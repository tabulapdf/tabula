require 'open3'
require_relative '../../tabula_job_executor/executor.rb'

require_relative '../jruby_dump_characters.rb'


class AnalyzePDFJob < Tabula::Background::Job
  # args: (:file_id, :file, :output_dir, :thumbnail_job)
  # Runs the PDF analyzer on the uploaded file.

  def perform
    file_id = options[:file_id]
    thumbnail_job = options[:thumbnail_job]
    upload_id = self.uuid

    # return some status to browser
    at(0, 100, "analyzing PDF text...",
      :file_id => file_id,
      :upload_id => upload_id,
      :thumbnails_complete => true
    )
    xg = XMLGenerator.new(options[:file],
                          options[:output_dir])
    xg.add_observer(self, :at)
    xg.generate_xml!

    # If thumbnail jobs haven't finished, wait up for them
    while !Tabula::Background::JobExecutor.get(thumbnail_job).completed? do
      at(99, 100, "generating thumbnails...",
         :file_id => file_id,
         :upload_id => upload_id
         )
      sleep 0.25
    end

    at(100, 100, "complete",
       :file_id => file_id,
       :upload_id => upload_id,
       :thumbnails_complete => true
       )

    return nil
  end
end
