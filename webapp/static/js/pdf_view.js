Tabula = {};

var clip = null;

$(document).ready(function() {
    ZeroClipboard.setMoviePath('/swf/ZeroClipboard.swf');
    clip = new ZeroClipboard.Client();

    clip.on('mousedown', function(client) {
        client.setText($('table').table2CSV({delivery: null}));
        $('#data-modal span').css('display', 'inline').delay(900).fadeOut('slow');
    });

    $('.has-tooltip').tooltip();

  Tabula.tour = new Tour(
  {
    storage: false,
    onStart: function(){
      $('a#help-start').text("Close Help");
    },
    onEnd: function(){
      $('a#help-start').text("Help");
    }
  });

  Tabula.tour.addSteps([
    {
      content: "Click and drag to select each table in your document. Once you've selected it, a window to preview your data will appear, along with options to download it as a spreadsheet.",
      element: ".page-image#page-1",
      title: "Select Tables",
      placement: 'right'
    },
    {
      element: "#all-data",
      title: "Download Data",
      content: "When you've selected all of the tables in your PDF, click this button to preview the data from all of the selections and download it.",
      placement: 'left'
    },
    {
      element: "#should-preview-data-checkbox",
      title: "Preview Data Automatically?",
      content: "After you select each table on a page, a data preview window will appear automatically. If you want to select multiple tables without interruption, uncheck this box to suppress the preview window.",
      placement: 'left'
    },
    {
      element: "#thumb-page-2",
      title: "Page Shortcuts",
      content: "Click a thumbnail to skip directly to that page.",
      placement: 'right',
      parent: 'body'
    }
  ]);
});

//make the "follow you around bar" actually follow you around. ("sticky nav")
$(document).ready(function() {
  $('.followyouaroundbar').affix({top: 70 });
});

Tabula.PDFView = Backbone.View.extend({
    el : 'body',
    events : {
      'click button.close#directions' : 'moveSelectionsUp',
      'click a.tooltip-modal': 'tooltip', //$('a.tooltip-modal').tooltip();
      'hide #data-modal' : function(){ clip.unglue('#copy-csv-to-clipboard'); },
      'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); },
      'click i.delete-page': 'deletePage',
      'click i.rotate-left i.rotate-right': 'rotatePage',
      'click button.repeat-lassos': 'repeat_lassos',

      'click a#help-start': function(){ Tabula.tour.ended ? Tabula.tour.restart(true) : Tabula.tour.start(true); },

      //events for buttons on the follow-you-around bar.
      'click #should-preview-data-checkbox' : 'updateShouldPreviewDataAutomaticallyButton',
      'click #clear-all-selections': 'clear_all_selection',
      'click #restore-detected-tables': 'restore_detected_tables',
      'click #repeat-lassos': 'repeat_lassos',
      'click #all-data': 'query_all_data',
      'click .extraction-method-btn:not(.active)': 'queryWithToggledExtractionMethod',
      'click .toggle-advanced-options': 'toggleAdvancedOptionsShown',
      'click .download-dropdown': 'dropDownOrUp'
    },
    extractionMethod: "guess",
    $loading: $('#loading'),
    PDF_ID: window.location.pathname.split('/')[2],
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    noModalAfterSelect: !$('#should-preview-data-checkbox').is(':checked'),
    lastQuery: [{}],
    lastSelection: undefined,
    pageCount: undefined,

    initialize: function(){
      _.bindAll(this, 'render', 'createImgareaselects', 'getTablesJson', 'total_selections',
                'toggleClearAllAndRestorePredetectedTablesButtons', 'updateShouldPreviewDataAutomaticallyButton', 
                'query_all_data', 'redoQuery', 'toggleAdvancedOptionsShown');
        this.pageCount = $('img.page-image').length;
        this.setAdvancedOptionsShown();
        this.render();
        this.updateExtractionMethodButton();
    },

    render : function(){
      query_parameters = {};
      this.getTablesJson();
      return this;
    },


    queryWithToggledExtractionMethod: function(e){
      // console.log("before", this.extractionMethod);
      this.extractionMethod = this.getOppositeExtractionMethod();
      // console.log("after", this.extractionMethod);
      this.updateExtractionMethodButton();

      this.redoQuery();
    },


    rotatePage: function(t) {
        alert('not implemented');
    },

    deletePage: function(t) {
        var page_thumbnail = $(t.target).parent().parent();
        var page_number = page_thumbnail.data('page').split('-')[1];
        var that = this;
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
                    if( $(this).offset()["top"] > (deleted_page_top + deleted_page_height) ){
                      $(this).offset({top: $(this).offset()["top"] - deleted_page_height });
                    }
                  });
                   that.pageCount -= 1;
               });

    },

    redoQuery: function(options) {
      //TODO: stash lastCoords, rather than stashing lastQuery and then parsing it.
      this.doQuery(this.PDF_ID,
                   JSON.parse(this.lastQuery["coords"]),
                   options);
    },

    debugRulings: function(image, render, clean, show_intersections) {
        image = $(image);
        var imagePos = image.offset();
        var newCanvas =  $('<canvas/>',{'class':'debug-canvas'})
            .attr('width', image.width())
            .attr('height', image.height())
            .css('top', imagePos.top + 'px')
            .css('left', imagePos.left + 'px');
        $('body').append(newCanvas);

        var pdf_rotation = parseInt($(image).data('rotation'));
        var pdf_width = parseInt($(image).data('original-width'));
        var pdf_height = parseInt($(image).data('original-height'));
        var thumb_width = $(image).width();

        var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width);

        var lq = $.extend(this.lastQuery,
                          {
                              pdf_page_width: pdf_width,
                              render_page: render == true,
                              clean_rulings: clean == true,
                              show_intersections: show_intersections == true
                          });

        $.get('/debug/' + this.PDF_ID + '/rulings',
              lq,
              _.bind(function(data) {
                  $.each(data.rulings, _.bind(function(i, ruling) {
                      $("canvas").drawLine({
                          strokeStyle: this.colors[i % this.colors.length],
                          strokeWidth: 1,
                          x1: ruling[0] * scale, y1: ruling[1] * scale,
                          x2: ruling[2] * scale, y2: ruling[3] * scale
                      });
                  }, this));

                  $.each(data.intersections, _.bind(function(i, intersection) {
                      $("canvas").drawEllipse({
                          fillStyle: this.colors[i % this.colors.length],
                          width: 5, height: 5,
                          x: intersection[0] * scale,
                          y: intersection[1] * scale
                      });
                  }, this));
              }, this));
    },

    _debugRectangularShapes: function(image, url) {
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

      var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width);

      $.get(url,
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

    debugCharacters: function(image) {
        return this._debugRectangularShapes(image, '/debug/' + this.PDF_ID + '/characters');
    },

    debugClippingPaths: function(image) {
        return this._debugRectangularShapes(image, '/debug/' + this.PDF_ID + '/clipping_paths');
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

      var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width);

      var coords = JSON.parse(this.lastQuery.coords);

      this.redoQuery({
        success: _.bind(function(data) {
                   var colors = this.colors;
                   console.log(coords);
                   $.each(data[0].vertical_separators, function(i, vert) {
                     newCanvas.drawLine({
                       strokeStyle: colors[i % colors.length],
                       strokeWidth: 1,
                       x1: vert * scale, y1: coords[0].y1 * scale,
                       x2: vert * scale, y2: coords[0].y2 * scale
                     });
                   });
                 }, this)});

    },

    debugCoordsToTabula: function() {
        var coords = eval(this.lastQuery.coords)[0];
        return [coords.y1, coords.x1, coords.y2, coords.x2].join(',');
    },

    debugTextChunks: function(image) {
        return this._debugRectangularShapes(image, '/debug/' + this.PDF_ID + '/text_chunks');
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
      // if tables weren't autodetected, don't tease the user with an autodetect button that won't work.
      if(!_(tableGuesses).isEmpty()){
        if(numOfSelectionsOnPage <= 0){
          $("#clear-all-selections").hide();
          $("#restore-detected-tables").show();
        }else{
          $("#clear-all-selections").show();
          $("#restore-detected-tables").hide();
        }
      }
    },
    clear_all_selection: function(){
      _(imgAreaSelects).each(function(imgAreaSelectAPIObj){
          if (imgAreaSelectAPIObj === false) return;
          imgAreaSelectAPIObj.cancelSelections();
      });
    },

    restore_detected_tables: function(){
      for(var imageIndex=0; imageIndex < imgAreaSelects.length; imageIndex++){
        var pageIndex = imageIndex + 1;
        this.drawDetectedTables( $('img#page-' + pageIndex), tableGuesses );
      }
      this.toggleClearAllAndRestorePredetectedTablesButtons(this.total_selections());
    },

    toggleDownloadAllAndClearButtons: function() {
        if (this.total_selections() > 0) {
            $('#all-data, #clear-all-selections').removeAttr('disabled');
        }
        else {
            $('#all-data, #clear-all-selections').attr('disabled', 'disabled');
        }
    },

    repeat_lassos: function(e) {
        var page_idx = parseInt($(e.currentTarget).attr('id').split('-')[1]);
        var selection_to_clone = $(e.currentTarget).data('selection');

        $(e.currentTarget).fadeOut(500, function() { $(this).remove(); });

        $('#should-preview-data-checkbox').prop('checked', false);
        this.updateShouldPreviewDataAutomaticallyButton();

        imgAreaSelects.slice(page_idx).forEach(function(imgAreaSelectAPIObj) {
            if (imgAreaSelectAPIObj === false) return;
            imgAreaSelectAPIObj.cancelSelections();
            imgAreaSelectAPIObj.createNewSelection(selection_to_clone.x1, selection_to_clone.y1,
                                                   selection_to_clone.x2, selection_to_clone.y2);
            imgAreaSelectAPIObj.setOptions({show: true});
            imgAreaSelectAPIObj.update();
            this.showSelectionThumbnail(imgAreaSelectAPIObj.getImg(),
                                        selection_to_clone);
        }, this);
    },

    query_all_data : function(){
        all_coords = [];
        imgAreaSelects.forEach(function(imgAreaSelectAPIObj){

            if (imgAreaSelectAPIObj === false) return;

            var thumb_width = imgAreaSelectAPIObj.getImg().width();
            var thumb_height = imgAreaSelectAPIObj.getImg().height();

            var pdf_width = parseInt(imgAreaSelectAPIObj.getImg().data('original-width'));
            var pdf_height = parseInt(imgAreaSelectAPIObj.getImg().data('original-height'));
            var pdf_rotation = parseInt(imgAreaSelectAPIObj.getImg().data('rotation'));

            var scale = (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width) / thumb_width;

            imgAreaSelectAPIObj.getSelections().forEach(function(selection){
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

    doQuery: function(pdf_id, coords, options) {
      this.lastQuery = {
        coords: JSON.stringify(coords) ,
        'extraction_method': this.extractionMethod
      };

      $('#data-modal').modal();
      this.setAdvancedOptionsShown();
      $('#switch-method').prop('disabled', true);
      $('#data-modal .modal-body').prepend(this.$loading.show());
      $('#data-modal .modal-body table').css('visibility', 'hidden');
      $('#data-modal .modal-body').css('overflow', 'hidden');

      $.ajax({
          type: 'POST',
          url: '/pdf/' + pdf_id + '/data',
          data: this.lastQuery,
          success: _.bind(function(resp) {
                this.extractionMethod = resp[0]["extraction_method"];
                this.updateExtractionMethodButton();
                
                //$('#data-modal').find('#loading').hide();
                this.$loading = this.$loading.detach();
                console.log("resp", resp);
                console.log("Extraction method: ", this.extractionMethod);

                this.$loading = this.$loading.detach();
                $('#switch-method').prop('disabled', false);
                $('#data-modal .modal-body table').css('visibility', 'visible');
                $('#data-modal .modal-body').css('overflow', 'auto');


                var tableHTML = '<table class="table table-condensed table-bordered">';
                $.each(_.pluck(resp, 'data'), function(i, rows) {
                  $.each(rows, function(j, row) {
                    tableHTML += '<tr><td>' + _.pluck(row, 'text').join('</td><td>') + '</td></tr>';
                  });
                });
                tableHTML += '</table>';
                $('#data-modal .modal-body').html(tableHTML);

                $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=csv');

                  $('div#hidden-fields').empty();
                  _(_(this.lastQuery).pairs()).each(function(key_val){
                    //<input type="hidden" class="data-query" name="lastQuery" value="" >
                    var new_hidden_field = $("<input type='hidden' class='data-query' value='' >");
                    new_hidden_field.attr("name", key_val[0]);
                    new_hidden_field.attr("value", key_val[1]);
                    $('div#hidden-fields').append(new_hidden_field);
                  });
                $('#download-data').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=csv'); });
                $('#download-csv').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=csv'); });
                $('#download-tsv').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=tsv'); });
                $('#download-script').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=script'); });
                $('#download-bbox').click(function(){ $('#download-form').attr("action", '/pdf/' + pdf_id + '/data?format=bbox'); });
                
                clip.glue('#copy-csv-to-clipboard');


                if (options !== undefined && _.isFunction(options.success))
                  options.success(resp);

            }, this),
          error: _.bind(function(xhr, status, error) {
            $('#data-modal').modal('hide');

            var error_text = xhr.responseText;
            window.raw_xhr_responseText = xhr.responseText;
            if(error_text.indexOf("DOCTYPE") != -1){ // we're in Jar/Jetty/whatever land, not rackup land
              var error_html = $('<div></div>').html( error_text );
              var summary = error_html.find('#summary').text().trim();
              var meta = error_html.find('#meta').text().trim();
              var info = error_html.find('#info').text().trim();
              error_text = [summary, meta, info].join("<br />");
            }
            $('#modal-error textarea').html(error_text);
            $('#modal-error').modal();
            if (options !== undefined && _.isFunction(options.error))
              options.error(resp);

          })
        });
    },

    showSelectionThumbnail: function(img, selection) {
        $('#thumb-' + img.attr('id') + " a").append( $('<div class="selection-show" id="selection-show-' + selection.id + '" />').css('display', 'block') );
        var sshow = $('#thumb-' + img.attr('id') + ' #selection-show-' + selection.id);
        var thumbScale = $('#thumb-' + img.attr('id') + ' img').width() / img.width();
        $(sshow).css('top', selection.y1 * thumbScale + 'px')
            .css('left', selection.x1 * thumbScale + 'px')
            .css('width', ((selection.x2 - selection.x1) * thumbScale) + 'px')
            .css('height', ((selection.y2 - selection.y1) * thumbScale) + 'px');
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
            this.showSelectionThumbnail($img, selection);
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

    _onSelectStart: function(img, selection) {
        this.showSelectionThumbnail($(img), selection);
    },

    _onSelectChange: function(img, selection) {
        var sshow = $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selection.id);
        var scale = $('#thumb-' + $(img).attr('id') + ' img').width() / $(img).width();
        $(sshow).css('top', selection.y1 * scale + 'px')
            .css('left', selection.x1 * scale + 'px')
            .css('width', ((selection.x2 - selection.x1) * scale) + 'px')
            .css('height', ((selection.y2 - selection.y1) * scale) + 'px');

        var b;
        var but_id = $(img).attr('id') + '-' + selection.id;
        if (b = $('button#' + but_id)) {
            var img_pos = $(img).offset();
            $(b)
                .css({
                    top: img_pos.top + selection.y1 + selection.height - $('button#' + but_id).height() * 1.5,
                    left: img_pos.left + selection.x1 + selection.width + 5
                })
                .data('selection', selection);
        }
    },

    _onSelectEnd: function(img, selection) {
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

        var scale = (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width) / thumb_width;

        // create button for repeating lassos, only if there are more pages after this
        if (this.pageCount > $(img).data('page')) {
            var but_id = $(img).attr('id') + '-' + selection.id;
            $('body').append('<button class="btn repeat-lassos" id="'+but_id+'">Repeat this selection</button>');
            var img_pos = $(img).offset();
            $('button#' + but_id)
                .css({
                    position: 'absolute',
                    top: img_pos.top + selection.y1 + selection.height - $('button#' + but_id).height() * 1.5,
                    left: img_pos.left + selection.x1 + selection.width + 5
                })
                .data('selection', selection);
        }

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
        this.toggleDownloadAllAndClearButtons();
    },

    _onSelectCancel: function(img, selection, selectionId) {
        $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selectionId).remove();
        $('#' + $(img).attr('id') + '-' + selectionId).remove();
        var but_id = $(img).attr('id') + '-' + selectionId;
        $('button#' + but_id).remove();
        this.toggleClearAllAndRestorePredetectedTablesButtons(this.total_selections());
        //TODO, if there are no selections, activate the restore detected tables button.
        this.toggleDownloadAllAndClearButtons();

    },

    //skip if pages is "deleted"
    createImgareaselects : function(tableGuessesTmp, pages){
      tableGuesses = tableGuessesTmp;
      var selectsNotYetLoaded = _(pages).filter(function(page){ return !page['deleted']}).length;
      var that = this;

      imgAreaSelects = $.map(pages, _.bind(function(page, arrayIndex){
        pageIndex = arrayIndex + 1;
        if (page['deleted']) {
          return false;
        }
        $image = $('img#page-' + pageIndex);
        return $image.imgAreaSelect({
          handles: true,
          instance: true,
          allowOverlaps: false,
          show: true,
          multipleSelections: true,

          onSelectStart: _.bind(that._onSelectStart, that),
          onSelectChange: that._onSelectChange,
          onSelectEnd: _.bind(that._onSelectEnd, that),
          onSelectCancel: _.bind(that._onSelectCancel, that),
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
    },

    /* simple display-related functions */

    toggleAdvancedOptionsShown: function(){
      var $advancedOptions = $('#advanced-options');
      currentAdvancedOptions = $advancedOptions.is(":visible");
      if(currentAdvancedOptions){
        // currently shown, so hide it
        localStorage.setItem("tabula-show-advanced-options", "false");
      }else{
        // currently hidden, so show it
        localStorage.setItem("tabula-show-advanced-options", "true");
      }
      this.setAdvancedOptionsShown();
    },

    setAdvancedOptionsShown: function(){
      var showAdvancedOptions = localStorage.getItem("tabula-show-advanced-options");
      var $advancedOptions = $('#advanced-options');
      var $advancedShowButton = $('#basic-options .toggle-advanced-options');
      if(showAdvancedOptions === "true"){
        $advancedOptions.slideDown();
        $advancedShowButton.hide();
      }else{
        $advancedOptions.slideUp();
        $advancedShowButton.show();
      }
    },

    getOppositeExtractionMethod: function(){
      if (this.extractionMethod == "guess"){
        return; // this should never happen.
      }
      else if (this.extractionMethod == "original") {
        return "spreadsheet";
      }
      return "original";
    },

    updateExtractionMethodButton: function(){
      $('#' + this.extractionMethod + '-method-btn').button('toggle');
    },
    
    updateShouldPreviewDataAutomaticallyButton: function(){
      this.noModalAfterSelect = !$('#should-preview-data-checkbox').is(':checked');
    },

    moveSelectionsUp: function(){
      $('div.imgareaselect').each(function(){ $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); });
    },

    dropDownOrUp: function(e){
      var $el = $(e.currentTarget);
      $ul = $el.parent().find('ul');

      window.setTimeout(function(){ // if we upgrade to bootstrap 3.0
                                         // we don't need this gross timeout and can, instead,
                                         // listen for the `dropdown's shown.bs.dropdown` event
        if(!isElementInViewport($ul)){
          $el.addClass('dropup');
          $ul.addClass('bottom-up');
        }
      }, 100);
    }

});

$(function () {
  Tabula.pdf_view = new Tabula.PDFView();
});


function isElementInViewport (el) {

    //special bonus for those using jQuery
    if (el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}