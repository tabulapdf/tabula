# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

raise Errno::ENOENT, "'./local_settings.rb' could not be found. See README.md for more info." unless File.exists?('./local_settings.rb')

require 'nokogiri'
require 'digest/sha1'
require 'json'
require 'csv'
require 'resque'
require 'resque/status_server'
require 'resque/job_with_status'

require './tabula_debug.rb'
require './lib/detect_rulings.rb'
require './lib/tabula.rb'
require './lib/parse_xml.rb'
require './lib/tabula_graph.rb'
require './lib/jobs/analyze_pdf.rb'
require './lib/jobs/generate_thumbails.rb'
require './lib/jobs/detect_tables.rb'
require './local_settings.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts", "/swf"]

Cuba.define do

  if Settings::ENABLE_DEBUG_METHODS
    on 'debug' do
      run TabulaDebug
    end
  end

  #this has to respond to both GET and POST (since some requests' params are too long for a URL and thus have to be a POST)
  #so I put this here to be DRY.
  respond_to_data = Proc.new do |file_id|
    pdf_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)

      coords = JSON.load(req.params['coords'])

      output_data = []

      #sort these in order first, by page, then by y coordinates (truncated), then by x coordinates
      # so that data comes out in reading order even if there are multiple tables on a page.
      coords.sort_by{|coord| [ coord['page'], [coord['y1'], coord['y2']].min.to_i / 10, [coord['x1'], coord['x2']].min ] }.each do |coord|

        text_elements = Tabula::XML.get_text_elements(pdf_path,
                                                      coord['page'],
                                                      coord['x1'],
                                                      coord['y1'],
                                                      coord['x2'],
                                                      coord['y2'])
        make_table_options = {}


        if !req.params['use_lines'].nil? and req.params['use_lines'] != 'false'
          page_dimensions = Tabula::XML.get_page_dimensions(pdf_path, req.params['page'])
          rulings = Tabula::Rulings::detect_rulings(File.join(pdf_path,
                                                              "document_2048_#{req.params['page']}.png"),
                                                    page_dimensions[:width] / 2048.0)

          make_table_options[:horizontal_rulings] = rulings[:horizontal]
          make_table_options[:vertical_rulings] = rulings[:vertical]
        end

        table = Tabula.make_table(text_elements, make_table_options)

        output_data += table.map { |line|
          line.text_elements.sort_by { |t| t.left }
        }
        output_data += [[],[]] unless coord == coords.last
      end

      if req.params['format'] == 'csv'
        res['Content-Type'] = 'application/force-download' #'text/csv'
        res['Content-disposition'] = "attachment; filename=download.csv"
        csv_string = CSV.generate { |csv|
          output_data.each { |l|
            csv << l.map { |c| c.text }
          }
        }
        res.write csv_string
      else
        res['Content-Type'] = 'application/json'
        res.write output_data.to_json
      end
    end


  on get do
    on root do
      res.write view("index.html")
    end

    on "pdf/:file_id/data" do |file_id|
      respond_to_data.call(file_id)
    end

    on "pdf/:file_id" do |file_id|
      document_dir = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
                       file_id: file_id,
                       page_images: Dir.glob(File.join(document_dir, "document_560_*.png"))
                         .sort_by { |f| f.gsub(/[^\d]/, '').to_i }
                         .map { |f| f.gsub(Dir.pwd + '/static', '') },
                       pages: File.open(File.join(Dir.pwd,
                                                  "static/pdfs/#{file_id}/pages.xml")) { |index_file|
                         Nokogiri::XML(index_file).xpath('//page')
                       })
      end
    end

    on "queue/:upload_id/json" do |upload_id|
      # upload_id is the "job id" uuid that resque-status provides
      status = Resque::Plugins::Status::Hash.get(upload_id)
      res['Content-Type'] = 'application/json'
      message = {}
      if status.nil?
        res.status = 404
        message[:status] = "error"
        message[:message] = "No such job"
        message[:pct_complete] = 0
      elsif status.failed?
        message[:status] = "error"
        message[:message] = "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
        message[:pct_complete] = 99
        res.write message.to_json
      else
        message[:status] = status.status
        message[:message] = status.message
        message[:pct_complete] = status.pct_complete
        message[:thumbnails_complete] = status['thumbnails_complete']
        message[:file_id] = status['file_id']
        message[:upload_id] = status['upload_id']
        res.write message.to_json
      end
    end

    on "queue/:upload_id" do |upload_id|
      # upload_id is the "job id" uuid that resque-status provides
      status = Resque::Plugins::Status::Hash.get(upload_id)
      if status.nil?
        res.status = 404
        res.write ""
        res.write view("upload_error.html",
            :message => "invalid upload_id (TODO: make this generic 404)")
      elsif status.failed?
        res.write view("upload_error.html",
            :message => "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again.")
      else
        res.write view("upload_status.html", :status => status, :upload_id => upload_id)
      end
    end
  end # /get

  on post do
    on 'upload' do
      file_id = Digest::SHA1.hexdigest(Time.now.to_s)
      file_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      FileUtils.mkdir(file_path)
      FileUtils.cp(req.params['file'][:tempfile].path,
                   File.join(file_path, 'document.pdf'))

      file = File.join(file_path, 'document.pdf')

      # Make sure this is a PDF.
      # TODO: cleaner way to do this without blindly relying on file extension (which we provided)?
      mime = `file -b --mime-type #{file}`
      if !mime.include? "application/pdf"
        res.write view("upload_error.html",
            :message => "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. <a href='/'>Please try again</a>.")
      else
        # fire off thumbnail and table detection jobs; table detection goes first, since it often takes longer.
        table_detector = DetectTablesJob.create(
          :file_id => file_id,
          :file => file,
          :output_dir => file_path
        )
        sm_thumbnail_job = GenerateThumbnailJob.create(
          :file => file,
          :output_dir => file_path,
          :thumbnail_size => 560
        )
        lg_thumbnail_job = GenerateThumbnailJob.create(
          :file => file,
          :output_dir => file_path,
          :thumbnail_size => 2048
        )
        upload_id = AnalyzePDFJob.create(
          :file_id => file_id,
          :file => file,
          :output_dir => file_path,
          :sm_thumbnail_job => sm_thumbnail_job,
          :lg_thumbnail_job => lg_thumbnail_job,
          :table_detection_job => table_detector
        )
        res.redirect "/queue/#{upload_id}"
      end
    end
    on "pdf/:file_id/data" do |file_id|
      respond_to_data.call(file_id)
    end
  end

end
