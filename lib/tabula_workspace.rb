require 'jruby/synchronized'
require 'singleton'

module Tabula
  class Workspace
    include JRuby::Synchronized
    include Singleton

    def initialize(data_dir=TabulaSettings.getDataDir)
      unless File.directory?(data_dir)
        raise "DOCUMENTS_BASEPATH does not exist or is not a directory."
      end

      @data_dir = data_dir
      @workspace_path = File.join(@data_dir, "pdfs", "workspace.json")
      @workspace = []

      if !File.exists?(@workspace_path)
        FileUtils.mkdir_p(File.join(@data_dir, "pdfs"))
      end
    end

    def add_document(document, pages)
      read_workspace!
      @workspace.unshift(document)
      add_file(pages.to_json, document['id'], 'pages.json')
      flush_workspace!
    end

    def delete_document(document_id)
      read_workspace!
      @workspace.delete_if { |d| d['id'] == document_id }
      flush_workspace!

      FileUtils.rm_rf(get_document_dir(document_id))
    end

    def delete_page(document_id, page_number)
      # TODO
      raise "Not Implemented"
    end

    def get_document_metadata(document_id)
      read_workspace!
      @workspace.find { |d| d['id'] == document_id }
    end

    def get_document_pages(document_id)
      JSON.parse(File.join(get_document_dir(document_id), 'pages.json').read)
    end

    def get_document_path(document_id)
      File.join(get_document_dir(document_id), 'document.pdf')
    end

    def get_document_dir(document_id)
      p = File.join(@data_dir, 'pdfs', document_id)
      if !File.directory?(p)
        FileUtils.mkdir_p(p)
      end
      p
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

    private

    def read_workspace!
      File.open(@workspace_path) do |f|
        @workspace = JSON.parse(f.read)
      end
    end

    def flush_workspace!
      File.open(@workspace_path, 'w') do |f|
        f.write @workspace.to_json
      end
    end
  end
end
