# Tabula Ubuntu Setup

Starting with a fresh EC2 instance of Ubuntu 12.04 (ami-0145d268):

Update apt-get
    
    sudo apt-get update

Install git and the build-essential package
    
    sudo apt-get install build-essential git-core

**Ruby**

Install and activate [rvm](https://github.com/wayneeseguin/rvm)
    
    bash -s stable < <(curl -s https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer)
    source /home/ubuntu/.rvm/scripts/rvm

Install Ruby build dependencies
    
    sudo apt-get install libreadline6-dev zlib1g-dev libssl-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev autoconf libgdbm-dev libncurses5-dev automake libtool bison pkg-config libffi-dev

Install Ruby
    
    rvm install 1.9.3-p392

Install jRuby dependencies
    
    sudo apt-get install openjdk-7-jre-headless

Install jruby
    
    rvm install jruby-1.7.3

**OpenCV** ([source](http://www.samontab.com/web/2012/06/installing-opencv-2-4-1-ubuntu-12-04-lts/))

Install dependencies

    sudo apt-get install libgtk2.0-dev libjpeg-dev libtiff4-dev libjasper-dev libopenexr-dev cmake python-dev python-numpy python-tk libtbb-dev libeigen2-dev yasm libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev libxvidcore-dev libx264-dev libqt4-dev libqt4-opengl-dev sphinx-common texlive-latex-extra libv4l-dev libdc1394-22-dev libavcodec-dev libavformat-dev libswscale-dev libtbb2 libtbb-dev libcv2.3 libcvaux2.3 libhighgui2.3 python-opencv opencv-doc libcv-dev libcvaux-dev libhighgui-dev libopencv-gpu-dev

Download and install OpenCV. Note that the Make step takes a very long time.

    cd ~
    wget http://downloads.sourceforge.net/project/opencvlibrary/opencv-unix/2.4.1/OpenCV-2.4.1.tar.bz2
    tar -xvf OpenCV-2.4.1.tar.bz2
    cd OpenCV-2.4.1
    mkdir build
    cd build
    cmake -D WITH_TBB=ON -D WITH_QT=ON ..
    make
    sudo make install
    
Edit `opencv.conf`
    
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

Save and exit the /etc/bash.bashrc file, then once back in terminal run

    source /etc/bash.bashrc

**MuPDF** ([source](https://github.com/xiangxw/mupdf-qt/wiki/Compile-Mupdf-on-Ubuntu))

Install dependencies
    sudo apt-get install libfreetype6-dev libjbig2dec0-dev libjpeg62-dev libopenjpeg-dev zlib1g-dev unzip

Download and install MuPDF 

    wget https://mupdf.googlecode.com/files/mupdf-1.2-source.zip 
    unzip mupdf-1.2-source.zip
    cd mupdf-1.2-source
    make
    sudo make prefix=/usr/local/mupdf install

**Redis** ([source](http://library.linode.com/databases/redis/ubuntu-12.04-precise-pangolin))

Install Redis

    sudo apt-get install redis-server
    sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.default

**Tabula**

Download Tabula and install Ruby dependencies.

    cd ~
    git clone git://github.com/jazzido/tabula.git
    cd tabula
    gem install bundler
    bundle install

Copy local_settings-example.rb to local_settings.rb. 

    cp local_settings-example.rb local_settings.rb

Edit `local_settings.rb` and set `JRUBY_PATH` to the path to the jruby executable. Using rvm, jruby is available at:

    JRUBY_PATH = '~/.rvm/bin/jruby-1.7.3'

Also set the path to `mudraw`:

    MUDRAW_PATH = '/usr/local/mupdf/bin/mudraw'

Follow the instructions detailed in the README to start the Tabula server. Make sure you have permissions set on to open HTTP/Port 80 for your instance, as well as port 9292 for the dev server.
