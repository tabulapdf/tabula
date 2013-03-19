require_relative '../../local_settings.rb'

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

  private

  def run_mupdfdraw(file, output_dir, width=560, page=nil)

    cmd = "#{Settings::MUDRAW_PATH} -w #{width} -o " \
    + File.join(output_dir, "document_#{width}_%d.png") \
    + " #{file}"

    cmd += " #{page}" unless page.nil?

    `#{cmd}`

  end


end
