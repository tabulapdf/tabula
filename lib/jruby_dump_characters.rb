# VERY DIRTY SCRIPT
# TODO refactor. we should get rid of the XML intermediate step, anyway.

require 'erb'
require 'ostruct'
require 'observer'

require 'java'
java_import org.apache.pdfbox.pdfparser.PDFParser
java_import org.apache.pdfbox.pdmodel.PDDocument
java_import org.apache.pdfbox.util.PDFTextStripper
java_import org.apache.pdfbox.pdfviewer.PageDrawer

# java_import java.io.File

$page_contents = []
$current_page = 0
$fonts = Hash.new({})
$page_fonts = Hash.new({})

PRINTABLE_RE = /[[:print:]]/

class TextExtractor < org.apache.pdfbox.util.PDFTextStripper

  attr_accessor :characters, :fonts

  def initialize
    super
    self.fonts = {}
    self.characters = []
    self.setSortByPosition(true)
  end

  def clear!
    self.characters = []; self.fonts = {}
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
    # probably not the fastest way of detecting printable chars
    self.characters << text if c =~ PRINTABLE_RE

  end
end

def prec(n, decimals=2)
  "%.#{decimals}f" % n
end

PT = <<-EOT
<% def prec(n, decimals=2)
  "%.\#{decimals}f" % n
end
%>
<?xml version="1.0" encoding="UTF-8"?>
<pdf2xml producer="pdfbox" version="1.7.5">
<page number="<%= page_number %>" top="0" left="0" height="<%= page.findCropBox.getHeight %>" width="<%= page.findCropBox.getWidth %>" rotation="<%= page.getRotation %>">
<% characters.each do |text| -%>
  <text top="<%= prec(text.getYDirAdj) %>" left="<%= prec(text.getXDirAdj) %>" width="<%= prec(text.getWidthDirAdj) %>" height="<%= prec(text.getHeightDir) %>" fontsize="<%= prec(text.getFontSize) %>" dir="<%= text.getDir.to_i %>"><![CDATA[<%= text.getCharacter -%>]]></text>
<% end %>
</page>
</pdf2xml>
EOT
PAGE_TEMPLATE = ERB.new(PT, nil, '>-')

IT = <<-EOT
<% def prec(n, decimals=2)
  "%.\#{decimals}f" % n
end
%>
<?xml version="1.0" encoding="UTF-8"?>
<index>
<% pages.each_with_index do |page, page_number| %>
<page number="<%= page_number + 1 %>" top="0" left="0" height="<%= prec(page.findCropBox.getHeight) %>" width="<%= prec(page.findCropBox.getWidth) %>" rotation="<%= page.getRotation.to_i %>">
<% end %>
</index>
EOT
INDEX_TEMPLATE = ERB.new(IT, nil, '>-')

class XMLGenerator
  include Observable

  def initialize(pdf_filename, output_directory)
    @pdf_file = PDDocument.loadNonSeq(java.io.File.new(pdf_filename), nil)
    @all_pages = @pdf_file.getDocumentCatalog.getAllPages
    @output_directory = output_directory
    @extractor = TextExtractor.new
  end

  def generate_xml!
    # generate page index
    index_file = File.new(@output_directory + "/pages.xml", 'w')
    index_file.puts INDEX_TEMPLATE.result(OpenStruct.new(pages: @all_pages).instance_eval { binding })
    index_file.close

    # generate xml for each page
    @all_pages.each_with_index do |page, i|
      contents = page.getContents
      next if contents.nil?

      outfile = File.new(@output_directory + "/page_#{i + 1}.xml", 'w')
      @extractor.clear!
      @extractor.processStream(page, page.findResources, contents.getStream)
      outfile.puts PAGE_TEMPLATE.result(OpenStruct.new(page_number: i+1,
                                                       page: page,
                                                       characters: @extractor.characters).instance_eval { binding })
      outfile.close

      changed
      notify_observers(i+1, @all_pages.size)

    end
    @pdf_file.close
  end

end

class STDERRProgressReporter
  def update(page, total_pages)
    STDERR.puts "#{page}///#{total_pages}"
  end
end

def print_text_locations(pdf_filename, output_directory)
  xg = XMLGenerator.new(pdf_filename, output_directory)
  xg.add_observer(STDERRProgressReporter.new)
  xg.generate_xml!
end

if __FILE__ == $0

  print_text_locations(ARGV[0], ARGV[1])

end
