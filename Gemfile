#since war/jar bundle requires gem package; use gem-in-a-box for testing
#or execute tabula via "rackup".
#source "http://127.0.0.1:9292"

source "https://rubygems.org"
platform :jruby do
  gem "cuba", "~> 3.8.1"
  gem "rack", "~> 2.0.3"
  gem "tilt", "~> 2.0.7"

  group :development do
    gem 'jar-dependencies', '0.3.10'
    gem 'jbundler', '~> 0.9.3'
    gem "rake"
    gem "warbler", "~> 2.0.3"
    gem "jruby-jars", "9.1.12.0"
    gem "bootstrap-sass", "~> 3.2.0"
    gem "compass"
  end
end
