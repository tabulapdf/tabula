require_relative '../executor.rb'
require_relative '../../thumbnail_generator.rb'

class GenerateThumbnailJob < Tabula::Background::Job
  # args: (:file, :output_dir, :thumbnail_sizes, :page_index_job_uuid)

  def perform

    file_id = options[:file_id]
    upload_id = self.uuid
    filepath = options[:filepath]
    output_dir = options[:output_dir]
    thumbnail_sizes = options[:thumbnail_sizes]

    generator = JPedalThumbnailGenerator.new(filepath, output_dir, thumbnail_sizes)
    generator.add_observer(self, :at)
    generator.generate_thumbnails!

  end
end
