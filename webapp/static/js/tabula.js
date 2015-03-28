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
  $.getJSON("/version", function(data){
    Tabula.api_version = data["api"];

    // if(Tabula.api_version.slice(0,3) == "rev"){
    //   $('#dev-mode-ribbon').show();
    // }

  })
}

$(function(){
  Tabula.getVersion();
  window.tabula_router = new TabulaRouter();
  Backbone.history.start({pushState: true});
});