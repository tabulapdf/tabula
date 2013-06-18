#since war/jar bundle requires gem package; use gem-in-a-box for testing
#or execute tabula via "rackup".
#source "http://127.0.0.1:9292"

source "https://rubygems.org"
platform :jruby do
  gem "cuba"
  gem "rack"
  gem "tilt"
  gem "tabula-extractor", '~>0.6.1', :require => "tabula"
  #gem "tabula-extractor", '~>0.6.1', :path => "../tabula-extractor"
  #gem "tabula-extractor", '~>0.6.1', :require => "tabula", :git => 'git://github.com/mtigas/tabula-extractor.git', :ref => 'e1d3e9a'

  group :development do
    gem "rake"
    gem "warbler"
  end
end
