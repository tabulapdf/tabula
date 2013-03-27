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

    # [x, y]
    def midpoint
      [self.left + (self.width / 2), self.top + (self.height / 2)]
    end

    def area
      self.width * self.height
    end

    def merge!(other)
      self.top    = [self.top, other.top].min
      self.left   = [self.left, other.left].min
      self.width  = [self.right, other.right].max - left
      self.height = [self.bottom, other.bottom].max - top
    end

    def horizontal_distance(other)
      (other.left - self.right).abs
    end

    def vertical_distance(other)
      (other.bottom - self.bottom).abs
    end

    # Roughly, detects if self and other belong to the same line
    def vertically_overlaps?(other)
      vertical_overlap = [0, [self.bottom, other.bottom].min - [self.top, other.top].max].max
      vertical_overlap > 0
    end

    # detects if self and other belong to the same column
    def horizontally_overlaps?(other)
      horizontal_overlap = [0, [self.right, other.right].min  - [self.left, other.left].max].max
      horizontal_overlap > 0
    end

    def overlaps?(other, ratio_tolerance=0.00001)
      self.overlap_ratio(other) > ratio_tolerance
    end

    def overlap_ratio(other)
      intersection_width = [0, [self.right, other.right].min  - [self.left, other.left].max].max
      intersection_height = [0, [self.bottom, other.bottom].min - [self.top, other.top].max].max
      intersection_area = [0, intersection_height * intersection_width].max

      union_area = self.area + other.area - intersection_area
      intersection_area / union_area
    end

    def to_h
      hash = {}
      [:top, :left, :width, :height].each do |m|
        hash[m] = self.send(m)
      end
      hash
    end

    def to_json(options={})
      self.to_h.to_json
    end
  end

  class TextElement < ZoneEntity
    attr_accessor :font, :font_size, :text

    CHARACTER_DISTANCE_THRESHOLD = 3

    def initialize(top, left, width, height, font, font_size, text)
      super(top, left, width, height)
      self.font = font
      self.font_size = font_size
      self.text = text
    end

    def should_merge?(other)
      raise TypeError, "argument is not a TextElement" unless other.instance_of?(TextElement)
      overlaps = self.vertically_overlaps?(other)

      tolerance = ((self.font_size + other.font_size) / 2) * 0.25

      overlaps or
        (self.height == 0 and other.height != 0) or
        (other.height == 0 and self.height != 0) and
        self.horizontal_distance(other) < tolerance
    end


    def merge!(other)
      raise TypeError, "argument is not a TextElement" unless other.instance_of?(TextElement)
      super(other)
      self.text << other.text
    end

    def to_h
      hash = super
      [:font, :text].each do |m|
        hash[m] = self.send(m)
      end
      hash
    end
  end


  class Line < ZoneEntity
    # TODO clean this up
    attr_accessor :text_elements

    def initialize
      self.text_elements = []
    end

    def <<(t)
      self.text_elements << t
      if self.text_elements.size == 1
        self.top = t.top
        self.left = t.left
        self.width = t.width
        self.height = t.height
      else
        self.merge!(t)
      end
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

  class Ruling < ZoneEntity
    attr_accessor :color

    def initialize(top, left, width, height, color)
      super(top, left, width, height)
      self.color = color
    end

    def to_h
      hash = super
      hash[:color] = self.color
      hash
    end

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
    return text_elements.compact

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

  def Tabula.get_columns(text_elements, merge_words=true)
    # second approach, inspired in pdf2table first_classifcation
    text_elements = Tabula.merge_words(text_elements) if merge_words

    Tabula.group_by_columns(text_elements).map do |c|
      {'left' => c.left, 'right' => c.right, 'width' => c.width}
    end
  end

  def Tabula.get_rows(text_elements, merge_words=true)
    text_elements = Tabula.merge_words(text_elements) if merge_words
    hg = Tabula.row_histogram(text_elements)
    hg.sort_by(&:top).map { |r| {'top' => r.top, 'bottom' => r.bottom, 'text' => r.texts} }
  end

  def Tabula.make_table(text_elements, merge_words=true, split_multiline_cells=false)
    text_elements = Tabula.merge_words(text_elements)

    # group by lines
    lines = []
    line_boundaries = Tabula.row_histogram(text_elements)
    line_boundaries.each { |lb|
      line = Line.new
      text_elements.find_all { |te|
        te.vertically_overlaps?(lb) } \
        .sort_by(&:left).each { |te| line << te }
      lines << line if line.text_elements.size > 0
    }
    lines.sort_by!(&:top)

    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.compact.uniq)

    # insert empty cells if needed
    lines.each_with_index { |l, line_index|
      next if l.text_elements.nil?
      l.text_elements.compact! # TODO WHY do I have to do this?
      l.text_elements.uniq!  # TODO WHY do I have to do this?

      l.text_elements = l.text_elements.sort_by(&:left)

      # l.text_elements = Tabula.merge_words(l.text_elements)

      next unless l.text_elements.size < columns.size

      columns.sort_by(&:left).each_with_index do |c, i|
        if (i > l.text_elements.size - 1) or !l.text_elements(&:left)[i].nil? and !c.text_elements.include?(l.text_elements[i])
          l.text_elements.insert(i, TextElement.new(l.top, c.left, c.width, l.height, nil, 0, ''))
        end
      end
    }

    # # merge elements that are in the same column
    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.compact.uniq)

    lines.each_with_index do |l, line_index|
      next if l.text_elements.nil?

      (0..l.text_elements.size-1).to_a.combination(2).each do |t1, t2|
        next if l.text_elements[t1].nil? or l.text_elements[t2].nil?

        # if same column...
        if columns.detect { |c| c.text_elements.include? l.text_elements[t1] } \
           == columns.detect { |c| c.text_elements.include? l.text_elements[t2] }
          if l.text_elements[t1].bottom <= l.text_elements[t2].bottom
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

    # remove duplicate lines
    # TODO this shouldn't have happened here, check why we have to do
    # this (maybe duplication is happening in the column merging phase?)
    (0..lines.size - 2).each do |i|
      next if lines[i].nil?
      # if any of the elements on the next line is duplicated, kill
      # the next line
      if (0..lines[i].text_elements.size-1).any? { |j| lines[i].text_elements[j] == lines[i+1].text_elements[j] }
        lines[i+1] = nil
      end
    end
    lines.compact
  end

  require 'algorithms'



  def Tabula.find_closest(text_elements, x, y)
    text_elements.sort_by { |te|
      Math.sqrt((x - te.midpoint[0]) ** 2 + (y - te.midpoint[1]) ** 2)
    }.first
  end


  def Tabula.find_whitespace(text_elements, bounds)
    queue = Containers::PriorityQueue.new
    queue.push([bounds, text_elements], bounds.width * bounds.height)
    rv = []


    while !queue.empty?
      r, obstacles = queue.pop
      if obstacles.empty?
        return r
      end

      pivot = Tabula.find_closest(obstacles, *r.midpoint)

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

  # EXPERIMENTAL: Merge lines closer than the global average
  # vertical distance
  def Tabula.merge_multiline_cells(lines)
    lines.compact!
    distances = (1..lines.size - 1).map { |i| lines[i].bottom - lines[i-1].bottom }
    avg_distance = distances.inject(0) { |sum, el| sum + el } / distances.size.to_f
    stddev_distance = Math.sqrt(distances.inject(0) { |variance, x| variance += (x - avg_distance) ** 2 } / (distances.size - 1).to_f)
    #puts "distances: #{distances.inspect}"
    #puts "avg_distance: #{avg_distance}"
    #puts "stddev_distance: #{stddev_distance}"

    i = 1
    cur_line = lines[0]
    while i < lines.size
      dist = cur_line.vertical_distance(lines[i])
      #puts "dist: #{dist}"
      if dist < avg_distance
        cur_line.text_elements.each_with_index { |te, j|
          cur_line.text_elements[j].merge! lines[i].text_elements[j]
        }
        cur_line.merge! lines[i]
        lines[i] = nil
      else
        cur_line = lines[i]
      end
      #puts cur_line.text_elements.map(&:text).inspect
      i += 1
    end
    #puts '----------------------------------------'
    #puts;     puts;     puts;     puts;     puts;
    lines.compact
  end


end
