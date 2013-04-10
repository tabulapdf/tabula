if defined? JRUBY_VERSION
  require_relative './jruby_executor_service.rb'
else
  require 'singleton'

  require 'resque'
  require 'resque/status_server'
  require 'resque/job_with_status'

  module Tabula
    module Background
      class JobExecutor
        include Singleton
        def self.get(uuid)
          Resque::Plugins::Status::Hash.get(uuid)
        end
      end

      class Job
        include Resque::Plugins::Status
        @queue = :pdftohtml
        Resque::Plugins::Status::Hash.expire_in = (30 * 60) # 30min
      end
    end
  end
end
