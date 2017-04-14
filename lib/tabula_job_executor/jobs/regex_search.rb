require 'java'

class RegexSearchJob 

  def performRegex(filepath, output_dir, upper_left, upper_right, lower_left, lower_right)
	page_areas_by_page = []
	begin
		extractor = Tabula::Extraction::ObjectExtractor.new(filepath, :all)
		page_count = extractor.page_count
		rda = Java::TechnologyTabulaDetectors::RegexSearch.new
		extractor.extract.each do |page|
			areas = rda.detect(page, upper_left, upper_right, lower_left, lower_right)
			page_areas_by_page << areas.map { |rect|
          [ rect.getLeft,
            rect.getTop,
            rect.getWidth,
            rect.getHeight ]
			}
		end
		
	rescue Java::JavaLang::Exception => e
      warn("Regex bounds detect failed. You may need to select tables manually.")
    end

    File.open(output_dir + "/regex.json", 'w') do |f|
      f.puts page_areas_by_page.to_json
    end
	
	File.open(output_dir + "/regex_list.json", 'a') do |f|
      f.puts upper_left + "," + upper_right + "," + lower_left + "," + lower_right + "\n"
    end
	
    return page_areas_by_page
  end
end