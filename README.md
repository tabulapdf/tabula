# Tabula

Tabula helps you liberate data tables trapped inside PDF files.

* [Read more about Tabula on OpenNews Source](http://source.mozillaopennews.org/en-US/articles/introducing-tabula/)
* [Check out the (feature-limited) demo](http://tabula.nerdpower.org/)

© 2012-2013 Manuel Aristarán. Available under MIT License. See `AUTHORS.md`
and `LICENSE.md`.

## Why Tabula?

If you’ve ever tried to do anything with data provided to you in PDFs, you
know how painful this is — you can’t easily copy-and-paste rows of data out 
of PDF files. Tabula allows you to extract that data in CSV format, through
a simple web interface:

{TODO: screenshot / screencast here}

**Caveat**: Tabula only works on text-based PDFs, not scanned documents.

## Amazon EC2 AMI

An Amazon EC2 AMI image is provided to give you a chance to boot up a quick test server: `ami-e895f081`

You can find a simple how-to [in `docs/ami-install.md`](docs/ami-install.md).

### Caveats

Note the [EC2 instance types](https://aws.amazon.com/ec2/instance-types/)
and [EC2 pricing](https://aws.amazon.com/ec2/pricing/). We’re not responsible
for any costs this may incur.

Also, please note that this image is a development demo image and may not be
secure. Using this AMI for mission-critical or sensitive documents is currently
not recommended.

## Manual Installation (OS X or Linux)

<i>(<b>Note:</b> A comprehensive, mostly copy-and-paste set of instructions is available for
OS X users that normally don't do Ruby development but are interested bootstrapping
Tabula on their own computer: [`docs/osx-simple-bootstrap.md`](docs/osx-simple-bootstrap.md))</i>

1. Install Ruby and JRuby. Tabula has been tested with Ruby 1.9.3 and JRuby 1.7.3. 
   Use of a Ruby version manager is recommended. Both [rbenv][rbenv] and [RVM][rvm] 
   are fine choices. (JRuby is required to interface with `pdfbox`, but native Ruby 
   must also be used since `ruby-opencv` is a natively compiled extension.)

   [rbenv]:https://github.com/sstephenson/rbenv/
   [rvm]:https://rvm.io

   If using rbenv:
   ~~~
   rbenv install 1.9.3-p392
   rbenv install jruby-1.7.3
   ~~~

   If using rvm:
   ~~~
   rvm install 1.9.3-p392
   rvm install jruby-1.7.3
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

    # Add the "science" tap to Homebrew so it can find OpenCV (if you haven't already)
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
