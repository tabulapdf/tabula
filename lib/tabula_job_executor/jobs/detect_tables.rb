require 'tabula'

require_relative '../executor.rb'

class DetectTablesJob < Tabula::Background::Job
  def perform
    file = options[:filename]
    output_dir = options[:output_dir]

    # return some status to browser
    at(0, 100, "auto-detecting tables on the page...")

    lines_by_page = Tabula::LSD::detect_lines_in_pdf(file)
    page_areas_by_page = lines_by_page.map do |lines|
      clean_lines = Tabula::Ruling::clean_rulings(lines)
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
