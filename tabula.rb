# TODO Refactor
# Text elements, Columns and Lines have same the positional properties
# (left, width, height, top, etc)
# They all should implement the same interface, so the algorithms can
# be applied to any of those entities

module Tabula

  module ZoneEntity
    attr_accessor :top, :left, :width, :height
  end

  class TextElement
    include ZoneEntity
    attr_accessor :font, :text

    def initialize(top, left, width, height, font, text)
      self.top = top
      self.left = left
      self.width = width
      self.height = height
      self.font = font
      self.text = text
    end

    def merge!(other)
      raise TypeError, "argument is not a TextElement" unless other.instance_of?(TextElement)

      self.text << other.text
      self.width += other.width
      self.height = [self.height, other.height].max
      
    end


    def to_json(arg)
      hash = {}
      [:@top, :@left, :@width, :@height, :@font, :@text].each do |var|
        hash[var[1..-1]] = self.instance_variable_get var
      end
      hash.to_json
    end

  end


  class Line
    attr_accessor :top, :bottom, :height, :leftmost, :rightmost, :font, :last_top, :first_top, :used_space, :typ, :text_elements  
    
    def initialize
      @text_elements = []
    end

    def <<(t)
      self.text_elements << t
      if self.text_elements.size == 1
        self.set_new_line_values!(t)      
      else
        self.update_line_values!(t)
      end
    end

    def set_new_line_values!(t)
      self.top        = t.top
      self.bottom     = t.top + t.height
      self.height     = bottom - top
      self.leftmost   = t.left
      self.rightmost  = t.left + t.width
      #self.font      = t.font
      self.last_top   = t.top
      self.first_top  = t.top
      self.used_space = t.width * t.height
    end

    def update_line_values!(t)
      self.top        = [t.top, top].min
      b               = t.top + t.height
      self.bottom     = [b, bottom].max
      self.height     = bottom - top
      self.leftmost   = [t.left, leftmost].min
      self.rightmost  = [rightmost, t.left + t.width].max
      self.last_top   = [t.top, last_top].max
      self.first_top  = [t.top, first_top].min
      self.used_space = t.width * t.height
    end

    def contains?(t) # called 'in_the_line' in original version
      # java version uses font size instead of t.height - why?
      text_bottom = t.top + t.height 
      (t.top > self.first_top && t.top <= self.bottom) || (text_bottom > self.first_top && text_bottom <= self.bottom) || (t.top <= self.first_top && text_bottom >= self.bottom)
    end

    def multiline?
      self.text_elements.size > 1
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

    def <<(te)
      self.text_elements << te
      self.update_boundaries!(te)
      self.text_elements.sort_by! { |t| t.top }
    end

    def update_boundaries!(text_element)
      self.left  = [text_element.left, self.left].min
      self.right = [text_element.left + text_element.width, self.right].max
    end

    # this column can be merged with other_column?
    def contains?(other_column)
      (self.left.between?(other_column.left, other_column.right) and self.right.between?(other_column.left, other_column.right)) or
        self.left.between?(other_column.left, other_column.right) or
        self.right.between?(other_column.left, other_column.right) or
        (other_column.right.between?(self.left, self.right) and other_column.left.between?(self.left, self.right))
    end

    def merge!(other_column)
      return unless self.contains?(other_column)
      other_column.text_elements.each { |te|
        self.text_elements << te
      }
    end

    def average_line_distance
      # avg distance between lines
      # this might help to MERGE lines that are shouldn't be split
      # e.g. cells with > 1 lines of text
      1.upto(self.text_elements.size - 1).map { |i|
        self.text_elements[i].top - self.text_elements[i - 1].top
      }.inject{ |sum, el| sum + el }.to_f / self.text_elements.size
    end

    def inspect
      vars = (self.instance_variables - [:@text_elements]).map{ |v| "#{v}=#{instance_variable_get(v).inspect}" }
      texts = self.text_elements.sort_by { |te| te.top }.map { |te| te.text }
      "<#{self.class}: #{vars.join(', ')}, @text_elements=#{texts.join(', ')}>"
    end
    
  end

  

  # how to make this dynamic? collecting average character widths? @
  # TODO investigate
  CHARACTER_DISTANCE_THRESHOLD = 3

  def Tabula.should_merge?(char1, char2)
    char1_x = char1.left; char1_yp = char1.top + char1.height
    char1_xp = char1.left + char1.width; char1_y = char1.top
    char2_x = char2.left; char2_yp = char2.top + char2.height
    char2_xp = char2.left + char2.width; char2_y = char2.top
    distance = char2_x - char1_xp
    
    (char2_y == char1_y) or 
      (char2_y.between?(char1_y, char1_yp) and char1_yp.between?(char2_y, char2_yp)) or
      (char1_y.between?(char2_y, char2_yp) and char2_yp.between?(char1_y, char1_yp)) or
      (char1_y.between?(char2_y, char2_yp) and char1_yp.between?(char2_y, char2_yp)) or 
      (char2_y.between?(char1_y, char1_yp)  and char2_yp.between?(char1_y, char1_yp)) or
      (char1.height == 0 and char2.height != 0) or
      (char2.height == 0 and char1.height != 0) and
      distance.abs < CHARACTER_DISTANCE_THRESHOLD
  end

  def Tabula.group_by_columns(text_elements)
    columns = [Column.new(text_elements.first.left, text_elements.first.width, [text_elements.first])]
    text_elements[1..-1].each do |te|

      if column = columns.detect { |c| 
          (te.left.between?(c.left, c.right) and (te.left + te.width).between?(c.left, c.right)) or
          (te.left.between?(c.left, c.right)) or
          ((te.left + te.width).between?(c.left, c.right)) or
          (c.right.between?(te.left, (te.left + te.width)) and c.left.between?(te.left, te.left + te.width))
        }
        column << te
      else
        columns << Column.new(te.left, te.width, [te])
      end
    end
    columns
  end

  def Tabula.regroup_columns(list_of_columns)
    merged_columns = []
    list_of_columns.combination(2).each { |c1, c2|
      if c1.contains?(c2)
        c1.merge!(c2)
        merged_columns << c2
      end
    }
    list_of_columns - merged_columns
  end

  def Tabula.merge_words(text_elements)
    current_word_index = i = 0
    char1 = text_elements[i]

    while i < text_elements.size-1 do

      char2 = text_elements[i+1]

      next if char2.nil? or char1.nil? 

      if self.should_merge?(text_elements[current_word_index], char2)
        text_elements[current_word_index].merge!(char2)
        char1 = char2
        text_elements[i+1] = nil
      else
        current_word_index = i+1
      end
      i += 1
    end

    text_elements.compact!
    return text_elements

  end

  # Returns an array of array of [start_idx, end_idx] (start and end
  # indices of multiline blocks)
  # a multiline block is a run of consecutive multilines
  # a multiline is a line with > 1 text elements
  def Tabula.multiline_blocks(lines)
    in_multiline = false
    multiline_blocks_indices = []
    current_multiline_block = []
    
    lines.each_with_index do |line, i|
      if line.multiline?
        if in_multiline
          multiline_blocks_indices.last[1] = i
        else
          in_multiline = true
          multiline_blocks_indices << [i, i]
        end
      else
        if in_multiline
          in_multiline = false
        end
      end
    end

    if in_multiline
      multiline_blocks_indices[-1][1] = lines.size - 1
    end

    multiline_blocks_indices
    
  end

  def Tabula.row_histogram(text_elements)
      1
  end

  def Tabula.make_table(text_elements, merge_words=false, split_multiline_cells=false) 

    # first approach. so naive, candid and innocent that it makes you
    # cry.
    # text_elements.group_by {|te| te.top }.map do |y_pos, row_cells|
    #   row_cells.sort_by { |c| c.left }.map { |c| c.text }
    # end



    # second approach, inspired in pdf2table first_classifcation
    text_elements = Tabula.merge_words(text_elements) if merge_words
    
    lines = []
    distance = 0
    unless text_elements.empty?
      line = Line.new
      line << text_elements.first
      lines << line
    end

    text_elements.each { |te|
      # if te.text == "Cantidad de "
      #   require 'ruby-debug'; debugger
      # end
      l = lines.last
      if l.contains?(te)
        l << te
      else
        new_line = Line.new
        new_line << te
        lines << new_line
        distance += new_line.first_top - l.last_top
      end
    }

    lines.sort_by!(&:top)


    # TODO this is recursive, shouldn't be 2 different methods
    # (see note at the top of this file)
#    puts lines.map(&:text_elements).flatten.uniq.inspect
    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.uniq)
#    puts; puts; puts
#    puts columns.inspect
    columns = Tabula.regroup_columns(columns)

#    puts columns.inspect

    avg_distance = columns.map(&:average_line_distance).inject{ |sum, el| sum + el }.to_f / columns.size

    if split_multiline_cells
      columns.each_with_index do |column, column_idx|
        i = 0
        while i < column.text_elements.size - 1 do
          te = column.text_elements[i]
          te_next = column.text_elements[i+1]

          if (te_next.top - te.top).abs < avg_distance and # closer than avg
              te_next.font == te.font # same font

            # find these text_elements in `lines` and merge
            te_line = lines.index { |l| l.text_elements.include?(te) }
            te_next_line = lines.index { |l| l.text_elements.include?(te_next) }

            # cells are being duplicated, for some reason
            # work around that bug, in a nasty way.
            if (te_line.nil? or te_next_line.nil?)
              i += 1
              next 
            end

            # shit, this is getting ugly
            # these are references to the to-be-merged elements
            # in the 'lines' array
            te_in_lines = lines[te_line].text_elements.detect { |x| x == te }
            te_next_in_lines = lines[te_next_line].text_elements.detect { |x| x == te_next }
            if te_in_lines == te_next_in_lines
              i +=1
              next
            end
            
            te_in_lines.text   << te_next_in_lines.text
            te_in_lines.width   = [te_in_lines.width, te_next_in_lines.width].max
            te_in_lines.left    = [te_in_lines.left, te_next_in_lines.left].min
            te_in_lines.height += te_next_in_lines.height
            
            lines[te_next_line].text_elements.delete(te_next_in_lines)

            #          puts "line for te: #{te_line} - line for te_next: #{te_next_line}"

            #          lines[te_line][lines[te_line].
            
            #          puts "Column: #{column_idx} - LESS THAN AVERAGE, MOTHERFUCKER!: '#{te.text}' - '#{te_next.text}'"
          end
          i += 1
        end
      end
    end  # /if split_multiline_cells

    lines.each { |l| 
      l.text_elements.uniq!  # TODO WHY do I have to do this?
      
      
    }
  end


end
