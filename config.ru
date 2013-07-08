require_relative './webapp/tabula_settings.rb'
require_relative './webapp/tabula_web.rb'
run Cuba


puts "$PROGRAM_NAME : #{$PROGRAM_NAME}"

# if running as a jar, automatically open the user's web browser
if "#{$PROGRAM_NAME}".include? "tabula.jar"
  require 'java'
  # don't do "java_import java.net.URI" -- it conflicts with Ruby URI and
  # makes Cuba/Rack really really upset. just call "java.*" classes
  # directly.

  url = "http://127.0.0.1:8080"

  puts "\n======================================================"
  puts "Launching web browser to #{url}\n\n"
  puts "When you're done using the Tabula interface, you may"
  puts "return to this window and press \"Control-C\" to close it."
  puts "======================================================\n\n"

  # Open browser after slight delay. (The server may take a while to actually
  # serve HTTP, so we are trying to avoid a "Could Not Connect To Server".)
  uri = java.net.URI.new(url)
  sleep 0.5
  java.awt.Desktop.getDesktop().browse(uri)
end
