require 'java'

class StringSearchJob 

  def performString(output_dir, boundariesArray)
	page_areas_by_page = []
	begin
		extractor = Tabula::Extraction::ObjectExtractor.new(File.join(output_dir, 'document.pdf'), :all)
		page_count = extractor.page_count
		rda = Java::TechnologyTabulaDetectors::StringSearch.new
		extractor.extract.each do |page|
			areas = rda.detect(page, boundariesArray)
			page_areas_by_page << areas.map { |rect|
          [ rect.getLeft,
            rect.getTop,
            rect.getWidth,
            rect.getHeight ]
			}
		end
		
	rescue Java::JavaLang::Exception => e
      warn("String bounds detect failed. You may need to select tables manually.")
    end

    File.open(output_dir + "/string.json", 'w') do |f|
      f.puts page_areas_by_page.to_json
    end
	
	File.open(output_dir + "/string_list.json", 'a') do |f|
      f.puts boundariesArray[0] + "," + boundariesArray[1] + "," + boundariesArray[2] + "," + boundariesArray[3] + "\n"
    end
	
    return page_areas_by_page
  end
end