require 'tabula'

require_relative '../executor.rb'

class DetectTablesJob < Tabula::Background::Job
  include Observable
  def perform
    file = options[:filename]
    output_dir = options[:output_dir]

    #get page count
    pdf_file = Tabula::Extraction.openPDF(file)
    page_count = pdf_file.getDocumentCatalog.getAllPages.size
    pdf_file.close

    page_areas_by_page = (0...page_count).map do |page_index|
      at( (page_count + page_index) / 2, page_count, "auto-detecting tables...") #starting at 50%...
      clean_lines = Tabula::Ruling::clean_rulings(Tabula::LSD::detect_lines_in_pdf_page(file, page_index))
      page_areas = Tabula::TableGuesser::find_rects_from_lines(clean_lines)
      page_areas.map!{|rect| rect.dims(:left, :top, :width, :height)}
    end
    File.open(output_dir + "/tables.json", 'w') do |f|
      f.puts page_areas_by_page.to_json
    end

    at(100, 100, "complete")
    return nil
  end
end
