require 'java'
require 'thread_safe'
java_import java.util.concurrent.ThreadPoolExecutor
java_import java.util.concurrent.TimeUnit
java_import java.util.concurrent.ArrayBlockingQueue

require 'securerandom'

module Tabula
  module Background

    class JobExecutor < java.util.concurrent.ThreadPoolExecutor

      attr_reader :job_statuses

      def initialize
        @job_statuses = {} # this should be a thread safe hash

        super(3, # core PoolSize
              3, # Max pool size
              1, # keep alive
              TimeUnit::MINUTES, # unit
              ArrayBlockingQueue.new(1, true), # work queue
              ThreadPoolExecutor::CallerRunsPolicy.new) # handler
      end
    end

    class Job
      def initialize(executor)
        @executor = executor
        @uuid = SecureRandom.uuid
      end

      def run
        perform
      end

      def at(num, total, *messages)
        set_status({ 'status' => 'working', 'num' => num, 'total' => total }, *messages)
      end

      def failed(*messages)
        set_status({'status' => 'failed'}, *messages)
      end

      def completed(*messages)
        set_status({'status' => 'failed', 'message' => "Completed at #{Time.now}"},
                   *messages)
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
      1.upto(20) do |i|
        at(i, 20)
        puts "YEAH"
        sleep 1
      end
    end
  end

  executor = Tabula::Background::JobExecutor.new
  executor.submit K.new(executor)

  Thread.new do
    loop do
      puts executor.job_statuses.inspect
      sleep 2
    end
  end

end
