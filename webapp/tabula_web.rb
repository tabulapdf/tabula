# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

require 'digest/sha1'
require 'json'
require 'csv'
require 'tempfile'
require 'fileutils'
require 'securerandom'

require_relative '../lib/jars/tabula-0.9.2-jar-with-dependencies.jar'

require_relative '../lib/tabula_java_wrapper.rb'
java_import 'java.io.ByteArrayOutputStream'
java_import 'java.util.zip.ZipEntry'
java_import 'java.util.zip.ZipOutputStream'

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
require_relative '../lib/tabula_job_executor/jobs/generate_document_data.rb'
require_relative '../lib/tabula_job_executor/jobs/generate_thumbnails.rb'
require_relative '../lib/tabula_job_executor/jobs/detect_tables.rb'


def is_valid_pdf?(path)
  File.open(path, 'r') { |f| f.read(4) } == '%PDF'
end


STATIC_ROOT = if defined?($servlet_context)
                File.join($servlet_context.getRealPath('/'), 'WEB-INF/webapp/static')
              else
                File.join(File.dirname(__FILE__), 'static')
              end

Cuba.plugin Cuba::Render
Cuba.settings[:render].store(:views, File.expand_path("views", File.dirname(__FILE__)))
Cuba.use Rack::MethodOverride
Cuba.use Rack::Static, root: STATIC_ROOT, urls: ["/css","/js", "/img", "/swf", "/fonts"]
Cuba.use Rack::ContentLength
Cuba.use Rack::Reloader


def upload(file)
  original_filename = file[:filename]
  file_id = Digest::SHA1.hexdigest(Time.now.to_s + original_filename) # just SHA1 of time isn't unique with multiple uploads
  file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)
  FileUtils.mkdir(file_path)
  begin
    FileUtils.mv(file[:tempfile].path,
                 File.join(file_path, 'document.pdf'))
  rescue Errno::EACCES # move fails on windows sometimes
    FileUtils.cp_r(file[:tempfile].path,
                   File.join(file_path, 'document.pdf'))
    FileUtils.rm_rf(file[:tempfile].path)
  end

  filepath = File.join(file_path, 'document.pdf')

  job_batch = SecureRandom.uuid

  thumbnail_sizes =  [800]

  GenerateDocumentDataJob.create(:filepath => filepath,
                                 :original_filename => original_filename,
                                 :id => file_id,
                                 :output_dir => file_path,
                                 :thumbnail_sizes => thumbnail_sizes,
                                 :batch => job_batch)

  DetectTablesJob.create(:filepath => filepath,
                         :output_dir => file_path,
                         :batch => job_batch)

  GenerateThumbnailJob.create(:file_id => file_id,
                              :filepath => filepath,
                              :output_dir => file_path,
                              :thumbnail_sizes => thumbnail_sizes,
                              :batch => job_batch)
  return [job_batch, file_id]
end

def list_templates
  workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
  raise if !File.exists?(workspace_filepath)

  workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
  workspace = if workspace_file.is_a? Array
                {"pdfs" => workspace_file, "templates" => [], "version" => 2}
              else
                workspace_file
              end
  workspace["templates"]
end
def persist_template(template_metadata)
  # write to workspace
  workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
  raise if !File.exists?(workspace_filepath)

  workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
  workspace = if workspace_file.is_a? Array
                {"pdfs" => workspace_file, "templates" => [], "version" => 2}
              else
                workspace_file
              end
  workspace["templates"].insert(0,{
                    "name" => template_metadata[:template_name].gsub(".tabula-template.json", ""), 
                    "selection_count" => template_metadata[:selection_count],
                    "page_count" => template_metadata[:page_count], 
                    "time" => template_metadata[:time], 
                    "id" => template_metadata[:id]
                  })
  tmp = Tempfile.new('workspace')
  tmp.write(JSON.generate(workspace))
  tmp.flush; tmp.close
  FileUtils.cp(tmp.path, workspace_filepath)
  tmp.unlink
end

def retrieve_template_metadata(template_id)
  workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
  raise if !File.exists?(workspace_filepath)

  workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
  workspace = if workspace_file.is_a? Array
                {"pdfs" => workspace_file, "templates" => [], "version" => 2}
              else
                workspace_file
              end
  workspace["templates"].find{|t| t["id"] == template_id}
end

def get_template_body(template_id)
  template_filename = template_id + ".tabula-template.json"
  file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, "../templates")
  open(file_path, 'r'){|f| f.read }
end

def create_template(template_info)
  template_name = template_info["name"]
  puts "template_name: #{template_info.inspect}"
  template_id = Digest::SHA1.hexdigest(Time.now.to_s + template_name) # just SHA1 of time isn't unique with multiple uploads
  template_filename = template_id + ".tabula-template.json"
  file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, "../templates")
  # write to file 
  FileUtils.mkdir_p(file_path)
  open(File.join(file_path, template_filename), 'w'){|f| f << JSON.dump(template_info["template"])}
  page_count = template_info.has_key?("page_count") ? template_info["page_count"] : template_info["template"].map{|f| f["page"]}.uniq.count
  selection_count = template_info.has_key?("selection_count") ? template_info["selection_count"] :  template_info["template"].count
  persist_template({id: template_id, template_name: template_name, page_count: page_count, time: Time.now.to_i, selection_count: selection_count})
  return template_id
end
def upload_template(template_file)
  template_name = template_file[:filename].gsub(/\.json$/, "").gsub(/\.tabula-template$/, "")
  template_id = Digest::SHA1.hexdigest(Time.now.to_s + template_name) # just SHA1 of time isn't unique with multiple uploads
  template_filename = template_id + ".tabula-template.json"
  file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, "../templates")
  # write to file
  FileUtils.mkdir_p(file_path)
  begin
    FileUtils.mv(template_file[:tempfile].path,
                 File.join(file_path, template_filename))
  rescue Errno::EACCES # move fails on windows sometimes
    FileUtils.cp_r(template_file[:tempfile].path,
                   File.join(file_path, template_filename))
    FileUtils.rm_rf(template_file[:tempfile].path)
  end

  persist_template({id: template_id, template_name: template_name, page_count: 0, time: Time.now.to_i,selection_count: 0})
  return template_id
end

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
      res.write '' # Firefox complains about an empty response without this.
    end

    # delete an uploaded file
    on 'pdf/:file_id' do |file_id|
      workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
      raise if !File.exists?(workspace_filepath)

      workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
      workspace = if workspace_file.is_a? Array
                    {"pdfs" => workspace_file, "templates" => [], "version" => 2}
                  else
                    workspace_file
                  end
      f = workspace[:pdfs].find { |g| g['id'] == file_id }

      FileUtils.rm_rf(File.join(TabulaSettings::DOCUMENTS_BASEPATH, f['id']))
      workspace.delete(f)

      # update safely
      tmp = Tempfile.new('workspace')
      tmp.write(JSON.generate(workspace))
      tmp.flush; tmp.close
      FileUtils.cp(tmp.path, workspace_filepath)
      tmp.unlink
      res.write '' # Firefox complains about an empty response without this.
    end

  end

  on put do
    on 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      # nothing yet
    end
  end

  on "templates" do 
    # GET  /books/ .... collection.fetch();
    # POST /books/ .... collection.create();
    # GET  /books/1 ... model.fetch();
    # PUT  /books/1 ... model.save();
    # DEL  /books/1 ... model.destroy();

    on get do
      # list them all
      res.status = 200
      res.write(JSON.dump(list_templates))
    end

    on post do 

      # create a template from the GUI
      on root do
        template_id = create_template(JSON.parse(req.params["model"]))
        res.status = 200
        res.write(JSON.dump({template_id: template_id}))
      end

      # upload a template from disk
      on 'upload.json' do
        if req.params['file']
          template_ids = [upload_template(req.params['file'])]
        elsif req.params['files']
          template_ids = req.params['files'].map{|f| upload_template(f)}
        end
        res.status = 200
        res.write(JSON.dump({template_ids: template_ids}))
      end
    end
    on put do 
      on ":template_id.json" do |template_id|
        # TODO
      end
    end
    on get do
      on ":template_id" do |template_id|
        # TODO: (maybe, do I need this?)
      end
      on ":template_id.json" do |template_id|
        # Write json representation of bounding boxes and pages for
        # use in OCR and other back ends.
        template_name = retrieve_template_metadata(template_id)["name"]
        res['Content-Type'] = 'application/json'
        res['Content-Disposition'] = "attachment; filename=\"#{template_name}.tabula-template.json\""

        # end JSON array
        res.write get_template_body(template_id)
      end
    end
  end

  on get do
    on 'pdfs' do
      run Rack::File.new(TabulaSettings::DOCUMENTS_BASEPATH)
    end

    on 'version' do
      res.write JSON.dump({api: $TABULA_VERSION})
    end

    on 'pdf/:file_id/metadata.json' do |file_id|
      workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')
      raise if !File.exists?(workspace_filepath)

      workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
      workspace = if workspace_file.is_a? Array
                    {"pdfs" => workspace_file, "templates" => [], "version" => 2}
                  else
                    workspace_file
                  end

      f = workspace["pdfs"].find { |g| g['id'] == file_id }
      res['Content-Type'] = 'application/json'
      res.write f.to_json
    end

    [root, "about", "pdf/:file_id", "help"].each do |paths_to_single_page_app|
      on paths_to_single_page_app do
        index = File.read("webapp/index.html")
        if ROOT_URI != ''
          index.sub!("<base href=\"/\">", "<base href=\"#{ROOT_URI}\">")
        end
        res.write index
      end
    end

  end # /get

  on post do
    on 'upload.json' do
      # Make sure this is a PDF, before doing anything

      if req.params['file'] # single upload mode. this should be deleting once if decide to enable multiple upload for realzies
        job_batch, file_id = *upload(req.params['file'])
        unless is_valid_pdf?(req.params['file'][:tempfile].path)
          res.status = 400
          res.write(JSON.dump({
            :success => false,
            :filename => req.params['file'][:filename],
            # :file_id => file_id,
            # :upload_id => job_batch,
            :error => "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. Please try again."
            }))
          next # halt this handler
        end

        res.write(JSON.dump([{
            :success => true,
            :file_id => file_id,
            :upload_id => job_batch
        }]))
      elsif req.params['files']
        statuses = req.params['files'].map do |file|
          if is_valid_pdf?(file[:tempfile].path)
            job_batch, file_id = *upload(file)
            {
              :filename => file[:filename],
              :success => true,
              :file_id => file_id,
              :upload_id => job_batch
            }
          else
            {
              :filename => file[:filename],
              :success => false,
              :file_id => file_id,
              :upload_id => job_batch,
              :error => "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. Please try again."
            }
            # next # halt this handler
          end
        end
        # if they all fail, return 400...
        res.status = 400 if(statuses.find{|a| a[:success] }.empty? )
        res.write(JSON.dump(statuses))
      else
        STDOUT.puts req.params.keys.inspect
      end
    end

    on "pdf/:file_id/data" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')

      coords = JSON.load(req.params['coords'])
      coords.sort_by! do |coord_set|
        [
         coord_set['page'],
         [coord_set['y1'], coord_set['y2']].min.to_i / 10,
         [coord_set['x1'], coord_set['x2']].min
        ]
      end

      tables = Tabula.extract_tables(pdf_path, coords)

      filename =  if req.params['new_filename'] && req.params['new_filename'].strip.size
                    basename = File.basename(req.params['new_filename'], File.extname(req.params['new_filename']))
                    "tabula-#{basename}"
                  else
                    "tabula-#{file_id}"
                  end

      case req.params['format']
      when 'csv'
        res['Content-Type'] = 'text/csv'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.csv\""
        tables.each do |table|
          res.write table.to_csv
        end
      when 'tsv'
        res['Content-Type'] = 'text/tab-separated-values'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.tsv\""
        tables.each do |table|
          res.write table.to_tsv
        end
      when 'zip'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.zip\""

        # I hate Java, Ruby, JRuby, Zip files, C, umm, computers, Linux, GNU,
        # parrots-as-gifts, improper climate-control settings, tar, gunzip,
        # streams, computers, did I say that already? ugh.
        baos = ByteArrayOutputStream.new;
        zos = ZipOutputStream.new baos

        tables.each_with_index do |table, index|
          # via https://stackoverflow.com/questions/23612864/create-a-zip-file-in-memory
          # /* File is not on the disk, test.txt indicates
          #    only the file name to be put into the zip */
          entry = ZipEntry.new("#{filename}-#{index}.csv")

          # /* use more Entries to add more files
          #    and use closeEntry() to close each file entry */
          zos.putNextEntry(entry)
          zos.write(table.to_csv.to_java_bytes) # lol java BITES...
          zos.closeEntry()
        end
        zos.finish
        # you know what, I changed my mind about JRuby.
        # this is actually way easier than it would be in MRE/CRuby.
        # ahahaha. I get the last laugh now.

        res.write String.from_java_bytes(baos.to_byte_array)
      when 'script'
        # Write shell script of tabula-extractor commands.  $1 takes
        # the name of a file from the command line and passes it
        # to tabula-extractor so the script can be reused on similar pdfs.
        res['Content-Type'] = 'application/x-sh'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.sh\""
        coords.each do |c|
          extraction_method_switch = if c['extraction_method'] == "original"
                                        "--no-spreadsheet"
                                     elsif c['extraction_method'] == "spreadsheet"
                                        "--spreadsheet"
                                     else
                                        ""
                                     end
          res.write "java -jar tabula-java.jar #{extraction_method_switch} -a #{c['y1'].round(3)},#{c['x1'].round(3)},#{c['y2'].round(3)},#{c['x2'].round(3)} -p #{c['page']} \"$1\" \n"
        end
      when 'bbox'
        # Write json representation of bounding boxes and pages for
        # use in OCR and other back ends.
        res['Content-Type'] = 'application/json'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.json\""
        res.write coords.to_json
      when 'json'
        # Write json representation of bounding boxes and pages for
        # use in OCR and other back ends.
        res['Content-Type'] = 'application/json'
        res['Content-Disposition'] = "attachment; filename=\"#{filename}.json\""

        # start JSON array
        res.write  "["
        tables.each_with_index do |table, index|
          res.write ", " if index > 0
          res.write table.to_json[0...-1] + ", \"spec_index\": #{table.spec_index}}"
        end

        # end JSON array
        res.write "]"
     else
        res['Content-Type'] = 'application/json'

        # start JSON array
        res.write  "["
        tables.each_with_index do |table, index|
          res.write ", " if index > 0
          res.write table.to_json[0...-1] + ", \"spec_index\": #{table.spec_index}}"
        end

        # end JSON array
        res.write "]"
      end
    end
  end
end
