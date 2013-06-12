require 'warbler'
Warbler::Task.new("war",
                  Warbler::Config.new { |config|
                    config.features = %w(executable)
                    config.jar_name = 'build/tabula'
                    config.jar_extension = 'jar'
                    config.webserver = "jetty"
                    config.webxml.jruby.compat.version = "1.9"
                    config.webxml.jruby.rack.logging = "stderr"
                    config.dirs = ['lib', 'webapp']
                  })
