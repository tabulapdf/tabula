require 'net/http'
require 'fileutils'
require 'digest/sha1'

module JavaCVDownloader
  JARS_PATH = "./lib/jars/"
  JAVACV_FILENAME = "javacv.jar"
  ARCH_SPECIFIC_FILENAMES = ["javacv-android-arm.jar", "javacv-linux-x86.jar", "javacv-linux-x86_64.jar", "javacv-macosx-x86_64.jar", "javacv-windows-x86.jar", "javacv-windows-x86_64.jar"]

  JAVACV_BIN_URL = URI('http://javacv.googlecode.com/files/javacv-0.5-bin.zip')
  JAVACV_BIN_SHA1 = "05631c8543ea4de93e31dfbcf4b97417f8696a51"

  def self.present?
    File.exist?(JARS_PATH + JAVACV_FILENAME) &&
      ARCH_SPECIFIC_FILENAMES.map{|f| File.exist?(JARS_PATH + f)}.include?(true)
  end

  def self.download
    return if present?


    puts "downloading JavaCV binaries..."
    open("javacv-bin.zip", "w") do |f|
      javacv_bin = Net::HTTP.get(JAVACV_BIN_URL)
      sig = Digest::SHA1.hexdigest(javacv_bin)
      raise IOError, "Downloaded javacv zip has the wrong signature. Uh oh." unless sig == JAVACV_BIN_SHA1
      f.write(javacv_bin)
    end

    begin
      `unzip -j javacv-bin.zip "*.jar" -d #{JARS_PATH}`
    rescue Errno::ENOENT
      raise NotYetImplementedError, "We depend on `unzip` existing on your system for automatic downloading of javacv binaries. Install it, or manaully unzip ./javacv-bin.zip and place its contents in lib/jars/ ."
    else
      FileUtils.rm("javacv-bin.zip")
    end
  end
end

if __FILE__ == $0
  JavaCVDownloader::download
end
