require 'data_mapper'

module Tabula
  module Document

    class Page
      include DataMapper::Resource

      property :number,   Integer, :required => true, :key => true
      property :height,   Float,   :required => true
      property :width,    Float,   :required => true
      property :rotation, Integer, :required => true

      has n, :glyphs
      has n, :rulings
      has n, :font_specs

    end

    # A character in a Page
    class Glyph
      include DataMapper::Resource

      property :id, Serial
      property :top, Float, :required => true
      property :left, Float, :required => true
      property :width, Float, :required => true
      property :height, Float, :required => true
      property :direction, Integer, :required => true
      property :text, String, :required => true

      belongs_to :page
      belongs_to :font_spec
    end

    # a Ruling (vertical or horizontal line) in a Page
    class Ruling
      include DataMapper::Resource

      property :id, Serial
      property :top, Float, :required => true
      property :left, Float, :required => true
      property :width, Float, :required => true
      property :height, Float, :required => true
      property :color, Float

      belongs_to :page
    end

    # a Font specification
    class FontSpec
      include DataMapper::Resource

      property :id, String, :key => true
      property :size, Float
      property :family, String
      property :color, String

      belongs_to :page

    end

    class DocumentProperty
      include DataMapper::Resource
      
      property :id, Serial
      property :name, String
      property :value, String
    end

  end
end
