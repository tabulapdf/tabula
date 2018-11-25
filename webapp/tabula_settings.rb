# encoding: UTF-8
require 'fileutils'

module TabulaSettings

  ########## Defaults ##########
  DEFAULT_DEBUG = false
  DEFAULT_DISABLE_VERSION_CHECK = false
  DEFAULT_DISABLE_NOTIFICATIONS = false

  ########## Helpers ##########
  def self.getDataDir
    # OS X: ~/Library/Application Support/Tabula
    # Win:  %APPDATA%/Tabula
    # Linux: ~/.tabula

    # when invoking as "java -Dtabula.data_dir=/foo/bar ... -jar tabula.war"
    data_dir = java.lang.System.getProperty('tabula.data_dir')
    unless data_dir.nil?
      return java.io.File.new(data_dir).getPath
    end

    # when invoking with env var
    data_dir = ENV['TABULA_DATA_DIR']
    unless data_dir.nil?
      return java.io.File.new(data_dir).getPath
    end

    # use the usual directory in (system-dependent) user home dir
    data_dir = nil
    case java.lang.System.getProperty('os.name')
    when /Windows/
      # APPDATA is in a different place (under user.home) depending on
      # Windows OS version. so use that env var directly, basically
      appdata = ENV['APPDATA']
      if appdata.nil?
        home = java.lang.System.getProperty('user.home')
      end
      data_dir = java.io.File.new(appdata, '/Tabula').getPath

    when /Mac/
      home = java.lang.System.getProperty('user.home')
      data_dir = File.join(home, '/Library/Application Support/Tabula')


    else
      # probably *NIX
      home = java.lang.System.getenv('XDG_DATA_HOME')
      if !home.nil?
        # XDG
        data_dir = File.join(home, '/tabula')
      else
        # other, normal *NIX systems
        home = java.lang.System.getProperty('user.home')
        home = '.' if home.nil?
        data_dir = File.join(home, '/.tabula')
      end
    end # /case

    data_dir
  end

  def self.enableDebug
    # when invoking as "java -Dtabula.debug=1 ... -jar tabula.war"
    debug = java.lang.System.getProperty('tabula.debug')
    unless debug.nil?
      return (debug.to_i > 0)
    end

    # when invoking with env var
    debug = ENV['TABULA_DEBUG']
    unless debug.nil?
      return (debug.to_i > 0)
    end

    DEFAULT_DEBUG
  end

  def self.disableVersionCheck
    disable_version_check = java.lang.System.getProperty('tabula.disable_version_check')
    unless disable_version_check.nil?
      return (disable_version_check.to_i > 0)
    end

    DEFAULT_DISABLE_VERSION_CHECK
  end

  def self.disableNotifications
    disable_notifications = java.lang.System.getProperty('tabula.disable_notifications')
    unless disable_notifications.nil?
      return (disable_notifications.to_i > 0)
    end

    DEFAULT_DISABLE_NOTIFICATIONS
  end

  ########## Constants that are used around the app, based on settings ##########
  DOCUMENTS_BASEPATH = File.join(self.getDataDir, 'pdfs')
  ENABLE_DEBUG_METHODS = self.enableDebug

  puts "DATA_DIR = #{self.getDataDir}"
  puts "DOCUMENTS_BASEPATH = #{DOCUMENTS_BASEPATH}"
  puts "ENABLE_DEBUG_METHODS = #{ENABLE_DEBUG_METHODS}"

  ########## Initialize environment, using helpers ##########
  FileUtils.mkdir_p(DOCUMENTS_BASEPATH)
end
