
require '../lib/tabula.rb'
require '../lib/detect_rulings.rb'

# rulings.marshal is a dump of the detected rulings
# of page 1 in madoff.pdf

rulings = nil
File.open('./rulings.marshal', 'r') { |f|
  rulings = Marshal.load(f.read)
}
