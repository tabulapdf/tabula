java_import org.apache.pdfbox.pdmodel.PDDocument
java_import org.apache.pdfbox.pdmodel.encryption.StandardDecryptionMaterial

class Java::OrgNerdpowerTabula::Table
  def to_csv
    sb = java.lang.StringBuilder.new
    org.nerdpower.tabula.writers.CSVWriter.new.write(sb, self)
    sb.toString
  end

  def to_tsv
    sb = java.lang.StringBuilder.new
    org.nerdpower.tabula.writers.TSVWriter.new.write(sb, self)
    sb.toString
  end

  def to_json(*a)
    sb = java.lang.StringBuilder.new
    org.nerdpower.tabula.writers.JSONWriter.new.write(sb, self)
    sb.toString
  end
end

module Tabula

  def Tabula.extract_tables(pdf_path, specs, options={})
    options = {
      :password => '',
      :detect_ruling_lines => true,
      :vertical_rulings => [],
      :extraction_method => "guess",
    }.merge(options)


    specs = specs.group_by { |s| s['page'] }
    pages = specs.keys.sort

    extractor = Extraction::ObjectExtractor.new(pdf_path,
                                                options[:password])

    sea = org.nerdpower.tabula.extractors.SpreadsheetExtractionAlgorithm.new
    bea = org.nerdpower.tabula.extractors.BasicExtractionAlgorithm.new

    Enumerator.new do |y|
      extractor.extract(pages.map { |p| p.to_java(:int) }).each do |page|
        specs[page.getPageNumber].each do |spec|

          if ["spreadsheet", "original"].include?(spec[:extraction_method])
            use_spreadsheet_extraction_method = spec[:extraction_method] == "spreadsheet"
          else
            use_spreadsheet_extraction_method = sea.isTabular(page)
          end

          area = page.getArea(spec['y1'], spec['x1'], spec['y2'], spec['x2'])

          if use_spreadsheet_extraction_method
            sea.extract(area).each { |table| puts table.inspect; y.yield table }
          else
            bea.extract(area).each { |table| puts table.inspect; y.yield table }
          end
        end
      end
      extractor.close!
    end

  end

  def Tabula.extract_table(pdf_path, page, area, options={})
    options = {
      :password => '',
      :detect_ruling_lines => true,
      :vertical_rulings => [],
      :extraction_method => "guess",
    }.merge(options)

    if page.is_a?(Integer)
      page = [page.to_java(:int)]
    end

    extractor = Extraction::ObjectExtractor.new(pdf_path,
                                                options[:password])

    pdf_page = extractor.extract(page).next
    extractor.close!

    if ["spreadsheet", "original"].include? options[:extraction_method]
      use_spreadsheet_extraction_method = options[:extraction_method] == "spreadsheet"
    else
      use_spreadsheet_extraction_method = pdf_page.is_tabular?
    end

    if use_spreadsheet_extraction_method
      spreadsheets = pdf_page.get_area(area).spreadsheets
      return spreadsheets.empty? ? Spreadsheet.empty(pdf_page) : spreadsheets#.inject(&:+)
    end

    use_detected_lines = false
    if options[:detect_ruling_lines] && options[:vertical_rulings].empty?

      detected_vertical_rulings = Ruling.crop_rulings_to_area(pdf_page.vertical_ruling_lines,
                                                              area)


      # only use lines if at least 80% of them cover at least 90%
      # of the height of area of interest

      # TODO this heuristic SUCKS
      # what if only a couple columns is delimited with vertical rulings?
      # ie: https://www.dropbox.com/s/lpydler5c3pn408/S2MNCEbirdisland.pdf (see 7th column)
      # idea: detect columns without considering rulings, detect vertical rulings
      # calculate ratio and try to come up with a threshold
      use_detected_lines = detected_vertical_rulings.size > 2 \
      && (detected_vertical_rulings.count { |vl|
            vl.height / area.height > 0.9
          } / detected_vertical_rulings.size.to_f) >= 0.8

    end

    pdf_page
      .get_area(area)
      .get_table(:vertical_rulings => use_detected_lines ? detected_vertical_rulings.subList(1, detected_vertical_rulings.size) : options[:vertical_rulings])

  end

  module Extraction

    def Extraction.openPDF(pdf_filename, password='')
      raise Errno::ENOENT unless File.exists?(pdf_filename)
      document = PDDocument.load(pdf_filename)
      if document.isEncrypted
        sdm = StandardDecryptionMaterial.new(password)
        document.openProtection(sdm)
      end
      document
    end

    class ObjectExtractor < org.nerdpower.tabula.ObjectExtractor

      alias_method :close!, :close

      # TODO: the +pages+ constructor argument does not make sense
      # now that we have +extract_page+ and +extract_pages+
      def initialize(pdf_filename, pages=[1], password='', options={})
        raise Errno::ENOENT unless File.exists?(pdf_filename)
        @pdf_filename = pdf_filename
        document = Extraction.openPDF(pdf_filename, password)

        super(document)
      end
    end

    class PagesInfoExtractor < ObjectExtractor

      def pages
        Enumerator.new do |y|
          self.extract.each do |page|
            y.yield({
                      :width => page.getWidth,
                      :height => page.getHeight,
                      :number => page.getPageNumber,
                      :rotation => page.getRotation.to_i,
                      :hasText => page.hasText
                    })
            end
        end
      end
    end
  end
end
