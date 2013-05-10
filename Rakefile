require 'warbler'
Warbler::Task.new("war",
                  Warbler::Config.new { |config|
                    config.features = %w(executable)
                    config.webserver = "jetty"
                    config.webxml.jruby.compat.version = "1.9"
                    config.webxml.jruby.rack.logging = "stdout"
                    config.dirs = ['lib', 'static', 'views', 'tabula_job_executor']
                    config.includes = ['tabula_debug.rb', 'tabula_web.rb', 'tabula_job_progress.rb']
                  })

