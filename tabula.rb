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
      # Font f = (Font) this.fonts.elementAt(t.font);
      
      # 	int text_bottom = t.top + f.size;
      
      # 	if (t.top >= l.first_top && t.top <= l.bottom) {
      # 		return true;
      # 	} else if (text_bottom >= l.first_top && text_bottom <= l.bottom) {
      # 		return true;
      # 	} else if (t.top <= l.first_top && text_bottom >= l.bottom) {
      # 		return true;
      # 	} else {
      # 		return false;
      # 	}
      text_bottom = t[:top] + t[:height] # java version uses font size
      # instead of t[:height] - why?
      #    require 'ruby-debug'; debugger
      (t[:top] > first_top && t[:top] <= bottom) || (text_bottom > first_top && text_bottom <= bottom) || (t[:top] <= first_top && text_bottom >= bottom)
    end

  end

  def Tabula.make_table(text_elements) 
    # first approach. so naive, candid and innocent that it makes you
    # cry.
    
    # puts text_elements.group_by {|te| te[:top] }
    # text_elements.group_by {|te| te[:top] }.map do |y_pos, row_cells|
    #   row_cells.sort_by { |c| c[:left] }.map { |c| c[:text] }
    # end

    # second approach, inspired in pdf2table first_classifcation
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
