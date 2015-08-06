var Tabula;
window.Tabula = Tabula || {};

Tabula.UI_VERSION = "1.0.0-2015-08-05" // when we make releases, we should remember to up this.
// Add '-pre' to the end of this for a prerelease version; this will let
// our "new version" check give you that channel.

// Note that this is separate from the "API version" (internal app version)
// which is what we check against GitHub. In the future, this will allow us
// to modularize the UI from the backend some more.

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
    // $('body').prepend( _.template( $('#navbar-template').html().replace(/nestedscript/g, 'script') )({}) ); // navbar.
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

        var prerelease = (Tabula.UI_VERSION.indexOf("-pre") !== -1);
        if (prerelease) {console.log("Is prerelease");}

        // check if new version
        var non_prerelease_i = 0;
        for (var i=0; i<data.length; i++) {
          var d = data[i];
          if (!!d.draft) { continue; } // ignore drafts
          if (!prerelease && !!d.prerelease) { continue; } // ignore prereleases unless we're on a prerelease
          console.log("checking " + d.name + " vs " + Tabula.api_version);
          if ((non_prerelease_i === 0) && (d.name == Tabula.api_version)){
            // if index == 0, current release is the newest, so break out of this fn
            console.log(" -> IS LATEST");
            return;
          } else {
            // keep iterating, maybe we'll find this version later in list
            non_prerelease_i += 1;
          }
        }

        // We're not the latest release, grab data from GitHub & tell user
        var new_release = data[0];
        if(new_release){
          Tabula.new_version.set(new_release);
        }
      }
  );
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
