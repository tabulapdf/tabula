require 'java'
java_import java.util.concurrent.ThreadPoolExecutor
java_import java.util.concurrent.TimeUnit
java_import java.util.concurrent.LinkedBlockingQueue

require 'jruby/synchronized'

require 'securerandom'
require 'singleton'

module Tabula
  class NoTextDataException < IOError; end

  module Background

    class JobExecutor < java.util.concurrent.ThreadPoolExecutor
      include Singleton

      attr_reader :jobs, :futures_jobs

      def initialize
        @jobs = Hash.new.extend(JRuby::Synchronized)
        @futures_jobs = Hash.new.extend(JRuby::Synchronized)

        super(3, # core pool size
              5, # max pool size
              300, # keep idle threads 5 minutes
              TimeUnit::SECONDS,
              LinkedBlockingQueue.new)

        at_exit do
          self.shutdown
          self.shutdownNow
        end
      end

      def afterExecute(runnable, throwable)
        super(runnable, throwable)
        if throwable.nil? and runnable.instance_of?(Java::JavaUtilConcurrent::FutureTask)
          begin
            if runnable.isDone
              runnable.get # 'get' the Future, so it rethrows exceptions if any
            end
          rescue Java::JavaUtilConcurrent::ExecutionException => e
            throwable = e
          rescue Java::JavaUtilConcurrent::CancellationException => e
            throwable = e.getCause
          rescue Java::JavaLang::InterruptedException => e
            Java::JavaLang::Thread.currentThread.interrupt
          end
          if throwable.nil?
            # task finished OK
            @futures_jobs[runnable].completed
          else
            throwable.printStackTrace(java.lang.System.out)
            # finished with exception
            throwable.printStackTrace # XXX TODO better exception logging
            @futures_jobs[runnable].failed(throwable.toString)
          end
        end
      end

      def submit(job)
        @jobs[job.uuid] = job
        future = super(job)
        @futures_jobs[future] = job
      end

      class << self
        def get(uuid)
          instance.jobs[uuid]
        end

        def get_by_batch(uuid)
          instance.jobs.select { |k, j|
            j.options[:batch] == uuid
          }
        end
      end
    end

    class Job
      include java.util.concurrent.Callable

      attr_accessor :options, :status
      attr_reader :uuid

      def initialize(options={})
        @uuid = SecureRandom.uuid
        @status = {'num' => 0 }
        self.options = options
      end

      def [](k)
        self.options[k]
      end

      def name
        "#{self.class.name}(#{options.inspect unless options.empty?})"
      end

      def call
        self.status.merge!({ 'status' => 'working', 'started_on' => Time.now })
        perform
        @uuid
      end

      def [](k)
        options[k]
      end

      def at(num, total, *messages)
        self.status.merge!({ 'status' => 'working', 'num' => num, 'total' => total, 'messages' => messages })
      end

      def queued
        self.status.merge!({ 'status' => 'queued', 'queued_on' => Time.now })
      end

      def warn(*warnings)
        self.status.merge!({ 'warnings' => warnings })
      end

      def failed(*messages)
        self.status.merge!({ 'status' => 'failed', 'messages' => messages})
      end

      def completed
        self.status.merge!({ 'status' => 'completed', 'completed_on' => Time.now })
      end

      def pct_complete
        case status['status']
          when 'completed' then 100
          when 'queued' then 0
          else
          t = (status['total'] == 0 || status['total'].nil?) ? 1 : status['total']
          (((status['num'] || 0).to_f / t.to_f) * 100).to_i
        end
      end

      def message
        self.status['messages']
      end

      alias_method :message?, :message

      def warning
        self.status['warnings']
      end

      alias_method :warning?, :warning

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

    end
  end
end


if __FILE__ == $0

  class K < Tabula::Background::Job
    def perform
      options[:start].upto(options[:end]) do |i|
        puts "I'm #{@uuid}: #{i}/#{options[:end]}"
        at(i, options[:end])
        sleep 1
      end
      @uuid
    end
  end

  class J < Tabula::Background::Job
    def perform
      options[:start].upto(options[:end]) do |i|
        puts "I'm #{@uuid}: #{i}/#{options[:end]}"
        at(i, options[:end])
        raise 'caca'
        sleep 1
      end
    end
  end

  j1 = K.create(:start => 1, :end => 20)
  j2 = K.create(:start => 25, :end => 40)
  j3 = J.create(:start => 1, :end => 6)

  Thread.new do
    loop {
      puts "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

      # puts "STATUS OF J1 IN EXECUTOR: #{Tabula::Background::JobExecutor.get(j1)}"
      # puts "STATUS OF J2 IN EXECUTOR: #{Tabula::Background::JobExecutor.get(j2)}"
      # puts "STATUS OF J3 IN EXECUTOR: #{Tabula::Background::JobExecutor.get(j3)}"
      puts Tabula::Background::JobExecutor.instance.futures_jobs.inspect
      sleep 1
    }
  end
end
