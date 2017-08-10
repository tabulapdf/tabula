require 'jruby/synchronized'
require 'singleton'

module Tabula
  class Workspace
    include JRuby::Synchronized
    include Singleton

    STARTING_VALUE = {"pdfs" => [], "templates" => [], "version" => 2}


    def initialize(data_dir=TabulaSettings.getDataDir)
      unless File.directory?(data_dir)
        raise "DOCUMENTS_BASEPATH does not exist or is not a directory."
      end

      @data_dir = data_dir
      @workspace_path = File.join(@data_dir, "pdfs", "workspace.json")
      @workspace = STARTING_VALUE
      if !File.exists?(@workspace_path)
        FileUtils.mkdir_p(File.join(@data_dir, "pdfs"))
      end
    end

    def add_document(document, pages)
      read_workspace!
      @workspace["pdfs"].unshift(document)
      add_file(pages.to_json, document['id'], 'pages.json')
      flush_workspace!
    end

    def delete_document(document_id)
      read_workspace!
      @workspace["pdfs"].delete_if { |d| d['id'] == document_id }
      flush_workspace!

      FileUtils.rm_rf(get_document_dir(document_id))
    end

    def delete_page(document_id, page_number)
      # TODO
      raise "Not Implemented"
    end

    def get_document_metadata(document_id)
      read_workspace!
      @workspace["pdfs"].find { |d| d['id'] == document_id }
    end

    def get_document_pages(document_id)
      JSON.parse(File.join(get_document_dir(document_id), 'pages.json').read)
    end

    def get_document_path(document_id)
      File.join(get_document_dir(document_id), 'document.pdf')
    end

    def list_documents
      read_workspace!
      @workspace["pdfs"]
    end



    def get_data_dir()
      @data_dir
    end

    def add_file(contents, document_id, filename)
      p = get_document_dir(document_id)

      File.open(File.join(p, filename), 'w') do |f|
        f.write contents
      end
    end

    def move_file(path, document_id, filename)
      FileUtils.mv(path, File.join(get_document_dir(document_id), filename))
    end



    def list_templates
      read_workspace!
      @workspace["templates"]
    end

    def get_template_metadata(template_id)
      read_workspace!
      @workspace["templates"].find { |d| d['id'] == template_id }
    end
    def get_template_body(template_id)
      puts File.join(get_templates_dir, "#{template_id}.tabula-template.json")
      open(File.join(get_templates_dir, "#{template_id}.tabula-template.json"), 'r'){|f| f.read }
    end

    def add_template(template_metadata)
      read_workspace!

      # write template metadata to workspace
      @workspace["templates"].insert(0,{
                                      "name" => template_metadata["name"].gsub(".tabula-template.json", ""), 
                                      "selection_count" => template_metadata["selection_count"],
                                      "page_count" => template_metadata["page_count"], 
                                      "time" => template_metadata["time"], 
                                      "id" => template_metadata["id"]
                                    })
      # write template file to disk
      write_template_file(template_metadata)
      flush_workspace!
    end

    def replace_template_metadata(template_id, template_metadata)
      read_workspace!
      idx = @workspace["templates"].index{|t| t["id"] == template_id}
      @workspace["templates"][idx] = template_metadata.select{|k,_| ["name", "selection_count", "page_count", "time", "id"].include?(k) }
      flush_workspace!
    end



    def delete_template(template_id)
      read_workspace!
      @workspace["templates"].delete_if { |t| t['id'] == template_id }
      flush_workspace!
      File.delete(File.join(get_templates_dir, "#{template_id}.tabula-template.json"))
    end


    private

    def write_template_file(template_metadata)
      template_name = template_metadata["name"]
      template_id = Digest::SHA1.hexdigest(Time.now.to_s + template_name) # just SHA1 of time isn't unique with multiple uploads
      template_filename = template_id + ".tabula-template.json"
      open(File.join(get_templates_dir, template_filename), 'w'){|f| f << JSON.dump(template_metadata["template"])}
    end

    def get_templates_dir
      p = File.join(@data_dir, 'templates')
      if !File.directory?(p)
        FileUtils.mkdir_p(p)
      end
      p
    end
    def get_document_dir(document_id)
      p = File.join(@data_dir, 'pdfs', document_id)
      if !File.directory?(p)
        FileUtils.mkdir_p(p)
      end
      p
    end


    def read_workspace!
      return STARTING_VALUE unless File.exists?(@workspace_path)
      File.open(@workspace_path) do |f|
        @workspace = JSON.parse(f.read)
      end
      # what if the already-existing workspace is v1? i.e. if it's just an array?
      # then we'll make it the new kind, seamlessly.
      if @workspace.is_a? Array
        @workspace = {"pdfs" => @workspace, "templates" => [], "version" => 2}
        flush_workspace!
      end
      @workspace
    end

    def flush_workspace!
      File.open(@workspace_path, 'w') do |f|
        f.write @workspace.to_json
      end
    end
  end
end
