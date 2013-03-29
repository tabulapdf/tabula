require 'opencv'
include OpenCV

def hough(file)
  # mat = CvMat.load(file,
  #                  CV_LOAD_IMAGE_ANYCOLOR | CV_LOAD_IMAGE_ANYDEPTH)

  image = IplImage.load(file,
                        CV_LOAD_IMAGE_ANYCOLOR | CV_LOAD_IMAGE_ANYDEPTH)
  image.set_roi(CvRect.new(1150, 1130, 960, 750))

  mat = image.to_CvMat
  mat = mat.BGR2GRAY
  mat_canny = mat.canny(50, 200, 3)
  mat = mat.GRAY2BGR
  lines = mat_canny.hough_lines(:probabilistic, 1, Math::PI / 180, 400, 50, 10)

 lines.each { |p| mat.line!(p[0], p[1], :color => CvColor::Red, :thickness => 2) }
 window = OpenCV::GUI::Window.new("preview")
 window.show(mat)
  OpenCV::GUI::wait_key
end
puts ARGV[0]
hough(ARGV[0])
