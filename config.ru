# encoding: UTF-8
require 'rubygems'
require 'bundler'
Bundler.require
require_relative './webapp/tabula_settings.rb'
require_relative './webapp/tabula_web.rb'
run Cuba

if "#{$PROGRAM_NAME}".include?("tabula.jar")
  # only do this if running as jar or app. (if "rackup", we don't
  # actually use 8080 by default.)

  require 'java'

  # don't do "java_import java.net.URI" -- it conflicts with Ruby URI and
  # makes Cuba/Rack really really upset. just call "java.*" classes
  # directly.
  port = java.lang.Integer.getInteger('warbler.port', 8080)
  url = "http://127.0.0.1:#{port}"

  puts "============================================================"
  puts url
  puts "============================================================"

  # Open browser after slight delay. (The server may take a while to actually
  # serve HTTP, so we are trying to avoid a "Could Not Connect To Server".)
  uri = java.net.URI.new(url)
  sleep 0.5

  have_desktop = false
  if java.awt.Desktop.isDesktopSupported
    begin
      desktop = java.awt.Desktop.getDesktop()
    rescue
      desktop = nil
    else
      have_desktop = true
    end
  end

  # if running as a jar or app, automatically open the user's web browser if
  # the system supports it.
  if have_desktop
    puts "\n======================================================"
    puts "Launching web browser to #{url}\n\n"
    puts "If it does not open in 10 seconds, you may manually open"
    puts "a web browser to the above URL."
    puts "When you're done using the Tabula interface, you may"
    puts "return to this window and press \"Control-C\" to close it."
    puts "======================================================\n\n"
    desktop.browse(uri)
  else
    puts "\n======================================================"
    puts "Server now listening at: #{url}\n\n"
    puts "You may now open a web browser to the above URL."
    puts "When you're done using the Tabula interface, you may"
    puts "return to this window and press \"Control-C\" to close it."
    puts "======================================================\n\n"
  end
end
