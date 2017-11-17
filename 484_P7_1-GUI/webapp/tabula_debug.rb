require 'json'

class TabulaDebug < Cuba
  define do

    on ":file_id/characters" do |file_id|
      par = JSON.load(req.params['coords']).first
      page = par['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::ObjectExtractor.new(pdf_path, [page])

      text_elements = extractor.extract.next.get_text([par['y1'].to_f,
                                                       par['x1'].to_f,
                                                       par['y2'].to_f,
                                                       par['x2'].to_f])

      res['Content-Type'] = 'application/json'
      res.write text_elements.map { |te|
        { 'left' => te.left,
          'top' => te.top,
          'width' => te.width,
          'height' => te.height,
          'text' => te.text }
      }.to_json
    end

    on ":file_id/text_chunks" do |file_id|
      par = JSON.load(req.params['coords']).first
      page = par['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::ObjectExtractor.new(pdf_path, [page])

      text_elements = extractor.extract.next.get_text([par['y1'].to_f,
                                                       par['x1'].to_f,
                                                       par['y2'].to_f,
                                                       par['x2'].to_f])

      text_chunks = Tabula::TextElement.merge_words(text_elements)

      puts text_chunks.inspect

      res['Content-Type'] = 'application/json'
      res.write text_chunks.map { |te|
        { 'left' => te.left,
          'top' => te.top,
          'width' => te.width,
          'height' => te.height,
          'text' => te.text }
      }.to_json
    end


    on ":file_id/clipping_paths" do |file_id|
      par = JSON.load(req.params['coords']).first
      page = par['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::ObjectExtractor.new(pdf_path, [page])
      extractor.debug_clipping_paths = true

      extractor.extract.next

      res['Content-Type'] = 'application/json'
      res.write extractor.clipping_paths.map { |cp|
        {
          'left' => cp.left,
          'top' => cp.top,
          'width' => cp.width,
          'height' => cp.height
        }
      }.to_json
    end

    on ":file_id/rulings" do |file_id|
      par = JSON.load(req.params['coords']).first
      page = par['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::ObjectExtractor.new(pdf_path, [page])

      # crop lines to area of interest
      par = JSON.load(req.params['coords']).first
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
      if req.params['show_intersections'] != 'false'
        intersections = Tabula::Ruling.find_intersections(page_area.horizontal_ruling_lines,
                                                          page_area.vertical_ruling_lines)
      end

      res['Content-Type'] = 'application/json'
      res.write({:rulings => rulings.uniq, :intersections => intersections.keys }.to_json)
    end

  end
end
