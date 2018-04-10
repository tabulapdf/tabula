#!/usr/bin/env bash
gem update --system
# download and use jruby
wget https://repo1.maven.org/maven2/org/jruby/jruby-dist/9.1.16.0/jruby-dist-9.1.16.0-bin.zip
unzip jruby-dist-9.1.16.0-bin.zip
mv jruby-9.1.16.0 ~/
export PATH=~/jruby-9.1.16.0/bin:$PATH
# create back-end jar
cd ~/
git clone https://github.com/redmyers/484_P7_1-Java.git
cd 484_P7_1-Java
git checkout Header_Back_End
mvn clean compile assembly:single
mvn install:install-file -Dfile=target/tabula-1.0.2-SNAPSHOT-jar-with-dependencies.jar -DgroupId=technology.tabula -DartifactId=tabula -Dversion=1.0.2-SNAPSHOT -Dpackaging=jar -DpomFile=pom.xml
# start server via GUI repo
cd ~/
git clone https://github.com/redmyers/484_P7_1-GUI.git
cd 484_P7_1-GUI
git checkout Header_Addition
export PATH=~/jruby-9.1.16.0/bin:$PATH
gem install bundler
bundle install
jruby -S jbundle installjruby -G -r jbundler -S rackup
sleep 5

