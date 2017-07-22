# coding: utf-8
require 'java'
require 'observer'

java_import javax.imageio.ImageIO
java_import java.awt.image.BufferedImage
java_import java.awt.Image

java_import org.apache.pdfbox.pdmodel.PDDocument
java_import org.apache.pdfbox.rendering.PDFRenderer

class AbstractThumbnailGenerator
  include Observable

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

class PDFBoxThumbnailGenerator < AbstractThumbnailGenerator
  def initialize(pdf_filename, output_directory, sizes=[2048, 560])
    super(pdf_filename, output_directory, sizes)
    @sizes = sizes
    @pdf_document = PDDocument.load(java.io.File.new(pdf_filename))
  end

  def generate_thumbnails!
    total_pages = @pdf_document.getNumberOfPages
    renderer = PDFRenderer.new(@pdf_document)

    total_pages.times do |pi|
      image = renderer.renderImageWithDPI(pi, 75)
      imageWidth = image.getWidth.to_f
      imageHeight = image.getHeight.to_f

      @sizes.each do |size|
        scale = size / imageWidth
        bi = BufferedImage.new(size, (imageHeight * scale).round, image.getType)
        bi.getGraphics.drawImage(image.getScaledInstance(size, (imageHeight * scale).round, Image::SCALE_SMOOTH), 0, 0, nil)
        ImageIO.write(bi,
                      'png',
                      java.io.File.new(File.join(@output_directory, "document_#{size}_#{pi+1}.png")))
      end

      changed
      notify_observers(pi+1, total_pages, "generating page thumbnails…")
    end
  end
end


if __FILE__ == $0

  class STDERRProgressReporter
    def update(page, total_pages, msg)
      STDERR.puts "#{page}///#{total_pages} -- #{msg}"
    end
  end

  pdftg = PDFBoxThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  #pdftg = MUDrawThumbnailGenerator.new(ARGV[0], '/tmp', [560])
  pdftg.add_observer(STDERRProgressReporter.new)
  pdftg.generate_thumbnails!
end
