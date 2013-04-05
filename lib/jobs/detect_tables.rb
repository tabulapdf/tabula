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
    #@class = "propub.pdf.ColumnGuesser"
    guess_columns_individually = false
    # on unix, this should be : separated, on win32 ; separated...
    if RUBY_PLATFORM.downcase.include?("mswin")
      classpath = "./java/bin/;./java/lib/PDFRenderer-0.9.1.jar;./java/lib/javacpp.jar;./java/lib/javacv.jar;./java/lib/javacv-windows-x86.jar"
    elsif RUBY_PLATFORM.downcase.include?("linux")
      classpath = "./java/bin/:./java/lib/PDFRenderer-0.9.1.jar:./java/lib/javacpp.jar:./java/lib/javacv.jar:./java/lib/javacv-linux-x86.jar"
    else
      classpath = "./java/bin/:./java/lib/PDFRenderer-0.9.1.jar:./java/lib/javacpp.jar:./java/lib/javacv.jar:./java/lib/javacv-macosx-x86_64.jar"
    end

    source_basename = File.basename(filename)
    cmd = "java -cp #{classpath} #{java_class} \"#{source_basename}\" \"#{filename}\" #{guess_columns_individually ? "\"indiv\"" : ""} ";
    return cmd
  end

end