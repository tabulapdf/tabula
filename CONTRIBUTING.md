CONTRIBUTING
============

Tabula is an open-source project, which means it depends on volunteers to build and improve it.

Interested in helping out? We'd love to have your help!

You can help by:

- [Reporting a bug](https://github.com/jazzido/tabula).
- Adding or editing documentation.
- Contributing code via a Pull Request from ideas or bugs listed in the [Enhancements](https://github.com/tabulapdf/tabula/labels/enhancement) section of the issues. [see CONTRIBUTING.md]
- Spreading the word about Tabula to people who might be able to benefit from using it.

If you'd like to contribute code, here's some stuff you should know. You're also welcome to send us a note, if you'd like. All of our email addresses are listed on our Github pages.

Tabula comes in a bunch of parts, all located in the [TabulaPDF Github organization](github.com/tabulapdf). The [tabula](https://github.com/tabulapdf/tabula) repo is the UI. We aim for it to soon be all front-end, but right now has a small web server, written in Ruby, to interface between the front-end and the [tabula-extractor](https://github.com/tabulapdf/tabula-extractor/) Ruby gem that actually extracts info from PDFs, using table locations provided by the UI (or on the command line). tabula-extractor will be deprecated soon too -- it'll be replaced by [tabula-java](https://github.com/tabulapdf/tabula-java/) which is a pure Java port, for speed/wider usability. [tabula-api](https://github.com/tabulapdf/tabula-api/) will eventually serve as the glue layer between tabula-java and the tabula UI.