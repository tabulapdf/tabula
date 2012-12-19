module Tabula

  # TextElement, Line and Column should all include this Mixin
  class ZoneEntity
    attr_accessor :top, :left, :width, :height
    
    attr_accessor :texts

    def initialize(top, left, width, height)
      self.top = top
      self.left = left
      self.width = width
      self.height = height
      self.texts = []
    end

    def bottom
      self.top + self.height
    end

    def right
      self.left + self.width
    end
        
    def merge!(other)
      self.top    = [self.top, other.top].min
      self.left   = [self.left, other.left].min
      self.width  = [self.right, other.right].max - left
      self.height = [self.bottom, other.bottom].max - top
    end


    # Roughly, detects if self and other belong to the same line
    def vertically_overlaps?(other)
      (other.top == self.top) or 
        (other.top.between?(self.top, self.height) and self.height.between?(other.top, other.height)) or
        (self.top.between?(other.top, other.height) and other.height.between?(self.top, self.height)) or
        (self.top.between?(other.top, other.height) and self.height.between?(other.top, other.height)) or 
        (other.top.between?(self.top, self.height)  and other.height.between?(self.top, self.height))
    end

    # detects if self and other belong to the same column
    def horizontally_overlaps?(other)
      (self.left.between?(other.left, other.right) and self.right.between?(other.left, other.right)) or
        self.left.between?(other.left, other.right) or
        self.right.between?(other.left, other.right) or
        (other.right.between?(self.left, self.right) and other.left.between?(self.left, self.right))
    end

  end

  class TextElement < ZoneEntity
    attr_accessor :font, :text

    CHARACTER_DISTANCE_THRESHOLD = 3

    def initialize(top, left, width, height, font, text)
      super(top, left, width, height)
      self.font = font
      self.text = text
    end

    def should_merge?(other)
      raise TypeError, "argument is not a TextElement" unless other.instance_of?(TextElement)

      distance = other.left - self.right
      
      self.vertically_overlaps?(other) or
        (self.height == 0 and other.height != 0) or
        (other.height == 0 and self.height != 0) and
        distance.abs < CHARACTER_DISTANCE_THRESHOLD
    end


    def merge!(other)
      raise TypeError, "argument is not a TextElement" unless other.instance_of?(TextElement)
      super(other)
      self.text << other.text
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
    # TODO clean this up
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

    # TODO check if this could be reformulated in terms of vertically_overlaps?
    def contains?(t) # called 'in_the_line' in original version
      # java version uses font size instead of t.height - why?
      text_bottom = t.top + t.height 
      (t.top > self.first_top && t.top <= self.bottom) || (text_bottom > self.first_top && text_bottom <= self.bottom) || (t.top <= self.first_top && text_bottom >= self.bottom)
    end

    def multiline?
      self.text_elements.size > 1
    end

  end

  class Column < ZoneEntity
    attr_accessor :text_elements
    
    def initialize(left, width, text_elements=[])
      super(0, left, width, 0)
      @text_elements = text_elements
    end

    def <<(te)
      self.text_elements << te
      self.update_boundaries!(te)
      self.text_elements.sort_by! { |t| t.top }
    end

    def update_boundaries!(text_element)
      self.merge!(text_element)
    end

    # this column can be merged with other_column?
    def contains?(other_column)
      self.horizontally_overlaps?(other_column)
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

  def Tabula.group_by_columns(text_elements)
    columns = []
    text_elements.sort_by(&:left).each do |te|
      if column = columns.detect { |c| te.horizontally_overlaps?(c) }
        column << te
      else
        columns << Column.new(te.left, te.width, [te])
      end
    end
    columns
  end

  def Tabula.merge_words(text_elements)
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

    text_elements.compact!
    return text_elements

  end


  def Tabula.row_histogram(text_elements)
    bins = []
    
    text_elements.each do |te|
      row = bins.detect { |l| l.vertically_overlaps?(te) }
      ze = ZoneEntity.new(te.top, te.left, te.width, te.height)
      if row.nil?
        bins << ze
        ze.texts << te.text
      else
        row.merge!(ze)
        row.texts << te.text
      end
    end
    bins 
  end

  def Tabula.get_columns(text_elements, merge_words=false)
    # second approach, inspired in pdf2table first_classifcation
    text_elements = Tabula.merge_words(text_elements) if merge_words

    Tabula.group_by_columns(text_elements).map do |c|
      {'left' => c.left, 'right' => c.right, 'width' => c.width}
    end
  end

  def Tabula.get_rows(text_elements, merge_words=false)
    text_elements = Tabula.merge_words(text_elements) if merge_words
    hg = Tabula.row_histogram(text_elements)
    rows = []
#    1.upto(hg.size - 1).each do |i|
#      rows << hg[i-1].bottom + ((hg[i].top - hg[i-1].bottom) / 2.0)
#    end
    puts (0..hg.size-1).to_a.combination(2).map { |r1, r2| 
    }.inspect
    hg.sort_by(&:top).map { |r| {'top' => r.top, 'bottom' => r.bottom} }
    #rows

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
 #   require 'debugger'; debugger
    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.uniq)

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
            
            te_in_lines.merge!(te_next_in_lines)

            lines[te_next_line].text_elements.delete(te_next_in_lines)

            #          puts "line for te: #{te_line} - line for te_next: #{te_next_line}"

            #          lines[te_line][lines[te_line].
            
            #          puts "Column: #{column_idx} - LESS THAN AVERAGE, MOTHERFUCKER!: '#{te.text}' - '#{te_next.text}'"
          end
          i += 1
        end
      end
    end  # /if split_multiline_cells


    # insert empty cells if needed
    lines.each_with_index { |l, line_index| 
      next if l.text_elements.nil?
      l.text_elements.compact! # TODO WHY do I have to do this?
      l.text_elements.uniq!  # TODO WHY do I have to do this?

      next unless l.text_elements.size < columns.size

      l.text_elements.sort_by!(&:left)
      columns.sort_by(&:left).each_with_index do |c, i|
        if !l.text_elements(&:left)[i].nil? and !c.text_elements.include?(l.text_elements[i])
          l.text_elements.insert(i, TextElement.new(l.top, c.left, c.width, l.height, nil, '  '))
        end
      end
    }

    # merge elements that are in the same column
    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.uniq)
    lines.each_with_index do |l, line_index|
      next if l.text_elements.nil?
      
      (0..l.text_elements.size-1).to_a.combination(2).each do |t1, t2|
        next if l.text_elements[t1].nil? or l.text_elements[t2].nil?
        
        # if same column...
        if columns.detect { |c| c.text_elements.include? l.text_elements[t1] } \
           == columns.detect { |c| c.text_elements.include? l.text_elements[t2] }
          if l.text_elements[t1].top <= l.text_elements[t2].top
            l.text_elements[t1].merge!(l.text_elements[t2])
            l.text_elements[t2] = nil
          else
            l.text_elements[t2].merge!(l.text_elements[t1])
            l.text_elements[t1] = nil
          end
        end
      end
      l.text_elements.compact!
    end


    lines



  end


end

