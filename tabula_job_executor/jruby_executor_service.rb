require 'java'
java_import java.util.concurrent.ThreadPoolExecutor
java_import java.util.concurrent.TimeUnit
java_import java.util.concurrent.ArrayBlockingQueue

require 'jruby/synchronized'

require 'securerandom'
require 'singleton'

# API and implementation inspired in resque-status (https://github.com/quirkey/resque-status)
module Tabula
  module Background

    class JobExecutor < java.util.concurrent.ThreadPoolExecutor
      include Singleton

      attr_reader :job_statuses

      def initialize
        @job_statuses = Hash.new.extend(JRuby::Synchronized)
        super(3, # core PoolSize
              3, # Max pool size
              1, # keep alive
              TimeUnit::MINUTES, # unit
              ArrayBlockingQueue.new(1, true), # work queue
              ThreadPoolExecutor::CallerRunsPolicy.new) # handler

        at_exit do
          self.shutdown
          self.shutdownNow
        end
      end

      def get_job_status(id)
        job_statuses[id]
      end

      def submit(job)
        # TODO LOGGING
        super(job)
      end

      class << self
        def get(uuid)
          instance.job_statuses[uuid]
        end

        def set(uuid, new_status)
          instance.job_statuses[uuid] = new_status
        end
      end
    end

    class Job
      include java.lang.Runnable

      attr_accessor :options
      attr_reader :uuid

      def initialize(options={})
        @uuid = SecureRandom.uuid
        self.options = options
      end

      def name
        "#{self.class.name}(#{options.inspect unless options.empty?})"
      end

      def run
        perform
      end

      def at(num, total, *messages)
        puts "AT!! #{num}, #{total}, #{messages.inspect}"
        set_status({ 'status' => 'working', 'num' => num, 'total' => total }, *messages)
      end

      def failed(*messages)
        set_status({'status' => 'failed'}, *messages)
      end

      def completed(*messages)
        set_status({'status' => 'failed', 'message' => "Completed at #{Time.now}"},
                   *messages)
      end

      def status
        JobExecutor.get(@uuid)
      end

      def status=(new_status)
        JobExecutor.set(@uuid, new_status)
      end

      STATUSES = %w{queued working completed failed killed}.freeze
      STATUSES.each do |status|
        define_method("#{status}?") do
          self.status['status'] === status
        end
      end

      class << self
        def create(options)
          job = self.new(options)
          JobExecutor.instance.submit(job)
          job.uuid
        end
      end

      private

      def set_status(*args)
        @executor.job_statuses[@uuid] = args.flatten
      end
    end
  end
end


if __FILE__ == $0

  class K < Tabula::Background::Job
    def perform
      puts self.inspect
      options[:start].upto(options[:end]) do |i|
        at(i, options[:end])
        puts "I'm #{@uuid}: #{i}/#{options[:end]}"
        sleep 1
      end
    end
  end

  j1 = K.create(:start => 1, :end => 20)
  j2 = K.create(:start => 25, :end => 40)

  Thread.new do
    loop {
      puts "STATUS OF J1 IN EXECUTOR: #{Tabula::Background::JobExecutor.get(j1)}"
      puts "STATUS OF J2 IN EXECUTOR: #{Tabula::Background::JobExecutor.get(j2)}"
      sleep 2
    }
  end


end
