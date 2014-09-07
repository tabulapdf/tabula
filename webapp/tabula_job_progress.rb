require_relative '../lib/tabula_job_executor/executor.rb'

class TabulaJobProgress < Cuba
  define do
    on ":upload_id/json" do |batch_id|
      # upload_id is the "job id" uuid that resque-status provides
      batch = Tabula::Background::JobExecutor.get_by_batch(batch_id)
      res['Content-Type'] = 'application/json'
      message = {}
      if batch.empty?
        res.status = 404
        message[:status] = "error"
        message[:message] = "No such job"
        message[:pct_complete] = 0
      elsif batch.any? { |uuid, job| job.failed? }
        message[:status] = "error"
        message[:message] = "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
        message[:pct_complete] = 99
        res.write message.to_json
      else
        s = batch.find { |uuid, job| job.working? }
        message[:status] = !s.nil? ? s.last.status['status'] : 'completed'
        message[:message] = !s.nil? && !s.last.message.nil? ? s.last.message.first : ''
        message[:pct_complete] = (batch.inject(0.0) { |sum, (uuid, job)| sum + job.pct_complete } / batch.size).to_i
        message[:file_id] = req.params['file_id']
        message[:upload_id] = batch_id
        res.write message.to_json
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
