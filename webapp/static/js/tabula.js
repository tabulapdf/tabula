var Tabula;
Tabula = Tabula || {};

TABULA_VERSION = "TODO";

var TabulaRouter = Backbone.Router.extend({
  routes: {
    "":                            "upload",
    "/":                           "upload",
    "pdf/:file_id":                "view",
    // "pdf/:file_id/export":         "export",
    "queue/:file_id":              'status', //TK, renders navbar
    "error":                       'uploadError' //TK, renders navbar
  },

  upload: function() {
    $('#fork-me-ribbon').show();
    $.getJSON('/pdfs/workspace.json', function(workspace){
      if( workspace.length > 0){
        $('#uploaded-files-container').html( _.template( $('#uploaded-files-template').html().replace(/nestedscript/g, 'script') )({workspace: workspace }));
      }else{
        $('#uploaded-files-container').html( $('<p>No uploaded files yet.</p>') );
      }
    })

    $('#tabula-app').html( _.template( $('#upload-template').html().replace(/nestedscript/g, 'script') )({
      TABULA_VERSION: TABULA_VERSION,
      pct_complete: 0,
      importing: false
    }) );
    $("#fileTable").tablesorter( { headers: { 4: { sorter: false}, 5: {sorter: false} } } ); 
  },

  // TODO: requires interacting with resque.
  // uploadError: function(){
  //   $('body').prepend( _.template( $('#navbar-template').html() )({}) ); // navbar.
  //   //TODO: there's another errorMsg: "Sorry, your file upload could not be processed. Please double-check that the file you uploaded is a valid PDF file and try again."
  //   var errorMsg = "Sorry, the file you uploaded was not detected as a PDF. You must upload a PDF file. <a href='/'>Please try again</a>.";
  //   $('#tabula-app').html( _.template( $('#upload-error-template').html() )({message: errorMsg}) );
  // },

  // status: function(file_id){
  //   $('body').prepend( _.template( $('#navbar-template').html() )({}) ); // navbar.
  //   $('#tabula-app').html( _.template( $('#upload-status-template').html() )({}) );
  //   $.ajax({
  //     url: "/js/upload_status.js",
  //     dataType: "script",
  //     async: true,
  //     success: function(data, status, jqxhr){
  //       //TODO: rewrite upload_status.js as a Backbone view.
  //     },
  //     error: function(a,b,c){
  //       console.log(a,b,c);
  //     }
  //   });
  // },

  view: function(file_id) {
    $('body').prepend( _.template( $('#navbar-template').html().replace(/nestedscript/g, 'script') )({}) ); // navbar.
    $('body').addClass('page-selections')
    $('#tabula-app').html( _.template( $('#pdf-view-template').html().replace(/nestedscript/g, 'script') )({}) );

    $.ajax({
      url: "/js/pdf_view.js",
      dataType: "script",
      async: true,
      success: function(data, status, jqxhr){
        Tabula.pdf_view = new Tabula.PDFView({pdf_id: file_id});
      },
      error: function(a,b,c){
        console.log(a,b,c);
      }
    });
  },

  // extract: function(file_id, ) {
  //   $('body').prepend( _.template( $('#navbar-template').html().replace(/nestedscript/g, 'script') )({}) ); // navbar.
  //   $('body').addClass('page-export')
  //   $('#tabula-app').html( _.template( $('#page-export-template').html().replace(/nestedscript/g, 'script') )({}) );
  
  //   $.ajax({
  //     url: "/js/pdf_extract.js",
  //     dataType: "script",
  //     async: true,
  //     success: function(data, status, jqxhr){


  //       Tabula.pdf_view = new Tabula.PDFView({pdf_id: file_id});


  //     },
  //     error: function(a,b,c){
  //       console.log(a,b,c);
  //     }
  //   });
  // }
});

if(TABULA_VERSION.slice(0,3) == "rev"){
  $('#dev-mode-ribbon').show();
}


$(function(){
  new TabulaRouter();
  Backbone.history.start({pushState: true});
});