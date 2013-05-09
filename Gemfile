source "https://rubygems.org"
  gem "algorithms"
  gem "nokogiri"
  gem "cuba"
  gem "rake"
  gem "rack"
  gem "tilt"
  gem "tabula-extractor", '>=0.0.1'

  platforms :mri_19, :mri_20 do
    gem "resque", "~>1.24.1"
    gem "foreman"
    gem "resque-status"
    gem "ruby-opencv"
  end

  platforms :jruby do
    gem "warbler"
  end

group :test do
  platforms :mri_19, :mri_20 do
    gem "minitest"
  end
end
