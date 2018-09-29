# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

require 'digest/sha1'
require 'json'
require 'csv'
require 'tempfile'
require 'fileutils'
require 'securerandom'

require_relative '../lib/tabula_java_wrapper.rb'
java_import 'java.io.ByteArrayOutputStream'
java_import 'java.util.zip.ZipEntry'
java_import 'java.util.zip.ZipOutputStream'

require_relative './tabula_settings.rb'

begin
  require_relative './tabula_version.rb'
rescue LoadError
  $TABULA_VERSION = "rev#{`git rev-list --max-count=1 HEAD`.strip}"
end

require_relative '../lib/tabula_workspace.rb'
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

  begin
    Tabula::Workspace.instance.move_file(file[:tempfile].path, file_id, 'document.pdf')
  rescue Errno::EACCES
    # Windows doesn't like tempfiles to be moved
	Tabula::Workspace.instance.copy_file(file[:tempfile].path, file_id, 'document.pdf')
  end

  filepath = Tabula::Workspace.instance.get_document_path(file_id)
  job_batch = SecureRandom.uuid
  thumbnail_sizes =  [800]

  GenerateDocumentDataJob.create(:filepath => filepath,
                                 :original_filename => original_filename,
                                 :id => file_id,
                                 :thumbnail_sizes => thumbnail_sizes,
                                 :batch => job_batch)

  DetectTablesJob.create(:filepath => filepath,
                         :id => file_id,
                         :batch => job_batch)

  GenerateThumbnailJob.create(:file_id => file_id,
                              :filepath => filepath,
                              :output_dir => file_path,
                              :thumbnail_sizes => thumbnail_sizes,
                              :batch => job_batch)
  return [job_batch, file_id]
end

class InvalidTemplateError < StandardError; end
TEMPLATE_REQUIRED_KEYS = ["page", "extraction_method", "x1", "x2", "y1", "y2", "width", "height"]
def upload_template(template_file)
  template_name = template_file[:filename].gsub(/\.json$/, "").gsub(/\.tabula-template/, "")
  template_id = Digest::SHA1.hexdigest(Time.now.to_s + template_name) # just SHA1 of time isn't unique with multiple uploads
  template_filename = template_id + ".tabula-template.json"

  # validate the uploaded template, since it really could be anything.
  template_json = open(template_file[:tempfile].path, 'r'){|f| f.read }
  begin
    template_data = JSON.parse(template_json)
  rescue JSON::ParserError => e
    raise InvalidTemplateError.new("template is invalid json: #{e}")
  end

  raise InvalidTemplateError.new("template is invalid, must be an array of selection objects") unless template_data.is_a?(Array)
  raise InvalidTemplateError.new("template is invalid; a selection object is invalid") unless template_data.all?{|sel| TEMPLATE_REQUIRED_KEYS.all?{|k| sel.has_key?(k)} }

  page_count = template_data.map{|sel| sel["page"]}.uniq.size
  selection_count = template_data.size

  # write to file and to workspace
  Tabula::Workspace.instance.add_template({ "id" => template_id,
                                            "template" => template_data,
                                            "name" => template_name,
                                            "page_count" => page_count,
                                            "time" => Time.now.to_i,
                                            "selection_count" => selection_count})
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

  on "templates" do
    # GET  /books/ .... collection.fetch();
    # POST /books/ .... collection.create();
    # GET  /books/1 ... model.fetch();
    # PUT  /books/1 ... model.save();
    # DEL  /books/1 ... model.destroy();

    on root do
      # list them all
      on get do
        res.status = 200
        res['Content-Type'] = 'application/json'
        res.write(JSON.dump(Tabula::Workspace.instance.list_templates))
      end

      # create a template from the GUI
      on post do
        template_info = JSON.parse(req.params["model"])
        template_name = template_info["name"] || "Unnamed Template #{Time.now.to_s}"
        template_id = Digest::SHA1.hexdigest(Time.now.to_s + template_name) # just SHA1 of time isn't unique with multiple uploads
        template_filename = template_id + ".tabula-template.json"
        file_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, "..", "templates")
        # write to file
        FileUtils.mkdir_p(file_path)
        open(File.join(file_path, template_filename), 'w'){|f| f << JSON.dump(template_info["template"])}
        page_count = template_info.has_key?("page_count") ? template_info["page_count"] : template_info["template"].map{|f| f["page"]}.uniq.count
        selection_count = template_info.has_key?("selection_count") ? template_info["selection_count"] :  template_info["template"].count
        Tabula::Workspace.instance.add_template({
                                                  "id" => template_id,
                                                  "name" => template_name,
                                                  "page_count" => page_count,
                                                  "time" => Time.now.to_i,
                                                  "selection_count" => selection_count,
                                                  "template" => template_info["template"]
                                                })
        res.status = 200
        res['Content-Type'] = 'application/json'
        res.write(JSON.dump({template_id: template_id}))
      end
    end

    # upload a template from disk
    on 'upload.json' do
      if req.params['file']
        template_ids = [upload_template(req.params['file'])]
      elsif req.params['files']
        template_ids = req.params['files'].map{|f| upload_template(f)}
      end
      res.status = 200
      res['Content-Type'] = 'application/json'
      res.write(JSON.dump({template_ids: template_ids}))
    end

    on ":template_id.json" do |template_id|
      on get do
        template_name = Tabula::Workspace.instance.get_template_metadata(template_id)["name"] # TODO
        res['Content-Type'] = 'application/json'
        res['Content-Disposition'] = "attachment; filename=\"#{template_name}.tabula-template.json\""
        template_body = Tabula::Workspace.instance.get_template_body(template_id)
        res.status = 200
        res.write template_body
      end
    end
    on ":template_id" do |template_id|
      on get do
        template_metadata = Tabula::Workspace.instance.get_template_metadata(template_id) # TODO
        template_name = template_metadata["name"]
        template_body = Tabula::Workspace.instance.get_template_body(template_id)
        template_metadata["selections"] = JSON.parse template_body
        res.status = 200
        res['Content-Type'] = 'application/json'
        res.write JSON.dump(template_metadata)
      end
      on put do
        old_metadata = Tabula::Workspace.instance.get_template_metadata(template_id) # TODO
        new_metadata = old_metadata.merge(JSON.parse(req.params["model"]))
        Tabula::Workspace.instance.replace_template_metadata(template_id, new_metadata)
        res.status = 200
        res['Content-Type'] = 'application/json'
        res.write(JSON.dump({template_id: template_id}))
      end
      on delete do
        Tabula::Workspace.instance.delete_template(template_id)
        res.status = 200
        res.write ''
      end
    end
  end

  on delete do

    on 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      index = Tabula::Workspace.instance.get_document_pages(file_id)
      index.find { |p| p['number'] == page_number.to_i }['deleted'] = true
      File.open(index_fname, 'w') { |f| f.write JSON.generate(index) }
      res.write '' # Firefox complains about an empty response without this.
    end

    # delete an uploaded file
    on 'pdf/:file_id' do |file_id|
      Tabula::Workspace.instance.delete_document(file_id)
      res.write '' # Firefox complains about an empty response without this.
    end

  end

  on put do
    on 'pdf/:file_id/page/:page_number' do |file_id, page_number|
      # nothing yet
    end
  end


  on get do
    on 'pdfs' do
      run Rack::File.new(TabulaSettings::DOCUMENTS_BASEPATH)
    end

    on 'documents' do
      res.status = 200
      res['Content-Type'] = 'application/json'
      res.write(JSON.dump(Tabula::Workspace.instance.list_documents))
    end

    on 'settings' do
      res.write JSON.dump({
        api_version: $TABULA_VERSION,
        disable_version_check: TabulaSettings::disableVersionCheck(),
        disable_notifications: TabulaSettings::disableNotifications(),
      })
    end

    on 'pdf/:file_id/metadata.json' do |file_id|
      res['Content-Type'] = 'application/json'
      res.write Tabula::Workspace.instance.get_document_metadata(file_id).to_json
    end

    [root, "about", "pdf/:file_id", "help", "mytemplates"].each do |paths_to_single_page_app|
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
      pdf_path = Tabula::Workspace.instance.get_document_path(file_id)

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
