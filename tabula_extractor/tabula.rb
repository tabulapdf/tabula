require_relative './lib/entities.rb'
require_relative './lib/table_extractor.rb'
require_relative './lib/detect_rulings.rb'
require_relative './lib/graph.rb'
require_relative './lib/parse_xml.rb'
require_relative './lib/whitespace.rb'

module Tabula
  # TODO next four module methods are deprecated
  def Tabula.group_by_columns(text_elements, merge_words=false)
    TableExtractor.new(text_elements, :merge_words => merge_words).group_by_columns
  end

  def Tabula.get_line_boundaries(text_elements)
    TableExtractor.new(text_elements).get_line_boundaries
  end

  def Tabula.get_columns(text_elements, merge_words=true)
    TableExtractor.new(text_elements, :merge_words => merge_words).get_columns
  end

  def Tabula.get_rows(text_elements, merge_words=true)
    TableExtractor.new(text_elements, :merge_words => merge_words).get_rows
  end


  ONLY_SPACES_RE = Regexp.new('^\s+$')
  def Tabula.make_table(text_elements, options={})
    extractor = TableExtractor.new(text_elements, options)

    # group by lines
    lines = []
    line_boundaries = extractor.get_line_boundaries

    # find all the text elements
    # contained within each detected line (table row) boundary
    line_boundaries.each { |lb|
      line = Line.new

      line_members = text_elements.find_all { |te|
        te.vertically_overlaps?(lb)
      }

      text_elements -= line_members

      line_members.sort_by(&:left).each { |te|
        # skip text_elements that only contain spaces
        next if te.text =~ ONLY_SPACES_RE
        line << te
      }

      lines << line if line.text_elements.size > 0
    }

    lines.sort_by!(&:top)

    columns = Tabula.group_by_columns(lines.map(&:text_elements).flatten.compact.uniq).sort_by(&:left)

    # # insert empty cells if needed
    lines.each_with_index { |l, line_index|
      next if l.text_elements.nil?
      l.text_elements.compact! # TODO WHY do I have to do this?
      l.text_elements.uniq!  # TODO WHY do I have to do this?
      l.text_elements.sort_by!(&:left)

      # l.text_elements = Tabula.merge_words(l.text_elements)

      next unless l.text_elements.size < columns.size

      columns.each_with_index do |c, i|
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
