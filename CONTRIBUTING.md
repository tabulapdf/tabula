CONTRIBUTING
============

Tabula is an open-source project, which means it depends on volunteers to build and improve it.

Interested in helping out? We'd love to have your help!

You can help by:

- [Reporting a bug](https://github.com/jazzido/tabula).
- Adding or editing documentation.
- Contributing code via a Pull Request from ideas listed in the [Enhancements](https://github.com/tabulapdf/tabula/labels/enhancement) section of the issues.
- Spreading the word about Tabula to people who might be able to benefit from using it.

Did you have a problem? Guidelines for reporting a bug
------------------------------------------------------

Did Tabula not work for you? We'd like to know about it. We'd also like to know if Tabula worked, but wasn't as easy or useful as it could be. Here's what you can tell us to so we can help you better.

1. What error message did you get? (We need the whole thing! If it looks like gobbledygook to you, it's probably very useful to us. That's why it's there!)
2. What steps did you take? The more precise, the better.
3. What PDF were you trying to extract data from? Some PDFs are wacky, so seeing the exact PDF will be useful. We understand that sometimes PDFs are confidential. If you can share it, just not publicly, send us an email. If you cant', we understand, but might not be able to help you.
4. What version of Tabula are you using? If you're using an older version, we may have solved the problem already.
5. What platform are you on? Windows 7 or 8? Mac? Linux? If your computer uses a language other than English or Spanish, we'd like to know that too.

Guidelines for contributing code
--------------------------------

If you'd like to contribute code, here's some stuff you should know: You're also welcome to send us a note, if you'd like. All of our email addresses are listed on our Github pages.

Tabula comes in a bunch of parts, all located in the [TabulaPDF Github organization](github.com/tabulapdf). 
 -The [tabula](https://github.com/tabulapdf/tabula) repo is the UI. We aim for it to soon be all front-end, but right now has a small web server, written in Ruby, to interface between the front-end and extractor library, called "tabula-extractor"
 - the [tabula-extractor](https://github.com/tabulapdf/tabula-extractor/) Ruby gem actually extracts info from PDFs, using table locations provided by the UI (or on the command line). tabula-extractor will be deprecated soon too -- it'll be replaced by 'tabula-java'
 - [tabula-java](https://github.com/tabulapdf/tabula-java/) is a pure Java port, for speed/wider usability. 
 - [tabula-api](https://github.com/tabulapdf/tabula-api/) will eventually serve as the glue layer between tabula-java and the tabula UI (replacing that small web server mentioned above).

The [Enhancements](https://github.com/tabulapdf/tabula/labels/enhancement) section of the issues lists some important improvements to Tabula that you could try out. They're well-suited to contributors, since they don't depend on a deep knowledge of all of Tabula's parts and they don't depend on close coordination.