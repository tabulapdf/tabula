IS_JRUBY = RUBY_PLATFORM =~ /java/

if IS_JRUBY
  require 'warbler'
  Warbler::Task.new("war",
                    Warbler::Config.new { |config|
                      config.features = %w(executable compiled)
                      config.webserver = "jetty"
                      config.webxml.jruby.compat.version = "1.9"
                      config.webxml.jruby.rack.logging = "stdout"
                      config.dirs = ['lib', 'static', 'views', 'tabula_extractor',
                                     'tabula_job_executor']
                      config.includes = ['tabula_debug.rb', 'tabula_web.rb', 'tabula_job_progress.rb']
                    })
else

  # load worker classes
  require_relative './lib/jobs/all_resque_jobs.rb'
  require 'resque/tasks'

  require 'rake/testtask'
  Rake::TestTask.new do |t|
    t.pattern = 'test/**/test_*.rb'
  end
end
