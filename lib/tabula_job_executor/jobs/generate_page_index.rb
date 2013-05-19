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
      f.puts extractor.pages.to_a.to_json
    end

    at(100, 100, "complete")
    return nil
  end
end
