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

## Running Tabula

### Running a packaged version

(TODO)

### Running Tabula from source (for developers)

1. Download JRuby. You can install it from its website, or using tools like
   `rvm` or `rbenv`

2. Download Tabula and install the Ruby dependencies. (Note: if using `rvm` or
   `rbenv`, ensure that JRuby is being used.

    ~~~
    git clone git://github.com/jazzido/tabula.git
    cd tabula

    gem install bundler
    bundle install
    ~~~

**Then, start the development server:**

    bundle exec rackup

The site instance should now be viewable at http://127.0.0.1:9292/ .

You can a couple some options when executing the server in this manner:

    TABULA_DATA_DIR="/tmp/tabula" \
    TABULA_DEBUG=1 \
    bundle exec rackup

* `TABULA_DATA_DIR` controls where uploaded data for Tabula is stored. By default,
  data is stored in the OS-dependent application data directory for the current
  user. (similar to: `C:\Users\foo\AppData\Roaming\Tabula` on Windows,
  `~/Library/Application Support/Tabula` on Mac, `~/.tabula` on Linux/UNIX)
* `TABULA_DEBUG` prints out extra status data when PDF files are being processed.
   (`false` by default.)

**Alternatively, running the server as a JAR file**

Testing in this manner will be closer to testing the "packaged application"
version of the app.

    bundle exec rake war
    java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar build/tabula.jar

#### Building a packaged application version

After performing the above steps ("Running Tabula from source"), you can compile
Tabula into a standalone application:

**Mac OS X**

    rake war
    ant macbundle

Then, you will find a "Tabula.app" file in the `build/mac` directory. You can
double-click this to run a hidden Tabula server that is viewble at http://127.0.0.1:8080/ .
You will notice the Tabula server running in your Dock -- simply Quit that application to end
the Tabula server. You can create a .zip archive of this by doing:

    # (from the root directory of the repo)
    cd build/mac
    zip -r9 tabula_mac.zip Tabula.app

This will result in a portable "tabula_mac.zip" archive for Mac OS X users.

**Windows**

You can build .exe files for the Windows target on any platform.

Download a [3.1.X (beta) copy of Launch4J][1].

Unzip it into the Tabula repo so that "launch4j" (with subdirectories "bin", etc.)
is in the repository root.

Then (these commands are for OS X/Linux and may need to be adjusted for Windows users):

    # (from the root directory of the repo)
    rake war
    cd launch4j
    ant -f ../build.xml windows

A "tabula.exe" file will be generated in "build/windows". To run, the exe file
needs "tabula.jar" (contained in "build") in the same directory. You can create a
.zip archive by doing:

    # (from the root directory of the repo)
    cd build/windows
    mkdir tabula
    cp tabula.exe ./tabula/
    cp ../tabula.jar ./tabula/
    zip -r9 tabula_win.zip tabula
    rm -fr tabula

This will result in a portable "tabula_win.zip" archive for Windows users.

[1]: http://sourceforge.net/projects/launch4j/files/launch4j-3/3.1.0-beta1/

## Contributing

Interested in helping out? See [`TODO.md`](TODO.md) for ideas.
