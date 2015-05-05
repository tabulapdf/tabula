require_relative '../lib/tabula_job_executor/executor.rb'

class TabulaJobProgress < Roda
  clear_middleware!

  route do
    on :upload_id, :method=>:get do |batch_id|
      # upload_id is the "job id" uuid that resque-status provides
      batch = Tabula::Background::JobExecutor.get_by_batch(batch_id)

      is "json" do |batch_id|
        message = {}
        if batch.empty?
          response.status = 404
          message[:status] = "error"
          message[:message] = "No such job"
          message[:pct_complete] = 0
        elsif batch.any? { |uuid, job| job.failed? }
          message[:status] = "error"
          message[:message] = "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
          message[:pct_complete] = 99
        else
          s = batch.find { |uuid, job| job.working? }
          message[:status] = !s.nil? ? s.last.status['status'] : 'completed'
          message[:message] = !s.nil? && !s.last.message.nil? ? s.last.message.first : ''
          message[:pct_complete] = (batch.inject(0.0) { |sum, (uuid, job)| sum + job.pct_complete } / batch.size).to_i
          message[:file_id] = request['file_id']
          message[:upload_id] = batch_id
        end
        message
      end

      is do
        if batch.empty?
          response.status = 404
          view("upload_error.html", :locals=>{
               :message => "invalid upload_id (TODO: make this generic 404)"})
        elsif batch.any? { |uuid, job| job.failed? }
          view("upload_error.html", :locals=>{
               :message => "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."})
        else
          s = batch.find { |uuid, job| job.working? }
          view("upload_status.html", :locals=>{
               :status => !s.nil? ? s.last.message : 'completed',
               :pct_complete => (batch.inject(0.0) { |sum, (uuid, job)| sum + job.pct_complete } / batch.size).to_i,
               :upload_id => batch_id,
               :file_id => request['file_id']})
        end
      end
    end
  end
end
