require 'java'

require_relative '../executor.rb'

class DetectTablesJob < Tabula::Background::Job
  include Observable
  def perform
    filepath = options[:filepath]
    output_dir = options[:output_dir]


    page_areas_by_page = []

    extractor = Tabula::Extraction::ObjectExtractor.new(filepath, :all)
    page_count = extractor.page_count
    sea = Java::TechnologyTabulaExtractors::SpreadsheetExtractionAlgorithm.new
    extractor.extract.each do |page|
      page_index = page.getPageNumber

      at( (page_count + page_index) / 2, page_count, "auto-detecting tables...") #starting at 50%...

      cells = Java::TechnologyTabulaExtractors::SpreadsheetExtractionAlgorithm.findCells(page.getHorizontalRulings, page.getVerticalRulings)
      areas = sea.findSpreadsheetsFromCells(cells)
      page_areas_by_page << areas.map { |rect|
        [ rect.getLeft,
          rect.getTop,
          rect.getWidth,
          rect.getHeight ]
      }
    end
    File.open(output_dir + "/tables.json", 'w') do |f|
      f.puts page_areas_by_page.to_json
    end

    at(100, 100, "complete")
    return nil
  end
end
