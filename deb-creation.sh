if [ ! -d $HOME/.openrefine ]; then
	echo "Building tabula"
	gem install bundler
	bundle install
	jruby -S jbundle install
	jruby -G -S rake war
fi

rm -rf deb-package
rm tabula.deb
mkdir deb-package
mkdir -p deb-package/opt/tabula
rsync -av --progress build/* deb-package/opt/tabula/ --exclude-from=deb-exclude
rsync -av --progress DEBIAN/ deb-package/DEBIAN/
dpkg-deb --build deb-package
mv deb-package.deb tabula.deb
