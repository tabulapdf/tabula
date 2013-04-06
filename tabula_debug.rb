class TabulaDebug < Cuba
  define do
    ## TODO delete
    on ":file_id/whitespace" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])

      whitespace =  Tabula::Whitespace.find_whitespace(text_elements,
                                                       Tabula::ZoneEntity.new(req.params['y1'].to_f,
                                                                              req.params['x1'].to_f,
                                                                              req.params['x2'].to_f - req.params['x1'].to_f,
                                                                              req.params['y2'].to_f - req.params['y1'].to_f))

      res['Content-Type'] = 'application/json'
      res.write whitespace.to_json

    end


    on ":file_id/columns" do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])

      res['Content-Type'] = 'application/json'
      res.write Tabula.get_columns(text_elements, true).to_json

    end

    on ":file_id/rows" do |file_id|
      pdf_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)

      text_elements = Tabula::XML.get_text_elements(pdf_path,
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])
      make_table_options = {}

      if !req.params['use_lines'].nil? and req.params['use_lines'] != 'false'
        page_dimensions = Tabula::XML.get_page_dimensions(pdf_path, req.params['page'])
        rulings = Tabula::Rulings::detect_rulings(File.join(pdf_path,
                                                            "document_2048_#{req.params['page']}.png"),
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
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])


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
      pdf_path = File.join(Settings::DOCUMENTS_BASEPATH, file_id)
      page_dimensions = Tabula::XML.get_page_dimensions(pdf_path, req.params['page'])
      rulings = Tabula::Rulings::detect_rulings(File.join(pdf_path,
                                                          "document_2048_#{req.params['page']}.png"),
                                                page_dimensions[:width] / 2048.0)

      res['Content-Type'] = 'application/json'
      res.write((rulings[:horizontal] + rulings[:vertical]).to_json)

    end

    on 'pdf/:file_id/graph' do |file_id|
      text_elements = Tabula::XML.get_text_elements(File.join(Settings::DOCUMENTS_BASEPATH, file_id),
                                                    req.params['page'],
                                                    req.params['x1'],
                                                    req.params['y1'],
                                                    req.params['x2'],
                                                    req.params['y2'])
      text_elements = Tabula::Graph.merge_text_elements(text_elements)

      res['Content-Type'] = 'application/json'
      res.write Tabula::Graph::Graph.make_graph(text_elements).to_json

    end
  end
end
