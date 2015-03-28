var Tabula;
window.Tabula = Tabula || {};

Tabula.UI_VERSION = "0.9.9-2015-03-28" // when we make releases, we should remember to up this.
// I've decided to decouple the UI version from the "API" version in preparation for actually
// turning htem into different projects.

var TabulaRouter = Backbone.Router.extend({
  routes: {
    "":                            "upload",
    "/":                           "upload",
    "pdf/:file_id":                "view",
    "pdf/:file_id/extract":        "view", // you have to make selections first, so going directly to /extract doesn't work.
    "queue/:file_id":              'status',
    "error":                       'uploadError',
    "help":                        'help',
    "about":                       'about'
  },

  help: function(){
    document.title="Help | Tabula";
    $('nav li a').removeClass('active'); $('nav #help-nav').addClass('active');
    $('#tabula-app').html( _.template( $('#help-template').html().replace(/nestedscript/g, 'script') )({
    }) );
  },

  about: function(){
    document.title="About | Tabula";
    $('nav li a').removeClass('active'); $('nav #about-nav').addClass('active');
    $('#tabula-app').html( _.template( $('#about-template').html().replace(/nestedscript/g, 'script') )({
    }) );
  },


  upload: function() {
    document.title="Import | Tabula";
    $('nav li a').removeClass('active'); $('nav #upload-nav').addClass('active');
    $.ajax({
      url: "/js/library.js",
      dataType: "script",
      async: true,
      success: function(data, status, jqxhr){
        Tabula.library = new Tabula.Library({el: $('#tabula-app')[0]}).render();
      },
      error: function(a,b,c){
        console.log(a,b,c);
      }
    });
  },

  view: function(file_id) {
    $('nav li a').removeClass('active');
    $('body').prepend( _.template( $('#navbar-template').html().replace(/nestedscript/g, 'script') )({}) ); // navbar.
    $('body').addClass('page-selections')
    $('#tabula-app').html( _.template( $('#pdf-view-template').html().replace(/nestedscript/g, 'script') )({}) );

    $.ajax({
      url: "/js/pdf_view.js",
      dataType: "script",
      async: true,
      success: function(data, status, jqxhr){
        Tabula.pdf_view = new Tabula.PDFView({pdf_id: file_id});
        Tabula.pdf_view.getData();
      },
      error: function(a,b,c){
        console.log(a,b,c);
      }
    });
  },
});


Tabula.getVersion = function(){
  Tabula.notification = new Backbone.Model({});
  Tabula.new_version = new Backbone.Model({});
  $.getJSON("/version", function(data){
    Tabula.api_version = data["api"];
    Tabula.getNotifications();

    // if(Tabula.api_version.slice(0,3) == "rev"){
    //   $('#dev-mode-ribbon').show();
    // }

  })
}
Tabula.getNotifications = function(){
  if(localStorage.getItem("tabula-notifications") === false) return;
  $.get('https://api.github.com/repos/tabulapdf/tabula/releases',
       function(data) {
         if (data.length < 1) return;
         if (Tabula.api_version.indexOf('rev') == 0) return;
         // check if new version
         var i = data.map(function(d) { return d.name; }).indexOf(Tabula.api_version);
         // if index >= 1, current release is not the newest
         if (i == 0) return;
         var new_release = data[0];
         if(new_release){
            Tabula.new_version.set(new_release);
         }
     });
  $.ajax({
    url: 'http://tabula.jeremybmerrill.com/tabula/notifications.jsonp', 
    dataType: "jsonp",
    jsonpCallback: 'notifications',
    success: function(data){
      if(data.length < 1) return;

      // find the first listed notification where today is between its `live_date` and `expires_date`
      // and within the `versions` list.
      // we might use this for, say, notifying users if a version urgently needs an update or something
      // 
      var notifications = $.grep(data, function(d){
        var today = new Date();
        if ( (d.expires_date && (new Date(d.expires_date) < today)) || (d.live_date && (new Date(d.live_date) > today)) ){ 
          return false;
        }
        if( d.versions && d.versions.length > 0){
          return (d.versions.indexOf(Tabula.api_version) > -1);
        }else{
          return true;
        }
      });

      if(notifications.length >= 1){
        console.log(notifications.length + " matching notifications:", notifications);
        Tabula.notification.set(notifications[0]);
      }else{
        console.log("no notifications")
      }
    }});
}


$(function(){
  Tabula.getVersion();
  window.tabula_router = new TabulaRouter();
  Backbone.history.start({pushState: true});
});