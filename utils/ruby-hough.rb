begin
  ['oily_png', 'pp'].each do |g|
    require g
  end
rescue LoadError => e
  puts "Could not load '#{e}'"; exit
end

class Hough
  Convert = "/usr/local/bin/convert"
  
  def initialize(image_path, options={})
    @verbose = options.delete(:verbose)
    @image = ChunkyPNG::Image.from_file(image_path)
    @image_path = image_path
  end

  def is_dark?(color)
    ChunkyPNG::Color.r(color) + ChunkyPNG::Color.g(color) + ChunkyPNG::Color.b(color) < 40
  end

  def is_light?(color)
    ChunkyPNG::Color.r(color) + ChunkyPNG::Color.g(color) + ChunkyPNG::Color.b(color) > 600
  end

  def angles(theta)
    @angles ||= {}
    @angles[theta] ||= {:cos => Math.cos(theta), :sin => Math.sin(theta)}
  end

  def get_hough_matrix
    hough = Hash.new(0)
    @image.height.times do |y|
      @image.width.times do |x|
        if is_dark?(@image[x,y]) && is_light?(@image[x,y + 1]) 
          (0..20).step(0.2).each do |theta|
            distance = (x * angles(theta)[:cos] + y * angles(theta)[:sin]).to_i
            hough[[theta, distance]] += 1 if distance >= 0
          end
        end
      end
    end
    return hough
  end

  def average_theta
     at = (get_hough_matrix.sort_by {|k,v| v }.take(20).inject(0.0) {|m,v| m + v[0][0] } / 20)
     pp "Average theta: #{at}"
     return at
  end

  def rotate(output_path)
   `#{Convert} #{@image_path} -rotate #{average_theta} #{output_path}`
  end

end

if __FILE__ == $0
  output_path = "ea.png"
  image_path = "probando_png.png"

  h = Hough.new(image_path, :verbose => true)
  h.rotate(output_path)

  `open #{output_path}`
end
