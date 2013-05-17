#
# Cribbed shamelessly from Daniel Vartanov's [ruby-geometry](https://github.com/DanielVartanov/ruby-geometry/)
# MIT License (c) 2008 Daniel Vartanov, modifications (c) 2013 Jeremy B. Merrill
#


module Geometry
  class Rectangle < Struct.new(:point1, :point2)
    SIMILARITY_DIVISOR = 10

    def Rectangle.unionize(non_overlapping_rectangles, next_rect)
      
      #if next_rect doesn't overlap any of non_overlapping_rectangles
      if (overlapping = non_overlapping_rectangles.select{|r| next_rect.overlaps? r})
        
        #remove all of those that it overlaps from non_overlapping_rectangles and 
        non_overlapping_rectangles -= overlapping
        #add to non_overlapping_rectangles the bounding box of the overlapping rectangles.
        non_overlapping_rectangles << overlapping.inject(next_rect){|memo, overlap| memo.bounding_box(other_rect) }
      
      else
        non_overlapping_rectangles << next_rect
      end
    end

    def self.new_by_x_y_dims(x, y, width, height)
      self.new( Point.new_by_array([x, y]), Point.new_by_array([x + width, y + height]) )
    end

    def x
      [point1.x, point2.x].min
    end

    def y
      [point1.y, point2.y].min
    end

    def x2
      [point1.x, point2.x].min + width
    end

    def y2
      [point1.x, point2.x].min + height
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

    def overlaps?(other_rect)
      return rect
    end 
    def bounding_box(other_rect)
      #new rect with bounding box of these two
      new_x1 = min(x, other_rect.x)
      new_y1 = min(x, other_rect.y)
      new_x2 = max(x2, other_rect.x2)
      new_y2 = max(y2, other_rect.y2)
      new_width = (new_x2 - new_x1).abs
      new_height = (new_y1 - new_y1).abs
      Rectangle.new_by_x_y_dims(new_x1, new_y1, new_width, new_height)
    end
  end
end