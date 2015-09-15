require 'fileutils'
require 'warbler'

########## java jar compilation ##########

Warbler::Task.new("war",
  Warbler::Config.new { |config|
    config.features = %w(executable)
    config.jar_name = 'build/tabula'
    config.jar_extension = 'jar'
    config.webserver = "jetty"
    config.webxml.jruby.compat.version = "1.9"
    config.webxml.jruby.rack.logging = "stderr"
    config.dirs = ['lib', 'webapp']
    config.override_gem_home = false
  }
)

# version we're building
def build_version
  ENV['TABULA_VERSION'] || "rev#{`git rev-list --max-count=1 HEAD`.strip}"
end

def invoke_ant(*args)
  IO.popen("ant #{args.join(' ')}") { |f|
    yield f
  }
end

########## distribution bundles ##########
task :create_version_file do |t|
  puts "Creating version file (#{build_version})..."
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  rb_file = <<-eos
    $TABULA_VERSION = "#{build_version}"
  eos
  File.open(File.join(tabula_dir, 'webapp', 'tabula_version.rb'), 'wb') do |f|
    f.write rb_file
  end
end

task :delete_version_file do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  FileUtils.rm(File.join(tabula_dir, 'webapp', 'tabula_version.rb'))
end


task :jardist => [:create_version_file, :war] do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  build_dir = File.join(tabula_dir, "build")
  dist_dir = File.join(build_dir, "jardist", "tabula")

  if File.exist?(File.join(build_dir, "jardist"))
    FileUtils.rm_rf(File.join(build_dir, "jardist"))
  end

  puts "\n======================================================"
  puts "Building jar zip file bundle..."
  puts "======================================================\n\n"

  Dir.mkdir(File.join(build_dir, "jardist"))
  Dir.mkdir(File.join(build_dir, "jardist", "tabula"))

  jar_src = File.join(build_dir, "tabula.jar")
  jar_dst = File.join(dist_dir, "tabula.jar")
  FileUtils.cp(jar_src, jar_dst)

  readme_src = File.join(build_dir, "dist-README.txt")
  readme_dst = File.join(dist_dir, "README.txt")
  FileUtils.cp(readme_src, readme_dst)

  lic_src = File.join(build_dir, "dist-LICENSE.txt")
  lic_dst = File.join(dist_dir, "LICENSE.txt")
  FileUtils.cp(lic_src, lic_dst)

  authors_src = File.join(tabula_dir, "AUTHORS.md")
  authors_dst = File.join(dist_dir, "AUTHORS.txt")
  FileUtils.cp(authors_src, authors_dst)

  cd File.join(build_dir, "jardist")
  output = File.join(build_dir, "tabula-jar-#{build_version}.zip")
  if File.exists?(output)
    File.delete(output)
  end

  IO.popen("zip -r9 #{output} tabula") { |f|
    f.each { |line| puts line }
  }
  FileUtils.rm_rf(dist_dir)
  puts "\n======================================================"
  puts "Zip file saved to #{output}"
  puts "======================================================\n\n"
end


task :macosx => [:create_version_file, :war] do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  build_dir = File.join(tabula_dir, "build")
  dist_dir = File.join(build_dir, "mac", "tabula")

  cd File.join(tabula_dir)

  if File.exist?(File.join(build_dir, "mac"))
    FileUtils.rm_rf(File.join(build_dir, "mac"))
  end

  puts "\n======================================================"
  puts "Building Mac OS X app..."
  puts "======================================================\n\n"

  invoke_ant("-Dfull_version=#{build_version}", "-v", "macbundle") { |f|
    f.each { |line| puts line }
  }


  puts "\n======================================================"
  puts "Creating zip file bundle..."
  puts "======================================================\n\n"

  Dir.mkdir(dist_dir)

  app_src = File.join(build_dir, "mac", "Tabula.app")
  app_dst = File.join(dist_dir, "Tabula.app")
  FileUtils.mv(app_src, app_dst)

  readme_src = File.join(build_dir, "dist-README.txt")
  readme_dst = File.join(dist_dir, "README.txt")
  FileUtils.cp(readme_src, readme_dst)

  lic_src = File.join(build_dir, "dist-LICENSE.txt")
  lic_dst = File.join(dist_dir, "LICENSE.txt")
  FileUtils.cp(lic_src, lic_dst)

  authors_src = File.join(tabula_dir, "AUTHORS.md")
  authors_dst = File.join(dist_dir, "AUTHORS.txt")
  FileUtils.cp(authors_src, authors_dst)

  cd File.join(build_dir, "mac")
  output = File.join(build_dir, "tabula-mac-#{build_version}.zip")
  if File.exists?(output)
    File.delete(output)
  end

  IO.popen("zip -r9 #{output} tabula") { |f|
    f.each { |line| puts line }
  }
  FileUtils.rm_rf(dist_dir)
  puts "\n======================================================"
  puts "Zip file saved to #{output}"
  puts "======================================================\n\n"
end


task :windows => [:create_version_file, :war] do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  build_dir = File.join(tabula_dir, "build")
  dist_dir = File.join(build_dir, "windows", "tabula")

  if File.exist?(File.join(build_dir, "windows"))
    FileUtils.rm_rf(File.join(build_dir, "windows"))
  end

  cd File.join(tabula_dir)

  puts "\n======================================================"
  puts "Building Windows executable..."
  puts "======================================================\n\n"

  # exe files REALLY need x.x.x.x otherwise the compile fails.
  if build_version.start_with?('rev')
    win_build_version = '0.0.0.0'
  else
    win_build_version = build_version
    while win_build_version.split('.').length < 4
      win_build_version = "#{win_build_version}.0"
    end
  end

  cd File.join(File.expand_path(File.dirname(__FILE__)), "launch4j")
  invoke_ant("-Dfull_version=#{win_build_version}", "-f", "../build.xml", "windows") { |f|
    f.each { |line| puts line }
  }
  puts "\n======================================================"
  puts "Creating zip file bundle..."
  puts "======================================================\n\n"

  Dir.mkdir(dist_dir)

  app_src = File.join(build_dir, "windows", "tabula.exe")
  app_dst = File.join(dist_dir, "tabula.exe")
  FileUtils.mv(app_src, app_dst)

  jar_src = File.join(build_dir, "tabula.jar")
  jar_dst = File.join(dist_dir, "tabula.jar")
  FileUtils.cp(jar_src, jar_dst)

  readme_src = File.join(build_dir, "dist-README.txt")
  readme_dst = File.join(dist_dir, "README.txt")
  FileUtils.cp(readme_src, readme_dst)

  lic_src = File.join(build_dir, "dist-LICENSE.txt")
  lic_dst = File.join(dist_dir, "LICENSE.txt")
  FileUtils.cp(lic_src, lic_dst)

  authors_src = File.join(tabula_dir, "AUTHORS.md")
  authors_dst = File.join(dist_dir, "AUTHORS.txt")
  FileUtils.cp(authors_src, authors_dst)

  cd File.join(build_dir, "windows")
  output = File.join(build_dir, "tabula-win-#{build_version}.zip")
  if File.exists?(output)
    File.delete(output)
  end

  IO.popen("zip -r9 #{output} tabula") { |f|
    f.each { |line| puts line }
  }
  FileUtils.rm_rf(dist_dir)
  puts "\n======================================================"
  puts "Zip file saved to #{output}"
  puts "======================================================\n\n"
end

task :build_all_platforms => [:create_version_file, :war] do |t|
  ['jardist', 'macosx', 'windows'].each do |platform|
    Rake::Task[platform].execute
    puts
  end
end

# delete version file after build
['jardist', 'macosx', 'windows'].each do |t|
  puts "Deleting version file."
  Rake::Task[t.intern].enhance {
    Rake::Task['delete_version_file'.intern].invoke
  }
end
