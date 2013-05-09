# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

require 'digest/sha1'
require 'json'
require 'csv'
require 'tabula' # tabula-extractor gem

begin
  require ENV['TABULA_SETTINGS'] || './local_settings.rb'
rescue LoadError
  puts "'./local_settings.rb' could not be found. See README.md for more info."
  raise
end

unless File.directory?(Settings::DOCUMENTS_BASEPATH)
  raise "DOCUMENTS_BASEPATH does not exist or is not a directory."
end

if Settings::ASYNC_PROCESSING
  require './tabula_job_executor/executor.rb'
  require './lib/jobs/generate_thumbnails.rb'
  require './lib/jobs/generate_page_index.rb'
end

else
  require './lib/jruby_dump_characters.rb'
  require './lib/thumbnail_generator.rb'
end

require './tabula_extractor/tabula.rb'



def is_valid_pdf?(path)
  # TODO: probabaly not entirely correct - check.
  File.open(path, 'r') { |f| f.read(4) } == '%PDF'
end


STATIC_ROOT = defined?($servlet_context) ? \
                File.join($servlet_context.getRealPath('/'), 'WEB-INF/static') : \
                'static'


Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: STATIC_ROOT, urls: ["/css","/js", "/img", "/scripts", "/swf"]
#Cuba.use Rack::Reloader

Cuba.define do

  if Settings::ENABLE_DEBUG_METHODS
    require './tabula_debug.rb'
    on 'debug' do
      run TabulaDebug
    end
  end

  if Settings::ASYNC_PROCESSING
    require './tabula_job_progress.rb'
    on 'queue' do
      run TabulaJobProgress
    end
  end


  on get do
    on root do
      res.write view("index.html")
    end

    on "pdf/:file_id/data" do |file_id|
      pdf_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')

      # make_table_options = {}

      # if !req.params['use_lines'].nil? and req.params['use_lines'] != 'false'
      #   page_dimensions = Tabula::XML.get_page_dimensions(pdf_path, req.params['page'])
      #   rulings = Tabula::Rulings::detect_rulings(File.join(pdf_path,
      #                                                       "document_2048_#{req.params['page']}.png"),
      #                                             page_dimensions[:width] / 2048.0)

      #   make_table_options[:horizontal_rulings] = rulings[:horizontal]
      #   make_table_options[:vertical_rulings] = rulings[:vertical]
      # end

      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [req.params['page'].to_i])

      table = Tabula.make_table(extractor.extract.next.get_text([req.params['y1'].to_f,
                                                                req.params['x1'].to_f,
                                                                req.params['y2'].to_f,
                                                                req.params['x2'].to_f]))
      
      case req.params['format']
      when 'csv'
        res['Content-Type'] = 'text/csv'
        Tabula::Writers.CSV(table, res)
      when 'tsv'
        res['Content-Type'] = 'text/tab-separated-values'
        Tabula::Writers.TSV(table, res)
      else
        res['Content-Type'] = 'application/json'
        Tabula::Writers.JSON(table, res)
      end

    end

    on 'pdfs' do
      run Rack::File.new(Settings::DOCUMENTS_BASEPATH)
    end

    on "pdf/:file_id" do |file_id|
      document_dir = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
                       page_images: Dir.glob(File.join(document_dir, "document_560_*.png"))
                         .sort_by { |f| f.gsub(/[^\d]/, '').to_i }
                         .map { |f| f.gsub(Settings::DOCUMENTS_BASEPATH, '/pdfs') },
                       pages: File.open(File.join(document_dir, 'pages.json')) { |f| 
                         JSON.parse(f.read)
                       })
      end
    end

  end # /get

  on post do
    on 'upload' do

      # Make sure this is a PDF, before doing anything
      unless is_valid_pdf?(req.params['file'][:tempfile].path)
        res.status = 400
        res.write view("upload_error.html",
                       :message => "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. <a href='/'>Please try again</a>.")
        FileUtils.rm(req.params['file'][:tempfile].path)
        next # halt this handler
      end

      file_id = Digest::SHA1.hexdigest(Time.now.to_s)
      file_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      FileUtils.mkdir(file_path)
      FileUtils.mv(req.params['file'][:tempfile].path,
                   File.join(file_path, 'document.pdf'))

      file = File.join(file_path, 'document.pdf')

      if Settings::ASYNC_PROCESSING
        # fire off thumbnail jobs
        thumbnail_job = GenerateThumbnailJob.create(:file => file,
                                                       :output_dir => file_path,
                                                       :thumbnail_sizes => [560])
        upload_id = AnalyzePDFJob.create(:file_id => file_id,
                                         :file => file,
                                         :output_dir => file_path,
                                         :thumbnail_job => thumbnail_job)

        res.redirect "/queue/#{upload_id}"
      else
        PDFThumbnailGenerator.new(file, file_path, [560]).generate_thumbnails!
        XMLGenerator.new(File.join(file_path, 'document.pdf'), file_path).generate_xml!
        res.redirect "/pdf/#{file_id}"
      end
    end
  end
end
