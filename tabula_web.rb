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

def run_pdftohtml(file, output_dir)
  `pdftohtml -xml #{file} #{File.join(output_dir, 'document.xml')}`
end

def parse_document_xml(file)
  Nokogiri::XML(File.open(file)) # { |config| config.default_xml.noblanks }
end

Cuba.define do

  on get do
    on root do
      res.write view("index.html")
    end

    on "pdf/:file_id/data" do |file_id| # TODO validate that file_id is /[a-f0-9]{40}/
      xml = parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
      text_nodes = xml.xpath("//page[@number=#{req.params['page']}]//text[@top > #{req.params['y1']} and @top < #{req.params['y2']} and @left > #{req.params['x1']} and @left < #{req.params['x2']}]")

      text_nodes.each { |tn| puts tn.to_xml(:indent => 2) }

      

      text_elements = text_nodes.map { |tn| 
        { 
          left: tn.attr('left').to_i,
          top: tn.attr('top').to_i,
          width: tn.attr('width').to_i,
          height: tn.attr('height').to_i,
          text: tn.text
        }
      }

      res['Content-Type'] = 'application/json'
      res.write Tabula.make_table(text_elements).map { |line| 
        line.texts.sort_by { |t| t[:left] }
      }.to_json

    end
 

    on "pdf/:file_id" do |file_id| 
      # TODO validate that file_id is  /[a-f0-9]{40}/
            
      res.write view("pdf_view.html",
                     page_images: Dir.glob(File.join("static/pdfs/", file_id, "document_*.jpg")),
                     page_sizes:  parse_document_xml(File.join(Dir.pwd, "static/pdfs/#{file_id}/document.xml"))
                                    .xpath("//page").map { |p| [p.attr('width'), p.attr('height')] })
      
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
                              :size => '500x', :format => [:jpg], :output => file_path)

      run_pdftohtml(File.join(file_path, 'document.pdf'), file_path)

      res.redirect "/pdf/#{file_id}"
    end
  end
  
end

