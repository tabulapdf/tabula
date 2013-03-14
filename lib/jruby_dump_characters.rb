# VERY DIRTY SCRIPT
# TODO refactor. we should get rid of the XML intermediate step, anyway.
require 'java'

java_import org.apache.pdfbox.pdfparser.PDFParser
java_import org.apache.pdfbox.pdmodel.PDDocument
java_import org.apache.pdfbox.util.PDFTextStripper
java_import org.apache.pdfbox.pdfviewer.PageDrawer

java_import java.awt.image.BufferedImage
java_import java.awt.Color
java_import java.awt.geom.PathIterator

# java_import java.io.File

$page_contents = []
$current_page = 0
$fonts = Hash.new({})
$page_fonts = Hash.new({})

PRINTABLE_RE = /[[:print:]]/

class TextExtractor < org.apache.pdfbox.util.PDFTextStripper

  attr_accessor :contents, :fonts

  def initialize
    super
    self.fonts = {}
    self.contents = ''
    self.setSortByPosition(true)
  end

  def clear!
    self.contents = ''; self.fonts = {}
  end


  def processTextPosition(text)
#    return if text.getCharacter == ' '

    # text_font = text.getFont
    # text_size = text.getFontSize
    # font_plus_size = self.fonts.select { |k, v| v == text_font }.first.first + "-" + text_size.to_i.to_s

    # $fonts[$current_page].merge!({
    #   font_plus_size => { :family => text_font.getBaseFont, :size => text_size }
    # })

#    $page_contents[$current_page] += "  <text top=\"%.2f\" left=\"%.2f\" width=\"%.2f\" height=\"%.2f\" font=\"#{font_plus_size}\" dir=\"#{text.getDir}\">#{text.getCharacter}</text>\n" % [text.getYDirAdj - text.getHeightDir, text.getXDirAdj, text.getWidthDirAdj, text.getHeightDir]

    c = text.getCharacter
    if c =~ PRINTABLE_RE  # probably not the fastest way of detecting printable chars
      self.contents += "  <text top=\"%.2f\" left=\"%.2f\" width=\"%.2f\" height=\"%.2f\" fontsize=\"%.2f\" dir=\"%s\"><![CDATA[%s]]></text>\n" % [text.getYDirAdj, text.getXDirAdj, text.getWidthDirAdj, text.getHeightDir, text.getFontSize, text.getDir, text.getCharacter]
    end

  end

end


def print_text_locations(pdf_file_name, output_directory)
  pdf_file = PDDocument.loadNonSeq(java.io.File.new(pdf_file_name), nil)
  all_pages = pdf_file.getDocumentCatalog.getAllPages
  extractor = TextExtractor.new

  index_file = File.new(output_directory + "/pages.xml", 'w')
  index_file.puts <<-index_preamble
  <?xml version="1.0" encoding="UTF-8"?>
  <index>
  index_preamble

  all_pages.each_with_index do |page, i|

    contents = page.getContents
    next if contents.nil?

    outfile = File.new(output_directory + "/page_#{i + 1}.xml", 'w')

    extractor.clear!
    extractor.processStream(page, page.findResources, contents.getStream)

    preamble = <<-xmlpreamble
<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml producer="pdfbox" version="1.7.5">
    xmlpreamble
    outfile.puts preamble
    page_tag = "<page number=\"#{i+1}\" position=\"absolute\" top=\"0\" left=\"0\" height=\"#{page.findCropBox.getHeight}\" width=\"#{page.findCropBox.getWidth}\" rotation=\"#{page.getRotation}\""
    outfile.puts page_tag + ">"

    # # $fonts[i].each { |font_id, font|
    # #   puts "  <fontspec id=\"#{font_id}\" size=\"#{font[:size]}\" family=\"#{font[:family]}\" color=\"#000000\"/>"
    # # }

    outfile.puts extractor.contents
    outfile.puts "</page>"
    outfile.puts "</pdf2xml>"
    outfile.close

    index_file.puts page_tag + "/> "

    STDERR.puts "converted #{i+1}/#{all_pages.size}"

  end

  index_file.puts "</index>"
  index_file.close
  pdf_file.close

end

if __FILE__ == $0

  print_text_locations(ARGV[0], ARGV[1])

end
