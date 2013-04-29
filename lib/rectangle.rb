#
# Cribbed shamelessly from Daniel Vartanov's [ruby-geometry](https://github.com/DanielVartanov/ruby-geometry/)
# MIT License (c) 2008 Daniel Vartanov, modifications (c) 2013 Jeremy B. Merrill
#


module Geometry
  class Rectangle < Struct.new(:point1, :point2)
    SIMILARITY_DIVISOR = 10

    def self.new_by_x_y_dims(x, y, width, height)
      self.new( Point.new_by_array([x, y]), Point.new_by_array([x + width, y + height]) )
    end

    def x
      [point1.x, point2.x].min
    end

    def y
      [point1.y, point2.y].min
    end

    def width
      (point1.x - point2.x).abs
    end

    def height
      (point1.y - point2.y).abs
    end

    def area
      self.width * self.height
    end

    def similarity_hash
      [self.x.to_i / SIMILARITY_DIVISOR, self.y.to_i / SIMILARITY_DIVISOR, self.width.to_i / SIMILARITY_DIVISOR, self.height.to_i / SIMILARITY_DIVISOR].to_s
    end

    def dims
      [self.x, self.y, self.width, self.height]
    end
  end
end