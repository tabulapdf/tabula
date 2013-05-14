

require 'java'
require 'json'
require './lib/point'
require './lib/segment'
require './lib/rectangle'

#CLASSPATH=:./lib/jars/javacpp.jar:./lib/jars/javacv.jar:./lib/jars/javacv-macosx-x86_64.jar:./lib/jars/PDFRenderer-0.9.1.jar ruby lib/jruby_column_guesser.rb nbsps.pdf

java_import com.googlecode.javacpp.Pointer
java_import com.googlecode.javacv.CanvasFrame
java_import(com.googlecode.javacv.cpp.opencv_core){'Opencv_core'}
java_import(com.googlecode.javacv.cpp.opencv_imgproc){'Opencv_imgproc'}

java_import(com.googlecode.javacv.cpp.opencv_highgui){'Opencv_highgui'}
java_import com.sun.pdfview.PDFFile
java_import com.sun.pdfview.PDFPage

java_import java.awt.image.BufferedImage;
java_import(java.io.File){'JavaFile'};
java_import java.io.RandomAccessFile;
java_import java.nio.ByteBuffer;
java_import java.nio.channels.FileChannel::MapMode;
java_import java.util.ArrayList;
java_import java.util.Collections;
java_import java.util.List;
java_import java.util.HashMap;
java_import java.util.Comparator;


module TableGuesser

  def TableGuesser.find_and_write_rects(filename, output_dir)
    #writes to JSON the rectangles on each page in the specified PDF.
    open(File.join(output_dir, "tables.json"), 'w') do |f|
      f.write( JSON.dump(find_rects(filename).map{|a| a.map{|r| r.dims.map &:to_i }} ))
    end
  end

  def TableGuesser.find_rects(filename="nbsps.pdf")
      tunable_threshold = 500;

      raf = RandomAccessFile.new(filename, "r")
      channel = raf.channel
      buf = channel.map(MapMode::READ_ONLY, 0, channel.size())
      newfile = PDFFile.new(buf)

      if newfile.getNumPages == 0
        puts "not a pdf!"
        exit
      end

      #int max_pages
      guess_columns_per_page = false
      
      list_of_cols = []
      cols = []

      puts "pages: " + newfile.getNumPages.to_s
            
      tables = []

      newfile.getNumPages.times do |i|          
        page_index = i + 1 
        if newfile.getNumPages > 100
          STDERR.puts("detecting tables on page #{page_index}")
        end
        #gotcha: with PDFView, PDF pages are 1-indexed. If you ask for page 0 and then page 1, you'll get the first page twice. So start with index 1.
        apage = newfile.getPage(page_index, true)
        box = apage.getPageBox()

        #Note: sometimes calling getWidth() and getHeight() on apage gives the right result; this used to be called on box, in what DF wrote. Does that ever work better?.
        image = apage.getImage(apage.getWidth().to_i, apage.getHeight().to_i , nil ,nil ,true ,true )

       #   CanvasFrame source = new CanvasFrame("Source");
       #   source.showImage(image);
        iplImage = Opencv_core::IplImage.createFrom(image)
        lines = cvFindLines(iplImage, tunable_threshold, page_index)
        vertical_lines = lines.select &:vertical?
        horizontal_lines = lines.select &:horizontal?

        temp_cols = lines.map{|l| l.point1.x} #mapOrientedLinesToLocations(lines, "vertical")
      
        current_try = tunable_threshold
        
        #TODO: set higher threshold for finding columns?
        minimal_lines_threshold = 10 #for finding tables, this should be very high. The cost of a false positive line is low; the cost of a false negative may be high.
        while (vertical_lines.size() < minimal_lines_threshold || horizontal_lines.size() < minimal_lines_threshold) do #
          current_try -= 20 #sacrifice speed for success.

          # we might need to give up..
          break if current_try < 10
          
          lines = cvFindLines(iplImage, current_try, filename + page_index.to_s)
          vertical_lines = lines.select &:vertical?
          horizontal_lines = lines.select &:horizontal?
          temp_cols = lines.map{|l| l.point1.x}
        end

        temp_cols.sort!

        if guess_columns_per_page
          temp_cols.each do |col_item|
            if !cols.include? col_item
              cols << col_item;
            end
          end
        else
          list_of_cols << temp_cols
        end

        temp_rows = lines.map{|l| l.point1.y}
        temp_rows.sort!
        tables << findTables(vertical_lines, horizontal_lines)
      end
      tables.each{|t| t.sort_by(&:area).reverse } #biggest first
    end

    def TableGuesser.cvFindLines(src, threshold, name) 
      dst = Opencv_core::cvCreateImage(Opencv_core::cvGetSize(src), src.depth, 1)
      colorDst = Opencv_core::cvCreateImage(Opencv_core::cvGetSize(src), src.depth(), 3)

      
      Opencv_imgproc::cvCanny(src, dst, 50, 200, 3)
      Opencv_imgproc::cvCvtColor(dst, colorDst, Opencv_imgproc::CV_GRAY2BGR)

      storage = Opencv_core::cvCreateMemStorage(0)
      # /*
      #  * http:#opencv.willowgarage.com/documentation/feature_detection.html#houghlines2
      #  * 
      #  * distance resolution in pixel-related units.
      #  * angle resolution in radians
      #  * "accumulator value"
      #  * second-to-last parameter: minimum line length # was 50
      #  * last parameter: join lines if they are within N pixels of each other.
      #  * 
      #  */
      lines = Opencv_imgproc::cvHoughLines2(dst, storage, Opencv_imgproc::CV_HOUGH_PROBABILISTIC, 1, Math::PI / 180, threshold, 20, 10)
      lines_list = []

      lines.total.times do |i|
          line = Opencv_core::cvGetSeqElem(lines, i)
          pt1 = Opencv_core::CvPoint.new(line).position(0)
          pt2 = Opencv_core::CvPoint.new(line).position(1)
          lines_list << Geometry::Segment.new_by_arrays([pt1.x, pt1.y], [pt2.x, pt2.y])
          Opencv_core::cvLine(colorDst, pt1, pt2, Opencv_core::CV_RGB(255, 0, 0), 1, Opencv_core::CV_AA, 0) #actually draw the line on the img.
      end

      #N.B.: No images are saved if column_pictures folder in app root doesn't exist.
      Opencv_highgui::cvSaveImage("column_pictures/#{name}.png", colorDst)
      Opencv_core::cvReleaseImage(dst)
      Opencv_core::cvReleaseImage(colorDst)

      return lines_list
    end



    def TableGuesser.euclideanDistanceHelper(x1, y1, x2, y2)
      return Math.sqrt( ((x1 - x2) ** 2) + ((y1 - y2) ** 2) )
    end

    def TableGuesser.euclideanDistance(p1, p2)
      euclideanDistanceHelper(p1.x, p1.y, p2.x, p2.y)
    end
    
    def TableGuesser.isUpwardOriented(line, y_value)
      #return true if this line is oriented upwards, i.e. if the majority of it's length is above y_value.
      topPoint = line.topmost_endpoint.y
      bottomPoint = line.bottommost_endpoint.y
      return (y_value - topPoint > bottomPoint - y_value);
    end
    
    def TableGuesser.findTables(verticals, horizontals)
      # /*
      #  * Find all the rectangles in the vertical and horizontal lines given.
      #  * 
      #  * Rectangles are deduped with hashRectangle, which considers two rectangles identical if each point rounds to the same tens place as the other.
      #  * 
      #  * TODO: generalize this.
      #  */
      corner_proximity_threshold = 0.10;
      
      rectangles = []
      #find rectangles with one horizontal line and two vertical lines that end within $threshold to the ends of the horizontal line.
            
      [true, false].each do |up_or_down_lines|
        horizontals.each do |horizontal_line|
          horizontal_line_length = horizontal_line.length

          has_vertical_line_from_the_left = false
          left_vertical_line = nil 
          #for the left vertical line.
          verticals.each do |vertical_line|
            #1. if it is correctly oriented (up or down) given the outer loop here. (We don't want a false-positive rectangle with one "arm" going down, and one going up.)
            next unless isUpwardOriented(vertical_line, horizontal_line.leftmost_endpoint.y) == up_or_down_lines
            
            vertical_line_length = vertical_line.length
            longer_line_length = [horizontal_line_length, vertical_line_length].max
            corner_proximity = corner_proximity_threshold * longer_line_length
            #make this the left vertical line:
            #2. if it begins near the left vertex of the horizontal line.
            if euclideanDistance(horizontal_line.leftmost_endpoint, vertical_line.topmost_endpoint) < corner_proximity || 
               euclideanDistance(horizontal_line.leftmost_endpoint, vertical_line.bottommost_endpoint) < corner_proximity
              #3. if it is farther to the left of the line we already have.  
              if left_vertical_line.nil? || left_vertical_line.leftmost_endpoint.x > vertical_line.leftmost_endpoint.x #is this line is more to the left than left_vertical_line. #"What's your opinion on Das Kapital?"
                has_vertical_line_from_the_left = true
                left_vertical_line = vertical_line
              end
            end
          end

          has_vertical_line_from_the_right = false;
          right_vertical_line = nil
          #for the right vertical line.
          verticals.each do |vertical_line|
            next unless isUpwardOriented(vertical_line, horizontal_line.leftmost_endpoint.y) == up_or_down_lines
            vertical_line_length = vertical_line.length
            longer_line_length = [horizontal_line_length, vertical_line_length].max
            corner_proximity = corner_proximity_threshold * longer_line_length
            if euclideanDistance(horizontal_line.rightmost_endpoint, vertical_line.topmost_endpoint) < corner_proximity ||
              euclideanDistance(horizontal_line.rightmost_endpoint, vertical_line.bottommost_endpoint) < corner_proximity

              if right_vertical_line.nil? || right_vertical_line.rightmost_endpoint.x > vertical_line.rightmost_endpoint.x  #is this line is more to the right than right_vertical_line. #"Can you recite all of John Galt's speech?"
                #do two passes to guarantee we don't get a horizontal line with a upwards and downwards line coming from each of its corners.
                #i.e. ensuring that both "arms" of the rectangle have the same orientation (up or down).
                has_vertical_line_from_the_right = true
                right_vertical_line = vertical_line
              end
            end
          end

          if has_vertical_line_from_the_right && has_vertical_line_from_the_left
            #in case we eventually tolerate not-quite-vertical lines, this computers the distance in Y directly, rather than depending on the vertical lines' lengths.
            height = [left_vertical_line.bottommost_endpoint.y - left_vertical_line.topmost_endpoint.y, right_vertical_line.bottommost_endpoint.y - right_vertical_line.topmost_endpoint.y].max
            
            y = [left_vertical_line.topmost_endpoint.y, right_vertical_line.topmost_endpoint.y].min
            width = horizontal_line.rightmost_endpoint.x - horizontal_line.leftmost_endpoint.x
            r = Geometry::Rectangle.new_by_x_y_dims(horizontal_line.leftmost_endpoint.x, y, width, height ) #x, y, w, h
            #rectangles.put(hashRectangle(r), r); #TODO: I dont' think I need this now that I'm in Rubyland
            rectangles << r
          end
        end

        #find rectangles with one vertical line and two horizontal lines that end within $threshold to the ends of the vertical line.
        verticals.each do |vertical_line|
          vertical_line_length = vertical_line.length
            
          has_horizontal_line_from_the_top = false
          top_horizontal_line = nil
          #for the top horizontal line.
          horizontals.each do |horizontal_line|
            horizontal_line_length = horizontal_line.length
            longer_line_length = [horizontal_line_length, vertical_line_length].max
            corner_proximity = corner_proximity_threshold * longer_line_length

            if euclideanDistance(vertical_line.topmost_endpoint, horizontal_line.leftmost_endpoint) < corner_proximity ||
                euclideanDistance(vertical_line.topmost_endpoint, horizontal_line.rightmost_endpoint) < corner_proximity
                if top_horizontal_line.nil? || top_horizontal_line.topmost_endpoint.y > horizontal_line.topmost_endpoint.y #is this line is more to the top than the one we've got already.
                  has_horizontal_line_from_the_top = true;
                  top_horizontal_line = horizontal_line;
                end
            end
          end
          has_horizontal_line_from_the_bottom = false;
          bottom_horizontal_line = nil
          #for the bottom horizontal line.
          horizontals.each do |horizontal_line|
            horizontal_line_length = horizontal_line.length
            longer_line_length = [horizontal_line_length, vertical_line_length].max
            corner_proximity = corner_proximity_threshold * longer_line_length

            if euclideanDistance(vertical_line.bottommost_endpoint, horizontal_line.leftmost_endpoint) < corner_proximity ||
              euclideanDistance(vertical_line.bottommost_endpoint, horizontal_line.rightmost_endpoint) < corner_proximity
              if bottom_horizontal_line.nil? || bottom_horizontal_line.bottommost_endpoint.y > horizontal_line.bottommost_endpoint.y  #is this line is more to the bottom than the one we've got already. 
                has_horizontal_line_from_the_bottom = true;
                bottom_horizontal_line = horizontal_line;
              end
            end
          end

          if has_horizontal_line_from_the_bottom && has_horizontal_line_from_the_top
            x = [top_horizontal_line.leftmost_endpoint.x, bottom_horizontal_line.leftmost_endpoint.x].min
            y = vertical_line.topmost_endpoint.y
            width = [top_horizontal_line.rightmost_endpoint.x - top_horizontal_line.leftmost_endpoint.x, bottom_horizontal_line.rightmost_endpoint.x - bottom_horizontal_line.rightmost_endpoint.x].max
            height = vertical_line.bottommost_endpoint.y - vertical_line.topmost_endpoint.y
            r = Geometry::Rectangle.new_by_x_y_dims(x, y, width, height); #x, y, w, h
            #rectangles.put(hashRectangle(r), r);
            rectangles << r
          end
        end
      end
      return rectangles.uniq &:similarity_hash 
    end    
      
end

if __FILE__ == $0
  TableGuesser::find_and_write_rects(ARGV[0], ARGV[1])
end