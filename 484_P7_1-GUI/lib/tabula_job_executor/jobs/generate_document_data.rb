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

    # return some status to browser
    at(1, 100, "opening workspace...")

    doc = { 'original_filename' => original_filename,
            'id' => id,
            'time' => Time.now.to_i,
            'page_count' => '?',
            'size' => File.size(filepath),
            'thumbnail_sizes' => options[:thumbnail_sizes]
          }
    at(5, 100, "analyzing PDF text...")

    extractor = Tabula::Extraction::PagesInfoExtractor.new(filepath)
    page_data = extractor.pages.to_a
    doc['page_count'] = page_data.size
    unless page_data.any? { |pd| pd[:hasText] }
      at(0, 100, "No text data found")
      raise Tabula::NoTextDataException, "no text data found"
    end

    Tabula::Workspace.instance.add_document(doc, page_data)
    at(100, 100, "complete")
    extractor.close!
    return nil
  end
end
