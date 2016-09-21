#since war/jar bundle requires gem package; use gem-in-a-box for testing
#or execute tabula via "rackup".
#source "http://127.0.0.1:9292"

source "https://rubygems.org"
platform :jruby do
  gem "cuba"
  gem "rack", "~> 1.6.0"
  gem "tilt", "~> 1.4.0"

  group :development do
    gem "rake"
    gem "warbler", "~> 2.0.3"
    gem "jruby-jars", "9.1.5.0"
    gem "bootstrap-sass", "~> 3.2.0"
    gem "compass"
  end
end
