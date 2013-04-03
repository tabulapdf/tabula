# Tabula

Tabula helps you liberate data tables trapped inside evil PDFs.

A demo is available at: http://tabula.nerdpower.org/

© 2012-2013 Manuel Aristarán. Available under MIT License. See `AUTHORS.md`
and `LICENSE.md`.

## Why Tabula?

If you’ve ever tried to do anything with data provided to you in PDFs, you
know how painful this is — you can’t easily copy-and-paste rows of data out 
of PDF files. Tabula allows you to extract that data in CSV format, through
a simple web interface:

{TODO: screenshot / screencast here}

**Caveat**: Tabula only works on text-based PDFs, not scanned documents.


## Installation

1. Install Ruby and JRuby. Tabula been tested with Ruby 1.9.3 and JRuby 1.7.3.
   We recommend using [rbenv](https://github.com/sstephenson/rbenv/) to manage
   you Ruby versions. (JRuby is required to interface with `pdfbox`, but
   native Ruby must also be used since `ruby-opencv` is a natively compiled
   extension.)

   If using rbenv:

   ~~~
   rbenv install 1.9.3-p392
   rbenv install jruby-1.7.3
   ~~~

2. (Mac OS X only) Download and install XQuartz: https://xquartz.macosforge.org/landing/

3. Install the rest of the dependencies: (TODO: instructions for non-OSX platforms.)

    ~~~
    # Install Python, setuptools, and pip.  You can skip this
    # if you already have them.
    brew install python
    curl http://python-distribute.org/distribute_setup.py | python
    curl https://raw.github.com/pypa/pip/master/contrib/get-pip.py | python

    # Install numpy (feel free to put it in a virtualenv); opencv dependency
    pip install numpy

    brew tap homebrew/science
    brew install opencv --with-tbb --with-opencl --with-qt
    brew install mupdf redis
    ~~~

4. Download Tabula and install the Ruby dependencies. (Note: ensure that
   `rbenv` is configured for the standard Ruby interpreter, not JRuby)

    ~~~
    git clone git://github.com/jazzido/tabula.git
    cd tabula

    gem install bundler
    bundle install
    ~~~

5. Configure Tabula: Copy `local_settings-example.rb`  to `local_settings.rb`.
   Edit `local_settings.rb` and set `JRUBY_PATH` to the path to the `jruby`
   executable.

   If you are using rbenv, you can find the path to `jruby` by doing:

   ~~~
   RBENV_VERSION='jruby-1.7.3' rbenv which jruby
   ~~~

## Starting the Server (Dev)

Start `redis-server` in a separate terminal tab

    redis-server /usr/local/etc/redis.conf

Next, you need to start `resque` and the actual web server.  You can run both
of those using [Foreman](http://ddollar.github.com/foreman/) by running the
following:

    bundle exec foreman start

The site instance should now be viewable at http://127.0.0.1:9292/

## Contributing

Interested in helping out? See [`TODO.md`](TODO.md) for ideas.
