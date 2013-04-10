require_relative '../../tabula_job_executor/executor.rb'

class GenerateThumbnailJob < Tabula::Background::Job
  # args: (:file, :output_dir, :thumbnail_size)

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
