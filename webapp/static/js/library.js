Tabula = window.Tabula || {};
var base_uri = $('base').attr("href");

Tabula.FileUpload = Backbone.Model.extend({
  // isOneOfMultiple:
  // uploadTime
  // uploadOrder
  initialize: function(){
    this.set({
      message: 'waiting to be processed...',
      pct_complete: 0,
      warnings: []
    });
  },

  checkStatus: function() {
    if(typeof this.get('file_id') == 'undefined' && typeof !this.get('upload_id') == 'undefined'){
      this.pct_complete = 1;
      this.message = "waiting to be processed..."
    }else{
      $.ajax({
          dataType: 'json',
          url: (base_uri || '/') + 'queue/'+this.get('upload_id')+'/json?file_id=' + this.get('file_id'),
          success: _.bind(function(data, status, xhr) {
            if( (data.message.length && data.message != "complete") || data.pct_complete == 100 ){
              this.set('message',  data.message);
            } else if(data.pct_complete > 1) {
              this.set('message', 'processing');
            }

            this.set('pct_complete', data.pct_complete);
            this.set('warnings', data.warnings);

            if (data.status == "error" && data.error_type == "unknown") {
                // window.location.reload(true);
            } else if (data.status == "error" && data.error_type == "no-text") {
                console.log('no text');
                window.clearTimeout(this.timer);

                // resets upload/input form
                $('form#upload').find('button').removeAttr('disabled');
                $('form#upload')[0].reset();

                //TODO: something prettier.
                alert("Sorry, your PDF file is image-based; it does not have any embedded text. It might have been scanned from paper... Tabula isn't able to extract any data from image-based PDFs. Click the Help button for more information.");
            } else if(data.pct_complete < 100) {
                this.timer = setTimeout(_.bind(this.checkStatus, this), 1000);
            } else {
              this.collection.remove(this);
              Tabula.library.files_collection.fetch();
            }
          }, this),
          error: function(xhr, status, err) {
              console.log('err', err); //TODO:
          }
      });
    }
  },

});

// does flash work?
// clear the input

Tabula.FileUploadsCollection = Backbone.Collection.extend({
  model: Tabula.FileUpload,
  comparator: function(i){ return -i.get('uploadTime') - i.get('uploadOrder')},
})

Tabula.UploadedFile = Backbone.Model.extend({
  size: null,
  page_count: null,
  initialize: function(){
    this.set('size', this.get('size') || null);
    this.set('page_count', this.get('page_count') || null)
  }
});

Tabula.UploadedFilesCollection = Backbone.Collection.extend({
    model: Tabula.UploadedFile,
    url: function(){ return 'documents'+ '?' + Number(new Date()).toString() },
    comparator: function(i){ return -i.get('time')},
    parse: function(pdfs){
      _(pdfs).each(function(i){
        if(!i.original_filename){
          i.original_filename = i.file;
        }
      });
      // if it's still being processed, don't enter it into the library.
      pdfs = _(pdfs).reject(_.bind(function(uploaded_file){
        var in_progress = Tabula.library && Tabula.library.uploads_collection.findWhere({file_id: uploaded_file.id});
        return in_progress
      }, this));
      return pdfs;
    }
});


Tabula.UploadedFileView = Backbone.View.extend({
  tagName: 'tr',
  className: 'uploaded-file',
  events: {
    'click .delete-pdf': 'deletePDF'
  },
  template: _.template( $('#uploaded-file-template').html().replace(/nestedscript/g, 'script')),
  initialize: function(){
    _.bindAll(this, 'render', 'deletePDF');
  },
  render: function(){
    this.$el.append(this.template(this.model.attributes));
    this.$el.addClass('file-id-' + this.model.get('id')); // more efficient lookups than data-attr
    this.$el.data('id', this.model.get('id')); //more cleanly accesse than a class
    return this;
  },
  deletePDF: function(e) {
    var btn = $(e.currentTarget);
    var tr = btn.parents('tr');

    if (!confirm('Delete file "'+btn.data('filename')+'"?')) return;
    var pdf_id = btn.data('pdfid');

    $.post((base_uri || '/') + 'pdf/' + pdf_id,
          { _method: 'delete' },
          function() {
            tr.fadeOut(200, function() { $(this).remove(); });
          });
    },
})

Tabula.ProgressBars = Backbone.View.extend({
  template: _.template( $('#progress-bars-template').html().replace(/nestedscript/g, 'script')),
  initialize: function(stuff){
    _.extend(this, stuff); //  in-place.
    this.listenTo(this.uploads_collection, 'remove', this.render);
  },
  render: function(){
    if(this.uploads_collection.size() > 0){
      this.in_progress = false;
      if(!$.trim(this.$el.html())) this.$el.html(this.template({}))
    }else if(!this.in_progress){
      //TODO: this belongs in Library, technically, but we don't go around rerendering that, so here it is for now.
      $('form#upload').find('button').removeAttr('disabled');
      $('form#upload')[0].reset();
    }
    return this;
  }
});

Tabula.Library = Backbone.View.extend({
    events: {
        "submit form#upload": 'uploadPDF',
    },
    template: _.template( $('#uploader-template').html().replace(/nestedscript/g, 'script')),
    initialize: function(){
      _.bindAll(this, 'uploadPDF', 'render', 'renderFileLibrary');
      this.files_collection = new Tabula.UploadedFilesCollection([]);
      this.files_collection.fetch({silent: true, complete: _.bind(function(){ this.render(); }, this) });
      
      this.listenTo(this.files_collection, 'add', this.renderFileLibrary);
      this.uploads_collection = new Tabula.FileUploadsCollection([]);

      this.listenTo(Tabula.notification, 'change', this.renderNotification);
      this.listenTo(Tabula.new_version, 'change', this.renderVersion);
    },
    renderNotification: function(){
      if(_.isEmpty(Tabula.notification.attributes)) return;
      $('#notification-alert').html(_.template($('#notification-template').html().replace(/nestedscript/g, 'script'))({
        notification: Tabula.notification.attributes,
        api_version: Tabula.api_version
      })).show();
    },
    renderVersion: function(){
      if(_.isEmpty(Tabula.new_version.attributes)) return;
      console.log('render new version');
      $('#new-version-alert').html(_.template($('#new-version-template').html().replace(/nestedscript/g, 'script'))({
        new_release: Tabula.new_version.attributes,
        api_version: Tabula.api_version
      })).show();
    },
    uploadPDF: function(e){
      $(e.currentTarget).find('button').attr('disabled', 'disabled');
      this.progress_bars = new Tabula.ProgressBars({el: '#progress-container', uploads_collection: this.uploads_collection });
      this.progress_bars.in_progress = true;
      this.progress_bars.render();

      var files_list = $(e.currentTarget).find('#file')[0].files
      _(files_list).each(_.bind(function(file, index){
        //TODO: the model should get the data, then fire an event that the view listens for, to rerender
        var file_upload = new Tabula.FileUpload({
          collection: this.uploads_collection,
          filename: file.name,
          uploadTime: new Date(),
          uploadOrder: index,
          isOneOfMultiple: files_list.length != 1
        });
        this.uploads_collection.add(file_upload);
        var checker = new Tabula.ProgressBar({model: file_upload });
        this.progress_bars.render().$el.find('#progress-bars-container').append(checker.render().el)
      },this));

      var formdata = new FormData($('form#upload')[0]);
      $.ajax({
          url: $('form#upload').attr('action'),
          type: 'POST',
          success: _.bind(function (res) {
              var statuses = JSON.parse(res);
              _(statuses).each(_.bind(function(status){
                var file_upload = this.uploads_collection.findWhere({filename: status.filename });
                if(!file_upload){
                  console.log("couldn't find upload objcect for " + status.filename );
                  return
                }
                if(status.success){
                  file_upload.set('file_id', status.file_id);
                  file_upload.set('id', status.file_id);
                  file_upload.set('upload_id', status.upload_id);
                  file_upload.set('error', !status.success);
                  file_upload.checkStatus(); //
                }else{
                  console.log('TODO: failure')
                  file_upload.set('file_id', status.file_id);
                  file_upload.set('id', status.file_id);
                  file_upload.set('upload_id', status.upload_id);
                  file_upload.set('error', !status.success);
                }
              }, this))
          }, this),
          error: _.bind(function(a,b,c){
            $(e.currentTarget).find('button').removeAttr('disabled');
            this.uploads_collection.each(function(file_upload){
              file_upload.message = "Sorry, your file upload could not be processed. ("+a.statusText+")";
              file_upload.pct_complete = 100;
              file_upload.error = true;
            })
          },this),
          data: formdata,

          cache: false,
          contentType: false,
          processData: false
      });
      e.preventDefault();
      return false; // don't actually submit the form
    },

    renderFileLibrary: function(added_model){
      if(this.files_collection.length > 0){
        $('#library-container').show();
        ($('#uploaded-files-container').is(':empty') ? this.files_collection.reverse() : this.files_collection).
        each(_.bind(function(uploaded_file){
          if(this.$el.find('.file-id-' + uploaded_file.get('id') ).length){
            return;
          }
          var file_element = new Tabula.UploadedFileView({model: uploaded_file}).render().$el;
          if(added_model && added_model.get('id') == uploaded_file.get('id')){
            file_element.addClass('flash');
          }
          $('#uploaded-files-container').prepend(file_element);
        }, this));

        //remove anything that was deleted
        this.$el.find('.uploaded-file').each(_.bind(function(i, el){
          if(typeof this.files_collection.findWhere({id: $(el).data('id')}) === "undefined"){
            $(el).remove();
          }
        }, this));

        $("#fileTable").tablesorter( {
          headers: { 3: { sorter: "usLongDate" },  4: { sorter: false}, 5: {sorter: false} },
          sortList: [[3,1]]  // initial sort
          } );
      }else{
        $('#library-container').hide();
        $('#library-container').
          after(_.template( $('#help-template').html().replace(/nestedscript/g, 'script') )({})).
          after('<h1>First time using Tabula? Welcome!</h1>');
        $('.jumbotron.help').css('padding-top', '10px');
      }
    },

    render: function(){
      $('#tabula-app').html( this.template({
        TABULA_VERSION: Tabula.version,
        pct_complete: 0,
        importing: false
      }) );
      this.renderFileLibrary();
      this.renderNotification();
      this.renderVersion();
      return this;
    }
});

Tabula.ProgressBar = Backbone.View.extend({
    file_id: null,
    upload_id: null,
    pct_complete: 0,
    message: null,
    tagName: 'div',
    template: _.template( $('#file-upload-template').html().replace(/nestedscript/g, 'script')),
    initialize: function(){
      _.bindAll(this, 'render');
      this.listenTo(this.model, 'change:pct_complete', this.render);
    },

    render: function(){
      if(this.model.get('pct_complete') <= 0){
        this.$el.find('h4').text("Upload Progress");
      }else if(this.model.get('pct_complete') >= 100 && !this.model.get('error')){
        this.$el.find('h4').text("Upload Finished.");
        this.$el.find('#message').text('');
        if (!!this.spinobj) {
            this.spinobj.stop()
        };
        if(this.model.get('isOneOfMultiple')){
          this.remove();
        }else{
          window.location = (base_uri || '/') + 'pdf/' + this.model.get('file_id');
        };
      }else if(this.model.get('pct_complete') >= 100 && this.model.get('error')){
        this.$el.find('h4').text("Upload Failed.");
      }else{
        this.$el.find('h4').text("Importing…");
        var spinpots = {
            lines: 11,
            length: 5,
            width: 2,
            radius: 4,
            hwaccel: true,
            top: '0',
            left: 0
        };
        this.spinobj = new Spinner(spinpots).spin(this.$el.find('#spinner')[0]);
      }
      this.$el.html(this.template(this.model.attributes));
      return this;
    }
});
