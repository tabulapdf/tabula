require_relative '../lib/tabula_job_executor/executor.rb'

class TabulaJobProgress < Cuba
  define do
    on ":upload_id/json" do |upload_id|
      # upload_id is the "job id" uuid that resque-status provides
      status = Tabula::Background::JobExecutor.get(upload_id)
      res['Content-Type'] = 'application/json'
      message = {}
      if status.nil?
        res.status = 404
        message[:status] = "error"
        message[:message] = "No such job"
        message[:pct_complete] = 0
      elsif status.failed?
        message[:status] = "error"
        message[:message] = "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
        message[:pct_complete] = 99
        res.write message.to_json
      else
        message[:status] = status.status
        message[:message] = status.message
        message[:pct_complete] = status.pct_complete
        message[:file_id] = status[:file_id]
        message[:upload_id] = status[:upload_id]
        res.write message.to_json
      end
    end

    on ":upload_id" do |upload_id|
      # upload_id is the "job id" uuid that resque-status provides
      status = Tabula::Background::JobExecutor.get(upload_id)
      puts Tabula::Background::JobExecutor.instance.jobs.inspect
      if status.nil?
        res.status = 404
        res.write ""
        res.write view("upload_error.html",
                       :message => "invalid upload_id (TODO: make this generic 404)")
      elsif status.failed?
        res.write view("upload_error.html",
                       :message => "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again.")
      else
        res.write view("upload_status.html", :status => status, :upload_id => upload_id)
      end
    end
  end
end
