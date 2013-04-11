require_relative '../../local_settings.rb'

class DetectTablesJob
  # args: (:file, :output_dir, :thumbnail_size)
  include Resque::Plugins::Status
  Resque::Plugins::Status::Hash.expire_in = (30 * 60) # 30min
  @queue = :pdftohtml

  def perform
    file = options['file']
    file_id = options['file_id']
    output_dir = options['output_dir']
    f = open(File.join(output_dir, "tables.json"), 'w')
    f.write(guess_tables(file))
    f.close
    return nil
  end

  private

  def guess_tables(filename)
    #return a list of pages' tables.
    #e.g. [[[184.0, 100.0, 497.0, 486.0] ]] for a single page doc with one table.
    cmd = create_column_guesser_command(filename)
    json_tables = `#{cmd}`
    return JSON.load(json_tables)
  end

  def create_column_guesser_command(filename)
    #return bash string to convert clean PDF to TSV via Java converter
    java_class = "propub.pdf.ColumnGuesser"
    guess_columns_individually = false

    #TODO: check if javacv jars exist, if not, raise error instructing people to use javacv_downloader.rb

    # on unixes, this should be : separated, on win32 ; separated.
    if RUBY_PLATFORM.downcase.include?("mswin")
      if RUBY_PLATFORM.downcase.include?("x86_64")
        classpath = "./lib/java/bin/;./lib/jars/PDFRenderer-0.9.1.jar;./lib/jars/javacpp.jar;./lib/jars/javacv.jar;./lib/jars/javacv-windows-x86_64.jar"
      elsif RUBY_PLATFORM.downcase.include?("i386") #may the Lord help you if you're running Windows on a platform other than i386 or x86_64.
        classpath = "./lib/java/bin/;./lib/jars/PDFRenderer-0.9.1.jar;./lib/jars/javacpp.jar;./lib/jars/javacv.jar;./lib/jars/javacv-windows-x86.jar"
      end
    elsif RUBY_PLATFORM.downcase.include?("linux")
      if RUBY_PLATFORM.downcase.include?("x86_64")
        classpath = "./lib/java/bin/:./lib/jars/PDFRenderer-0.9.1.jar:./lib/jars/javacpp.jar:./lib/jars/javacv.jar:./lib/jars/javacv-linux-x86_64.jar.jar"
      elsif RUBY_PLATFORM.downcase.include?("i386")
        classpath = "./lib/java/bin/:./lib/jars/PDFRenderer-0.9.1.jar:./lib/jars/javacpp.jar:./lib/jars/javacv.jar:./lib/jars/javacv-linux-x86.jar"
      elsif RUBY_PLATFORM.downcase.include?("arm")
        raise NotYetImplementedError, "You're gonna have to find your own jars for JavaCV on ARM. Rumor has it that they exist. :)"
      end
    elsif RUBY_PLATFORM.downcase.include?("darwin")
      classpath = "./lib/java/bin/:./lib/jars/PDFRenderer-0.9.1.jar:./lib/jars/javacpp.jar:./lib/jars/javacv.jar:./lib/jars/lib/javacv-macosx-x86_64.jar"
    else
      raise NotYetImplementedError, "Wasn't able to determine your platform for setting the right javacv binary in classpath."
    end

    source_basename = File.basename(filename)
    cmd = "java -cp #{classpath} #{java_class} \"#{source_basename}\" \"#{filename}\" #{guess_columns_individually ? "\"indiv\"" : ""} ";
    return cmd
  end

end