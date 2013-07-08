require 'json'
require 'jruby/synchronized'

require 'tabula'
require_relative '../executor.rb'

class GenerateDocumentMetadataJob < Tabula::Background::Job
  include JRuby::Synchronized

  # args: (:filename, :id)
  def perform

    file = options[:filename]
    id = options[:id]

    workspace_file = File.join(TabulaSettings::DOCUMENTS_BASEPATH, 'workspace.json')

    workspace = if File.exist?(workspace_file)
                  File.open(workspace_file) { |f| JSON.load(f) }
                else
                  []
                end

    workspace.insert(0, { 'file' => file, 'id' => id, 'time' => Time.now.to_i })

    # safely update
    begin
      File.open(workspace_file + '.tmp', 'w') { |tmp|
        tmp.write JSON.generate(workspace)
      }
    rescue
      puts "Failed to save wokspace!"
      return
    end

    if File.exists?(workspace_file)
      File.rename(workspace_file, workspace_file + '.old')
    end

    File.rename(workspace_file + '.tmp', workspace_file)
    if File.exists?(workspace_file + '.old')
      File.delete(workspace_file + '.old')
    end
  end
end
