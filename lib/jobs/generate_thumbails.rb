class GenerateThumbnailJob
  # args: (:file, :output_dir, :thumbnail_size)
  include Resque::Plugins::Status
  Resque::Plugins::Status::Hash.expire_in = (30 * 60) # 30min
  @queue = :pdftohtml


  def perform
    file = options['file']
    output_dir = options['output_dir']
    thumbnail_size = options['thumbnail_size']

    run_mupdfdraw(file, output_dir, thumbnail_size)
  end
end
