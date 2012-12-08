module Tabula

  class Line
    attr_accessor :top, :bottom, :height, :leftmost, :rightmost, :font, :last_top, :first_top, :used_space, :typ, :texts  
    
    def initialize
      @texts = []
    end

    def set_new_line_values!(t)
      self.top        = t[:top]
      self.bottom     = t[:top] + t[:height]
      self.height     = bottom - top
      self.leftmost   = t[:left]
      self.rightmost  = t[:left] + t[:width]
      #self.font      = t[:font]
      self.last_top   = t[:top]
      self.first_top  = t[:top]
      self.used_space = t[:width] * t[:height]
    end

    def update_line_values!(t)
      self.top        = [t[:top], top].min
      b               = t[:top] + t[:height]
      self.bottom     = [b, bottom].max
      self.height     = bottom - top
      self.leftmost   = [t[:left], leftmost].min
      self.rightmost  = [rightmost, t[:left] + t[:width]].max
      self.last_top   = [t[:top], last_top].max
      self.first_top  = [t[:top], first_top].min
      self.used_space = t[:width] * t[:height]
    end

    def contains?(t) # called 'in_the_line' in original version
      text_bottom = t[:top] + t[:height] # java version uses font size
      # instead of t[:height] - why?
      #    require 'ruby-debug'; debugger
      (t[:top] > first_top && t[:top] <= bottom) || (text_bottom > first_top && text_bottom <= bottom) || (t[:top] <= first_top && text_bottom >= bottom)
    end

  end

  class Column
    attr_accessor :left, :width
    attr_accessor :text_elements
    
    def initialize(left, width, text_elements=[])
      @left = left; @width = width
      @text_elements = text_elements
    end

    def right
      self.left + self.width
    end

    def right=(r)
      @width = r - left
    end

    def update_boundaries!(text_element)
      left  = [text_element[:left], self.left].max
      right = [text_element[:left] + text_element[:width], self.right].max
    end

    def inspect
      vars = self.instance_variables.map{ |v| "#{v}=#{instance_variable_get(v).inspect}"}.join(", ")
      "<#{self.class}: #{vars}>"
    end
    
  end

  # how to make this dynamic? collecting average character widths? @
  # TODO investigate
  CHARACTER_DISTANCE_THRESHOLD = 1.8

  def Tabula.should_merge?(char1, char2)
    char1_x = char1[:left]; char1_yp = char1[:top] + char1[:height]
    char1_xp = char1[:left] + char1[:width]; char1_y = char1[:top]
    char2_x = char2[:left]; char2_yp = char2[:top] + char2[:height]
    char2_xp = char2[:left] + char2[:width]; char2_y = char2[:top]
    distance = char2_x - char1_xp
    
    (char2_y == char1_y) or 
      (char2_y.between?(char1_y, char1_yp) and char1_yp.between?(char2_y, char2_yp)) or
      (char1_y.between?(char2_y, char2_yp) and char2_yp.between?(char1_y, char1_yp)) or
      (char1_y.between?(char2_y, char2_yp) and char1_yp.between?(char2_y, char2_yp)) or 
      (char2_y.between?(char1_y, char1_yp)  and char2_yp.between?(char1_y, char1_yp)) or
      (char1[:height] == 0 and char2[:height] != 0) or
      (char2[:height] == 0 and char1[:height] != 0) and
      distance.abs < CHARACTER_DISTANCE_THRESHOLD
  end

  def Tabula.group_by_columns(text_elements)
    columns = [Column.new(text_elements.first[:left], text_elements.first[:width], [text_elements.first])]
    text_elements[1..-1].each do |te|
      if column = columns.detect { |c| 
          (te[:left].between?(c.left, c.right) and (te[:left] + te[:width]).between?(c.left, c.right)) or
          (te[:left].between?(c.left, c.right)) or
          ((te[:left] + te[:width]).between?(c.left, c.right)) or
          (c.right.between?(te[:left], (te[:left] + te[:width])) and c.left.between?(te[:left], te[:left] + te[:width]))
        }
        column.update_boundaries!(te)
        column.text_elements << te
      else
        columns << Column.new(te[:left], te[:width], [te])
      end
    end
    columns
  end

  def Tabula.merge_words(text_elements)
    current_word_index = i = 0
    char1 = text_elements[i]

    while i < text_elements.size-1 do

      char2 = text_elements[i+1]

      # if text_elements[current_word_index][:text][0..4] == 'La Pa'
      #   require 'ruby-debug'; debugger
      # end

      next if char2.nil? or char1.nil? 

      if self.should_merge?(text_elements[current_word_index], char2)
        text_elements[current_word_index][:text]   << char2[:text]
        text_elements[current_word_index][:width]  += char2[:width]
        text_elements[current_word_index][:height]  = [text_elements[current_word_index][:height], char2[:height]].max

        char1 = char2
        text_elements[i+1] = nil
      else
        current_word_index = i+1
      end
      i += 1
    end

    text_elements.compact!

  end

  def Tabula.make_table(text_elements, merge_words=false) 
    # first approach. so naive, candid and innocent that it makes you
    # cry.
    
    # puts text_elements.group_by {|te| te[:top] }
    # text_elements.group_by {|te| te[:top] }.map do |y_pos, row_cells|
    #   row_cells.sort_by { |c| c[:left] }.map { |c| c[:text] }
    # end

    # second approach, inspired in pdf2table first_classifcation

    text_elements = Tabula.merge_words(text_elements) if merge_words

    lines = []
    distance = 0

    text_elements.each { |te|
      if lines.empty?
        new_line = Line.new
        new_line.texts << te
        new_line.set_new_line_values!(te)
        lines << new_line
      else
        l = lines.last
        if l.contains?(te)
          l.texts << te
          l.update_line_values!(te)
        else
          new_line = Line.new
          new_line.texts << te
          new_line.set_new_line_values!(te)
          lines << new_line
          distance += new_line.first_top - l.last_top
        end
      end
    }
    lines
  end


end
