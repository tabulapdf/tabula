# -*- coding: utf-8 -*-
require 'cuba'
require "cuba/render"

require "docsplit" # for page thumbnails
require 'nokogiri'
require "digest/sha1"
require 'json'

require './tabula.rb'

Cuba.plugin Cuba::Render
Cuba.use Rack::Static, root: "static", urls: ["/css","/js", "/img", "/pdfs", "/scripts"]

USE_JRUBY_ANALYZER = true

def run_pdftohtml(file, output_dir)
  `/usr/local/Cellar/poppler/0.20.2/bin/pdftohtml -xml #{file} #{File.join(output_dir, 'document.xml')}`
  #`/usr/local/Cellar/pdftohtml/0.40a/bin/pdftohtml -xml #{file} #{File.join(output_dir, 'document.xml')}`
end

def run_jrubypdftohtml(file, output_dir)
  `CLASSPATH=lib/jars/fontbox-1.7.1.jar:lib/jars/pdfbox-1.7.1.jar:lib/jars/commons-logging-1.1.1.jar:lib/jars/jempbox-1.7.1.jar /Users/manuel/.rvm/rubies/jruby-1.6.5/bin/jruby jruby_dump_characters.rb #{file} > #{File.join(output_dir, 'document.xml')}`
end

def parse_document_xml(file)
  Nokogiri::XML(File.open(file)) # { |config| config.default_xml.noblanks }
end

Cuba.define do

  on get do
    on root do
      res.write view("index.html", )
    end

    on "pdf/:file_id/data" do |file_id| # TODO validate that file_id is /[a-f0-9]{40}/
      xml = parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
      
      text_nodes = xml.xpath("//page[@number=#{req.params['page']}]//text[@top > #{req.params['y1']} and @top < #{req.params['y2']} and @left > #{req.params['x1']} and @left < #{req.params['x2']}]")

      #text_nodes.each { |tn| puts tn.to_xml(:indent => 2) }

      text_elements = text_nodes.map { |tn| 
        { 
          left: tn.attr('left').to_f,
          top: tn.attr('top').to_f,
          width: tn.attr('width').to_f,
          height: tn.attr('height').to_f,
          text: tn.text
        }
      }

      
 
      res['Content-Type'] = 'application/json'
      table = Tabula.make_table(text_elements, USE_JRUBY_ANALYZER).map { |line| 
        line.texts.sort_by { |t| t[:left] }
      }
      puts table
      res.write table.to_json

    end
 

    on "pdf/:file_id" do |file_id| 
      # TODO validate that file_id is  /[a-f0-9]{40}/
            
      res.write view("pdf_view.html",
                     page_images: Dir.glob(File.join("static/pdfs/", file_id, "document_*.jpg")).sort_by { |f| f.gsub(/[^\d]/, '').to_i },
                     pages:       parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
                                    .xpath("//page"))
      
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

      if USE_JRUBY_ANALYZER
        run_jrubypdftohtml(File.join(file_path, 'document.pdf'), file_path)
      else
        run_pdftohtml(File.join(file_path, 'document.pdf'), file_path)
      end
      

      res.redirect "/pdf/#{file_id}"
    end
  end
  
end

