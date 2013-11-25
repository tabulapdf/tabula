require 'json'

class TabulaDebug < Cuba
  define do

    on ":file_id/characters" do |file_id|
      par = JSON.load(req.params['coords']).first
      page = par['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [page])

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

    on ":file_id/rulings" do |file_id|
      page = JSON.load(req.params['coords']).first['page']

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)

      rulings = ::Tabula::Extraction::LineExtractor.lines_in_pdf_page(File.join(pdf_path, 'document.pdf'),
                                                                    page - 1,
                                                                    :render_pdf => req.params['render_page'] == 'true')

      if req.params['clean_rulings'] != 'false'
        rulings = Tabula::Ruling.clean_rulings(rulings)
      end

      # crop lines to area of interest
      par = JSON.load(req.params['coords']).first
      top, left, bottom, right = [par['y1'].to_f,
                                  par['x1'].to_f,
                                  par['y2'].to_f,
                                  par['x2'].to_f]
      area = Tabula::ZoneEntity.new(top, left,
                                    right - left, bottom - top)
      rulings = Tabula::Ruling.crop_rulings_to_area(rulings, area)

      intersections = {}
      if req.params['show_intersections'] != 'false'
        intersections = Tabula::Ruling.find_intersections(rulings.find_all(&:horizontal?),
                                                          rulings.find_all(&:vertical?))
      end

      res['Content-Type'] = 'application/json'
      res.write({:rulings => rulings.uniq, :intersections => intersections.keys }.to_json)
    end

  end
end
