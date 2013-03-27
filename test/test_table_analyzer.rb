require 'tmpdir'

require 'minitest/autorun'

require_relative '../local_settings'
require_relative '../lib/tabula'
require_relative '../lib/parse_xml.rb'

class TestTableAnalyzer < MiniTest::Unit::TestCase
  def setup
    @tmp_dir = Dir.mktmpdir
  end

  def teardown
    FileUtils.remove_entry_secure @tmp_dir
  end

  def test_argentina_diputados_voting_record
    run_jruby_extractor!('test_pdfs/argentina_diputados_voting_record.pdf')

    text_elements = Tabula::XML.get_text_elements(@tmp_dir, 1, 12.75, 269.875, 561, 790.5)
    table = Tabula.make_table(text_elements)

    # TODO write the actual test!!!!!!!!!!
    # (ie compare table with the expected output)

  end


  private

  def run_jruby_extractor!(pdf_path)
    jar_path = File.join(File.expand_path(File.dirname(__FILE__)), '..', 'lib/jars')
    jruby_script_path = File.join(File.expand_path(File.dirname(__FILE__)), '..', 'lib/jruby_dump_characters.rb')
    jars = ['fontbox-1.7.1.jar','pdfbox-1.7.1.jar','commons-logging-1.1.1.jar','jempbox-1.7.1.jar'].map { |j| File.join(jar_path, j) }.join(':')
    puts jars
    system({'CLASSPATH' => jars}, "#{Settings::JRUBY_PATH} --1.9 --server #{jruby_script_path} #{pdf_path} #{@tmp_dir}")
  end


end
