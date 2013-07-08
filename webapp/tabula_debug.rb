require 'json'

class TabulaDebug < Cuba
  define do
    ## TODO delete
    on ":file_id/whitespace" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')

      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [req.params['page'].to_i])

      text_elements = extractor.extract.next.get_text([req.params['y1'].to_f,
                                                       req.params['x1'].to_f,
                                                       req.params['y2'].to_f,
                                                       req.params['x2'].to_f])


      whitespace =  Tabula::Whitespace.find_whitespace(Tabula::TableExtractor.new(text_elements, :merge_words => true).text_elements,
                                                       Tabula::ZoneEntity.new(req.params['y1'].to_f,
                                                                              req.params['x1'].to_f,
                                                                              req.params['x2'].to_f - req.params['x1'].to_f,
                                                                              req.params['y2'].to_f - req.params['y1'].to_f))

      res['Content-Type'] = 'application/json'
      res.write whitespace.to_json
    end


    on ":file_id/columns" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [req.params['page'].to_i || 1])

      text_elements = extractor.extract.next.get_text([req.params['y1'].to_f,
                                                       req.params['x1'].to_f,
                                                       req.params['y2'].to_f,
                                                       req.params['x2'].to_f])

      res['Content-Type'] = 'application/json'
      res.write Tabula.get_columns(text_elements, true).to_json

    end

    on ":file_id/rows" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [req.params['page'].to_i || 1])

      text_elements = extractor.extract.next.get_text([req.params['y1'].to_f,
                                                       req.params['x1'].to_f,
                                                       req.params['y2'].to_f,
                                                       req.params['x2'].to_f])
      make_table_options = {}

      if !req.params['use_lines'].nil? and req.params['use_lines'] != 'false'
        page_dimensions = Tabula::XML.get_page_dimensions(pdf_path, req.params['page'].to_i || 1)
        rulings = Tabula::Rulings::detect_rulings(File.join(pdf_path,
                                                            "document_2048_#{req.params['page'].to_i || 1}.png"),
                                                  page_dimensions[:width] / 2048.0)

        make_table_options[:horizontal_rulings] = rulings[:horizontal]
        make_table_options[:vertical_rulings] = rulings[:vertical]
      end

      rows = Tabula::TableExtractor.new(text_elements,
                                        make_table_options).get_rows

      res['Content-Type'] = 'application/json'
      res.write rows.to_json

    end

    on ":file_id/characters" do |file_id|
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [req.params['page'].to_i || 1])

      text_elements = extractor.extract.next.get_text([req.params['y1'].to_f,
                                                       req.params['x1'].to_f,
                                                       req.params['y2'].to_f,
                                                       req.params['x2'].to_f])

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
      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id)

      page = req.params['page'].to_i - 1

      rulings = Tabula::LSD.detect_lines_in_pdf_page(File.join(pdf_path, 'document.pdf'),
                                                     page,
                                                     :image_size => 1024)

      rulings = Tabula::Ruling.clean_rulings(rulings)

      res['Content-Type'] = 'application/json'
      res.write(rulings.to_json)

    end

    on 'pdf/:file_id/graph' do |file_id|

      pdf_path = File.join(TabulaSettings::DOCUMENTS_BASEPATH, file_id, 'document.pdf')
      extractor = Tabula::Extraction::CharacterExtractor.new(pdf_path, [page])

      text_elements = extractor.extract.next.get_text([req.params['y1'].to_f,
                                                       req.params['x1'].to_f,
                                                       req.params['y2'].to_f,
                                                       req.params['x2'].to_f])

      text_elements = Tabula::Graph.merge_text_elements(text_elements)

      res['Content-Type'] = 'application/json'
      res.write Tabula::Graph::Graph.make_graph(text_elements).to_json

    end
  end
end
