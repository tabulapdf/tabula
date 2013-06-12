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

{TODO: write instructions for downloading and running the packaged versions}

## Running Tabula from source (for developers)

1. Download JRuby. You can install it from its website, or using tools like `rvm` or `rbenv`

2. Download Tabula and install the Ruby dependencies. (Note: if using `rvm` or `rbenv`, ensure that it is configured for JRuby)

    ~~~
    git clone git://github.com/jazzido/tabula.git
    cd tabula

    gem install bundler
    bundle install
    ~~~

## Starting the Server (Dev)

    bundle exec rackup

The site instance should now be viewable at http://127.0.0.1:9292/

You can a couple some options when executing the server in this manner:

    TABULA_DATA_DIR="/tmp/tabula" \
    TABULA_ASYNC=1 \
    TABULA_DEBUG=1 \
    bundle exec rackup

## Contributing

Interested in helping out? See [`TODO.md`](TODO.md) for ideas.
