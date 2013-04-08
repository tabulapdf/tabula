// TODO this really needs a refactor. maybe bootstrap.js

var clip = null;

$(document).ready(function() {
    ZeroClipboard.setMoviePath('/swf/ZeroClipboard.swf');
    clip = new ZeroClipboard.Client();

    clip.on('mousedown', function(client) {
        client.setText($('table').table2CSV({delivery: null}));
        $('#myModal span').css('display', 'inline').delay(900).fadeOut('slow');
    });

});

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
          .css("top", 70)
          .css("box-shadow", "rgba(0, 0, 0, 0.1) 0px 4px 5px 0px")
      } else if (windowTop > footerTop) {
        this
        .css("position", "absolute")
        .css("top", 70)
        .css("box-shadow", "rgba(0, 0, 0, 0) 0px 4px 5px 0px")
      }
    }

    $(window).scroll(_.throttle(_.bind(stick, elem), 100));
});

var debugRulings;
var debugColumns;
var debugRows;
var debugCharacters;
var lastQuery;
var lastSelection;

var COLORS = ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'];

var noModalAfterSelect = false;

$(function () {

    $('button.close#directions').click(function(){
      $('div.imgareaselect').each(function(){ $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); });
    })

    $('#multiselect-checkbox').click(function(){
      noModalAfterSelect = $('#multiselect-checkbox').is(':checked');
    })

    var PDF_ID = window.location.pathname.split('/')[2];
    lastQuery = {};

    debugWhitespace = function(image) {
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (thumb_width / pdf_width);

        $.get('/debug/' + PDF_ID + '/whitespace',
              lastQuery,
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
    };

    debugGraph = function(image) {
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (thumb_width / pdf_width);

        $.get('/debug/' + PDF_ID + '/graph',
              lastQuery,
              function(data) {
                  // draw rectangles enclosing each cluster
                  $.each(data.vertices, function(i, row) {
                      $(newCanvas).drawRect({
                          x: lastSelection.x1,
                          y: row.top * scale_y,
                          width: lastSelection.x2 - lastSelection.x1,
                          height: row.bottom - row.top,
                          strokeStyle: COLORS[i % COLORS.length],
                          fromCenter: false
                      });
                  });

                  // draw lines connecting clusters (edges)
                  // $.each(data, function(i, row) {
                  //     $(newCanvas).drawRect({
                  //         x: lastSelection.x1,
                  //         y: row.top * scale_y,
                  //         width: lastSelection.x2 - lastSelection.x1,
                  //         height: row.bottom - row.top,
                  //         strokeStyle: COLORS[i % COLORS.length],
                  //         fromCenter: false
                  //     });
                  // });
              });
    };

    debugRulings = function(image) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var scaleFactor = image.width() / 2048.0;

        var lq = $.extend(lastQuery,
                          {
                              pdf_page_width: $('img#page-' + lastQuery.page).data('original-width')
                          });

        $.get('/debug/' + PDF_ID + '/rulings',
              lq,
              function(data) {
                  $.each(data, function(i, ruling) {
                      console.log(ruling);
                      $("canvas").drawLine({
                          strokeStyle: COLORS[i % COLORS.length],
                          strokeWidth: 1,
                          x1: ruling[0] * scaleFactor, y1: ruling[1] * scaleFactor,
                          x2: ruling[2] * scaleFactor, y2: ruling[3] * scaleFactor
                      });
                  });
              });
    };


    debugRows = function(image, use_rulings) {
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (thumb_width / pdf_width);

        if (use_rulings !== undefined)
            $.extend(lastQuery, { use_lines: true});

        $.get('/debug/' + PDF_ID + '/rows',
              lastQuery,
              function(data) {
                  $.each(data, function(i, row) {
                      $(newCanvas).drawRect({
                          x: lastSelection.x1,
                          y: row.top * scale,
                          width: lastSelection.x2 - lastSelection.x1,
                          height: row.bottom - row.top,
                          strokeStyle: COLORS[i % COLORS.length],
                          fromCenter: false
                      });
                  });
              });
    };


    debugColumns = function(image) {
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale_x = (thumb_width / pdf_width);
        var scale_y = (thumb_height / pdf_height);

        $.get('/debug/' + PDF_ID + '/columns',
              lastQuery,
              function(data) {
                  $.each(data, function(i, column) {
                      $(newCanvas).drawRect({
                          x: column.left * scale_x,
                          y: lastSelection.y1,
                          width: (column.right - column.left) * scale_x,
                          height: lastSelection.y2 - lastSelection.y1,
                          strokeStyle: COLORS[i % COLORS.length],
                          fromCenter: false
                      });
                  });
              });
    };

    debugCharacters = function(image) {
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale_x = (thumb_width / pdf_width);
        var scale_y = (thumb_height / pdf_height);

        $.get('/debug/' + PDF_ID + '/characters',
              lastQuery,
              function(data) {
                  $.each(data, function(i, row) {
                      $("canvas").drawRect({
                          strokeStyle: COLORS[i % COLORS.length],
                          strokeWidth: 1,
                          x: row.left * scale_x, y: row.top * scale_y,
                          width: row.width * scale_x,
                          height: row.height * scale_y,
                          fromCenter: false
                      });
                  });
              });
    };


    $('a.tooltip-modal').tooltip();

    $('input#use_lines').change(function() {
        _(lastQuery).map(function(selection_params){
          $.extend(selection_params, { use_lines: $(this).is(':checked') });
        });
        doQuery(PDF_ID, lastQuery);
    });

    //query_parameters = {}; //uhh.


    $('#myModal').on('hide', function() {
        clip.unglue('#copy-csv-to-clipboard');
    });

    var doQuery = function(pdf_id, query_parameters) {
        $('#loading').css('left', ($(window).width() - 98) + 'px').css('visibility', 'visible');

        lastQuery = _(query_parameters).map(function(selection_params){
          $.extend(selection_params, { use_lines: $('#use_lines').is(':checked') });
        })

        var real_query_parameters = {coords: JSON.stringify(query_parameters) ,
                use_lines :  $('#use_lines').is(':checked')
              };

        $.get('/pdf/' + pdf_id + '/data',
              real_query_parameters,
              function(data) {
                  var tableHTML = '<table contenteditable="true" class="table table-condensed table-bordered">';
                  $.each(data, function(i, row) {
                      tableHTML += '<tr><td>' + $.map(row, function(cell, j) { return cell.text; }).join('</td><td>') + '</td></tr>';
                  });
                  tableHTML += '</table>';

                  $('.modal-body').html(tableHTML);
                  $('#download-csv').attr('href', '/pdf/' + pdf_id + '/data?format=csv&' + $.param(real_query_parameters));
                  // $('#download-csv').click(function(){ 
                  //                       $.post('/pdf/' + pdf_id + '/data',
                  //                         {coords: JSON.stringify(query_parameters) ,
                  //                           use_lines :  $('#use_lines').is(':checked'),
                  //                           format : 'csv'
                  //                         },
                  //                         function(data){ window.open(data);}
                  //                         )
                  //                     });
                  $('#myModal').modal();
                  clip.glue('#copy-csv-to-clipboard');
                  $('#loading').css('visibility', 'hidden');
              });
    };

    // only run these functions if the image is loaded already. 
    // TODO: this works better than it used to, but still fails sometimes.
    // clearly a race condition.
    // http://stackoverflow.com/questions/1743880/image-height-using-jquery-in-chrome-problem
    $.getJSON("/pdfs/" + PDF_ID + "/tables.json", function(tableGuesses){ 
      var selectsNotYetLoaded = tableGuesses.length;

      imgAreaSelects = $.map($('img.page-image'), function(image){ 
        return $(image).imgAreaSelect({
          handles: true,
          instance: true,
          allowOverlaps: false,
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
          onSelectEnd: function(img, selection) {
              if (selection.width == 0 && selection.height == 0) {
                  $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selection.id).css('display', 'none');
              }
              if (selection.height * selection.width < 5000) return;
              lastSelection = selection;
              var thumb_width = $(img).width();
              var thumb_height = $(img).height();

              var pdf_width = parseInt($(img).data('original-width'));
              var pdf_height = parseInt($(img).data('original-height'));
              var pdf_rotation = parseInt($(img).data('rotation'));

              // if rotated, swap width and height
              if (pdf_rotation == 90 || pdf_rotation == 270) {
                  var tmp = pdf_height;
                  pdf_height = pdf_width;
                  pdf_width = tmp;
              }
              // var tmp;
              // switch(pdf_rotation) {
              // case 180:
              //     console.log('180 carajo!'); //yesssssss -Jeremy
              //     tmp = selection.x1; selection.x1 = selection.x2; selection.x2 = tmp;
              //     tmp = selection.y1; selection.y1 = selection.y2; selection.y2 = tmp;
              // }

              var scale = (pdf_width / thumb_width);

              var query_parameters = {
                  x1: selection.x1 * scale,
                  x2: selection.x2 * scale,
                  y1: selection.y1 * scale,
                  y2: selection.y2 * scale,
                  page: $(img).data('page')
              };
              if(!noModalAfterSelect){
                doQuery(PDF_ID, [query_parameters]);
              }
          },
          onSelectCancel: function(img, selection, selectionId){
            $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selectionId).remove();
            console.log("selections on page: " + totalSelections() ); // this one hasn't been deleted yet.
            toggleClearAllAndRestorePredetectedTablesButtons(totalSelections());
            //TODO, if there are no selections, activate the restore detected tables button.
          },
          onInit: drawDetectedTablesIfAllAreLoaded
        });
      });

      function drawDetectedTablesIfAllAreLoaded(){
        selectsNotYetLoaded--;
        if(selectsNotYetLoaded == 0){
          for(var imageIndex=0; imageIndex < imgAreaSelects.length; imageIndex++){ 
            var pageIndex = imageIndex + 1;
            drawDetectedTables( $('img#page-' + pageIndex)[0] );
          }
        }
      }

      function drawDetectedTables(e){
        img = $(e);

        imageIndex = parseInt(img.attr("id").replace("page-", '')) - 1;

        var thumb_width = img.width();
        var thumb_height = img.height();

        var pdf_width = parseInt(img.data('original-width'));
        var pdf_height = parseInt(img.data('original-height'));
        var pdf_rotation = parseInt(img.data('rotation'));

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (pdf_width / thumb_width);


        $(tableGuesses[imageIndex]).each(function(tableGuessIndex, tableGuess){ 

          var my_x2 = tableGuess[0] + tableGuess[2];
          var my_y2 = tableGuess[1] + tableGuess[3];

          // console.log("page: " + imageIndex + 1);
          // console.log(tableGuess);
          // console.log(scale);
          // console.log(my_x2 / scale);
          // console.log(my_y2 / scale);
          // console.log("");
          imgAreaSelectAPIObj = imgAreaSelects[imageIndex];

          /* nothing is set yet, when race condition manifests */
          console.log(tableGuess, imageIndex);

          selection = imgAreaSelectAPIObj.createNewSelection(tableGuess[0] / scale, 
                                        tableGuess[1] / scale, 
                                        my_x2 / scale, 
                                        my_y2 / scale);
          imgAreaSelectAPIObj.setOptions({show: true});
          imgAreaSelectAPIObj.update();

         
          //create a red box for this selection.
          $('#thumb-' + $(img).attr('id') + " a").append( $('<div class="selection-show" id="selection-show-' + selection.id + '" />').css('display', 'block') );
          var sshow = $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selection.id);
          var thumbScale = $('#thumb-' + img.attr('id') + ' img').width() / img.width();
          $(sshow).css('top', selection.y1 * thumbScale + 'px')
              .css('left', selection.x1 * thumbScale + 'px')
              .css('width', ((selection.x2 - selection.x1) * thumbScale) + 'px')
              .css('height', ((selection.y2 - selection.y1) * thumbScale) + 'px');

        });
        //imgAreaSelectAPIObj.createNewSelection(50, 50, 300, 300); //for testing overlaps from API.
      }
    });

    $('#clear-all-selections').on("click", function(){
      _(imgAreaSelects).each(function(imgAreaSelectAPIObj){
        imgAreaSelectAPIObj.cancelSelections();
      });
    });

    $('#repeat-lassos').on("click", function(){ alert("not yet implemented")});

    $('#all-data').on("click", function(){
      query_parameters = [];
      _(imgAreaSelects).each(function(imgAreaSelectAPIObj){

          var thumb_width = imgAreaSelectAPIObj.getImg().width();
          var thumb_height = imgAreaSelectAPIObj.getImg().height();

          var pdf_width = parseInt(imgAreaSelectAPIObj.getImg().data('original-width'));
          var pdf_height = parseInt(imgAreaSelectAPIObj.getImg().data('original-height'));
          var pdf_rotation = parseInt(imgAreaSelectAPIObj.getImg().data('rotation'));

          // if rotated, swap width and height
          if (pdf_rotation == 90 || pdf_rotation == 270) {
              var tmp = pdf_height;
              pdf_height = pdf_width;
              pdf_width = tmp;
          }

          var scale = (pdf_width / thumb_width);


          console.log(imgAreaSelectAPIObj.getSelections());

        _(imgAreaSelectAPIObj.getSelections()).each(function(selection){

          new_query = {
                x1: selection.x1 * scale,
                x2: selection.x2 * scale,
                y1: selection.y1 * scale,
                y2: selection.y2 * scale,
                page: imgAreaSelectAPIObj.getImg().data('page')
              }
          query_parameters.push(new_query);
        });
      });

      doQuery(PDF_ID, query_parameters);
    })
  function totalSelections(){
    return _.reduce(imgAreaSelects, function(memo, s){ return memo + s.getSelections().length; }, 0);
  }
  function toggleClearAllAndRestorePredetectedTablesButtons(numOfSelectionsOnPage){
    console.log("num: " + numOfSelectionsOnPage);
    if(numOfSelectionsOnPage <= 0){
      $("#clear-all-selections").hide();
      $("#restore-detected-tables").show();
    }else{
      $("#clear-all-selections").show();
      $("#restore-detected-tables").hide();
    }
  }

});
