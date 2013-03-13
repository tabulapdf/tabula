# -*- coding: utf-8 -*-
require 'cuba'
require 'cuba/render'

require 'nokogiri'
require 'digest/sha1'
require 'json'
require 'csv'

require './lib/detect_rulings.rb'
require './lib/tabula.rb'
require './lib/tabula_graph.rb'
require './local_settings.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts", "/swf"]

def run_pdftohtml(file, output_dir)
  `#{Settings::PDFTOHTML_PATH} -xml #{file} #{File.join(output_dir, 'document.xml')}`
end

def run_jrubypdftohtml(file, output_dir)
  system({"CLASSPATH" => "lib/jars/fontbox-1.7.1.jar:lib/jars/pdfbox-1.7.1.jar:lib/jars/commons-logging-1.1.1.jar:lib/jars/jempbox-1.7.1.jar"},
         "#{Settings::JRUBY_PATH} --1.9 --server lib/jruby_dump_characters.rb #{file} #{output_dir}")
end

def run_mupdfdraw(file, output_dir, width=560, page=nil)

  cmd = "#{Settings::MUDRAW_PATH} -w #{width} -o " \
    + File.join(output_dir, "document_#{width}_%d.png") \
    + " #{file}"

  cmd += " #{page}" unless page.nil?

  `#{cmd}`

end

def parse_document_xml(file_id, page)
  f = File.open(File.join(Dir.pwd, "static/pdfs/#{file_id}/page_#{page}.xml"))
  xml = Nokogiri::XML(f)
  f.close
  xml
end

def get_text_elements(file_id, page, x1, y1, x2, y2)
  xml = parse_document_xml(file_id, page)
  xpath = "//page[@number=#{page}]//text[@top > #{y1} and (@top + @height) < #{y2} and @left > #{x1} and (@left + @width) < #{x2}]"
  text_nodes = xml.xpath(xpath)
  text_nodes.find_all { |e| e.name == 'text' }.map { |tn|
    Tabula::TextElement.new(tn.attr('top').to_f,
                            tn.attr('left').to_f,
                            tn.attr('width').to_f,
                            tn.attr('height').to_f,
                            tn.attr('font').to_s,
                            tn.attr('fontsize').to_f,
                            tn.text)
  }
end

Cuba.define do

  on get do
    on root do
      res.write view("index.html")
    end

    ## TODO delete
    on "pdf/:file_id/whitespace" do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      whitespace =  Tabula.find_whitespace(text_elements,
                                           Tabula::ZoneEntity.new(req.params['y1'].to_f,
                                                                  req.params['x1'].to_f,
                                                                  req.params['x2'].to_f - req.params['x1'].to_f,
                                                                  req.params['y2'].to_f - req.params['y1'].to_f))

      res['Content-Type'] = 'application/json'
      res.write whitespace.to_json

    end

    # TODO validate that file_id is /[a-f0-9]{40}/
    on "pdf/:file_id/data" do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      table = Tabula.make_table(text_elements)


      # merged = Tabula.merge_words(text_elements)
      # whitespace = Tabula.find_whitespace(merged,
      #                                     Tabula::ZoneEntity.new(req.params['y1'].to_f,
      #                                                            req.params['x1'].to_f,
      #                                                            req.params['x2'].to_f - req.params['x1'].to_f,
      #                                                            req.params['y2'].to_f - req.params['y1'].to_f))

      # puts whitespace.inspect

      if req.params['split_multiline_cells'] == 'true'
        table = Tabula.merge_multiline_cells(table)
      end

      line_texts = table.map { |line|
        line.text_elements.sort_by { |t| t.left }
      }

      if req.params['format'] == 'csv'
        res['Content-Type'] = 'text/csv'
        csv_string = CSV.generate { |csv|
          line_texts.each { |l|
            csv << l.map { |c| c.text }
          }
        }
        res.write csv_string
      else
        res['Content-Type'] = 'application/json'
        res.write line_texts.to_json
      end


    end

    on "pdf/:file_id/columns" do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      res['Content-Type'] = 'application/json'
      res.write Tabula.get_columns(text_elements, true).to_json

    end

    on "pdf/:file_id/rows" do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      rows = Tabula.get_rows(text_elements, true)
      res['Content-Type'] = 'application/json'
      res.write rows.to_json

    end

    on "pdf/:file_id/characters" do |file_id|
      text_elements = get_text_elements(file_id,
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

    on "pdf/:file_id/rulings" do |file_id|
      lines = Tabula::Rulings::detect_rulings(File.join(Dir.pwd, "static/pdfs/#{file_id}/document_2048_#{req.params['page']}.png"),
                                              req.params['x1'].to_f,
                                              req.params['y1'].to_f,
                                              req.params['x2'].to_f,
                                              req.params['y2'].to_f)
      # File.open('/tmp/rulings.marshal', 'w') do |f|
      #   f.write(Marshal.dump(lines))
      # end
      res['Content-Type'] = 'application/json'
      res.write lines.to_json
    end

    on 'pdf/:file_id/graph' do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])
      text_elements = Tabula::Graph.merge_text_elements(text_elements)

      res['Content-Type'] = 'application/json'
      res.write Tabula::Graph::Graph.make_graph(text_elements).to_json

    end

    on "pdf/:file_id" do |file_id|
      # TODO validate that file_id is  /[a-f0-9]{40}/
      document_dir = File.join(Dir.pwd, "static/pdfs/#{file_id}")
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
                       page_images: Dir.glob(File.join(document_dir, "document_560_*.png"))
                         .sort_by { |f| f.gsub(/[^\d]/, '').to_i }
                         .map { |f| f.gsub(Dir.pwd + '/static', '') },
                       pages: File.open(File.join(Dir.pwd,
                                                  "static/pdfs/#{file_id}/pages.xml")) { |index_file|
                         Nokogiri::XML(index_file).xpath('//page')
                       })
      end
    end
  end

  on post do
    on 'upload' do
      file_id = Digest::SHA1.hexdigest(Time.now.to_s)
      file_path = File.join(Dir.pwd, 'static', 'pdfs', file_id)
      FileUtils.mkdir(file_path)
      FileUtils.cp(req.params['file'][:tempfile].path,
                   File.join(file_path, 'document.pdf'))

      run_mupdfdraw(File.join(file_path, 'document.pdf'), file_path) # 560 width
      run_mupdfdraw(File.join(file_path, 'document.pdf'), file_path, 2048) # 2048 width


      run_jrubypdftohtml(File.join(file_path, 'document.pdf'), file_path)

      res.redirect "/pdf/#{file_id}"
    end
  end

end
