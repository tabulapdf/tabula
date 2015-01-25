require 'tabula'

require_relative '../executor.rb'

class GeneratePageIndexJob < Tabula::Background::Job
  # args: (:file, :output_dir)
  # Generate pages.json

  def perform
    file = options[:file]
    output_dir = options[:output_dir]

    # return some status to browser
    at(0, 100, "analyzing PDF text...")

    extractor = Tabula::Extraction::PagesInfoExtractor.new(file)
    File.open(output_dir + "/pages.json", 'w') do |f|
      page_data = extractor.pages.to_a
      unless page_data.any?(&:has_text?)
        at(0, 100, "No text data found") 
        raise Tabula::NoTextDataException, "no text data found"
      end
      f.puts page_data.to_json
    end

    at(100, 100, "complete")
    return nil
  end
end
