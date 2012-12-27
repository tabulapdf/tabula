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

var debugColumns;
var debugRows;
var debugCharacters;
var lastQuery;
var lastSelection;

var COLORS = ['#f00', '#0f0', '#00f'];

$(function () {

      var PDF_ID = window.location.pathname.split('/')[2];
      lastQuery = {};

      debugRows = function(image) {
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

          $.get('/pdf/' + PDF_ID + '/rows',
                lastQuery,
                function(data) {
                    $.each(data, function(i, row) {
                            var line = {x1: lastSelection.x1,
                                    y1: row.top * scale_y,
                                    x2: lastSelection.x2,
                                    y2: row.top * scale_y };
                            $(newCanvas).drawLine(
                                $.extend({
                                    strokeStyle: COLORS[i % COLORS.length],
                                    strokeWidth: 1
                                }, line));
                            line = {x1: lastSelection.x1,
                                    y1: row.bottom * scale_y,
                                    x2: lastSelection.x2,
                                    y2: row.bottom * scale_y };
                            $(newCanvas).drawLine(
                                $.extend({
                                    strokeStyle: COLORS[i % COLORS.length],
                                    strokeWidth: 1
                                }, line));
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

          $.get('/pdf/' + PDF_ID + '/columns',
                lastQuery,
                function(data) {
                    $.each(data, function(i, row) {
                            var line = {x1: row.left * scale_x,
                                    y1: lastSelection.y1,
                                    x2: row.left * scale_x,
                                    y2: lastSelection.y2 };

                            $(newCanvas).drawLine(
                                $.extend({
                                    strokeStyle: COLORS[i % COLORS.length],
                                    strokeWidth: 1
                                }, line));
                               line = {x1: row.right * scale_x,
                                    y1: lastSelection.y1,
                                    x2: row.right * scale_x,
                                    y2: lastSelection.y2 };

                            $(newCanvas).drawLine(
                                $.extend({
                                    strokeStyle: COLORS[i % COLORS.length],
                                    strokeWidth: 1
                                }, line));
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

          $.get('/pdf/' + PDF_ID + '/characters',
                lastQuery,
                function(data) {
                    $.each(data, function(i, row) {
                               $("canvas").drawRect({
                                       strokeStyle: COLORS[i % COLORS.length],
                                       strokeWidth: 1,
//                                       fillStyle: COLORS[i % COLORS.length],
                                       x: row.left * scale_x, y: row.top * scale_y,
                                       width: row.width * scale_x,
                                       height: row.height * scale_y,
                                       fromCenter: false
                               });

                           });
                });
      };




      // $('input#split_multiline_cells').change(function() {
      //         $.extend(lastQuery, { split_multiline_cells: $(this).is(':checked') });
      //         doQuery(PDF_ID, lastQuery);
      // });

      $('.thumbnail-list li img').load(function() {
              $(this).after($('<div />',
                               { class: 'selection-show'}));
      });

      query_parameters = {};

      $('#myModal').on('hide', function() {
                           clip.unglue('#copy-csv-to-clipboard');
                       });

      var doQuery = function(pdf_id, query_parameters) {
          $('#loading').css('left', ($(window).width() - 98) + 'px').css('visibility', 'visible');

          lastQuery = query_parameters;
          $.get('/pdf/' + pdf_id + '/data',
                query_parameters,
                function(data) {
                    var tableHTML = '<table contenteditable="true" class="table table-condensed table-bordered">';
                    $.each(data, function(i, row) {
                               tableHTML += '<tr><td>' + $.map(row, function(cell, j) { return cell.text; }).join('</td><td>') + '</td></tr>';
                           });
                    tableHTML += '</table>';

                    $('.modal-body').html(tableHTML);
                    $('#download-csv').attr('href', '/pdf/' + pdf_id + '/data?format=csv&' + $.param(query_parameters));
                    $('#myModal').modal();
                    clip.glue('#copy-csv-to-clipboard');
                    $('#loading').css('visibility', 'hidden');
                });
      };

      $('img.page-image').imgAreaSelect({
              handles: true,
              //minHeight: 50, minWidth: 100,
              onSelectStart: function(img, selection)  {
                  $('#thumb-' + $(img).attr('id') + ' .selection-show').css('display', 'block');
              },
              onSelectChange: function(img, selection) {
                  var sshow = $('#thumb-' + $(img).attr('id') + ' .selection-show');
                  var scale = $('#thumb-' + $(img).attr('id') + ' img').width() / $(img).width();
                  $(sshow).css('top', selection.y1 * scale + 'px')
                       .css('left', selection.x1 * scale + 'px')
                       .css('width', ((selection.x2 - selection.x1) * scale) + 'px')
                       .css('height', ((selection.y2 - selection.y1) * scale) + 'px');

              },
              onSelectEnd: function(img, selection) {
                  if (selection.width == 0 && selection.height == 0) {
                      $('#thumb-' + $(img).attr('id') + ' .selection-show').css('display', 'none');
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
                  //     console.log('180 carajo!');
                  //     tmp = selection.x1; selection.x1 = selection.x2; selection.x2 = tmp;
                  //     tmp = selection.y1; selection.y1 = selection.y2; selection.y2 = tmp;
                  // }

                  var scale_x = (pdf_width / thumb_width);
                  var scale_y = (pdf_height / thumb_height);

                  var query_parameters = {
                      x1: selection.x1 * scale_x,
                      x2: selection.x2 * scale_x,
                      y1: selection.y1 * scale_y,
                      y2: selection.y2 * scale_y,
                      page: $(img).data('page')
                  };

                  doQuery(PDF_ID, query_parameters);
              }});

  });
