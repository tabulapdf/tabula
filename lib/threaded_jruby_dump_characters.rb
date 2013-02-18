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


class TextExtractor < org.apache.pdfbox.util.PDFTextStripper

  attr_accessor :contents, :fonts

  def initialize
    super
    self.setSortByPosition(true)
    self.fonts = {}
    self.contents = ''
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

    self.contents += "  <text top=\"%.2f\" left=\"%.2f\" width=\"%.2f\" height=\"%.2f\" font=\"\" dir=\"%s\"><![CDATA[%s]]></text>\n" % [text.getYDirAdj - text.getHeightDir, text.getXDirAdj, text.getWidthDirAdj, text.getHeightDir, text.getDir, text.getCharacter]

  end

end

require 'peach'
#require 'parallel'

def print_text_locations(pdf_file_name, output_directory)
  pdf_file = PDDocument.loadNonSeq(java.io.File.new(pdf_file_name), nil)
  number_of_pages = pdf_file.getNumberOfPages
  pdf_file.close

  open_docs = []

#  Parallel.each(0.upto(number_of_pages - 1), :in_threads => ) do |i|

  0.upto(number_of_pages - 1).to_a.peach(10) do |i|

    # pdfbox is not threadsafe, resorting to threadlocals :(
    # threaded text extraction *appears* to improve performance
    if Thread.current[:document].nil?
      puts "OPENING FILE in Thread #{Thread.current.inspect}"
      Thread.current[:document] = PDDocument.loadNonSeq(java.io.File.new(pdf_file_name), nil)
      open_docs << Thread.current[:document]
      Thread.current[:extractor] = TextExtractor.new
      Thread.current[:all_pages] = Thread.current[:document].getDocumentCatalog.getAllPages
    end

    page = Thread.current[:all_pages].get(i)

    contents = page.getContents
    next if contents.nil?

    outfile = File.new(output_directory + "/page_#{i + 1}.xml", 'w')

    extractor = Thread.current[:extractor]
    extractor.clear!
    extractor.processStream(page, page.findResources, contents.getStream)

    preamble = <<-xmlpreamble
<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml producer="pdfbox" version="1.7.5">
    xmlpreamble
    outfile.puts preamble
    outfile.puts "<page number=\"#{i+1}\" position=\"absolute\" top=\"0\" left=\"0\" height=\"#{page.findCropBox.getHeight}\" width=\"#{page.findCropBox.getWidth}\" rotation=\"#{page.getRotation}\">"

    # $fonts[i].each { |font_id, font|
    #   puts "  <fontspec id=\"#{font_id}\" size=\"#{font[:size]}\" family=\"#{font[:family]}\" color=\"#000000\"/>"
    # }

    outfile.puts extractor.contents
    outfile.puts "</page>"
    outfile.puts "</pdf2xml>"
    outfile.close

    STDERR.puts "converted #{i+1}/#{number_of_pages} (by thread #{Thread.current.inspect})"

  end

  open_docs.each { |od| od.close }



end

if __FILE__ == $0

  print_text_locations(ARGV[0], ARGV[1])

end
