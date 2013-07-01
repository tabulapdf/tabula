# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

require 'digest/sha1'
require 'json'
require 'csv'
require 'tabula' # tabula-extractor gem

require_relative './tabula_settings.rb'

unless File.directory?(TabulaSettings::DOCUMENTS_BASEPATH)
  raise "DOCUMENTS_BASEPATH does not exist or is not a directory."
end

require_relative '../lib/tabula_job_executor/executor.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_document_metadata.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_thumbnails.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_page_index.rb'


def is_valid_pdf?(path)
  File.open(path, 'r') { |f| f.read(4) } == '%PDF'
end


STATIC_ROOT = defined?($servlet_context) ? \
                File.join($servlet_context.getRealPath('/'), 'WEB-INF/webapp/static') : \
                File.join(File.dirname(__FILE__), 'static')

Cuba.plugin Cuba::Render
Cuba.settings[:render].store(:views, File.expand_path("views", File.dirname(__FILE__)))
Cuba.use Rack::MethodOverride
Cuba.use Rack::Static, root: STATIC_ROOT, urls: ["/css","/js", "/img", "/scripts", "/swf"]
Cuba.use Rack::ContentLength
Cuba.use Rack::Reloader

Cuba.define do

  if TabulaSettings::ENABLE_DEBUG_METHODS
    require_relative './tabula_debug.rb'
    on 'debug' do
      run TabulaDebug
    end
  end


  on 'queue' do
    require_relative './tabula_job_progress.rb'
    run TabulaJobProgress
  end

  on delete do
    on 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      index_fname = File.join(TabulaSettings::DOCUMENTS_BASEPATH,
                              file_id,
                              'pages.json')
      index = File.open(index_fname) { |f| JSON.load(f) }
      index.find { |p| p['number'] == page_number.to_i }['deleted'] = true
      File.open(index_fname, 'w') { |f| f.write JSON.generate(index) }
    end
  end

  on put do
    on 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      # nothing yet
    end
  end

  on get do
    on root do
      workspace_file = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
      workspace = if File.exists?(workspace_file)
                    File.open(workspace_file) { |f| JSON.load(f) }
                  else
                    []
                  end

      res.write view("index.html",
                     workspace: workspace)
    end

    on "pdf/:file_id/data" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')

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
      run Rack::File.new(TabulaSettings::DOCUMENTS_BASEPATH)
    end

    on "pdf/:file_id" do |file_id|
      document_dir = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
                       pages: File.open(File.join(document_dir, 'pages.json')) { |f|
                         JSON.parse(f.read)
                       },
                       file_id: file_id)
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
        next # halt this handler
      end

      original_filename = req.params['file'][:filename]
      file_id = Digest::SHA1.hexdigest(Time.now.to_s)
      file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)
      FileUtils.mkdir(file_path)
      begin
        FileUtils.mv(req.params['file'][:tempfile].path,
                     File.join(file_path, 'document.pdf'))
      rescue Errno::EACCES # move fails on windows sometimes
        FileUtils.cp_r(req.params['file'][:tempfile].path,
                       File.join(file_path, 'document.pdf'))
        FileUtils.rm_rf(req.params['file'][:tempfile].path)

      end

      file = File.join(file_path, 'document.pdf')

      # fire off background jobs

      document_metadata_job = GenerateDocumentMetadataJob.create(:filename => original_filename,
                                                                 :id => file_id)
      page_index_job = GeneratePageIndexJob.create(:file => file,
                                                   :output_dir => file_path)
      upload_id = GenerateThumbnailJob.create(:file_id => file_id,
                                              :file => file,
                                              :page_index_job => page_index_job,
                                              :output_dir => file_path,
                                              :thumbnail_sizes => [560])
      res.redirect "/queue/#{upload_id}"
    end
  end
end
