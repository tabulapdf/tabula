require 'opencv'


mat = OpenCV::CvMat.load(ARGV[0],
                         OpenCV::CV_LOAD_IMAGE_ANYCOLOR | OpenCV::CV_LOAD_IMAGE_ANYDEPTH)

# TODO if mat is not 3-channel, don't do BGR2GRAY
mat = mat.BGR2GRAY
#mat = mat.smooth(1, 3,3)
#mat.save_image '/tmp/blur.jpg'
mat_canny = mat.canny(50, 200, 3)
mat_canny.save_image '/tmp/canny.jpg'

mat = mat.GRAY2BGR
lines = mat_canny.hough_lines(:probabilistic, 1, Math::PI / 180, 500, 20, 10)

# puts lines.map do |line|
#   [line.point1.x, line.point1.y, line.point2.x, line.point2.y]
# end

lines.each do |line|
  mat.line!(line.point1, line.point2, :color => OpenCV::CvColor::Blue,
                  :thickness => 1, :line_type => :aa)
end



window = OpenCV::GUI::Window.new("preview")

#mat_sobel = mat_canny.sobel(0, 1, 3)

#window.show(mat_canny)
#window.show(mat_sobel)
window.show(mat)
OpenCV::GUI::wait_key

mat.save_image '/tmp/lines.jpg'
