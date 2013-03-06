# Tabula

## Quick & Dirty Setup Instructions

TODO: extremely incomplete and possibly incorrect

### Install / setup

Works best under jruby (and some parts of the app require jruby/java
support). rbenv instructions:

    rbenv install jruby-1.7.3

    # ... cd to the tabula repo root directory ...
    rbenv local jruby-1.7.3

Install some dependencies:

    gem update
    gem install nokogiri -v 1.5.6
    gem install cuba -v 3.1.0
    gem install resque -v 1.23.0
    gem install resque-progress -v 1.0.1

    # ...Install XQuartz since brew won't do it for you...
    #      -> https://xquartz.macosforge.org/landing/
    brew install mupdf

Not required yet, but `ruby-opencv` is likely to become dependency in
the future and has some peculiarities to ensure it compiles correctly:

    # TODO: ruby-opencv doesn't install under jruby
    brew install python
    pip install numpy
    brew install opencv --with-tbb --with-opencl --with-qt
    gem install ruby-opencv

### Usage

    rackup
