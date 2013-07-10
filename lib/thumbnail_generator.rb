require 'java'
require 'observer'

java.lang.System.setProperty('org.jpedal.jai', 'true')
require_relative './jars/jpedal_lgpl.jar'

java_import javax.imageio.ImageIO
java_import java.awt.image.BufferedImage
java_import java.awt.Image

java_import org.jpedal.PdfDecoder
java_import org.jpedal.fonts.FontMappings

class AbstractThumbnailGenerator
  include Observable

  def initialize(pdf_filename, output_directory, sizes=[2048, 560], pages=[])
    raise Errno::ENOENT unless File.directory?(output_directory)
    raise ArgumentError if sizes.empty?
    @sizes = sizes.sort.reverse
    @output_directory = output_directory
  end

  def generate_thumbnails!
    raise 'NotImplemented'
  end

end

class JPedalThumbnailGenerator < AbstractThumbnailGenerator
  def initialize(pdf_filename, output_directory, sizes=[2048, 560], pages=[])
    super(pdf_filename, output_directory, sizes, pages)
    @decoder = PdfDecoder.new(true)
    FontMappings.setFontReplacements
    @decoder.openPdfFile(pdf_filename)
    @decoder.setExtractionMode(0, 1.0)
    @decoder.useHiResScreenDisplay(true)
  end

  def generate_thumbnails!
    total_pages = @decoder.getPageCount

    total_pages.times do |i|
      # w = pageData.getCropBoxWidth(pageNo);
      # h = pageData.getCropBoxHeight(pageNo);
      image = @decoder.getPageAsImage(i+1);
      image_w, image_h = image.getWidth, image.getHeight

      @sizes.each do |s|
        scale = s.to_f / image_w.to_f
        bi = BufferedImage.new(s, image_h * scale, image.getType)
        bi.getGraphics.drawImage(image.getScaledInstance(s, image_h * scale, Image::SCALE_SMOOTH), 0, 0, nil)
        ImageIO.write(bi,
                      'png',
                      java.io.File.new(File.join(@output_directory,
                                                 "document_#{s}_#{i+1}.png")))
        changed
        notify_observers(i+1, total_pages * 2, "generating page thumbnails...")
      end
    end
    @decoder.closePdfFile
  end
end

if __FILE__ == $0

  class STDERRProgressReporter
    def update(page, total_pages)
      STDERR.puts "#{page}///#{total_pages}"
    end
  end

  pdftg = JPedalThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  pdftg.add_observer(STDERRProgressReporter.new)
  pdftg.generate_thumbnails!
end
