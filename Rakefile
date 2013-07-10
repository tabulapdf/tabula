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
  }
)

########## distribution bundles ##########


task :jardist => [:war] do |t|
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
  output = File.join(build_dir, "tabula-jar.zip")
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


task :macosx => [:war] do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  build_dir = File.join(tabula_dir, "build")
  dist_dir = File.join(build_dir, "mac", "tabula")

  if File.exist?(File.join(build_dir, "mac"))
    FileUtils.rm_rf(File.join(build_dir, "mac"))
  end

  puts "\n======================================================"
  puts "Building Mac OS X app..."
  puts "======================================================\n\n"
  IO.popen("ant -v macbundle") { |f|
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
  output = File.join(build_dir, "tabula-mac.zip")
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


task :windows => [:war] do |t|
  tabula_dir = File.expand_path(File.dirname(__FILE__))
  build_dir = File.join(tabula_dir, "build")
  dist_dir = File.join(build_dir, "windows", "tabula")

  if File.exist?(File.join(build_dir, "windows"))
    FileUtils.rm_rf(File.join(build_dir, "windows"))
  end

  puts "\n======================================================"
  puts "Building Windows executable..."
  puts "======================================================\n\n"
  cd File.join(File.expand_path(File.dirname(__FILE__)), "launch4j")
  IO.popen("ant -f ../build.xml windows") { |f|
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
  output = File.join(build_dir, "tabula-win.zip")
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
