require 'opencv'

module Tabula
  module Rulings

    class Ruling
      attr_accessor :x1, :y1, :x2, :y2

      def initialize(x1, y1, x2, y2)
        self.x1 = x1
        self.y1 = y1
        self.x2 = x2
        self.y2 = y2
      end

      # 2D line intersection test taken from comp.graphics.algorithms FAQ
      def intersects?(other)
        r = ((self.y1-other.y1)*(other.x2-other.x1) - (self.x1-other.x1)*(other.y2-other.y1)) / ((self.x2-self.x1)*(other.y2-other.y1)-(self.y2-self.y1)*(other.x2-other.x1))

        s = ((self.y1-other.y1)*(self.x2-self.x1) - (self.x1-other.x1)*(self.y2-self.y1))/((self.x2-self.x1)*(other.y2-other.y1) - (self.y2-self.y1)*(other.x2-other.x1))

        r >= 0 and r < 1 and s >= 0 and s < 1
      end

      def vertical?
        x1 == x2
      end

      def horizontal?
        y1 == y2
      end

      def to_json(arg)
        [x1, y1, x2, y2].to_json
      end

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
