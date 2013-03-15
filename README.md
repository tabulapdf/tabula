# Tabula

## Quick & Dirty Setup Instructions

TODO: extremely incomplete and possibly incorrect

### Install / setup

Requires jruby installed (to interface with the PDF parser), but the
rest of the app requires the normal C-based ruby (so that opencv can
be compiled in). Has been tested with Ruby 1.9.3 and JRuby 1.7.3.

Check out the repo, blah blah.

Install some dependencies:

    # Handle installing Python and pip.  You can skip this
    # if you already have it.
    brew install python
    curl http://python-distribute.org/distribute_setup.py | python
    curl https://raw.github.com/pypa/pip/master/contrib/get-pip.py | python

    # Install numpy (feel free to put it in a virtualenv); opencv dependency
    pip install numpy

    # ...Install XQuartz since brew won't do it for you...
    #      -> https://xquartz.macosforge.org/landing/

    brew install mupdf
    brew install opencv --with-tbb --with-opencl --with-qt

    # redis; resque dependency
    brew install redis

    # Make sure bundler is installed (skip if you have it)
    gem install bundler
    bundle install

Install jruby and get the full path to the jruby executable.
Instructions for rbenv:

    rbenv install jruby-1.7.3
    RBENV_VERSION='jruby-1.7.3' rbenv which jruby

Now copy `local_settings-example.rb`  to `local_settings.rb` in your
repo root and set `JRUBY_PATH` to the path you got in the previous
step.

Note: You shouldn't use jRuby to run or install the various gems.  Tabula just
uses it in a few areas where Java libraries are better.

### Dev Usage

Start `redis-server` in a separate terminal tab

    redis-server /usr/local/etc/redis.conf

Start `resque` in a separate terminal tab (there may be no output)

    COUNT=3 TERM_CHILD=1 QUEUE=* bundle exec rake resque:workers

Run your server

    bundle exec rackup

The site instance should now be viewable at http://127.0.0.1:9292/
