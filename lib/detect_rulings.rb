require 'opencv'

require './tabula.rb'

module Tabula
  module Rulings

    class Ruling < ZoneEntity
      attr_accessor :x1, :y1, :x2, :y2

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

    # generate an xml string of
    def Rulings.to_xml(rulings)
    end

    def Rulings.clean_rulings(rulings)
      # merge close rulings (TODO: decide how close is close?)
      # stitch rulings ("tips" are close enough)
      # delete lines that don't look like rulings (TODO: define rulingness)
    end

    def Rulings.detect_rulings(image_filename)

      mat = OpenCV::CvMat.load(image_filename,
                               OpenCV::CV_LOAD_IMAGE_ANYCOLOR | \
                               OpenCV::CV_LOAD_IMAGE_ANYDEPTH)

      # TODO if mat is not 3-channel, don't do BGR2GRAY
      mat = mat.BGR2GRAY
      mat_canny = mat.canny(1, 50, 3)

      lines = mat_canny.hough_lines(:probabilistic,
                                    1,
                                    (Math::PI/180) * 45,
                                    200,
                                    200,
                                    10)

      lines = lines.to_a

      # filter out non vertical and non horizontal rulings
      # TODO check if necessary. would hough even detect diagonal lines with
      # the provided arguments, anyway?
      lines.reject! { |line|
        line.point1.x != line.point2.x and
        line.point1.y != line.point2.y
      }

      lines.map do |line|
        Ruling.new(line.point1.x, line.point1.y, line.point2.x, line.point2.y)
      end

      # Hough non-probabilistic
      # wh = mat.size.width + mat.size.height
      # lines = mat_canny.hough_lines(:multi_scale, 1, Math::PI / 180, 100, 0, 0)
      # lines.map do |line|
      #   rho = line[0]; theta = line[1]
      #   a = Math.cos(theta); b = Math.sin(theta)
      #   x0 = a * rho; y0 = b * rho;
      #   [x0 + wh * (-b), y0 + wh*(a), x0 - wh*(-b), y0 - wh*(a)]
      # end

    end
  end
end
