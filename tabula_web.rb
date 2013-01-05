# -*- coding: utf-8 -*-
require 'cuba'
require "cuba/render"

require "docsplit" # for page thumbnails
require 'nokogiri'
require "digest/sha1"
require 'json'
require 'csv'

require './tabula.rb'
require './local_settings.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts", "/swf"]

def run_pdftohtml(file, output_dir)
  `#{Settings::PDFTOHTML_PATH} -xml #{file} #{File.join(output_dir, 'document.xml')}`
end

def run_jrubypdftohtml(file, output_dir)
  `CLASSPATH=lib/jars/fontbox-1.7.1.jar:lib/jars/pdfbox-1.7.1.jar:lib/jars/commons-logging-1.1.1.jar:lib/jars/jempbox-1.7.1.jar #{Settings::JRUBY_PATH} --1.9 --server jruby_dump_characters.rb #{file} /tmp 500 > #{File.join(output_dir, 'document.xml')}`
end

def parse_document_xml(file)
  Nokogiri::XML(File.open(file)) # { |config| config.default_xml.noblanks }
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
  # require 'opencv'
  # include OpenCV
  # mat = CvMat.load("/Users/manuel/Work/cosas/tablextract/tabula/static/pdfs/f670d9f076cbe4cd26478145a191d38aaff784ce/document_19.jpg" , CV_LOAD_IMAGE_ANYCOLOR | CV_LOAD_IMAGE_ANYDEPTH)
  # mat = mat.BGR2GRAY
  # mat_canny = mat.canny(50, 200, 3)
  # lines = mat_canny.hough_lines(:probabilistic, 1, Math::PI / 180, 65)
  # mat = mat.GRAY2BGR
  # lines.each { |p| mat.line!(p[0], p[1], :color => CvColor::Red, :thickness => 2) }
  # window = OpenCV::GUI::Window.new("preview")
  # window.show(mat)
end

Cuba.define do

  on get do
    on root do
      res.write view("index.html", )
    end

    on "pdf/:file_id/data" do |file_id| # TODO validate that file_id is /[a-f0-9]{40}/

      text_elements = get_text_elements(file_id,
                                        req.params['page'],
                                        req.params['x1'],
                                        req.params['y1'],
                                        req.params['x2'],
                                        req.params['y2'])

      table = Tabula.make_table(text_elements, 
                                Settings::USE_JRUBY_ANALYZER,
                                req.params['split_multiline_cells'] == 'true')

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


    on "pdf/:file_id" do |file_id| 
      # TODO validate that file_id is  /[a-f0-9]{40}/
      document_dir = File.join(Dir.pwd, "static/pdfs/#{file_id}")
      unless File.directory?(document_dir)
        res.status = 404
      else
        res.write view("pdf_view.html",
                       page_images: Dir.glob(File.join(document_dir, "document_*.jpg"))
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

      Docsplit.extract_images(File.join(file_path, 'document.pdf'),
                              :size => '560x', :format => [:jpg], :output => file_path)

      if Settings::USE_JRUBY_ANALYZER
        run_jrubypdftohtml(File.join(file_path, 'document.pdf'), file_path)
      else
        run_pdftohtml(File.join(file_path, 'document.pdf'), file_path)
      end
      

      res.redirect "/pdf/#{file_id}"
    end
  end
  
end

