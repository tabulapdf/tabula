#since war/jar bundle requires gem package; use gem-in-a-box for testing
#or execute tabula via "rackup".
#source "http://127.0.0.1:9292"

source "https://rubygems.org"
platform :jruby do
  gem "cuba"
  gem "rack"
  gem "tilt"

  group :development do
    gem "rake"
    gem "warbler", "~> 1.4.9"
    gem "jruby-jars", "1.7.22" ##1.7.16.1 doesn't work, see issue #203
    gem "compass"
    gem "bootstrap-sass"
  end
end
