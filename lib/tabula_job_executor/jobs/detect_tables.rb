require 'tabula'

require_relative '../executor.rb'

class DetectTablesJob < Tabula::Background::Job
  include Observable
  def perform
    file = options[:filename]
    output_dir = options[:output_dir]


    page_areas_by_page = []

    extractor = Tabula::Extraction::ObjectExtractor.new(file, :all)
    page_count = extractor.page_count
    extractor.extract.each do |page|
      page_index = page.number(:zero_indexed)
      at( (page_count + page_index) / 2, page_count, "auto-detecting tables...") #starting at 50%...
      page_areas_by_page << page.spreadsheets.map{|rect| rect.dims(:left, :top, :width, :height)}
    end
    File.open(output_dir + "/tables.json", 'w') do |f|
      f.puts page_areas_by_page.to_json
    end

    at(100, 100, "complete")
    return nil
  end
end
