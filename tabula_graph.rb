## Approach inspired in "Object-Level Analysis of PDF Files" (Tamir Hassan)

require 'rgl/adjacency'

require './tabula_web.rb'

text_elements = get_text_elements('4d9fd418460b798686c042084092f15ddc8ccddb', 1, 23.375, 252.875, 562.0625, 691.6875)

# puts text_elements.length


module Tabula
  class TextCluster < ZoneEntity
  end

  class TextElement < ZoneEntity
    # redefine should_merge? method for this approach
    def should_merge?(other)
      overlaps = self.vertically_overlaps?(other)

      tolerance = ((self.font_size + other.font_size) / 2) * 0.25

      overlaps or
        (self.height == 0 and other.height != 0) or
        (other.height == 0 and self.height != 0) and
        self.horizontal_distance(other) < tolerance
    end
  end
end

class Graph

  attr_accessor :vertices, :edges

  OPPOSITE = {
    :above => :below, :below => :above,
    :right => :left, :left => :right
  }

  def initialize(vertices)
    self.vertices = vertices
    self.edges = {}
  end

  def add_edge(u, v, attributes = {})
    self.edges[u] = [] if self.edges[u].nil?
    self.edges[v] = [] if self.edges[v].nil?
    if !self.edges[u].find { |e| e[:target] == v }
      self.edges[u] << { :target => v, :attributes => attributes}
      self.edges[v] << { :target => u, :attributes => attributes.clone.merge({:direction => OPPOSITE[attributes[:direction]]})}
    end
  end
end




def make_graph(text_elements)
  horizontal = text_elements.sort_by { |mp| mp.midpoint[0] }
  vertical   = text_elements.sort_by { |mp| mp.midpoint[1] }

  graph = Graph.new(text_elements)

  text_elements.each do |te|
    te_x, te_y = te.midpoint

    hi = horizontal.index(te); vi = vertical.index(te)

    (hi-1).downto(0) do |i|
      if te.top <= horizontal[i].midpoint[1] and te.bottom >= horizontal[i].midpoint[1]
        graph.add_edge(te, horizontal[i], { :direction => :right })
        break
      end
    end

    (hi+1).upto(horizontal.length - 1) do |i|
      if te.top <= horizontal[i].midpoint[1] and te.bottom >= horizontal[i].midpoint[1]
        graph.add_edge(te, horizontal[i], { :direction => :left })
        break
      end
    end

    (vi-1).downto(0) do |i|
      if te.left <= vertical[i].midpoint[0] and te.right >= vertical[i].midpoint[0]
        graph.add_edge(te, vertical[i], { :direction => :below })
        break
      end
    end

    (vi+1).upto(vertical.length - 1) do |i|
      if te.left <= vertical[i].midpoint[0] and te.right >= vertical[i].midpoint[0]
        graph.add_edge(te, vertical[i], { :direction => :above })
        break
      end
    end
  end

  graph

end


def merge_text_elements(text_elements)
  current_word_index = i = 0
  char1 = text_elements[i]

  while i < text_elements.size-1 do

    char2 = text_elements[i+1]

    next if char2.nil? or char1.nil?

    if text_elements[current_word_index].should_merge?(char2)
      text_elements[current_word_index].merge!(char2)
      char1 = char2
      text_elements[i+1] = nil
    else
      current_word_index = i+1
    end
    i += 1
  end

  text_elements.compact
end

text_elements = merge_text_elements(text_elements)
graph = make_graph(text_elements)

require 'debugger'; debugger


puts graph.inspect
