require 'nokogiri'

module Tabula
  module XML

    def XML.parse_document_xml(document_base_path, page)
      f = File.open(File.join(document_base_path, "page_#{page}.xml"))
      xml = Nokogiri::XML(f)
      f.close
      xml
    end

    def XML.get_text_elements(document_base_path, page, x1, y1, x2, y2)
      xml = parse_document_xml(document_base_path, page)
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

    def XML.get_page_dimensions(document_base_path, page)
      root = parse_document_xml(document_base_path, page).xpath('//page')
      width, height, rotation = ['width', 'height', 'rotation'].map { |a| root.attr(a).value.to_f }
      if rotation == 90 || rotation == 270
        tmp = height
        height = width
        width = tmp
      end
      { :width => width, :height => height }
    end

    def XML.get_pages(document_base_path)
      index_file = File.open(File.join(document_base_path, 'pages.xml'))
      Nokogiri::XML(index_file).xpath('//page')
    end

  end
end
