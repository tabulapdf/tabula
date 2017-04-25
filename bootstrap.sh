#!/usr/bin/env bash

# # Initial System Setup
#
# There are some basic requirements at the system level that are
# required to handle installing various other packages.
apt-get add-apt-repository ppa:guilhem-fr/mupdf
apt-get update
apt-get install -y build-essential openjdk-6-jre libxml2-dev libxslt-dev


# # rbenv
#
# Tabula requires multiple versions of Ruby and the suggested method
# is to use [rbenv][] to handle those various versions.  This section
# of code installs and configures rbenv if it hasn't already.
#
# [rbenv]: https://github.com/sstephenson/rbenv/
if [[ ! -d /home/vagrant/.rbenv ]]
then
  wget https://github.com/sstephenson/rbenv/archive/master.tar.gz
  tar -xzf master.tar.gz && rm master.tar.gz
  mv rbenv-master .rbenv

  wget https://github.com/sstephenson/ruby-build/archive/master.tar.gz
  tar -xzf master.tar.gz && rm master.tar.gz
  mkdir .rbenv/plugins
  mv ruby-build-master .rbenv/plugins/ruby-build

  echo "# Add rbenv to path" >> /home/vagrant/.profile
  echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> /home/vagrant/.profile
  echo "" >> /home/vagrant/.profile

  echo "# Add rbenv shims" >> /home/vagrant/.profile
  echo 'eval "$(rbenv init -)"' >> /home/vagrant/.profile

  chown -R vagrant:vagrant /home/vagrant/.rbenv
fi

for i in 1.9.3-p392 jruby-1.7.3;
do
  /home/vagrant/.rbenv/bin/rbenv install $i
done

/home/vagrant/.rbenv/versions/1.9.3-p392/bin/gem install bundler

# # Python
#
# Tabula requires numpy, which requires some basic bootstrapping of
# the Python environment to install.  This section handles that.
if [ -z `which pip` ]; then
  curl --silent http://python-distribute.org/distribute_setup.py | python
  curl --silent https://raw.github.com/pypa/pip/master/contrib/get-pip.py | python
  pip install numpy
fi

# # System Packagfes
#
apt-get install -y mupdf redis-server \
		python-opencv \
		libopencv-contrib-dev \
		libopencv-calib3d-dev \
		libopencv-gpu-dev \
		libopencv-legacy-dev \
		libopencv-ml-dev \
		libopencv-objdetect-dev \
		libopencv-video-dev

# # Tabula
#
# Now that all of the dependencies are handled, install and
# configure Tabula
cd /home/vagrant/tabula
/home/vagrant/.rbenv/versions/1.9.3-p392/bin/bundle install
