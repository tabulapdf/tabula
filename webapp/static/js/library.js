Tabula = window.Tabula || {};

Tabula.UploadedFile = Backbone.Model.extend({
  size: null,
  page_count: null,
  initialize: function(){
    this.set('size', this.get('size') || null);
    this.set('page_count', this.get('page_count') || null)
  }

});

Tabula.FilesCollection = Backbone.Collection.extend({
    model: Tabula.UploadedFile,
    url: '/pdfs/workspace.json',
    comparator: function(i){ return -i.get('time')},
    parse: function(items){
      _(items).each(function(i){
        if(!i.original_filename){
          i.original_filename = i.file;
        }
      });
      return items;
    }
});

Tabula.File = Backbone.View.extend({
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
    return this;
  },
  deletePDF: function(e) {
    var btn = $(e.currentTarget);
    var tr = btn.parents('tr');

    if (!confirm('Delete file "'+btn.data('filename')+'"?')) return;
    var pdf_id = btn.data('pdfid');

    $.post('/pdf/' + pdf_id,
          { _method: 'delete' },
          function() {
            tr.fadeOut(200, function() { $(this).remove(); });
          });
    },
})


Tabula.Library = Backbone.View.extend({
    events: {
        "submit form#upload": 'uploadPDF',
    },
    template: _.template( $('#upload-template').html().replace(/nestedscript/g, 'script')),
    initialize: function(){
      _.bindAll(this, 'uploadPDF', 'render', 'renderFileLibrary');
      this.files_collection = new Tabula.FilesCollection([]);
      this.files_collection.fetch({silent: true, success: _.bind(function(){ this.render(); this.renderFileLibrary(); }, this) });
      this.listenTo(this.files_collection, 'add', this.renderFileLibrary);
    },
    uploadPDF: function(e){
      $(e.currentTarget).find('button').attr('disabled', 'disabled');

      var formdata = new FormData($('form#upload')[0]);
      $.ajax({
          url: $('form#upload').attr('action'),
          type: 'POST',
          success: _.bind(function (res) {
              var data = JSON.parse(res);
              this.checker = new Tabula.UploadStatusChecker({
                  el: this.$el.find('#progress-container'),
                  file_id: data.file_id,
                  upload_id: data.upload_id,
              });
              this.checker.checkStatus();
              this.checker.render();
          }, this),
          error: function(a,b,c){ console.log('error', a,b,c)},
          data: formdata,

          cache: false,
          contentType: false,
          processData: false
      });
      e.preventDefault();
      return false; // don't actually submit the form
    },

    renderFileLibrary: function(added_model){
      $('#uploaded-files-container').empty();
      if(this.files_collection.length > 0){
        this.files_collection.each(function(uploaded_file){
          var file_element = new Tabula.File({model: uploaded_file}).render().el;
          if(added_model == uploaded_file){
            $(file_element).addClass('flash');
          }
          $('#uploaded-files-container').append(file_element);
        })
        $("#fileTable").tablesorter( { headers: { 3: { sorter: "usLongDate" },  4: { sorter: false}, 5: {sorter: false} } } ); 
      }else{
        $('#uploaded-files-container').html( $('<p>No uploaded files yet.</p>') );
      }
    },

    render: function(){
      $('#tabula-app').html( this.template({
        TABULA_VERSION: TABULA_VERSION,
        pct_complete: 0,
        importing: false
      }) );
      return this;
    }
})

Tabula.UploadStatusChecker = Backbone.View.extend({
    file_id: null,
    upload_id: null,
    pct_complete: 0,
    message: null,
    initialize: function(stuff){
        _.bindAll(this, 'statusComplete', 'checkStatus', 'render');
        this.file_id = stuff.file_id;
        this.upload_id = stuff.upload_id;
    },
    statusComplete: function(file_id) {
        if (!!this.spinobj) {
            this.spinobj.stop()
        };
        Tabula.library.files_collection.fetch();
        $('form#upload').find('button').removeAttr('disabled');
        window.location = '/pdf/' + file_id;
    },

    checkStatus: function() {
        $.ajax({
            dataType: 'json',
            url: '/queue/'+this.upload_id+'/json?file_id=' + this.file_id,
            success: _.bind(function(data, status, xhr) {
                console.log(data);
                this.message = data.message;
                this.pct_complete = data.pct_complete;
                this.render();
                if (data.status == "error" && data.error_type == "unknown") {
                    // window.location.reload(true);
                } else if (data.status == "error" && data.error_type == "no-text") {
                    console.log('no text');
                    window.clearTimeout(this.timer);
                    alert("Sorry, your PDF file is image-based; it does not have any embedded text. It might have been scanned... Tabula can't be able to extract any data from image-based PDFs. (Though you can try OCRing the PDF with a tool like Tesseract and then trying Tabula again.)") //TODO: something prettier.
                } else if (data.pct_complete >= 100) {
                    this.statusComplete(data.file_id);
                } else {
                    this.timer = setTimeout(this.checkStatus, 1000);
                }
            }, this),
            error: function(xhr, status, err) {
                console.log(err);
            }
        });
    },
    render: function(){
        if(this.pct_complete <= 0){
            this.$el.find('h4').text("Upload Progress");
        }else if(this.pct_complete >= 100){
            this.$el.find('h4').text("Upload Finished.");
            this.$el.find('#message').text('');
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
        var msg;
        if (this.message) {
            msg = this.message;
        } else if (this.pct_complete === 0) {
            msg = "waiting to be processed..."
        }
        this.$el.find("#message").text(msg);
        this.$el.find(".progress-bar").css("width", this.pct_complete + "%").attr('aria-valuenow', this.pct_complete);
        this.$el.find("#percent").html(this.pct_complete + "%");
        return this;
    }
});