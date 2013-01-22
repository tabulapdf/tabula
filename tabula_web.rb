# -*- coding: utf-8 -*-
require 'cuba'
require "cuba/render"

require "docsplit" # for page thumbnails
require 'nokogiri'
require "digest/sha1"
require 'json'
require 'csv'
require 'opencv'


require './lib/tabula.rb'
require './local_settings.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts", "/swf"]

def run_pdftohtml(file, output_dir)
  `#{Settings::PDFTOHTML_PATH} -xml #{file} #{File.join(output_dir, 'document.xml')}`
end

def run_jrubypdftohtml(file, output_dir)
  cmd = "CLASSPATH=lib/jars/fontbox-1.7.1.jar:lib/jars/pdfbox-1.7.1.jar:lib/jars/commons-logging-1.1.1.jar:lib/jars/jempbox-1.7.1.jar #{Settings::JRUBY_PATH} --1.9 --server lib/jruby_dump_characters.rb #{file} /tmp 500 > #{File.join(output_dir, 'document.xml')}"
  puts cmd
  `#{cmd}`

end

def run_mupdfdraw(file, output_dir, width=560)
  cmd = "#{Settings::MUDRAW_PATH} -w #{width} -o " \
    + File.join(output_dir, "document_#{width}_%d.png") \
    + " #{file} > /dev/null"
  `#{cmd}`
end

def parse_document_xml(file)
  Nokogiri::XML(File.open(file))
end

def get_text_elements(file_id, page, x1, y1, x2, y2)
  xml = parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
  xpath = "//page[@number=#{page}]//text[@top > #{y1} and (@top + @height) < #{y2} and @left > #{x1} and (@left + @width) < #{x2}]"
  text_nodes = xml.xpath(xpath)
  text_nodes.find_all { |e| e.name == 'text' }.map { |tn|
    Tabula::TextElement.new(tn.attr('top').to_f,
                            tn.attr('left').to_f,
                            tn.attr('width').to_f,
                            tn.attr('height').to_f,
                            tn.attr('font').to_s,
                            tn.text)
  }
end

def get_rulings(file_id, page, x1, y1, x2, y2)
  xml = parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
  xpath = "//page[@number=#{page}]//line[@top > #{y1} and (@top + @height) < #{y2} and @left > #{x1} and (@left + @width) < #{x2}]"
  line_nodes = xml.xpath(xpath)
  line_nodes.map { |tn|
    Tabula::Ruling.new(tn.attr('top').to_f,
                       tn.attr('left').to_f,
                       tn.attr('width').to_f,
                       tn.attr('height').to_f,
                       tn.attr('color').to_s)
  }.uniq
end

def hough(file_id, page)
  mat = OpenCV::CvMat.load(File.join(Dir.pwd, "static/pdfs/#{file_id}/document_2048_#{page}.png"),
                           OpenCV::CV_LOAD_IMAGE_ANYCOLOR | OpenCV::CV_LOAD_IMAGE_ANYDEPTH)

  # TODO if mat is not 3-channel, don't do BGR2GRAY
  mat = mat.BGR2GRAY
  mat_canny = mat.canny(1, 50, 3)
  mat = mat.GRAY2BGR

  lines = mat_canny.hough_lines(:probabilistic, 5, (Math::PI/180) * 45, 200, 100, 10)
  lines.map do |line|
    [line.point1.x, line.point1.y, line.point2.x, line.point2.y]
  end

  # wh = mat.size.width + mat.size.height
  # lines = mat_canny.hough_lines(:multi_scale, 1, Math::PI / 180, 100, 0, 0)
  # lines.map do |line|
  #   rho = line[0]; theta = line[1]
  #   a = Math.cos(theta); b = Math.sin(theta)
  #   x0 = a * rho; y0 = b * rho;
  #   [x0 + wh * (-b), y0 + wh*(a), x0 - wh*(-b), y0 - wh*(a)]
  # end
end


Cuba.define do

  on get do
    on root do
      res.write view("index.html")
    end

    # TODO validate that file_id is /[a-f0-9]{40}/
    on "pdf/:file_id/data" do |file_id|

      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      table = Tabula.make_table(text_elements,
                                Settings::USE_JRUBY_ANALYZER)

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
      res.write Tabula.get_columns(text_elements,
                              Settings::USE_JRUBY_ANALYZER).to_json

    end

    on "pdf/:file_id/rows" do |file_id|
      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      rows = Tabula.get_rows(text_elements, Settings::USE_JRUBY_ANALYZER)
      res['Content-Type'] = 'application/json'
      res.write rows.to_json

    end

    on "pdf/:file_id/rulings" do |file_id|
      rulings = get_rulings(file_id,
                            req.params['page'],
                            req.params['x1'],
                            req.params['y1'],
                            req.params['x2'],
                            req.params['y2'])

      res['Content-Type'] = 'application/json'
      r = rulings.sort_by(&:top).find_all { |x| x.height < 1 }.map(&:to_h).uniq
      res.write r.to_json
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

    on "pdf/:file_id/lines" do |file_id|
      lines = hough(file_id,
                    req.params['page'])
      res['Content-Type'] = 'application/json'
      res.write lines.to_json
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
                       pages:       parse_document_xml(File.join(document_dir, "document.xml"))
                         .xpath("//page"))
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


      if Settings::USE_JRUBY_ANALYZER
        run_jrubypdftohtml(File.join(file_path, 'document.pdf'), file_path)
      else
        run_pdftohtml(File.join(file_path, 'document.pdf'), file_path)
      end


      res.redirect "/pdf/#{file_id}"
    end
  end

end
