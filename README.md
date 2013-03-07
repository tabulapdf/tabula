# Tabula

## Quick & Dirty Setup Instructions

TODO: extremely incomplete and possibly incorrect

### Install / setup

Requires jruby installed (to interface with the PDF parser), but the
rest of the app requires the normal C-based ruby (so that opencv can
be compiled in). Has been tested with Ruby 1.9.3 and JRuby 1.7.3.

Check out the repo, blah blah.

Install some dependencies:

    # ...Install XQuartz since brew won't do it for you...
    #      -> https://xquartz.macosforge.org/landing/
    brew install mupdf

    gem update
    gem install nokogiri -v 1.5.6
    gem install cuba -v 3.1.0
    gem install resque -v 1.23.0
    gem install resque-progress -v 1.0.1

    # opencv + deps
    brew install python
    pip install numpy
    brew install opencv --with-tbb --with-opencl --with-qt
    gem install ruby-opencv

    # resque + deps
    brew install redis
    gem install bundler
    gem install resque

Install jruby and get the full path to the jruby executable.
Instructions for rbenv:

    rbenv install jruby-1.7.3
    RBENV_VERSION='jruby-1.7.3' rbenv which jruby

Now copy `local_settings-example.rb`  to `local_settings.rb` in your
repo root and set `JRUBY_PATH` to the path you got in the previous
step.


### Dev Usage

Start redis in a separate terminal tab

    redis-server /usr/local/etc/redis.conf

Start resque in a separate terminal tab

    VERBOSE=1 TERM_CHILD=1 QUEUE=* rake resque:work

Run your server

    rackup
