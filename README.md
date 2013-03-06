# Tabula

## Quick & Dirty Setup Instructions

TODO: extremely incomplete and possibly incorrect

### Install / setup

    gem update
    gem install nokogiri -v 1.5.6
    gem install cuba -v 3.1.0
    gem install resque -v 1.23.0
    gem install resque-progress -v 1.0.1

    Install XQuartz: https://xquartz.macosforge.org/landing/
    brew install mupdf

### Not yet integrated, but someday you will need ruby-opencv:

    brew install python
    pip install numpy
    brew install opencv --with-tbb --with-opencl --with-qt
    gem install ruby-opencv
    # TODO: does not install under jruby
