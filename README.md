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
    brew install opencv --with-tbb --with-opencl --with-qt

    # Handle installing Python and pip.  You can skip this
    # if you already have it.
    brew install python
    curl http://python-distribute.org/distribute_setup.py | python
    curl https://raw.github.com/pypa/pip/master/contrib/get-pip.py | python

    # Install numpy (feel free to put it in a virtualenv)
    pip install numpy

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

### Usage

    bundle exec rackup


## License
Copyright 2012-2013 Manuel Aristarán

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
