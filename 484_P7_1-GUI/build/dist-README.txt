# Tabula

Tabula helps you liberate data tables trapped inside PDF files.

* The latest downloads and documentation are always available at:
  http://tabula.technology/

* Read more about Tabula on OpenNews Source:
  https://source.opennews.org/en-US/articles/introducing-tabula/

* See the GitHub project for source code, technical info, and more:
  https://github.com/tabulapdf/tabula

* Find a bug? Report it on GitHub:
  https://github.com/tabulapdf/tabula/issues

© 2012-2016 Manuel Aristarán. Available under MIT License.
See `AUTHORS.txt` and `LICENSE.txt`.

---

## Using Tabula

First, make sure you have a recent copy of Java installed. You can
download Java at https://www.java.com/download/ . Tabula requires
a Java Runtime Environment compatible with Java 6 or Java 7.

### Windows (tabula-win.zip)

Open tabula.exe and a browser should automatically open to
http://127.0.0.1:8080/ . If not, open your web browser of choice and visit
that URL.

### Mac OS X (tabula-mac.zip)

Open the Tabula app and a browser should automatically open to
http://127.0.0.1:8080/ . If not, open your web browser of choice and visit
that URL.

### JAR file for Linux/Other (tabula-jar.zip)

Open a terminal window, and `cd` to inside this `tabula` directory,
then run the following command

  java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar tabula.jar

Then, manually open your web browser to http://127.0.0.1:8080/ to access
the Tabula interface. Tabula binds to port 8080 by default. You can change
it with the `warbler.port` option; for example, if you want to use port 9999:

  java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -Dwarbler.port=9999 -jar tabula.jar

(You can enable the old "automatically open browser" behavior by using
the `-Dtabula.openBrowser=true` option.)
