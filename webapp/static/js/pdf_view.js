Tabula = {};

var clip = null;

PDF_ID = window.location.pathname.split('/')[2];

TEMPLATES = [
  
]

$(document).ready(function() {
    ZeroClipboard.setMoviePath('/swf/ZeroClipboard.swf');
    clip = new ZeroClipboard.Client();

    clip.on('mousedown', function(client) {
        client.setText($('table').table2CSV({delivery: null}));
        $('#data-modal span').css('display', 'inline').delay(900).fadeOut('slow');
    });

    $('.has-tooltip').tooltip();
});

var Page = Backbone.Model.extend({
  // number: null, //set on initialize
  // width: null, //set on initialize
  // height: null, //set on initialize
  // rotation: null, //set on initialize
  pdf_document: null,
  initialize: function(){
    this.set('number_zero_indexed', this.get('number') - 1);
    this.set('image_url', '/pdfs/' + PDF_ID + '/document_560_' + this.get('number') + '.png');
  },
});

var Pages = Backbone.Collection.extend({
  model: Page,
  url: null, //set on initialize
  initialize: function(){
    this.url = '/pdfs/' + PDF_ID + '/pages.json?_=' + Math.round(+new Date()).toString();
  },
})

var Document = Backbone.Model.extend({
  page_collection: null, //set on initialize
  pdf_id: PDF_ID, //set on initialize
  initialize: function(){
    this.page_collection = new Pages([], {pdf_document: this})
  }
})

// TODO: make sure render fires after document ready or something


Tabula.DataView = Backbone.View.extend({  //only one, is the data modal.
  el: '#data-modal',
  events: {
    'click .download-dropdown': 'dropDownOrUp',
    'click .extraction-method-btn:not(.active)': 'queryWithToggledExtractionMethod',
    'click .toggle-advanced-options': 'toggleAdvancedOptionsShown',
    //N.B.: Download button (and format-specific download buttons) are an HTML form.
    //TODO: handle flash clipboard thingy here.
  },
  ui: null, //added on create
  extractionMethod: "guess",

  initialize: function(){
    _.bindAll(this, 'render', 'toggleAdvancedOptionsShown');
  },

  render: function(){
    // do I need this, or will the modal() method suffice?
    // or should I keep it for forwards-compatibility?
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
  },

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
    //TODO: cache $advancedOptions, $advancedShowButton on the data_view object.
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

  queryWithToggledExtractionMethod: function(e){
    // console.log("before", this.extractionMethod);
    this.extractionMethod = this.getOppositeExtractionMethod();
    // console.log("after", this.extractionMethod);
    this.updateExtractionMethodButton();

    this.redoQuery();
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


});

Tabula.DocumentView = Backbone.View.extend({ //only one
  events: {
    'click button.close#directions' : 'moveSelectionsUp',
  },
  ui: null, //added on create

  /* when the Directions area is closed, the pages themselves move up, because they're just normally positioned.
   * The selections on those images, though, do not, and need to be moved up separately.
   */
  // TODO: also move up the repeat lasso button (or change the HTML structure so that this method does that)
  moveSelectionsUp: function(){
    $('div.imgareaselect').each(function(){ 
      $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); 
    });
  },

  initialize: function(){
    _.bindAll(this, 'createImgareaselects', 'render');
  },

  render: function(){
    return this;
  },

  createImgareaselects: function(){
    return; // temporary no op. TODO: get rid of this.
  }

  //TODO: delegate creating imgareaselect to each child page_view. 

  /*createImgareaselects : function(tableGuessesTmp, pages){
    var selectsNotYetLoaded = _(pages).filter(function(page){ return !page['deleted']}).length;
    this.ui.tableGuesses = tableGuessesTmp;

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

    this.ui.imgAreaSelects = _(this.page_views).map(_.bind(function(page_view, i){
      page_view.createImgareaselect(null, pages[i], drawDetectedTablesIfAllAreLoaded);
    }, this));
  }*/

  // createImgareaselects : function(tableGuessesTmp, pages){
  //   var that = this;

  //   imgAreaSelects = $.map(pages, _.bind(function(page, arrayIndex){
  //   }, this));

  // },
});

Tabula.PageView = Backbone.View.extend({ // one per page of the PDF
  document_view: null, //added on create
  className: 'row pdf-page',
  id: function(){
    return 'page-' + this.model.get('number');
  },
  template: Handlebars.compile($('#templates #page-template').html()) , 
  'events': {
    'click i.delete-page': 'delete_page',
    'click i.rotate-left i.rotate-right': 'rotate_page',
  },

  initialize: function(){
    _.bindAll(this, 'createImgareaselect', 'rotate_page', 'delete_page');
  },

  render: function(){
    if(this.model.get('deleted')){
         return;
    }

    this.$el.html(this.template({
                    'number': this.model.get('number'),
                    'image_url': this.model.get('image_url')
                  }));
    this.$el.find('img').attr('data-page', this.model.get('number'))
                        .attr('data-original-width', this.model.get('width'))
                        .attr('data-original-height', this.model.get('height'))
                        .attr('data-rotation', this.model.get('rotation'));
    if(this.model.number == 1){
      this.$el.find('img').attr('data-position', "right")
         .attr('data-intro', "Click and drag to select each table in your document. Once you've selected it, a window to preview your data will appear, along with options to download it as a spreadsheet.");
    }

    this.createImgareaselect();
    return this;
  },

  createImgareaselect: function(){
    return; //TODO: replace this no op with the real thing.
  },

  /*createImgareaselect: function(tableGuessesTmp, page, drawDetectedTablesIfAllAreLoaded){
    if (page['deleted']) {
      return false;
    }

    // $image = $('img#page-' + this.page_number);
    $image = $el.children('img');
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
  }

  _onSelectStart: function(img, selection) {
    self.document_view.ui.sidebar.thumbnail_views[this.page_number].showSelectionThumbnail(selection)
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
      if (selection.height * selection.width < 5000) return; //TODO: this is dumb, get rid of it.
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
          this.doQuery(PDF_ID, [coords]);
      }
      this.toggleDownloadAllAndClearButtons();
  },

  _onSelectCancel: function(img, selection, selectionId) {
      $('#thumb-' + $(img).attr('id') + ' #selection-show-' + selectionId).remove();
      $('#' + $(img).attr('id') + '-' + selectionId).remove();
      var but_id = $(img).attr('id') + '-' + selectionId;
      $('button#' + but_id).remove();
      this.document_view.ui.control_panel_view.toggleClearAllAndRestorePredetectedTablesButtons();
      this.document_view.ui.control_panel_view.toggleDownloadAllAndClearButtons();
  }, */

  rotate_page: function(t) {
      alert('not implemented');
  },

  delete_page: function(t) {
    //var page_thumbnail = self.document_view.ui.sidebar.thumbnail_views[page_number] //TODO: make this work, delete the next line.
    var page_thumbnail = $(t.target).parent().parent();
    //var page_number = this.page_number //TODO: make this work.
    var page_number = page_thumbnail.data('page').split('-')[1];
    var that = this;

    if (!confirm('Delete page ' + page_number + '?')) return;

    $.post('/pdf/' + PDF_ID + '/page/' + page_number,
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
});


/* I'm not sure having a SelectionView makes sense. But, 
 * TODO: ssomething needs to manage the repeat lasso button
 * AND, something should create the selection thumbnail (without managing it in three places)
 */
// Tabula.SelectionView = Backbone.View.extend({ // multiple per page of the PDF
//   events: {
//     'click button.repeat-lassos': 'repeat_lassos',
//   }
//   page_view: null, //added on create. //TODO: do this.

//   repeat_lassos: function(e) {
//     /* TODO: make this work. 
//     // var page_idx = page_view.page_number;
//     // var selection_to_clone = this;
//     */
//     var page_idx = parseInt($(e.currentTarget).attr('id').split('-')[1]);
//     var selection_to_clone = $(e.currentTarget).data('selection');

//     //remove the button
//     $(e.currentTarget).fadeOut(500, function() { $(this).remove(); });

//     $('#should-preview-data-checkbox').prop('checked', false);
//     this.updateShouldPreviewDataAutomaticallyButton();

//     imgAreaSelects.slice(page_idx).forEach(function(imgAreaSelectAPIObj) {
//         if (imgAreaSelectAPIObj === false) return;
//         imgAreaSelectAPIObj.cancelSelections();
//         imgAreaSelectAPIObj.createNewSelection(selection_to_clone.x1, selection_to_clone.y1,
//                                                selection_to_clone.x2, selection_to_clone.y2);
//         imgAreaSelectAPIObj.setOptions({show: true});
//         imgAreaSelectAPIObj.update();
//         this.showSelectionThumbnail(imgAreaSelectAPIObj.getImg(),
//                                     selection_to_clone);
//     }, this);
//   },
// });

Tabula.ControlPanelView = Backbone.View.extend({ // only one
  events: {
    'click #should-preview-data-checkbox' : 'updateShouldPreviewDataAutomaticallyButton',
    'click #clear-all-selections': 'clear_all_selection',
    'click #restore-detected-tables': 'restore_detected_tables',
    'click #all-data': 'query_all_data',
    'click #repeat-lassos': 'repeat_lassos',
  },
  ui: null, //added on create
  className: 'followyouaroundbar',

  template: Handlebars.compile($('#templates #control-panel-template').html()),

  noModalAfterSelect: !$('#should-preview-data-checkbox').is(':checked'),

  updateShouldPreviewDataAutomaticallyButton: function(){
    this.noModalAfterSelect = !$('#should-preview-data-checkbox').is(':checked');
  },

  repeat_lassos: function(){
    alert('not yet implemented');
    return;
    /* TODO:
     * get ui, get document_view, get first page_view:
     * either:
     * - repeat first selection
     * - repeat all selections
    */
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
    this.toggleClearAllAndRestorePredetectedTablesButtons();
  },

  toggleClearAllAndRestorePredetectedTablesButtons: function(){
    // if tables weren't autodetected, don't tease the user with an autodetect button that won't work.
    var numOfSelectionsOnPage = this.ui.total_selections();
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

  toggleDownloadAllAndClearButtons: function() {
      if (this.ui.total_selections() > 0) {
          $('#all-data, #clear-all-selections').removeAttr('disabled');
      }
      else {
          $('#all-data, #clear-all-selections').attr('disabled', 'disabled');
      }
  },

  initialize: function(){
    _.bindAll(this, 'updateShouldPreviewDataAutomaticallyButton', 'query_all_data', 'render');
  },


  /*TODO: get the parent, get the document_view, get all of its children, get all of their imgAreaSelects
   * then loop over all of them.
   */
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
    this.doQuery(PDF_ID, all_coords);
  },


  render: function(){
    //make the "follow you around bar" actually follow you around. ("sticky nav")
    $('.followyouaroundbar').affix({top: 70 });

    this.$el.html(this.template({
                  }));


    return this;
  },
});

Tabula.SidebarView = Backbone.View.extend({ // only one
  tagName: 'ul',
  className: 'thumbnail-list',
});

Tabula.ThumbnailView = Backbone.View.extend({ // one per page
  'events': {
    //TODO:  on load, create an empty div with class 'selection-show' to be the selection thumbnail.
    'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); },
  },
  tagName: 'li',
  className: "thumbnail pdf-page",
  id: function(){
    return 'thumb-page-' + this.model.get('number');
  },

  // initialize: function(){
  //   this.$img = this.$el.children('img');
  //   this.img = this.$img[0];
  // },
  template: Handlebars.compile($('#templates #thumbnail-template').html()),

  initialize: function(){
    _.bindAll(this, 'render');
  },

  render: function(){
    if(this.model.get('deleted')){
         return;
    }

    //TODO: use a real templating language.
    this.$el.attr('data-page', this.model.get('number'))
            .attr('data-original-width', this.model.get('width'))
            .attr('data-original-height', this.model.get('height'))
            .attr('data-rotation', this.model.get('rotation'));
    this.$el.html(this.template({
                    'number': this.model.get('number'),
                    'image_url': this.model.get('image_url')
                  }));

    if(this.model.number == 1){
      this.$el.find('img').attr('data-position', "right")
         .attr('data-intro', "Click a thumbnail to skip directly to that page.");
    }

    return this;
  },

  showSelectionThumbnail: function(selection) {
    $el.append( $('<div class="selection-show" id="selection-show-' + selection.id + '" />').css('display', 'block') );
    var sshow = $('#thumb-' + $img.attr('id') + ' #selection-show-' + selection.id);
    var thumbScale = $('#thumb-' + $img.attr('id') + ' img').width() / $img.width();
    $(sshow).css('top', selection.y1 * thumbScale + 'px')
        .css('left', selection.x1 * thumbScale + 'px')
        .css('width', ((selection.x2 - selection.x1) * thumbScale) + 'px')
        .css('height', ((selection.y2 - selection.y1) * thumbScale) + 'px');
  },
})

Tabula.UI = Backbone.View.extend({
    el : '#tabula-app',

    events : {
      'click a.tooltip-modal': 'tooltip',
      'hide #data-modal' : function(){ clip.unglue('#copy-csv-to-clipboard'); },
      'click a#help-start': function(){ Tabula.tour.ended ? Tabula.tour.restart(true) : Tabula.tour.start(true); },
    },
    $loading: $('#loading'),
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    lastQuery: [{}],
    lastSelection: undefined,
    pageCount: undefined,
    components: {},

    model: Document,

    initialize: function(){
      _.bindAll(this, 'render', 'redoQuery');

      this.pdf_document = new Document({
        pdf_id: PDF_ID,
      });

      this.listenTo(this.pdf_document.page_collection, 'all', this.render);
      this.listenTo(this.pdf_document.page_collection, 'add', this.addOne);
      this.listenTo(this.pdf_document.page_collection, 'reset', this.addAll);


      this.components['document_view'] = new Tabula.DocumentView({ui: this}); //creates page_views
      this.components['control_panel'] = new Tabula.ControlPanelView({ui: this});
      this.components['sidebar_view'] = new Tabula.SidebarView({ui: this}); //TODO: create thumbnail_views 
      
      this.pdf_document.page_collection.fetch();
    },

    addOne: function(page) {
      var page_view = new Tabula.PageView({model: page});
      var thumbnail_view = new Tabula.ThumbnailView({model: page})
      this.components['document_view'].$el.append(page_view.render().el); // is this a good idea? TODO: 
      this.components['sidebar_view'].$el.append(thumbnail_view.render().el); // is this a good idea? TODO: 
    },

    addAll: function() {
      Pages.each(this.addOne, this);
    },

    total_selections: function(){
      return _.reduce(imgAreaSelects, function(memo, s){
        if(s){
          return memo + s.getSelections().length;
        }else{
          return memo;
        }
      }, 0);
    },

    render : function(){
      $('#main-container').append(this.components['document_view'].render().el);
      $('#control-panel-container').append(this.components['control_panel'].render().el);
      $('.sidebar-nav.well').append(this.components['sidebar_view'].render().el);

      query_parameters = {};

      this.pageCount = this.pdf_document.page_collection.size();

      /* TODO: do this stuff somewhere
       * this.setAdvancedOptionsShown();
       * this.updateExtractionMethodButton();
       */

      // render out the components, as necessary
      return this;
    },

    createTour: function(){
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
    },

    redoQuery: function(options) {
      //TODO: stash lastCoords, rather than stashing lastQuery and then parsing it.
      this.doQuery(PDF_ID,
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

        $.get('/debug/' + PDF_ID + '/rulings',
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
      return this._debugRectangularShapes(image, '/debug/' + PDF_ID + '/characters');
    },

    debugClippingPaths: function(image) {
      return this._debugRectangularShapes(image, '/debug/' + PDF_ID + '/clipping_paths');
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
      return this._debugRectangularShapes(image, '/debug/' + PDF_ID + '/text_chunks');
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
            $('#modal-error textarea').html(xhr.responseText);
            $('#modal-error').modal();
            if (options !== undefined && _.isFunction(options.error))
              options.error(resp);

          })
        });
    },

    drawDetectedTables: function($img, tableGuesses){
      alert("not yet reimplemented"); return; //TODO:

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

});

// old fetch code
// /* pdfs/<PDF_ID>/tables.json may or may not exist, depending on whether the user chooses to use table autodetection. */
// getTablesJson : function(){
//   $.getJSON("/pdfs/" + PDF_ID + "/pages.json?_=" + Math.round(+new Date()).toString(),
//       _.bind(function(pages){
//         $.getJSON("/pdfs/" + PDF_ID + "/tables.json",
//           _.bind(function(tableGuesses){
//             this.render();
//             this.components['document_view'].createImgareaselects(tableGuesses, pages);
//             //TODO: draw selections on thumbnails (also on lines below, in error callbacks)
//           }, this)).
//           error( _.bind(function(){ this.components['document_view'].createImgareaselects([], pages) }, this));
//       }, this) ).
//       error( _.bind(function(){ this.components['document_view'].createImgareaselects([], []) }, this));
// },


$(function () {
  Tabula.ui = new Tabula.UI();
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
