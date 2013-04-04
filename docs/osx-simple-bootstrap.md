This is a supplementary set of installation instructions for folks who normally
don’t do Ruby development and are running OS X.

*(This document is a work-in-progress.)*

This assumes you have Homebrew installed. If you don’t:

* Install [Command Line Tools for Xcode](https://developer.apple.com/downloads)
  or [Xcode](http://itunes.apple.com/us/app/xcode/id497799835)
* Then see the instructions [on the Homebrew site](http://mxcl.github.com/homebrew/)
  (it’s that Ruby one-liner most of the way down the page). (See [Homebrew’s
  installation documentation](https://github.com/mxcl/homebrew/wiki/Installation)
  for more info.)

1. **Install XQuartz:** https://xquartz.macosforge.org/landing/

2. **Install [rbenv](https://github.com/sstephenson/rbenv/):**

    ~~~
    brew update
    brew install rbenv ruby-build
    ~~~

    Then, if you’re using bash (most people):
    ~~~
    echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
    ~~~

    Or, if you’re using zsh:
    ~~~
    echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
    ~~~

    ...Then, regardless of which shell you’re running:
    ~~~
    exec $SHELL -l
    ~~~

3. **Install the Tabula dependencies:**

    ~~~
    brew install python
    curl http://python-distribute.org/distribute_setup.py | /usr/local/bin/python
    curl https://raw.github.com/pypa/pip/master/contrib/get-pip.py | /usr/local/bin/python
    pip install numpy
    brew tap homebrew/science
    brew update
    brew install opencv --with-tbb --with-opencl --with-qt
    brew install mupdf redis
    ~~~

4. **Download Tabula** and start setting up the environment:

    ~~~
    git clone git://github.com/jazzido/tabula.git
    cd tabula

    gem install bundler
    rbenv rehash
    bundle install
    ~~~

5. **Configure Tabula:**

    ~~~
    cp local_settings-example.rb local_settings.rb
    ~~~

    Run the following command...
    ~~~
    RBENV_VERSION='jruby-1.7.3' rbenv which jruby
    ~~~
    ...then edit `local_settings.rb` and change the `JRUBY_PATH` value
    to match the path that you got.

6. **Run Tabula:**

    Run this in your Terminal...
    ~~~
    redis-server /usr/local/etc/redis.conf
    ~~~

    ...and then leave it running. Open another Terminal window or tab,
    and `cd` to the Tabula directory (probably `cd ~/tabula` if you’ve
    been following the instructions verbatim), and then run this:
    ~~~
    bundle exec foreman start
    ~~~

7. **Use Tabula:**

    You should now have the ability to open http://127.0.0.1:9292/ in your
    web browser.
