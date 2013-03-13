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

var debugRulings;
var debugColumns;
var debugRows;
var debugCharacters;
var lastQuery;
var lastSelection;

var COLORS = ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'];

var rotatePoint = function(point, rot_deg) {
    //  x' = x cos f - y sin f
    //  y' = y cos f + x sin f
    var rot_rad = rot_deg * (Math.PI / 180.0);
    var rv = [ point[0] * Math.cos(rot_rad) - point[1] * Math.sin(rot_rad),
               point[1] * Math.cos(rot_rad) + point[0] * Math.sin(rot_rad)];
    return rv;

};

var rotatePath = function(path, rot_deg) {
    var rot_p1 = rotatePoint([path.left, path.top], rot_deg);
    var rot_p2 = rotatePoint([path.left + path.width, path.top + path.height], rot_deg);
    return {
        top: rot_p1[1], left: rot_p1[0],
        width: rot_p2[0] - rot_p1[0], height: rot_p2[1] - rot_p1[1]
    };
};

$(function () {

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

        $.get('/pdf/' + PDF_ID + '/whitespace',
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

        $.get('/pdf/' + PDF_ID + '/graph',
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

        $.get('/pdf/' + PDF_ID + '/rulings',
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
                  // $("canvas").drawRect({
                  //     strokeStyle: COLORS[i % COLORS.length],
                  //     strokeWidth: 1,
                  //     x: row.left * scale_x, y: row.top * scale_y,
                  //     width: row.width * scale_x,
                  //     height: row.height * scale_y,
                  //     fromCenter: false
                  // });

                  $.each(data, function(i, row) {
                      $(newCanvas).drawRect({
                          x: lastSelection.x1,
                          y: row.top * scale_y,
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

        $.get('/pdf/' + PDF_ID + '/columns',
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

        $.get('/pdf/' + PDF_ID + '/characters',
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




    $('input#split_multiline_cells').change(function() {
        $.extend(lastQuery, { split_multiline_cells: $(this).is(':checked') });
        doQuery(PDF_ID, lastQuery);
    });

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

            var scale = (pdf_width / thumb_width);

            var query_parameters = {
                x1: selection.x1 * scale,
                x2: selection.x2 * scale,
                y1: selection.y1 * scale,
                y2: selection.y2 * scale,
                page: $(img).data('page')
            };

            doQuery(PDF_ID, query_parameters);
        }});

});
