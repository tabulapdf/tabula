#since war/jar bundle requires gem package; use gem-in-a-box for testing
#or execute tabula via "rackup".
#source "http://127.0.0.1:9292"

source "https://rubygems.org"
platform :jruby do
  gem "cuba"
  gem "rack"
  gem "tilt"
  #gem "tabula-extractor", '~>0.6.4', :require => "tabula"
  gem "tabula-extractor", :path => "../tabula-extractor"

  group :development do
    gem "rake"
    gem "warbler"
  end
end
