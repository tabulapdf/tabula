# -*- coding: utf-8 -*-
require 'roda'
require 'tilt/erb'
require 'rufus-lru'

require 'digest/sha1'
require 'json'
require 'csv'
require 'tempfile'
require 'fileutils'
require 'securerandom'

require 'tabula' # tabula-extractor gem

require_relative './tabula_settings.rb'

unless File.directory?(TabulaSettings::DOCUMENTS_BASEPATH)
  raise "DOCUMENTS_BASEPATH does not exist or is not a directory."
end

begin
  require_relative './tabula_version.rb'
rescue LoadError
  $TABULA_VERSION = "rev#{`git rev-list --max-count=1 HEAD`.strip}"
end

require_relative '../lib/tabula_job_executor/executor.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_document_metadata.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_thumbnails.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_page_index.rb'
require_relative '../lib/tabula_job_executor/jobs/detect_tables.rb'


def is_valid_pdf?(path)
  File.open(path, 'r') { |f| f.read(4) } == '%PDF'
end


STATIC_ROOT = if defined?($servlet_context)
                File.join($servlet_context.getRealPath('/'), 'WEB-INF/webapp/static')
              else
                File.join(File.dirname(__FILE__), 'static')
              end

MAX_CACHE_ENTRIES = 10

Roda.plugin :render, :views=>File.expand_path("views", File.dirname(__FILE__)),
  :template_opts=>{:default_encoding=>'UTF-8'}
Roda.plugin :all_verbs
Roda.plugin :json
Roda.plugin :delegate
Roda.request_delegate :on, :is, :delete, :get, :put, :post, :root, :run
Roda.plugin :default_headers, 'Content-Type'=>"text/html; charset=utf-8"
Roda.use Rack::MethodOverride
Roda.use Rack::Static, root: STATIC_ROOT, urls: ["/css","/js", "/img", "/swf"]
Roda.use Rack::ContentLength
Roda.use Rack::Reloader

if TabulaSettings::EXTRACTION_CACHE
  CACHE = Rufus::Lru::SynchronizedHash.new(MAX_CACHE_ENTRIES)
else
  # horrid, wrong, disrespectful
  # sort of a pass-through
  class NoCache < Hash
    def [](k)
      return @k
    end
    def []=(k, v)
      @k = v
    end
    def has_key?(k)
      false
    end
  end
  CACHE = NoCache.new
end

if TabulaSettings::ENABLE_DEBUG_METHODS
  require_relative './tabula_debug.rb'
end
require_relative './tabula_job_progress.rb'

Roda.route do

  if TabulaSettings::ENABLE_DEBUG_METHODS
    on 'debug' do
      run TabulaDebug
    end
  end

  on 'queue' do
    run TabulaJobProgress
  end

  delete do

    is 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      index_fname = File.join(TabulaSettings::DOCUMENTS_BASEPATH,
                              file_id,
                              'pages.json')
      index = File.open(index_fname) { |f| JSON.load(f) }
      index.find { |p| p['number'] == page_number.to_i }['deleted'] = true
      File.open(index_fname, 'w') { |f| f.write JSON.generate(index) }
    end

    # delete an uploaded file
    is 'pdf/:file_id' do |file_id|
      workspace_file = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
      raise if !File.exists?(workspace_file)

      workspace = File.open(workspace_file) { |f| JSON.load(f) }
      f = workspace.find { |g| g['id'] == file_id }

      FileUtils.rm_rf(File.join(TabulaSettings::DOCUMENTS_BASEPATH, f['id']))
      workspace.delete(f)

      # update safely
      tmp = Tempfile.new('workspace')
      tmp.write(JSON.generate(workspace))
      tmp.flush; tmp.close
      FileUtils.cp(tmp.path, workspace_file)
      tmp.unlink

    end

  end

  put do
    is 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      # nothing yet
    end
  end

  get do
    root do
      workspace_file = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
      workspace = if File.exists?(workspace_file)
                    File.open(workspace_file) { |f| JSON.load(f) }
                  else
                    []
                  end

      view("index.html", :locals=>{workspace: workspace})
    end


    on 'pdfs' do
      run Rack::File.new(TabulaSettings::DOCUMENTS_BASEPATH)
    end

    is "pdf/:file_id" do |file_id|
      document_dir = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)
      if File.directory?(document_dir)
        view("pdf_view.html", :locals=>{
                       pages: File.open(File.join(document_dir, 'pages.json')) { |f|
                         JSON.parse(f.read)
                       },
                       file_id: file_id})
      end
    end

  end # /get

  post do
    is 'upload' do

      tempfile_path = request['file'][:tempfile].path

      # Make sure this is a PDF, before doing anything
      unless is_valid_pdf?(tempfile_path)
        response.status = 400
        next view("upload_error.html", :locals=>{
                       :message => "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. <a href='/'>Please try again</a>."})
      end

      original_filename = request['file'][:filename]
      file_id = Digest::SHA1.hexdigest(Time.now.to_s)
      file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)
      FileUtils.mkdir(file_path)
      begin
        FileUtils.mv(tempfile_path,
                     File.join(file_path, 'document.pdf'))
      rescue Errno::EACCES # move fails on windows sometimes
        FileUtils.cp_r(tempfile_path,
                       File.join(file_path, 'document.pdf'))
        FileUtils.rm_rf(tempfile_path)

      end

      file = File.join(file_path, 'document.pdf')

      # fire off background jobs; in different orders if we're doing autodetection

      job_batch = SecureRandom.uuid

      GenerateDocumentMetadataJob.create(:filename => original_filename,
                                         :id => file_id,
                                         :batch => job_batch)

      if request['autodetect-tables']
        DetectTablesJob.create(:filename => file,
                               :output_dir => file_path,
                               :batch => job_batch)
      end

      GeneratePageIndexJob.create(:file => file,
                                  :output_dir => file_path,
                                  :batch => job_batch)

      GenerateThumbnailJob.create(:file_id => file_id,
                                  :file => file,
                                  :output_dir => file_path,
                                  :thumbnail_sizes => [560],
                                  :batch => job_batch)

      request.redirect "/queue/#{job_batch}?file_id=#{file_id}"
    end

    is "pdf/:file_id/data" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')

      coords = JSON.load(request['coords'])
      coords.sort_by! do |coord_set|
        [
         coord_set['page'],
         [coord_set['y1'], coord_set['y2']].min.to_i / 10,
         [coord_set['x1'], coord_set['x2']].min ]
      end
      if ["guess", "spreadsheet", "original"].include?(request['extraction_method'])
        extraction_method_requested = request['extraction_method']
      else
        extraction_method_requested = "guess"
      end

      coords_method_key = extraction_method_requested + coords.to_s
      # don't rewrite this is as CACHE[coords] ||= ....
      unless CACHE.has_key?(coords_method_key)
        CACHE[coords_method_key] = coords.each_with_index.map do |coord_set, index|
          Tabula.extract_table(pdf_path,
                               coord_set['page'].to_i,
                               [coord_set['y1'].to_f,
                                coord_set['x1'].to_f,
                                coord_set['y2'].to_f,
                                coord_set['x2'].to_f],
                                {:extraction_method => extraction_method_requested}
                                )
        end
      end

      case request['format']
      when 'csv'
        response['Content-Type'] = 'text/csv'
        response['Content-Disposition'] = "attachment; filename=\"tabula-#{file_id}.csv\""
        tables = CACHE[coords_method_key].flatten(1)
        tables.each do |table|
          response.write table.to_csv
        end
      when 'tsv'
        response['Content-Type'] = 'text/tab-separated-values'
        response['Content-Disposition'] = "attachment; filename=\"tabula-#{file_id}.tsv\""
        tables = CACHE[coords_method_key].flatten(1)
        tables.each do |table|
          response.write table.to_tsv
        end
      when 'script'
        # Write shell script of tabula-extractor commands.  $1 takes 
        # the name of a file from the command line and passes it 
        # to tabula-extractor so the script can be reused on similar pdfs.
        response['Content-Type'] = 'application/x-sh'
        response['Content-Disposition'] = "attachment; filename=\"tabula-#{file_id}.sh\""
        coords.each do |c|
          response.write "tabula -a #{c['y1']},#{c['x1']},#{c['y2']},#{c['x2']} -p #{c['page']} \"$1\" \n"
        end
      when 'bbox'
        # Write json representation of bounding boxes and pages for 
        # use in OCR and other back ends.
        response['Content-Disposition'] = "attachment; filename=\"tabula-#{file_id}.json\""
        coords
     else
        CACHE[coords_method_key].flatten(1)
      end
    end
  end
end
