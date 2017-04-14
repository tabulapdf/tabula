require 'java'
require 'observer'

require_relative '../lib/jars/tabula-1.0.0-SNAPSHOT-jar-with-dependencies.jar'

java_import javax.imageio.ImageIO
java_import java.awt.image.BufferedImage
java_import java.awt.Image

java_import org.apache.pdfbox.rendering.PDFRenderer
java_import org.apache.pdfbox.pdmodel.PDDocument
java_import java.io.ByteArrayOutputStream


class AbstractThumbnailGenerator
  include Observable
  SIZE = 800

  def initialize(pdf_filename, output_directory, sizes=[2048, 560])
    raise Errno::ENOENT unless File.directory?(output_directory)
    raise ArgumentError if sizes.empty?
    @sizes = sizes.sort.reverse
    @output_directory = output_directory
    @pdf_filename = pdf_filename
  end

  def generate_thumbnails!
    raise 'NotImplemented'
  end
end

##
# use /usr/bin/mudraw for faster thumbnail generation
# useful for hosted instances of Tabula
class MUDrawThumbnailGenerator < AbstractThumbnailGenerator

  def initialize(pdf_filename, output_directory, sizes=[2048, 560], mudraw='/usr/local/bin/mudraw')
    super(pdf_filename, output_directory, sizes)
    @mudraw = mudraw
  end

  def generate_thumbnails!
    @sizes.each_with_index do |size, i|
      out = File.join(@output_directory, "document_#{size}_%d.png")

      `#{@mudraw} -o "#{out}" -w #{size} "#{@pdf_filename}"`
      changed
      notify_observers(i+1, @sizes.length, "generating page thumbnails...")
    end
  end
end

class PDFBox2ThumbnailGenerator  < AbstractThumbnailGenerator
  def initialize(pdf_filename, output_directory, sizes=[2048, 560])
    super(pdf_filename, output_directory, sizes)
    @pdf_document = PDDocument.load(java.io.File.new(pdf_filename))
  end
  def generate_thumbnails!
    renderer = PDFRenderer.new(@pdf_document);
    total_pages = @pdf_document.get_number_of_pages

    total_pages.times do |pi|
      image = renderer.render_image_with_dpi(pi, 75);
      imageWidth = image.width # was get_width
      imageHeight = image.height # was get_height
      scale = SIZE / imageWidth.to_f

      bi = BufferedImage.new(SIZE, (imageHeight * scale).round, image.type);
      bi.get_graphics.draw_image(image.get_scaled_instance(SIZE, (imageHeight * scale).round, Image::SCALE_SMOOTH), 0, 0, nil);

      out = ByteArrayOutputStream.new
      ImageIO.write(bi, "png", out);

      filename = "document_#{SIZE}_#{pi + 1}.png"
      ImageIO.write(bi,
                    'png',
                    java.io.File.new(File.join(@output_directory,
                                               filename)))
      STDERR.puts "Writing page thumbnail #{filename}"
      notify_observers(pi+1, total_pages, "generating page thumbnails...")
    end

    @pdf_document.close();

  end
end

if __FILE__ == $0

  class STDERRProgressReporter
    def update(page, total_pages)
      STDERR.puts "#{page}///#{total_pages}"
    end
  end

  #pdftg = JPedalThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  # pdftg = MUDrawThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  pdftg = PDFBox2ThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  pdftg.add_observer(STDERRProgressReporter.new)
  pdftg.generate_thumbnails!
end
