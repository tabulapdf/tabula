module Settings
  JRUBY_PATH = '/Users/mtigas/.rbenv/versions/jruby-1.7.3/bin/jruby'
  MUDRAW_PATH = '/usr/local/bin/mudraw'
  USE_GOOGLE_ANALYTICS = false
  # uploaded pdfs and generated files go here. change if needed
  DOCUMENTS_BASEPATH = File.join(File.expand_path(File.dirname(__FILE__)), 'static/pdfs')
  ENABLE_DEBUG_METHODS = false
end
