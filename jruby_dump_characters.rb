require 'java'
require 'erb'

import org.apache.pdfbox.pdfparser.PDFParser
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.util.PDFTextStripper

class TextExtractor < org.apache.pdfbox.util.PDFTextStripper

  def processTextPosition(text)
    puts "<text top=\"#{text.getYDirAdj - text.getHeightDir}\" left=\"#{text.getXDirAdj}\" width=\"#{text.getWidthDirAdj}\" height=\"#{text.getHeightDir}\" font=\"0\">#{text.getCharacter}</text>"
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


  pdf_file.getDocumentCatalog.getAllPages.each_with_index do |page, i|
  
    contents = page.getContents
    unless contents.nil?
      puts "<page number=\"#{i+1}\" position=\"absolute\" top=\"0\" left=\"0\" height=\"#{page.findCropBox.getHeight}\" width=\"#{page.findCropBox.getWidth}\" rotation=\"#{page.getRotation}\">"
      extractor.processStream(page, page.findResources, page.getContents.getStream)
      puts "</page>"
    end
  end

  puts "</pdf2xml>"

  pdf_file.close

end

if __FILE__ == $0
  
  print_text_locations ARGV[0]

end


