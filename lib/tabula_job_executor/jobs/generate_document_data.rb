require 'json'
require 'jruby/synchronized'

require_relative '../executor.rb'

class GenerateDocumentDataJob < Tabula::Background::Job
  include JRuby::Synchronized

  # args: (:filename, :id)
  def perform

    filepath = options[:filepath]
    original_filename = options[:original_filename]
    id = options[:id]
    output_dir = options[:output_dir]


    # return some status to browser
    at(1, 100, "opening workspace...")

    workspace_filepath = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')

    workspace = if File.exist?(workspace_filepath)
                  workspace_file = File.open(workspace_filepath) { |f| JSON.load(f) }
                  if workspace_file.is_a? Array
                {"pdfs" => workspace_file, "templates" => [], "version" => 2}
                  else
                    workspace_file
                  end
                else
                {"pdfs" => [], "templates" => [], "version" => 2}
                end

    workspace["pdfs"].insert(0, { 'original_filename' => original_filename,
                          'id' => id,
                          'time' => Time.now.to_i,
                          'page_count' => '?',
                          'size' => File.size(filepath),
                          'thumbnail_sizes' => options[:thumbnail_sizes]
                        })

    at(5, 100, "analyzing PDF text...")

    extractor = Tabula::Extraction::PagesInfoExtractor.new(filepath)
    File.open(output_dir + "/pages.json", 'w') do |f|
      page_data = extractor.pages.to_a
      workspace["pdfs"][0]['page_count'] = page_data.size
      unless page_data.any? { |pd| pd[:hasText] }
        at(0, 100, "No text data found")
        raise Tabula::NoTextDataException, "no text data found"
      end
      f.puts page_data.to_json
    end

    # safely update
    begin
      File.open(workspace_filepath + '.tmp', 'w') { |tmp|
        tmp.write JSON.generate(workspace)
      }
    rescue
      puts "Failed to save workspace!"
      return
    end

    if File.exists?(workspace_filepath)
      File.rename(workspace_filepath, workspace_filepath + '.old')
    end

    File.rename(workspace_filepath + '.tmp', workspace_filepath)
    if File.exists?(workspace_filepath + '.old')
      File.delete(workspace_filepath + '.old')
    end

    at(100, 100, "complete")
    extractor.close!
    return nil

  end
end
