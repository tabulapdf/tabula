require_relative '../../tabula_job_executor/executor.rb'
require_relative '../thumbnail_generator.rb'

class GenerateThumbnailJob < Tabula::Background::Job
  # args: (:file, :output_dir, :thumbnail_sizes)

  def perform
    file = options['file']
    output_dir = options['output_dir']
    thumbnail_sizes = options['thumbnail_sizes']

    generator = PDFThumbnailGenerator.new(file, output_dir,)
    generator.add_observer(self, :at)
    generator.generate_thumbnails!
  end
end
