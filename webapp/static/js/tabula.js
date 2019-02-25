var Tabula;
window.Tabula = Tabula || {};
$.ajaxSetup({ cache: false }); // fixes a dumb issue where Internet Explorer caches Ajax requests. See https://github.com/tabulapdf/tabula/issues/408
var base_uri = $('base').attr("href");

Tabula.UI_VERSION = "1.2.1-2018-05-22"; // when we make releases, we should remember to up this.
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
    "about":                       'about',
    "mytemplates":                 'templates'
  },

  help: function(){
    document.title="Help | Tabula";
    $('nav li a').removeClass('active'); $('nav #help-nav').addClass('active');
    $('#tabula-app').html( _.template( $('#help-template').html().replace(/nestedscript/g, 'script') )({ }) );
  },

  about: function(){
    document.title="About | Tabula";
    $('nav li a').removeClass('active'); $('nav #about-nav').addClass('active');
    $('#tabula-app').html( _.template( $('#about-template').html().replace(/nestedscript/g, 'script') )({ }) );
  },

  templates: function(){
    document.title="Templates | Tabula";
    $('nav li a').removeClass('active'); $('nav #templates-nav').addClass('active');
    $('#tabula-app').html( _.template( $('#templates-template').html().replace(/nestedscript/g, 'script') )({ }) );
    $.ajax({
      url: (base_uri || '/') + "js/template_library.js",
      dataType: "script",
      async: true,
      success: function(data, status, jqxhr){
        Tabula.library = new Tabula.TemplateLibrary({el: $('#tabula-app')[0]}).render();
      },
      error: function(a,b,c){
        console.log(a,b,c);
      }
    });
  },

  upload: function() { // library page.
    document.title="Import | Tabula";
    $('nav li a').removeClass('active'); $('nav #upload-nav').addClass('active');
    $.ajax({
      url: (base_uri || '/') + "js/library.js",
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
      url: (base_uri || '/') + "js/pdf_view.js",
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


Tabula.getSettings = function(){

  Tabula.notification = new Backbone.Model({});
  Tabula.new_version = new Backbone.Model({});
  $.getJSON((base_uri || '/') + "settings", function(data){

    // there are two ways to turn off notifications: 
    // 1. in settings.rb (which is set via command-line options) and in which you can turn off one
    //    but not the other.
    // 2. in localStorage.

    // on first usage, we do nothing. once you've seen the opt-out banner,
    // we continue to show it, but fetch notifications.

    getNotifications = function(){
      if(data["disable_version_check"] === false) {
        Tabula.getLatestReleaseVersion();
      }
      if(data["disable_notifications"] === false) {
        Tabula.getNotifications();
      }
    }

    var notificationsDialogSeen = localStorage.getItem("tabula-notifications-dialog-seen");
    var acceptsNotifications = localStorage.getItem("tabula-notifications");
    if (acceptsNotifications == "true"){
      getNotifications();
    }else if (acceptsNotifications == "false"){
     // do nothing.
    }else{ // null or unset
      if (notificationsDialogSeen){
        getNotifications();
      }else{
        localStorage.setItem("tabula-notifications-dialog-seen", true);
      }
      $('#tabula-app').after( _.template( $('#notifications-approval-template').html().replace(/nestedscript/g, 'script') )({ }) );
      $('#notifications-approval-clicky #notifications-approval-close, #notifications-approval-clicky #notifications-approval-okay').on("click", function(){
        localStorage.setItem("tabula-notifications-dialog-seen", true);
        localStorage.setItem("tabula-notifications", true);
        $('#notifications-approval-clicky').hide();
      })
      $('#notifications-approval-clicky #notifications-approval-opt-out').on("click", function(){
        localStorage.setItem("tabula-notifications-dialog-seen", true);
        localStorage.setItem("tabula-notifications", false);
        $('#notifications-approval-clicky').hide();
      })
    }
    Tabula.api_version = data["api_version"];
    if(Tabula.api_version.slice(0,3) == "rev"){
      // $('#dev-mode-ribbon').show();
      console.log("This is a development version of Tabula!")
    }

  })
}


Tabula.getLatestReleaseVersion = function(){
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

          var rel_ver_re = /\((\d+\.\d+\.\d+\.\d+)\)/;
          console.log("checking " + d.name + " vs " + Tabula.api_version);

          // Either the name of the GitHub release is the the version or the
          // name of the GitHub release contains the full 4-part "build id"
          // in parenthesis.
          //   * "1.1.0"
          //   * "Tabula 1.1.0 Release (1.1.0.16091701)" (YYMMDDxx, with xx as a day-based serial number in case we need it)
          if ((non_prerelease_i === 0) && (
            (d.name == Tabula.api_version) ||
            (!!d.name.match(rel_ver_re) && (d.name.match(rel_ver_re)[1] === Tabula.api_version))
          )) {
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
};


Tabula.getNotifications = function(){
  $.ajax({
    url: 'http://tabula.jeremybmerrill.com/tabula/notifications.jsonp',
    dataType: "jsonp",
    jsonpCallback: 'notifications',
    success: function(data){
      if(data.length < 1) return;

      // find the first listed notification where today is between its `live_date` and `expires_date`
      // and within the `versions` list.
      // we might use this for, say, notifying users if a version urgently needs an update or something
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
  Tabula.getSettings();
  window.tabula_router = new TabulaRouter();
  Backbone.history.start({
    pushState: true,
    root: base_uri
  });
});
