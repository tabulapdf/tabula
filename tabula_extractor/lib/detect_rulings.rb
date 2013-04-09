require 'opencv'

module Tabula
  module Rulings

    class Ruling < ZoneEntity

      # 2D line intersection test taken from comp.graphics.algorithms FAQ
      def intersects?(other)
        r = ((self.top-other.top)*(other.right-other.left) - (self.left-other.left)*(other.bottom-other.top)) \
             / ((self.right-self.left)*(other.bottom-other.top)-(self.bottom-self.top)*(other.right-other.left))

        s = ((self.top-other.top)*(self.right-self.left) - (self.left-other.left)*(self.bottom-self.top)) \
            / ((self.right-self.left)*(other.bottom-other.top) - (self.bottom-self.top)*(other.right-other.left))

        r >= 0 and r < 1 and s >= 0 and s < 1
      end

      def vertical?
        left == right
      end

      def horizontal?
        top == bottom
      end

      def to_json(arg)
        [left, top, right, bottom].to_json
      end

      def to_xml
        "<ruling x1=\"%.2f\" y1=\"%.2f\" x2=\"%.2f\" y2=\"%.2f\" />" \
         % [left, top, right, bottom]
      end
    end

    def Rulings.clean_rulings(rulings, max_distance=4)
      horiz = rulings.select(&:horizontal?)
      vert = rulings.select(&:vertical?)

      # delete lines shorter than the mean
      # note: this acts as a signal-noise filter for the hough transform
      # noise lines are *much* shorter than actual rulings, so this works.
      # a more robust metric wouldn't hurt, though :)
      h_mean =  horiz.inject(0) { |accum, i| accum + i.width } / horiz.size
      horiz.delete_if { |h| h.width < h_mean }

      # - only keep horizontal rulings that intersect with at least one vertical ruling
      # - only keep vertical rulings that intersect with at least one horizontal ruling
      # yeah, it's a naive heuristic. but hey, it works.

      vert.delete_if  { |v| !horiz.any? { |h| h.intersects?(v) } } unless horiz.empty?
      horiz.delete_if { |h| !vert.any?  { |v| v.intersects?(h) } } unless vert.empty?

      return { :horizontal => horiz, :vertical => vert }
    end

    def Rulings.detect_rulings(image_filename, scale_factor=1)

      image = OpenCV::IplImage.load(image_filename,
                                    OpenCV::CV_LOAD_IMAGE_ANYCOLOR | OpenCV::CV_LOAD_IMAGE_ANYDEPTH)

      mat = image.to_CvMat

      mat = mat.BGR2GRAY if mat.channel == 3

      mat_canny = mat.canny(1, 50, 3)

      lines = mat_canny.hough_lines(:probabilistic,
                                    1,
                                    Math::PI/180,
                                    500,
                                    20,
                                    10)

      lines = lines.to_a

      clean_rulings(lines.map { |line|
                      Ruling.new(line.point1.y * scale_factor,
                                 line.point1.x * scale_factor,
                                 (line.point2.x - line.point1.x) * scale_factor,
                                 (line.point2.y - line.point1.y) * scale_factor)
                    })
    end
  end
end
