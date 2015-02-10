require 'json'

class TabulaDebug < Roda
  clear_middleware!

  route do
    on :file_id, :method=>:get do |file_id|
      par = JSON.load(request['coords']).first
      page = par['page']
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::ObjectExtractor.new(pdf_path, [page])

      is "characters" do |file_id|
        text_elements = extractor.extract.next.get_text([par['y1'].to_f,
                                                         par['x1'].to_f,
                                                         par['y2'].to_f,
                                                         par['x2'].to_f])

        text_elements.map { |te|
          { 'left' => te.left,
            'top' => te.top,
            'width' => te.width,
            'height' => te.height,
            'text' => te.text }
        }
      end

      is "text_chunks" do |file_id|
        text_elements = extractor.extract.next.get_text([par['y1'].to_f,
                                                         par['x1'].to_f,
                                                         par['y2'].to_f,
                                                         par['x2'].to_f])

        text_chunks = Tabula::TextElement.merge_words(text_elements)

        text_chunks.map { |te|
          { 'left' => te.left,
            'top' => te.top,
            'width' => te.width,
            'height' => te.height,
            'text' => te.text }
        }
      end


      is "clipping_paths" do |file_id|
        extractor.debug_clipping_paths = true

        extractor.extract.next

        extractor.clipping_paths.map { |cp|
          {
            'left' => cp.left,
            'top' => cp.top,
            'width' => cp.width,
            'height' => cp.height
          }
        }
      end

      is "rulings" do |file_id|
        # crop lines to area of interest
        top, left, bottom, right = [par['y1'].to_f,
                                    par['x1'].to_f,
                                    par['y2'].to_f,
                                    par['x2'].to_f]

        area = Tabula::ZoneEntity.new(top, left,
                                      right - left, bottom - top)

        page_obj = extractor.extract.next
        page_area = page_obj.get_area(area)
        rulings = page_area.ruling_lines

        intersections = {}
        if request['show_intersections'] != 'false'
          intersections = Tabula::Ruling.find_intersections(page_area.horizontal_ruling_lines,
                                                            page_area.vertical_ruling_lines)
        end

        {:rulings => rulings.uniq, :intersections => intersections.keys}
      end

    end
  end
end
