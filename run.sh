#!/usr/bin/env bash
gem install bundler
bundle install
jruby -S jbundle install
jruby -G -r jbundler -S rackup
