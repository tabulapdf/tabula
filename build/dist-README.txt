# Tabula

Tabula helps you liberate data tables trapped inside PDF files.

* Read more about Tabula on OpenNews Source:
  https://source.mozillaopennews.org/en-US/articles/introducing-tabula/

* See the GitHub project for source code, bug reports, and more:
  https://github.com/jazzido/tabula

© 2012-2013 Manuel Aristarán. Available under MIT License.
See `AUTHORS.txt` and `LICENSE.txt`.

---

## Using Tabula

First, make sure you have a recent copy of Java installed. You can
download Java at https://www.java.com/download/ . Tabula requires
a Java Runtime Environment compatible with Java 6 or Java 7.

### Windows (tabula-win.zip)

Open tabula.exe and a browser should automatically open to
http://127.0.0.1:34555/ . If not, open your web browser of choice and visit
that URL.

### Mac OS X (tabula-mac.zip)

Open the Tabula app and a browser should automatically open to
http://127.0.0.1:34555/ . If not, open your web browser of choice and visit
that URL.

### JAR file for Linux/Other (tabula-jar.zip)

Open a terminal window, and `cd` to inside this `tabula` directory,
then run the following command

  java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar tabula.jar
