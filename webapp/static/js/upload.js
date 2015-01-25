Tabula = Tabula || {};

Tabula.Upload = Backbone.View.extend({
    events: {
        "submit form#upload": 'uploadPDF'
    },
    el: $('#tabula-app')[0],
    template: _.template( $('#upload-template').html().replace(/nestedscript/g, 'script')),
    initialize: function(){
      _.bindAll(this, 'uploadPDF', 'render');
    },
    uploadPDF: function(e){
        var formdata = new FormData($('form#upload')[0]);
        $.ajax({
            url: $('form#upload').attr('action'),
            type: 'POST',
            success: _.bind(function (res) {
                var data = JSON.parse(res);
                this.checker = new Tabula.UploadStatusChecker({
                    file_id: data.file_id,
                    upload_id: data.upload_id,
                });
                this.checker.checkStatus();
                this.$el.find('#progress-container').html(this.checker.render().el);
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

    render: function(){
        $('#tabula-app').html( this.template({
          TABULA_VERSION: TABULA_VERSION,
          pct_complete: 0,
          importing: false
        }) );
    }
})

Tabula.UploadStatusChecker = Backbone.View.extend({
    file_id: null,
    upload_id: null,
    el: $('#progress-container')[0],
    progress: 0,
    initialize: function(stuff){
        _.bindAll(this, 'statusComplete', 'checkStatus', 'render');
        this.file_id = stuff.file_id;
        this.upload_id = stuff.upload_id;
    },
    statusComplete: function(file_id) {
        if (!!this.spinobj) {
            this.spinobj.stop()
        };
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
                if (data.status == "error") {
                    window.location.reload(true);
                } else if (data.pct_complete >= 100) {
                    this.statusComplete(data.file_id);
                } else {
                    setTimeout(this.checkStatus, 1000);
                }
            }, this),
            error: function(xhr, status, err) {
                console.log(err);
            }
        });
    },
    render: function(){
        if(this.progress <= 0){
            this.$el.find('h4').text("Upload Progress");
        }else if(this.progress >= 100){
            this.$el.find('h4').text("Upload Finished.");
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
        var msg = ""
        if (this.message) {
            msg += ": ";
            msg += this.message;
        } else if (this.pct_complete === 0) {
            msg += ": waiting to be processed..."
        }
        this.$el.find("#message").text(msg);
        this.$el.find(".progress-bar").css("width", this.pct_complete + "%").attr('aria-valuenow', this.pct_complete);
        this.$el.find("#percent").html(this.pct_complete + "%");
        return this;
    }
});