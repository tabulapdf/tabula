var clip = null;

$(document).ready(function() {
    console.log("YEAH");
    ZeroClipboard.setMoviePath('/swf/ZeroClipboard.swf');
    clip = new ZeroClipboard.Client();
    clip.on('load', function(client) { console.log("LOADED CLIENT"); });
    clip.on('mousedown', function(client) {
        client.setText($('table').table2CSV({delivery: null}));
    });
});



$(function () {

      var lastQuery = {};

      $('input#split_multiline_cells').change(function() {
                                                  $.extend(lastQuery, { split_multiline_cells: $(this).is(':checked') });
                                                  doQuery(PDF_ID, lastQuery);
                                              });

      $('.thumbnail-list li').click(function() {

//                                        console.log($('#' + $(this).data('page')).position());
                                        var contentPosTop = $('#' + $(this).data('page')).position().top - 60;
                                        $('html, body').stop().animate({
                                                                           scrollTop: contentPosTop
                                                                       }, 600);
                                    });

      query_parameters = {};

      var PDF_ID = window.location.pathname.split('/')[2];

      $('#myModal').on('hide', function() {
                           clip.unglue('#copy-csv-to-clipboard');
                       });

      var doQuery = function(pdf_id, query_parameters) {
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

                });
      };

      $('img.page-image').imgAreaSelect({
                                            handles: true,
                                            //minHeight: 50, minWidth: 100,
                                            onSelectEnd: function(img, selection) {
                                                if (selection.height * selection.width < 5000) return;
                                                var thumb_width = $(img).width(); var thumb_height = $(img).height();

                                                var pdf_width = parseInt($(img).data('original-width'));
                                                var pdf_height = parseInt($(img).data('original-height'));
                                                var pdf_rotation = parseInt($(img).data('rotation'));

                                                // if rotated, swap width and height
                                                if (pdf_rotation == 90 || pdf_rotation == 270) {
                                                    var tmp = pdf_height;
                                                    pdf_height = pdf_width;
                                                    pdf_width = tmp;
                                                }

                                                var scale_x = (pdf_width / thumb_width);
                                                var scale_y = (pdf_height / thumb_height);

                                                var x1 = selection.x1 * scale_x;
                                                var x2 = selection.x2 * scale_x;
                                                var y1 = selection.y1 * scale_y;
                                                var y2 = selection.y2 * scale_y;

                                                var query_parameters = {
                                                    x1: x1,
                                                    x2: x2,
                                                    y1: y1,
                                                    y2: y2,
                                                    page: $(img).data('page')
                                                };

                                                doQuery(PDF_ID, query_parameters);

                                            }});


      /* obtained from: http://jsfiddle.net/timdown/2YcaX/ */

      // function getCharacterOffsetWithin(range, node) {
      //     var treeWalker = document.createTreeWalker(
      //         node,
      //         NodeFilter.SHOW_TEXT,
      //         function(node) {
      //             var nodeRange = document.createRange();
      //             nodeRange.selectNodeContents(node);
      //             return nodeRange.compareBoundaryPoints(Range.END_TO_END, range) < 1 ?
      //                 NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      //         },
      //         false
      //     );

      //     var charCount = 0;
      //     while (treeWalker.nextNode()) {
      //         charCount += treeWalker.currentNode.length;
      //     }
      //     if (range.startContainer.nodeType == 3) {
      //         charCount += range.startOffset;
      //     }
      //     return charCount;
      // }

      // document.body.addEventListener("mouseup", function() {
      //                                    var el = document.getElementById("test");
      //                                    var range = window.getSelection().getRangeAt(0);
      //                                    console.log("Caret char pos: " + getCharacterOffsetWithin(range, el));
      //                                }, false);



  });
