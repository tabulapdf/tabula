## Approach inspired in "Object-Level Analysis of PDF Files" (Tamir Hassan)
## Still not finished
module Tabula

  module Graph
    class Edge
      attr_accessor :from, :to, :direction
      attr_writer :length, :font_size

      def initialize(from, to, direction)
        self.from = from
        self.to = to
        self.direction = direction
      end

      def length
        @length ||= case self.direction
                    when :above, :below
                      from.left - to.right
                    when :left, :right
                      from.top - to.bottom
                    end.abs / self.font_size
      end

      def font_size
        @font_size ||= (from.font_size + to.font_size) / 2.0
      end

      def horizontal?
        self.direction == :above || self.direction == :below
      end

      def to_json(options = {})
        { :from => self.from,
          :to => self.to,
          :direction => self.direction,
          :length => self.length
        }.to_json
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
        self.edges = Hash.new
      end

      def add_edge(u, v, direction)
        self.edges[u] = [] if self.edges[u].nil?
        self.edges[v] = [] if self.edges[v].nil?

        if !self.edges[u].find { |e| e.to == v }
          self.edges[u] << Edge.new(u, v, direction)
          self.edges[v] << Edge.new(v, u, OPPOSITE[direction])
        end
      end

      def to_json(options = {})
        puts self.edges.inspect
        {
          :vertices => self.vertices,
          :edges => self.edges
        }.to_json
      end

      def cluster_together(from, target, cluster_from, cluster_target)

      end

      # "factory" method for graphs from a list of text_elements
      def self.make_graph(text_elements)
        horizontal = text_elements.sort_by { |mp| mp.midpoint[0] }
        vertical   = text_elements.sort_by { |mp| mp.midpoint[1] }

        graph = Graph.new(text_elements)

        text_elements.each do |te|

          hi = horizontal.index(te); vi = vertical.index(te)

          (hi-1).downto(0) do |i|
            if te.top <= horizontal[i].midpoint[1] and te.bottom >= horizontal[i].midpoint[1]
              graph.add_edge(te, horizontal[i], :right)
              break
            end
          end

          (hi+1).upto(horizontal.length - 1) do |i|
            if te.top <= horizontal[i].midpoint[1] and te.bottom >= horizontal[i].midpoint[1]
              graph.add_edge(te, horizontal[i], :left)
              break
            end
          end

          (vi-1).downto(0) do |i|
            if te.left <= vertical[i].midpoint[0] and te.right >= vertical[i].midpoint[0]
              graph.add_edge(te, vertical[i], :below)
              break
            end
          end

          (vi+1).upto(vertical.length - 1) do |i|
            if te.left <= vertical[i].midpoint[0] and te.right >= vertical[i].midpoint[0]
              graph.add_edge(te, vertical[i], :above)
              break
            end
          end
        end

        return graph

      end
    end

    def self.merge_text_elements(text_elements)
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

  end
end



if __FILE__ == $0
  require_relative '../tabula_web.rb'
  text_elements = merge_text_elements(get_text_elements('4d9fd418460b798686c042084092f15ddc8ccddb', 1, 23.375, 252.875, 562.0625, 691.6875))
  puts text_elements.inspect
  graph = Tabula::Graph::Graph.make_graph(text_elements)
#  puts graph.to_json
end
