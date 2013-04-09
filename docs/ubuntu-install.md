# Tabula Ubuntu Setup

Starting with a fresh EC2 Instance of Ubuntu (ami-0145d268):

Update apt-get
    
    sudo apt-get update

Install git and the build-essential package
    
    sudo apt-get install build-essential git-core

**Ruby**

Install rvm
    
    bash -s stable < <(curl -s https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer)

Install Ruby build dependencies
    
    sudo apt-get install libreadline6-dev zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev autoconf libgdbm-dev libncurses5-dev automake libtool bison pkg-config libffi-dev

Install Ruby
    
    rvm install 1.9.3-p392

Install jRuby dependency
    
    sudo apt-get install openjdk-7-jre-headless

Install jruby
    
    rvm install jruby-1.7.3

**OpenCV** [source](http://www.samontab.com/web/2012/06/installing-opencv-2-4-1-ubuntu-12-04-lts/)

Install dependencies

    sudo apt-get install build-essential libgtk2.0-dev libjpeg-dev libtiff4-dev libjasper-dev libopenexr-dev cmake python-dev python-numpy python-tk libtbb-dev libeigen2-dev yasm libfaac-dev libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev libxvidcore-dev libx264-dev libqt4-dev libqt4-opengl-dev sphinx-common texlive-latex-extra libv4l-dev libdc1394-22-dev libavcodec-dev libavformat-dev libswscale-dev libtbb2 libtbb-dev

Download and install OpenCV

    cd ~
    wget http://downloads.sourceforge.net/project/opencvlibrary/opencv-unix/2.4.1/OpenCV-2.4.1.tar.bz2
    tar -xvf OpenCV-2.4.1.tar.bz2
    cd OpenCV-2.4.1
    cmake -D WITH_TBB=ON -D WITH_QT=ON -D ..
    make
    sudo make install
    
Edit the config file
    
    sudo vi /etc/ld.so.conf.d/opencv.conf

And add    
    
    /usr/local/lib

Run `ldconfig` to configure OpenCV

    sudo ldconfig

Edit the `bashrc` file 

    sudo vi /etc/bash.bashrc

And add the following lines

    PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig
    export PKG_CONFIG_PATH

**mupdf** [source](https://github.com/xiangxw/mupdf-qt/wiki/Compile-Mupdf-on-Ubuntu)

Install mupdf 

    wget https://mupdf.googlecode.com/files/mupdf-1.2-source.zip  
    unzip https://mupdf.googlecode.com/files/mupdf-1.2-source.zip 
    sudo apt-get install libfreetype6-dev libjbig2dec0-dev libjpeg62-dev libopenjpeg-dev zlib1g-dev
    cd updf-1.2-source
    make
    sudo make prefix=/usr/local/mupdf install

**Redis** [source](http://library.linode.com/databases/redis/ubuntu-12.04-precise-pangolin)

Install Redis

    sudo apt-get install redis-server
    cp /etc/redis/redis.conf /etc/redis/redis.conf.default

**Tabula**

Download Tabula and install the Ruby dependencies.

    git clone git://github.com/jazzido/tabula.git
    cd tabula
    gem install bundler
    bundle install

Configure Tabula: Copy local_settings-example.rb to local_settings.rb. Edit local_settings.rb and set JRUBY_PATH to the path to the jruby executable. Using rvm, jruby is available at:

    JRUBY_PATH = '~/.rvm/bin/jruby-1.7.3'

Also set the path to `mudraw`:

    MUDRAW_PATH = '/usr/local/mupdf/bin/mudraw'