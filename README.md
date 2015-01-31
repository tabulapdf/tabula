# Tabula

Tabula helps you liberate data tables trapped inside PDF files.

* [Download from the official site](http://tabula.nerdpower.org/)
* [Read more about Tabula on OpenNews Source](http://source.mozillaopennews.org/en-US/articles/introducing-tabula/)
* See also: [tabula-extractor](https://github.com/jazzido/tabula-extractor), a command-line interface for Tabula. (Also, this is the extraction library that powers Tabula.)

© 2012-2015 Manuel Aristarán. Available under MIT License. See
[`AUTHORS.md`](AUTHORS.md) and [`LICENSE.md`](LICENSE.md).

## Why Tabula?

If you’ve ever tried to do anything with data provided to you in PDFs, you
know how painful this is — you can’t easily copy-and-paste rows of data out
of PDF files. Tabula allows you to extract that data in CSV format, through
a simple web interface ([Check out this short screencast](https://erika.makes.org/popcorn/16ll))

**Caveat**: Tabula only works on text-based PDFs, not scanned documents. If you can click-and-drag to select text in your table in a PDF viewer (even if the output is disorganized trash), then your PDF is text-based and Tabula should work.

**Security Concerns?**: Tabula is designed with security in mind. Your PDF and the extracted data *never* touch the net -- when you use Tabula, as long as your browser's URL bar says "localhost" or "127.0.0.1", all processing takes place on your local machine. Tabula does download a list of Tabula versions from our server to alert you if Tabula has been updated (and we use hits to that list to count how often Tabula is being used); it also downloads a few badges and assets from the web.

## Using Tabula

First, make sure you have a recent copy of Java installed. You can
[download Java here][jre_download]. Tabula requires
a Java Runtime Environment compatible with Java 6 or Java 7.
If you have a problem, check [Known Issues](#knownissues) first, then [report an issue](http://www.github.com/jazzido/tabula/issues).

* ### Windows
  Download `tabula-win.zip` from [the download site][tabula_dl]. Unzip the whole thing
  and open the `tabula.exe` file inside. A browser should automatically open
  to http://127.0.0.1:8080/ . If not, open your web browser of choice and
  visit that link.

  To close Tabula, just go back to the console window and press "Control-C"
  (as if to copy).

  If you need Tabula to use a port other than 8080, set the `TABULA_PORT` environment variable.

* ###Mac OS X
  Download `tabula-mac.zip` from [the download site][tabula_dl]. Unzip and open
  the Tabula app inside. A browser should automatically open
  to http://127.0.0.1:8080/ . If not, open your web browser of choice and
  visit that link.

  To close Tabula, find the Tabula icon in your dock, right-click (or
  control-click) on it, and press "Quit".

  Note: If you’re running Mac OS X 10.8 or later, you might get an error like "Tabula is damaged and can't be opened." We're working on fixing this, but click [here](#gatekeeper) for a workaround.

* ###Other platforms (e.g. Linux)
  Download `tabula-jar.zip` from [the download site][tabula_dl] and unzip it
  to the directory of your choice. Open a terminal window, and `cd` to inside
  the `tabula` directory you just unzipped. Then run:

  `java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -jar tabula.jar`

If the program fails to run, double-check that you have [Java installed][jre_download]
and then try again.

[jre_download]: https://www.java.com/download/
[tabula_dl]: http://tabula.technology

Tabula binds to port 8080 by default. You can change it with the `jetty.port` property:

`java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -Djetty.port=9999 -jar tabula.jar`


## <a name="knownissues">Known issues</a>

There are some bugs that we're aware of that we haven't managed to fix yet. If there's not a solution here or you need more help, please go ahead and [report an issue](http://www.github.com/jazzido/tabula/issues).

* <a name='gatekeeper'>**"Tabula is damaged and can't be opened"** (Mac)</a>:
  If you’re running Mac OS X 10.8 or later, GateKeeper may prevent you from opening
  the Tabula app. Please [see this GateKeeper page][gatekeeper] for more information.

  1. Right-click on Tabula.app and select Open from the context menu.
  2. The system will tell you that the application is "from an unidentified developer" and ask you whether you want to open it. Click Open to allow the application to run. The system remembers this choice and won't prompt you again.

  (If you continue to have issues, double-check the [OS X GateKeeper documentation][gatekeeper] for more information.)

[gatekeeper]: http://support.apple.com/kb/HT5290

* <a name='lines'>**org.jruby.exceptions.RaiseException: (NoMethodError) undefined method `lines' for []:Array**</a> (All platforms):
  This error means that the area you selected didn't contain any text or a table that Tabula can understand. You probably have an image-based PDF (or a text-based PDF containing an image of a table). If you upgrade to the [latest version of Tabula](https://github.com/tabulapdf/tabula/releases), you'll get a friendlier error message, but please note that Tabula won't be able to extract any data from image-based PDFs at any point in the near future. (Though you can try OCRing the PDF and then trying Tabula again.)

* <a name='encoding'>**org.jruby.exceptions.RaiseException: (Encoding::CompatibilityError) incompatible character encodings:**</a> (Windows):
  Your Windows computer expects a type of encoding other than Unicode or Windows's English encoding. You can fix this by entering a few simple commands in the Command Prompt. (The commands won't affect anything besides Tabula.)

  1. Open a Command Prompt
  2. type `cd` and then the path to the directory that contains `tabula.exe`, e.g. `cd C:\Users\Username\Downloads`
  3. Change that terminal's codepage to Unicode by typing: `chcp 65001`
  4. Run Tabula by typing `tabula.exe`

* <a name='portproblems'>**A browser tab opens, but something other than Tabula loads there. Or Tabula doesn't start.**</a>
  It's possible another program is using port 8080, whichh Tabula binds to by default. You can try closing the other program, or change the port Tabula uses by running Tabula from the terminal with the `jetty.port` property:

  `java -Dfile.encoding=utf-8 -Xms256M -Xmx1024M -Djetty.port=9999 -jar tabula.jar`


## Running Tabula from source (for developers)

1. Download JRuby. You can install it from its website, or using tools like
   `rvm` or `rbenv`

2. Download Tabula and install the Ruby dependencies. (Note: if using `rvm` or
   `rbenv`, ensure that JRuby is being used.

    ~~~
    git clone git://github.com/jazzido/tabula.git
    cd tabula

    gem install bundler
    gem install tabula-extractor
    bundle install
    ~~~

**Then, start the development server:**

    bundle exec rackup

(If you get encoding errors, set the `JAVA_OPTS` environment variable to `-Dfile.encoding=utf-8`)

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

### Building a packaged application version

After performing the above steps ("Running Tabula from source"), you can compile
Tabula into a standalone application:

**Mac OS X**

If you wish to share Tabula with other machines, you will need a codesigning certificate.
Our distribution of Tabula uses a self-signed certificate, as noted above. See
[this section of build.xml][buildxml_cert] for details. If you will only be running Tabula
on the machine you are building it on, you may remove this entire <exec> block (lines 44-53).

To compile the app:

    rake macosx

This will result in a portable "tabula_mac.zip" archive (inside the `build` directory)
for Mac OS X users.

[buildxml_cert]: https://github.com/jazzido/tabula/blob/master/build.xml#L44-53

**Windows**

You can build .exe files for the Windows target on any platform.

Download a [3.1.X (beta) copy of Launch4J][launch4j].

Unzip it into the Tabula repo so that "launch4j" (with subdirectories "bin", etc.)
is in the repository root.


Then:

    rake windows

This will result in a portable "tabula_win.zip" archive (inside the `build` directory)
for Mac OS X users.

---

If you have issues, you can try building manually. (These commands are for
OS X/Linux and may need to be adjusted for Windows users.)

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

[launch4j]: http://sourceforge.net/projects/launch4j/files/launch4j-3/3.1.0-beta1/

## Contributing

Interested in helping out? We'd love to have your help!

You can help by:

- [Reporting a bug](https://github.com/jazzido/tabula).
- Adding or editing documentation.
- Contributing code via a Pull Request from ideas or bugs listed in the [Issues](https://github.com/jazzido/tabula/issues) section.
- Spreading the word about Tabula to people who might be able to benefit from using it.
