module Tabula
  class TableExtractor
    attr_accessor :text_elements, :options

    DEFAULT_OPTIONS = {
      :horizontal_rulings => [],
      :vertical_rulings => [],
      :merge_words => true,
      :split_multiline_cells => false
    }


    def initialize(text_elements, options = {})
      self.text_elements = text_elements
      self.options = DEFAULT_OPTIONS.merge(options)
      merge_words! if self.options[:merge_words]
    end


    def get_rows
      hg = self.get_line_boundaries
      hg.sort_by(&:top).map { |r| {'top' => r.top, 'bottom' => r.bottom, 'text' => r.texts} }
    end


    # TODO finish writing this method
    # it should be analogous to get_line_boundaries
    # (ie, take into account vertical ruling lines if available)
    def group_by_columns
      columns = []
      tes = self.text_elements.sort_by(&:left)

      # we don't have vertical rulings
      tes.each do |te|
        if column = columns.detect { |c| te.horizontally_overlaps?(c) }
          column << te
        else
          columns << Column.new(te.left, te.width, [te])
        end
      end
      columns
    end

    def get_columns
      Tabula.group_by_columns(text_elements).map { |c|
        {'left' => c.left, 'right' => c.right, 'width' => c.width}
      }
    end

    def get_line_boundaries
      boundaries = []

      if self.options[:horizontal_rulings].empty?
        # we don't have rulings
        # iteratively grow boundaries to construct lines
        self.text_elements.each do |te|
          row = boundaries.detect { |l| l.vertically_overlaps?(te) }
          ze = ZoneEntity.new(te.top, te.left, te.width, te.height)
          if row.nil?
            boundaries << ze
            ze.texts << te.text
          else
            row.merge!(ze)
            row.texts << te.text
          end
        end
      else
        self.options[:horizontal_rulings].sort_by!(&:top)
        1.upto(self.options[:horizontal_rulings].size - 1) do |i|
          above = self.options[:horizontal_rulings][i - 1]
          below = self.options[:horizontal_rulings][i]

          # construct zone between a horizontal ruling and the next
          ze = ZoneEntity.new(above.top,
                              [above.left, below.left].min,
                              [above.width, below.width].max,
                              below.top - above.top)

          # skip areas shorter than some threshold
          # TODO: this should be the height of the shortest character, or something like that
          next if ze.height < 2

          boundaries << ze
        end
      end
      boundaries
    end

    private

    def merge_words!
      return self.text_elements if @merged # only merge once. awful hack.
      @merged = true
      current_word_index = i = 0
      char1 = self.text_elements[i]

      while i < self.text_elements.size-1 do

        char2 = self.text_elements[i+1]

        next if char2.nil? or char1.nil?

        if self.text_elements[current_word_index].should_merge?(char2)
          self.text_elements[current_word_index].merge!(char2)
          char1 = char2
          self.text_elements[i+1] = nil
        else
          # is there a space? is this within `CHARACTER_DISTANCE_THRESHOLD` points of previous char?
          if (char1.text != " ") and (char2.text != " ") and self.text_elements[current_word_index].should_add_space?(char2)
            self.text_elements[current_word_index].text += " "
          end
          current_word_index = i+1
        end
        i += 1
      end
      return self.text_elements.compact!
    end
  end
end
