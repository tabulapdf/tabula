# VERY DIRTY SCRIPT
# TODO we need to get rid of the XML intermediate step, anyway.
require 'java'
require 'erb'

import org.apache.pdfbox.pdfparser.PDFParser
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.util.PDFTextStripper


$page_contents = []
$current_page = 0
$fonts = Hash.new({})
$page_fonts = Hash.new({})

class TextExtractor < org.apache.pdfbox.util.PDFTextStripper


  def processTextPosition(text)
    text_font = text.getFont
    text_size = text.getFontSize
    font_plus_size = $page_fonts[$current_page].select { |k, v| v == text_font }.first.first + "-" + text_size.to_i.to_s
    $fonts[$current_page].merge!({ 
      font_plus_size => { :family => text_font.getBaseFont, :size => text_size }
    })
    $page_contents[$current_page] += "<text top=\"#{text.getYDirAdj - text.getHeightDir}\" left=\"#{text.getXDirAdj}\" width=\"#{text.getWidthDirAdj}\" height=\"#{text.getHeightDir}\" font=\"#{font_plus_size}\">#{text.getCharacter}</text>\n"
  end

end


def print_text_locations(pdf_file_name)
  pdf_file = PDDocument.load pdf_file_name

  extractor = TextExtractor.new
  extractor.setSortByPosition(true)

    puts <<-xmlpreamble
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf2xml SYSTEM "pdf2xml.dtd">
<pdf2xml producer="pdfbox" version="1.7.5">
    xmlpreamble

  pages = pdf_file.getDocumentCatalog.getAllPages
  $page_contents = [''] * pages.size

  pages.each_with_index do |page, i|
    $current_page = i
    contents = page.getContents
    $page_fonts[i].merge! page.findResources.getFonts($page_fonts)
    extractor.processStream(page, page.findResources, contents.getStream) unless contents.nil?

  end


  pages.each_with_index do |page, i|
    puts "<page number=\"#{i+1}\" position=\"absolute\" top=\"0\" left=\"0\" height=\"#{page.findCropBox.getHeight}\" width=\"#{page.findCropBox.getWidth}\" rotation=\"#{page.getRotation}\">"
    
    $fonts[i].each { |font_id, font|
      puts "<fontspec id=\"#{font_id}\" size=\"#{font[:size]}\" family=\"#{font[:family]}\" color=\"#000000\"/>"
    }
    puts $page_contents[i]
    puts "</page>"
  end

  puts $fonts.inspect



  puts "</pdf2xml>"

  pdf_file.close

end

if __FILE__ == $0
  
  print_text_locations ARGV[0]

end


