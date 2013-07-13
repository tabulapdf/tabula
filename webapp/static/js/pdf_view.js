// TODO this really needs a refactor. maybe bootstrap.js

Tabula = {};

var clip = null;

$(document).ready(function() {
    ZeroClipboard.setMoviePath('/swf/ZeroClipboard.swf');
    clip = new ZeroClipboard.Client();

    clip.on('mousedown', function(client) {
        client.setText($('table').table2CSV({delivery: null}));
        $('#myModal span').css('display', 'inline').delay(900).fadeOut('slow');
    });
});

//make the "follow you around bar" actually follow you around. ("sticky nav")
$(document).ready(function() {
    elem = $(".followyouaroundbar");

    stick = function() {
      var windowTop = $(window).scrollTop();
      var footerTop = 50000; // this.jFooter.offset().top;
      var topOffset = this.offset().top;
      var elHeight = this.height();

      if (windowTop > topOffset && windowTop < footerTop) {
        this
          .css("position", "fixed")
          .css("width", "15%")
          .css("top", 70);
      }
    }

    $(window).scroll(_.throttle(_.bind(stick, elem), 100));
});


Tabula.PDFView = Backbone.View.extend({
    el : 'body',
    events : {
      'click button.close#directions' : 'moveSelectionsUp',
      'click a.tooltip-modal': 'tooltip', //$('a.tooltip-modal').tooltip();
      'change input#use_lines': 'toggleUseLines',
      'hide #myModal' : function(){ clip.unglue('#copy-csv-to-clipboard'); },
      'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); },
      'click i.icon-remove': 'deletePage',
      'click i.rotate-left i.rotate-right': 'rotatePage',

      //events related to the chardin help library.
      'click a#chardin-help': 'fire_chardin_event',
      'chardinJs:stop body' : 'chardin_stop',
      'chardinJs:start body' : 'chardin_start',

      //events for buttons on the follow-you-around bar.
      'click #multiselect-checkbox' : 'toggleMultiSelectMode',
      'click #clear-all-selections': 'clear_all_selection',
      'click #restore-detected-tables': 'restore_detected_tables',
      'click #repeat-lassos': 'repeat_lassos',
      'click #all-data': 'query_all_data',
    },

    rotatePage: function(t) {

    },

    deletePage: function(t) {
        var page_thumbnail = $(t.target).parent().parent();
        var page_number = page_thumbnail.data('page').split('-')[1];
        if (!confirm('Delete page ' + page_number + '?')) return;
        $.post('/pdf/' + this.PDF_ID + '/page/' + page_number,
               { _method: 'delete' },
               function () {

                  // delete the deleted page's imgAreaSelect object
                  imgAreaSelects[page_number-1].remove();
                  delete imgAreaSelects[page_number-1];

                  // move all the stuff for the following pages' imgAreaSelect objects up.
                  deleted_page_height = $('img.page-image#page-' + page_number).height();
                  deleted_page_top = $('img.page-image#page-' + page_number).offset()["top"];

                  $('img.page-image#page-' + page_number)
                     .fadeOut(200,
                              function() { $(this).remove(); });
                  page_thumbnail
                     .fadeOut(200,
                              function() { $(this).remove(); });

                  $('div.imgareaselect').each(function(){
                    //if ( parseInt( $(this).attr('id').replace("page-", '')) > page_number){
                    if( $(this).offset()["top"] > (deleted_page_top + deleted_page_height) ){
                      $(this).offset({top: $(this).offset()["top"] - deleted_page_height });
                    }
                  });
               });

    },


    PDF_ID: window.location.pathname.split('/')[2],
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    noModalAfterSelect: $('#multiselect-checkbox').is(':checked'),
    lastQuery: [{}],
    lastSelection: undefined,

    initialize: function(){
      _.bindAll(this, 'render', 'createImgareaselects', 'getTablesJson', 'total_selections',
                'toggleClearAllAndRestorePredetectedTablesButtons', 'toggleMultiSelectMode', 'query_all_data', 'toggleUseLines');
      this.render();
    },

    render : function(){
      query_parameters = {};
      this.getTablesJson();
      return this;
    },

    toggleMultiSelectMode: function(){
      this.noModalAfterSelect = $('#multiselect-checkbox').is(':checked');
    },

    moveSelectionsUp: function(){
        $('div.imgareaselect').each(function(){ $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); });
    },


    toggleUseLines: function() {
        //$.extend(this.lastQuery, { use_lines: $('input#use_lines').is(':checked') });
        this.doQuery(this.PDF_ID, JSON.parse(this.lastQuery["coords"])); //TODO: stash lastCoords, rather than stashing lastQuery and then parsing it.
    },


    /* debug functions */
    debugWhitespace: function(image) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var thumb_width = $(image).width();
        var thumb_height = $(image).height();
        var pdf_width = parseInt($(image).data('original-width'));
        var pdf_height = parseInt($(image).data('original-height'));
        var pdf_rotation = parseInt($(image).data('rotation'));

        var scale = (thumb_width / pdf_width);

        $.get('/debug/' + this.PDF_ID + '/whitespace',
              this.lastQuery,
              function(data) {
                  // whitespace
                  $.each(data, function(i, row) {
                      $(newCanvas).drawRect({
                          x: row.left * scale,
                          y: row.top * scale,
                          width: row.width * scale,
                          height: row.height * scale,
                          /*strokeStyle: '#f00', */fillStyle: '#f00',
                          fromCenter: false
                      });
                  });
              });
    },

    debugGraph: function(image) {
      image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var thumb_width = $(image).width();
        var thumb_height = $(image).height();
        var pdf_width = parseInt($(image).data('original-width'));
        var pdf_height = parseInt($(image).data('original-height'));
        var pdf_rotation = parseInt($(image).data('rotation'));

        var scale = (thumb_width / pdf_width);

        $.get('/debug/' + this.PDF_ID + '/graph',
              this.lastQuery,
              _.bind( function(data) {
                  // draw rectangles enclosing each cluster
                  $.each(data.vertices, _.bind(function(i, row) {
                      $(newCanvas).drawRect({
                          x: this.lastSelection.x1,
                          y: row.top * scale_y,
                          width: this.lastSelection.x2 - this.lastSelection.x1,
                          height: row.bottom - row.top,
                          strokeStyle: this.colors[i % this.colors.length],
                          fromCenter: false
                      });
                  }, this));

                  // draw lines connecting clusters (edges)
                  // $.each(data, function(i, row) {
                  //     $(newCanvas).drawRect({
                  //         x: lastSelection.x1,
                  //         y: row.top * scale_y,
                  //         width: lastSelection.x2 - lastSelection.x1,
                  //         height: row.bottom - row.top,
                  //         strokeStyle: this.colors[i % this.colors.length],
                  //         fromCenter: false
                  //     });
                  // });
              }, this));
    },

    debugRulings: function(image) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);
        var pdf_width = parseInt($(image).data('original-width'));

        var scaleFactor = image.width() / pdf_width ;

        var lq = $.extend(this.lastQuery,
                          {
                              pdf_page_width: pdf_width
                          });

        $.get('/debug/' + this.PDF_ID + '/rulings',
              lq,
              _.bind(function(data) {
                  $.each(data, _.bind(function(i, ruling) {
                      $("canvas").drawLine({
                          strokeStyle: this.colors[i % this.colors.length],
                          strokeWidth: 1,
                          x1: ruling[0] * scaleFactor, y1: ruling[1] * scaleFactor,
                          x2: ruling[2] * scaleFactor, y2: ruling[3] * scaleFactor
                      });
                  }, this));
              }, this));
    },


    debugRows: function(image, use_rulings) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var thumb_width = $(image).width();
        var thumb_height = $(image).height();
        var pdf_width = parseInt($(image).data('original-width'));
        var pdf_height = parseInt($(image).data('original-height'));
        var pdf_rotation = parseInt($(image).data('rotation'));

        var scale = (thumb_width / pdf_width);

        if (use_rulings !== undefined)
            $.extend(this.lastQuery, { use_lines: true});

        $.get('/debug/' + this.PDF_ID + '/rows',
              this.lastQuery,
              _.bind(function(data) {
                  $.each(data, _.bind(function(i, row) {
                      $(newCanvas).drawRect({
                          x: this.lastSelection.x1,
                          y: row.top * scale,
                          width: this.lastSelection.x2 - this.lastSelection.x1,
                          height: row.bottom - row.top,
                          strokeStyle: this.colors[i % this.colors.length],
                          fromCenter: false
                      });
                  }, this));
              }, this));
    },


    debugColumns: function(image) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var thumb_width = $(image).width();
        var thumb_height = $(image).height();
        var pdf_width = parseInt($(image).data('original-width'));
        var pdf_height = parseInt($(image).data('original-height'));
        var pdf_rotation = parseInt($(image).data('rotation'));

        var scale_x = (thumb_width / pdf_width);
        var scale_y = (thumb_height / pdf_height);

        $.get('/debug/' + this.PDF_ID + '/columns',
              this.lastQuery,
              _.bind(function(data) {
                  $.each(data, _.bind(function(i, column) {
                      $(newCanvas).drawRect({
                          x: column.left * scale_x,
                          y: this.lastSelection.y1,
                          width: (column.right - column.left) * scale_x,
                          height: this.lastSelection.y2 - this.lastSelection.y1,
                          strokeStyle: this.colors[i % this.colors.length],
                          fromCenter: false
                      });
                  }, this));
              }, this) );
    },

    debugCharacters: function(image) {
      image = $(image);
      var imagePos = image.offset();
      var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
          .attr('width', image.width())
          .attr('height', image.height())
          .css('top', imagePos.top + 'px')
          .css('left', imagePos.left + 'px');
      $('body').append(newCanvas);

      var thumb_width = $(image).width();
      var thumb_height = $(image).height();
      var pdf_width = parseInt($(image).data('original-width'));
      var pdf_height = parseInt($(image).data('original-height'));
      var pdf_rotation = parseInt($(image).data('rotation'));

      var scale = (thumb_width / pdf_width);

      $.get('/debug/' + this.PDF_ID + '/characters',
            this.lastQuery,
            _.bind(function(data) {
                $.each(data, _.bind(function(i, row) {
                    $("canvas").drawRect({
                        strokeStyle: this.colors[i % this.colors.length],
                        strokeWidth: 1,
                        x: row.left * scale, y: row.top * scale,
                        width: row.width * scale,
                        height: row.height * scale,
                        fromCenter: false
                    });
                }, this));
            }, this));
    },
    /* functions for the follow-you-around bar */
    total_selections: function(){
      return _.reduce(imgAreaSelects, function(memo, s){
        if(s){
          return memo + s.getSelections().length;
        }else{
          return memo;
        }
      }, 0);
    },
    toggleClearAllAndRestorePredetectedTablesButtons: function(numOfSelectionsOnPage){
      if(numOfSelectionsOnPage <= 0){
        $("#clear-all-selections").hide();
        $("#restore-detected-tables").show();
      }else{
        $("#clear-all-selections").show();
        $("#restore-detected-tables").hide();
      }
    },
    clear_all_selection: function(){
      _(imgAreaSelects).each(function(imgAreaSelectAPIObj){
        imgAreaSelectAPIObj.cancelSelections();
      });
    },

    restore_detected_tables: function(){
      for(var imageIndex=0; imageIndex < imgAreaSelects.length; imageIndex++){
        var pageIndex = imageIndex + 1;
        this.drawDetectedTables( $('img#page-' + pageIndex)[0], tableGuesses );
      }
      this.toggleClearAllAndRestorePredetectedTablesButtons(this.total_selections());
    },

    repeat_lassos: function(){ alert("not yet implemented")},

    query_all_data : function(){
      all_coords = [];
      _(imgAreaSelects).each(function(imgAreaSelectAPIObj){

          var thumb_width = imgAreaSelectAPIObj.getImg().width();
          var thumb_height = imgAreaSelectAPIObj.getImg().height();

          var pdf_width = parseInt(imgAreaSelectAPIObj.getImg().data('original-width'));
          var pdf_height = parseInt(imgAreaSelectAPIObj.getImg().data('original-height'));
          var pdf_rotation = parseInt(imgAreaSelectAPIObj.getImg().data('rotation'));

          var scale = (pdf_width / thumb_width);

        _(imgAreaSelectAPIObj.getSelections()).each(function(selection){

          new_coord = {
                x1: selection.x1 * scale,
                x2: selection.x2 * scale,
                y1: selection.y1 * scale,
                y2: selection.y2 * scale,
                page: imgAreaSelectAPIObj.getImg().data('page')
              }
          all_coords.push(new_coord);
        });
      });

      this.doQuery(this.PDF_ID, all_coords);
    },

    /* Chardin help-related functions */
    fire_chardin_event: function(){
      if($('a#chardin-help').text() == "Help"){
        $('body').chardinJs('start');
      }else{
        $('body').chardinJs('stop');
      }
    },
    chardin_stop : function(){
      $('a#chardin-help').text("Help");
      $("#multiselect-label").css("color", "black");
    },
    chardin_start: function(){
      $('a#chardin-help').text("Close Help");
      $("#multiselect-label").css("color", "black");
    },

    doQuery: function(pdf_id, coords) {
      $('#loading').css('left', ($(window).width() - 98) + 'px').css('visibility', 'visible');

      this.lastQuery = {coords: JSON.stringify(coords) ,
                use_lines :  $('#use_lines').is(':checked')
              };

      $.post('/pdf/' + pdf_id + '/data',
              this.lastQuery,
              _.bind(function(data) {
                  var tableHTML = '<table class="table table-condensed table-bordered">';
                  $.each(data, function(i, row) {
                      tableHTML += '<tr><td>' + $.map(row, function(cell, j) { return cell.text; }).join('</td><td>') + '</td></tr>';
                  });
                  tableHTML += '</table>';

                  $('.modal-body').html(tableHTML);

                  $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=csv');

                    $('div#hidden-fields').empty();
                    _(_(this.lastQuery).pairs()).each(function(key_val){
                      //<input type="hidden" class="data-query" name="lastQuery" value="" >
                      var new_hidden_field = $("<input type='hidden' class='data-query' value='' >");
                      new_hidden_field.attr("name", key_val[0]);
                      new_hidden_field.attr("value", key_val[1]);
                      $('div#hidden-fields').append(new_hidden_field);
                    });
                  $('#download-csv').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=csv'); });
                  $('#download-tsv').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=tsv'); });
                  $('#myModal').modal();
                  clip.glue('#copy-csv-to-clipboard');
                  $('#loading').css('visibility', 'hidden');
              }, this));
    },

    drawDetectedTables: function($img, tableGuesses){
      //$img = $(e);

      var imageIndex = $img.data('page');
      arrayIndex = imageIndex - 1;
      var imgAreaSelectAPIObj = imgAreaSelects[arrayIndex];

      var thumb_width = $img.width();
      var thumb_height = $img.height();

      var pdf_width = parseInt($img.data('original-width'));
      var pdf_height = parseInt($img.data('original-height'));
      var pdf_rotation = parseInt($img.data('rotation'));

      var scale = (pdf_width / thumb_width);

      $(tableGuesses[arrayIndex]).each(function(tableGuessIndex, tableGuess){

        var my_x2 = tableGuess[0] + tableGuess[2];
        var my_y2 = tableGuess[1] + tableGuess[3];

        selection = imgAreaSelectAPIObj.createNewSelection( Math.floor(tableGuess[0] / scale),
                                      Math.floor(tableGuess[1] / scale),
                                      Math.floor(my_x2 / scale),
                                      Math.floor(my_y2 / scale));
        imgAreaSelectAPIObj.setOptions({show: true});
        imgAreaSelectAPIObj.update();


        //create a red box for this selection.
        if(selection){ //selection is undefined if it overlaps an existing selection.
          $('#thumb-' + $img.attr('id') + " a").append( $('<div class="selection-show" id="selection-show-' + selection.id + '" />').css('display', 'block') );
          var sshow = $('#thumb-' + $img.attr('id') + ' #selection-show-' + selection.id);
          var thumbScale = $('#thumb-' + $img.attr('id') + ' img').width() / $img.width();
          $(sshow).css('top', selection.y1 * thumbScale + 'px')
              .css('left', selection.x1 * thumbScale + 'px')
              .css('width', ((selection.x2 - selection.x1) * thumbScale) + 'px')
              .css('height', ((selection.y2 - selection.y1) * thumbScale) + 'px');
        }

      });
      //imgAreaSelectAPIObj.createNewSelection(50, 50, 300, 300); //for testing overlaps from API.
      imgAreaSelectAPIObj.setOptions({show: true});
      imgAreaSelectAPIObj.update();
    },

    /* pdfs/<this.PDF_ID>/tables.json may or may not exist, depending on whether the user chooses to use table autodetection. */
    getTablesJson : function(){
      $.getJSON("/pdfs/" + this.PDF_ID + "/pages.json?_=" + Math.round(+new Date()).toString(),
          _.bind(function(pages){
            $.getJSON("/pdfs/" + this.PDF_ID + "/tables.json",
              _.bind(function(tableGuesses){
                this.createImgareaselects(tableGuesses, pages)
              }, this)).
              error( _.bind(function(){ this.createImgareaselects([], pages) }, this));
          }, this) ).
          error( _.bind(function(){ this.createImgareaselects([], []) }, this));
    },

    //skip if pages is "deleted"
    createImgareaselects : function(tableGuessesTmp, pages){
      tableGuesses = tableGuessesTmp;
      var selectsNotYetLoaded = _(pages).filter(function(page){ return !page['deleted']}).length;

      imgAreaSelects = $.map(pages, _.bind(function(page, arrayIndex){
        pageIndex = arrayIndex + 1;
        if (page['deleted']){
          return false;
        }
        $image = $('img#page-' + pageIndex);
        return $image.imgAreaSelect({
          handles: true,
          instance: true,
          allowOverlaps: false,
          show: true,
          multipleSelections: true,
          //minHeight: 50, minWidth: 100,

          onSelectStart: function(img, selection)  {
              //$('#thumb-' + $(img).attr('id') + ' .selection-show').css('display', 'block');
              $('#thumb-' + $(img).attr('id') + " a").append( $('<div class="selection-show" id="selection-show-' + selection.id + '" />').css('display', 'block') );
          },
          onSelectChange: function(img, selection) {
              var sshow = $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selection.id);
              var scale = $('#thumb-' + $(img).attr('id') + ' img').width() / $(img).width();
              $(sshow).css('top', selection.y1 * scale + 'px')
                  .css('left', selection.x1 * scale + 'px')
                  .css('width', ((selection.x2 - selection.x1) * scale) + 'px')
                  .css('height', ((selection.y2 - selection.y1) * scale) + 'px');

          },
          onSelectEnd: _.bind(function(img, selection) {
              if (selection.width == 0 && selection.height == 0) {
                  $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selection.id).css('display', 'none');
              }
              if (selection.height * selection.width < 5000) return;
              this.lastSelection = selection;
              var thumb_width = $(img).width();
              var thumb_height = $(img).height();

              var pdf_width = parseInt($(img).data('original-width'));
              var pdf_height = parseInt($(img).data('original-height'));
              var pdf_rotation = parseInt($(img).data('rotation'));

              var scale = (pdf_width / thumb_width);

              var coords = {
                  x1: selection.x1 * scale,
                  x2: selection.x2 * scale,
                  y1: selection.y1 * scale,
                  y2: selection.y2 * scale,
                  page: $(img).data('page')
              };
              if(!this.noModalAfterSelect){
                this.doQuery(this.PDF_ID, [coords]);
              }
          }, this),
          onSelectCancel: _.bind( function(img, selection, selectionId){
            $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selectionId).remove();
            //console.log("selections on page: " + this.total_selections() ); // this one hasn't been deleted yet.
            this.toggleClearAllAndRestorePredetectedTablesButtons(this.total_selections());
            //TODO, if there are no selections, activate the restore detected tables button.
          }, this),
          onInit: _.bind(drawDetectedTablesIfAllAreLoaded, this)
        });
      }, this));

      function drawDetectedTablesIfAllAreLoaded(){
        selectsNotYetLoaded--;
        if(selectsNotYetLoaded == 0){
          for(var imageIndex=0; imageIndex < imgAreaSelects.length; imageIndex++){
            var pageIndex = imageIndex + 1;
            if(imgAreaSelects[imageIndex]){ //not undefined
              this.drawDetectedTables( $('img#page-' + pageIndex), tableGuesses );
            }
          }
        }
      }
    }

});

$(function () {
  Tabula.pdf_view = new Tabula.PDFView();
});
