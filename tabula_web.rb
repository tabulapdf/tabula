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

require './lib/detect_rulings.rb'
require './lib/tabula.rb'
require './lib/parse_xml.rb'
require './lib/tabula_graph.rb'
require './lib/jobs/analyze_pdf.rb'
require './lib/jobs/generate_thumbails.rb'
require './local_settings.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts", "/swf"]

Cuba.define do

  on get do
    on root do
      res.write view("index.html")
    end

    ## TODO delete
    on "pdf/:file_id/whitespace" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])

      whitespace =  Tabula.find_whitespace(text_elements,
                                           Tabula::ZoneEntity.new(req.params['y1'].to_f,
                                                                  req.params['x1'].to_f,
                                                                  req.params['x2'].to_f - req.params['x1'].to_f,
                                                                  req.params['y2'].to_f - req.params['y1'].to_f))

      res['Content-Type'] = 'application/json'
      res.write whitespace.to_json

    end

    on "pdf/:file_id/data" do |file_id|
      pdf_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)

      text_elements = Tabula::XML.get_text_elements(pdf_path,
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])
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

      line_texts = table.map { |line|
        line.text_elements.sort_by { |t| t.left }
      }

      if req.params['format'] == 'csv'
        res['Content-Type'] = 'text/csv'
        csv_string = CSV.generate { |csv|
          line_texts.each { |l|
            csv << l.map { |c| c.text }
          }
        }
        res.write csv_string
      else
        res['Content-Type'] = 'application/json'
        res.write line_texts.to_json
      end


    end

    on "pdf/:file_id/columns" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])

      res['Content-Type'] = 'application/json'
      res.write Tabula.get_columns(text_elements, true).to_json

    end

    on "pdf/:file_id/rows" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])

      rows = Tabula.get_rows(text_elements, true)
      res['Content-Type'] = 'application/json'
      res.write rows.to_json

    end

    on "pdf/:file_id/characters" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])


      res['Content-Type'] = 'application/json'
      res.write text_elements.map { |te|
        { 'left' => te.left,
          'top' => te.top,
          'width' => te.width,
          'height' => te.height,
          'text' => te.text }
      }.to_json
    end

    on "pdf/:file_id/rulings" do |file_id|
        lines = Tabula::Rulings::detect_rulings(File.join(Settings::DOCUMENTS_BASEPATH,
                                                          file_id,
                                                          "document_2048_#{req.params['page']}.png"),
                                                req.params['x1'].to_f,
                                                req.params['y1'].to_f,
                                                req.params['x2'].to_f,
                                                req.params['y2'].to_f)
      res['Content-Type'] = 'application/json'
      res.write res.write((lines[:horizontal] + lines[:vertical]).to_json)
    end

    on 'pdf/:file_id/graph' do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])
      text_elements = Tabula::Graph.merge_text_elements(text_elements)

      res['Content-Type'] = 'application/json'
      res.write Tabula::Graph::Graph.make_graph(text_elements).to_json

    end

    on "pdf/:file_id" do |file_id|
      # TODO validate that file_id is  /[a-f0-9]{40}/
      document_dir = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
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
        # fire off thumbnail jobs
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
          :lg_thumbnail_job => lg_thumbnail_job
        )
        res.redirect "/queue/#{upload_id}"
      end
    end
  end

end
