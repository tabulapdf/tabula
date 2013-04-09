require 'algorithms'
module Tabula
  module Whitespace

    # Detect whitespace in a document (not yet used in Tabula)
    # Described in "Two Geometric Algorithms for layout analysis" (Thomas Breuer)
    # http://pdf.aminer.org/000/140/219/two_geometric_algorithms_for_layout_analysis.pdf

    def self.find_closest(text_elements, x, y)
      text_elements.sort_by { |te|
        Math.sqrt((x - te.midpoint[0]) ** 2 + (y - te.midpoint[1]) ** 2)
      }.first
    end


    def self.find_whitespace(text_elements, bounds)
      queue = Containers::PriorityQueue.new
      queue.push([bounds, text_elements], bounds.width * bounds.height)
      rv = []


      while !queue.empty?
        r, obstacles = queue.pop
        if obstacles.empty?
          return r
        end

        pivot = self.find_closest(obstacles, *r.midpoint)

        subrectangles = [
                         ZoneEntity.new(r.top, pivot.right, r.right - pivot.right, pivot.top - r.top),
                         ZoneEntity.new(r.top, r.left, pivot.left - r.left, pivot.top - r.top),
                         ZoneEntity.new(pivot.bottom, r.left, pivot.left - r.left, r.bottom - pivot.bottom),
                         ZoneEntity.new(pivot.bottom, pivot.right, r.right - pivot.right, r.bottom - pivot.bottom)
                        ]
        subrectangles.each do |sub_r|
          obs = obstacles.select { |s|
            s.overlaps?(sub_r)
          }
          if obs.empty?
            rv << sub_r
          else
            queue.push([sub_r, obs], sub_r.width * sub_r.height)
          end
        end
      end
      return rv
    end
  end
end
