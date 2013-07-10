require_relative '../executor.rb'
require_relative '../../thumbnail_generator.rb'

class GenerateThumbnailJob < Tabula::Background::Job
  # args: (:file, :output_dir, :thumbnail_sizes, :page_index_job_uuid)

  def perform

    file_id = options[:file_id]
    upload_id = self.uuid
    file = options[:file]
    output_dir = options[:output_dir]
    thumbnail_sizes = options[:thumbnail_sizes]
    page_index_job_uuid = options[:page_index_job_uuid]
    detect_tables_job_uuid = options[:detect_tables_job_uuid]

    # return some status to browser
    at(0, 100, "generating page thumbnails...")
    generator = JPedalThumbnailGenerator.new(file, output_dir, thumbnail_sizes)
    generator.add_observer(self, :at)
    generator.generate_thumbnails!

    unless detect_tables_job_uuid.nil?
      detect_tables_job = Tabula::Background::JobExecutor.get(detect_tables_job_uuid)
      while !detect_tables_job.completed? do
        at(detect_tables_job.status['num'], detect_tables_job.status['total'], "auto-detecting tables...",
           )
        sleep 0.25
      end
    end

    while !Tabula::Background::JobExecutor.get(page_index_job_uuid).completed? do
      at(99, 100, "generating page thumbnails...",
         )
      sleep 0.25
    end

    at(100, 100, "complete" )

  end
end
