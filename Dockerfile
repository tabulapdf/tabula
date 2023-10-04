FROM jruby:9.2-jdk

RUN apt-get update -qq && apt-get install -y build-essential git \
  && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN echo 'gem: --no-rdoc --no-ri' >> /.gemrc

ENV GEM_HOME /usr/local/bundle
ENV PATH $GEM_HOME/bin:$PATH
RUN gem install bundler -v '< 2' \
  && bundle config --global path "$GEM_HOME" \
  && bundle config --global bin "$GEM_HOME/bin"

# don't create ".bundle" in all our apps
ENV BUNDLE_APP_CONFIG $GEM_HOME

WORKDIR /app
EXPOSE 9292
CMD ["jruby", "-G", "-r", "jbundler", "-S", "rackup", "-o", "0.0.0.0", "config.ru"]

# these didn't work as ONBUILD, strangely. Idk why. -JBM
COPY Gemfile Gemfile.lock Jarfile Jarfile.lock ./
RUN bundle install && jruby -S jbundle install
COPY . .
