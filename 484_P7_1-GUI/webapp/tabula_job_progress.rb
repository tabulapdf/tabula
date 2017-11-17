require_relative '../lib/tabula_job_executor/executor.rb'

# if this is true, then the progress bar will complete (and give the user their PDF to interact with) before
# the autodetect tables job is done. the JS UI will handle checking periodiclaly if the autodetect tables job 
# is done yet; when it is, it'll be enabled.
FINISH_BEFORE_AUTODETECT_IS_DONE = true

class TabulaJobProgress < Cuba
  define do
    on ":upload_id/json" do |batch_id|
      # upload_id is the "job id" uuid that resque-status provides
      batch = Tabula::Background::JobExecutor.get_by_batch(batch_id)
      res['Content-Type'] = 'application/json'
      progress = {}
      if batch.empty?
        res.status = 404
        progress[:status] = "error"
        progress[:message] = "No such job"
        progress[:error_type] = "no-such-job"
        progress[:pct_complete] = 0
      elsif batch.any?{|uuid, job| job.failed? && job.kind_of?(GenerateDocumentDataJob) && job.message.first.include?("NoTextDataException") }
        progress[:status] = "error"
        progress[:error_type] = "no-text"
        progress[:message] = "Fatal Error: No text data is contained in this PDF file. Tabula can't process it."
        progress[:pct_complete] = 99
        res.write progress.to_json
      elsif batch.any? { |uuid, job| job.failed? }
        job =  batch.find{|uuid, job| job.failed? }.last
        progress[:status] = "error"
        progress[:error_type] = "unknown"
        progress[:message] = "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
        progress[:pct_complete] = 99
        res.write progress.to_json
      else
        batch.reject!{|uuid, job| FINISH_BEFORE_AUTODETECT_IS_DONE && job.kind_of?(DetectTablesJob ) && job.working? }
        first_working_job = batch.sort_by{|uuid, job| job.pct_complete}.find { |uuid, job| job.working? }
        first_working_job_with_message = batch.sort_by{|uuid, job| job.pct_complete}.find { |uuid, job| job.working? && !job.message.nil? && !job.message.empty? }

        progress[:messages] = batch.map{|job| (msg = job.last.message).nil? ? nil : msg.first }.compact
        progress[:warnings] = batch.map{|job| (msg = job.last.warning).nil? ? nil : msg.first }.compact
        progress[:message] = !first_working_job_with_message.nil? ? first_working_job_with_message.last.message.first : ''
        progress[:status] = !first_working_job.nil? ? first_working_job.last.status['status'] : 'completed'
        progress[:pct_complete] = (batch.inject(0.0) { |sum, (uuid, job)| sum + job.pct_complete } / batch.size).to_i
        progress[:file_id] = req.params['file_id']
        progress[:upload_id] = batch_id
        res.write progress.to_json
      end
    end

    on ":upload_id" do |batch_id|
      # upload_id is the "job id" uuid that resque-status provides
      batch = Tabula::Background::JobExecutor.get_by_batch(batch_id)

      if batch.empty?
        res.status = 404
        res.write ""
        res.write view("upload_error.html",
                       :message => "invalid upload_id (TODO: make this generic 404)")
      elsif batch.any? { |uuid, job| job.failed? }
        res.write view("upload_error.html",
                       :message => "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again.")
      else
        s = batch.find { |uuid, job| job.working? }
        res.write view("upload_status.html",
                       :status => !s.nil? ? s.last.message : ['completed'],
                       :pct_complete => (batch.inject(0.0) { |sum, (uuid, job)| sum + job.pct_complete } / batch.size).to_i,
                       :upload_id => batch_id,
                       :file_id => req.params['file_id'])
      end
    end
  end
end
