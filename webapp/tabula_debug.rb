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

      if req.params['clean_rulings'] && req.params['clean_rulings'] != 'false'
        rulings = Tabula::Ruling.clean_rulings(rulings)
      end
      res['Content-Type'] = 'application/json'
      res.write(rulings.uniq.to_json)

    end

  end
end
