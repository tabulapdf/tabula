require_relative '../../tabula_job_executor/executor.rb'
require_relative '../thumbnail_generator.rb'

class GenerateThumbnailJob < Tabula::Background::Job
  # args: (:file, :output_dir, :thumbnail_sizes, :page_index_job)

  def perform
    file_id = options[:file_id]
    upload_id = self.uuid
    file = options[:file]
    output_dir = options[:output_dir]
    thumbnail_sizes = options[:thumbnail_sizes]
    page_index_job = options[:page_index_job]

    # return some status to browser
    at(0, 100, "generating page thumbnails...",
       :file_id => file_id,
       :upload_id => upload_id)

    generator = PDFThumbnailGenerator.new(file, output_dir, thumbnail_sizes)
    generator.add_observer(self, :at)
    generator.generate_thumbnails!

    while !Tabula::Background::JobExecutor.get(page_index_job).completed? do
      at(99, 100, "generating page thumbnails...",
         :file_id => file_id,
         :upload_id => upload_id
         )
      sleep 0.25
    end

    at(100, 100, "complete",
       :file_id => file_id,
       :upload_id => upload_id)

  end
end
