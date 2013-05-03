require 'java'
require 'observer'

java_import java.io.RandomAccessFile
java_import java.nio.channels.FileChannel::MapMode
java_import javax.imageio.ImageIO
java_import java.awt.image.BufferedImage
java_import java.awt.Image

java_import com.sun.pdfview.PDFFile
java_import com.sun.pdfview.PDFPage

class PDFThumbnailGenerator
  include Observable
  
  def initialize(pdf_filename, output_directory, sizes=[2048, 560], pages=[])
    raise Errno::ENOENT unless File.directory?(output_directory)
    raise ArgumentError if sizes.empty?
    @sizes = sizes.sort.reverse
    @output_directory = output_directory

    raf = RandomAccessFile.new(pdf_filename, 'r')
    @pdf = Java::ComSunPdfview::PDFFile.new(raf.channel.map(MapMode::READ_ONLY, 0, raf.channel.size))
  end

  def generate_thumbnails!
    size, other_sizes = @sizes.first, @sizes[1..-1]
    total_pages = @pdf.getNumPages

    total_pages.times do |i|
      page_index = i + 1
      page = @pdf.getPage(page_index, true)

      # generate the biggest thumbnail
      w, h = page.getWidth, page.getHeight
      image = page.getImage(size, h * (size / w), nil, nil, true, true)
      ImageIO.write(image, 'png', 
                    java.io.File.new(File.join(@output_directory, 
                                               "document_#{size}_#{page_index}.png")))

      # rescale the already generated image for each specified size
      other_sizes.each do |s|
        scale = s.to_f / size.to_f
        bi = BufferedImage.new(s, h * (size / w) * scale, image.getType)
        bi.getGraphics.drawImage(image.getScaledInstance(s, h * (size / w) * scale, Image::SCALE_SMOOTH),
                                 0, 0, nil)
        ImageIO.write(bi, 
                      'png',
                      java.io.File.new(File.join(@output_directory,
                                                 "document_#{s}_#{page_index}.png")))
      end
      changed
      notify_observers(page_index, total_pages)
    end
  end
end

if __FILE__ == $0

  class STDERRProgressReporter
    def update(page, total_pages)
      STDERR.puts "#{page}///#{total_pages}"
    end
  end

  pdftg = PDFThumbnailGenerator.new(ARGV[0], '/tmp', [2048])
  pdftg.add_observer(STDERRProgressReporter.new)
  pdftg.generate_thumbnails!
end
