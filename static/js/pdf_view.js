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

Tabula.PDFView = Backbone.View.extend({
    el : 'body',
    events : {
      'click button.close#directions' : 'moveSelectionsUp',
      'click a.tooltip-modal': 'tooltip', //$('a.tooltip-modal').tooltip();
      'change input#use_lines': 'toggleUseLines',
      'hide #myModal' : function(){ clip.unglue('#copy-csv-to-clipboard'); },
      'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); }
    },

    moveSelectionsUp: function(){
        $('div.ias').each(function(){ $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); });
    },

    initialize: function(){
      _.bindAll(this, 'render');
      this.render();
    },

    PDF_ID: window.location.pathname.split('/')[2],
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    lastQuery: {},

    render : function(){
      query_parameters = {};

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
        onSelectEnd: _.bind(function(img, selection) {
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
            this.doQuery(this.PDF_ID, query_parameters);
        }, this)
      });
      return this;
    },

    toggleUseLines: function() {
        $.extend(this.lastQuery, { use_lines: $('input#use_lines').is(':checked') });
        this.doQuery(this.PDF_ID, this.lastQuery);
    },

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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (thumb_width / pdf_width);

        $.get('/debug/' + this.PDF_ID + '/graph',
              this.lastQuery,
              _.bind( function(data) {
                  // draw rectangles enclosing each cluster
                  $.each(data.vertices, _.bind(function(i, row) {
                      $(newCanvas).drawRect({
                          x: lastSelection.x1,
                          y: row.top * scale_y,
                          width: lastSelection.x2 - lastSelection.x1,
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
                              pdf_page_width: $('img#page-' + this.lastQuery.page).data('original-width')
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
              }, bind));
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale = (thumb_width / pdf_width);

        if (use_rulings !== undefined)
            $.extend(this.lastQuery, { use_lines: true});

        $.get('/debug/' + this.PDF_ID + '/rows',
              this.lastQuery,
              _.bind(function(data) {
                  $.each(data, _.bind(function(i, row) {
                      $(newCanvas).drawRect({
                          x: lastSelection.x1,
                          y: row.top * scale,
                          width: lastSelection.x2 - lastSelection.x1,
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

        // if rotated, swap width and height
        if (pdf_rotation == 90 || pdf_rotation == 270) {
            var tmp = pdf_height;
            pdf_height = pdf_width;
            pdf_width = tmp;
        }

        var scale_x = (thumb_width / pdf_width);
        var scale_y = (thumb_height / pdf_height);

        $.get('/debug/' + this.PDF_ID + '/columns',
              this.lastQuery,
              _.bind(function(data) {
                  $.each(data, _.bind(function(i, column) {
                      $(newCanvas).drawRect({
                          x: column.left * scale_x,
                          y: lastSelection.y1,
                          width: (column.right - column.left) * scale_x,
                          height: lastSelection.y2 - lastSelection.y1,
                          strokeStyle: this.colors[i % this.colors.length],
                          fromCenter: false
                      });
                  }, this));
              }, this));
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

      // if rotated, swap width and height
      if (pdf_rotation == 90 || pdf_rotation == 270) {
          var tmp = pdf_height;
          pdf_height = pdf_width;
          pdf_width = tmp;
      }

      var scale_x = (thumb_width / pdf_width);
      var scale_y = (thumb_height / pdf_height);

      $.get('/debug/' + this.PDF_ID + '/characters',
            this.lastQuery,
            _.bind(function(data) {
                $.each(data, _.bind(function(i, row) {
                    $("canvas").drawRect({
                        strokeStyle: this.colors[i % this.colors.length],
                        strokeWidth: 1,
                        x: row.left * scale_x, y: row.top * scale_y,
                        width: row.width * scale_x,
                        height: row.height * scale_y,
                        fromCenter: false
                    });
                }, this));
            }, this));
    },


    doQuery: function(pdf_id, query_parameters) {
        $('#loading').css('left', ($(window).width() - 98) + 'px').css('visibility', 'visible');

        this.lastQuery = query_parameters;

        $.extend(this.lastQuery, { use_lines: $('#use_lines').is(':checked') });

        $.get('/pdf/' + pdf_id + '/data',
              query_parameters,
              function(data) {
                  var tableHTML = '<table class="table table-condensed table-bordered">';
                  $.each(data, function(i, row) {
                      tableHTML += '<tr><td>' + $.map(row, function(cell, j) { return cell.text; }).join('</td><td>') + '</td></tr>';
                  });
                  tableHTML += '</table>';

                  $('.modal-body').html(tableHTML);
                  $('#download-csv').attr('href', '/pdf/' + pdf_id + '/data?format=csv&' + $.param(query_parameters));
                  $('#download-tsv').attr('href', '/pdf/' + pdf_id + '/data?format=tsv&' + $.param(query_parameters));
                  $('#myModal').modal();
                  clip.glue('#copy-csv-to-clipboard');
                  $('#loading').css('visibility', 'hidden');
              });
    }
});

$(function () {
  Tabula.pdf_view = new Tabula.PDFView();
});
