Tabula = {};

var clip = null;

PDF_ID = window.location.pathname.split('/')[2];

// bootstrap 2 only, fix for multiple modal recursion error: http://stackoverflow.com/questions/13649459/twitter-bootstrap-multiple-modal-error
$.fn.modal.Constructor.prototype.enforceFocus = function () {};

ZeroClipboard.config( { swfPath: "/swf/ZeroClipboard.swf" } );

Tabula.Page = Backbone.Model.extend({
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

Tabula.Pages = Backbone.Collection.extend({
  model: Tabula.Page,
  url: null, //set on initialize
  initialize: function(){
    this.url = '/pdfs/' + PDF_ID + '/pages.json?_=' + Math.round(+new Date()).toString();
  },
});

Tabula.Document = Backbone.Model.extend({
  page_collection: null, //set on initialize
  selections: null, //set on initialize
  pdf_id: PDF_ID, //set on initialize
  initialize: function(options){
    this.page_collection = new Tabula.Pages([], {pdf_document: this})
    this.selections = new Tabula.Selections([], {pdf_document: this})
  }
});

Tabula.Selection = Backbone.Model.extend({
  pdf_id: PDF_ID,

  initialize: function(){
    _.bindAll(this, 'queryForData', 'repeatLassos')
  },

  queryForData: function(){
    var page = Tabula.ui.pdf_document.page_collection.at(this.get('page_number') - 1);
    //TODO: break out query handling into a new method.
    var imageWidth = this.get('imageWidth');

    var pdf_width = page.get('width'); 
    var pdf_height = page.get('height'); 
    var pdf_rotation = page.get('rotation');

    var scale = (Math.abs(pdf_rotation) == 90 ? pdf_height : pdf_width) / imageWidth;

    var selection_coords = {
        x1: this.get('x1') * scale,
        x2: this.get('x2') * scale,
        y1: this.get('y1') * scale,
        y2: this.get('y2') * scale,
        page: this.get('page_number'),
        extraction_method: this.get('extractionMethod') || 'guess',
    };
    Tabula.ui.query = new Tabula.Query({list_of_coords: [selection_coords], selection: this.get('extractionMethod')}); 
    Tabula.ui.createDataView();
    Tabula.ui.query.doQuery();
  },

  repeatLassos: function(e) {
    this.pdf_document.page_collection.each(function(page){
      if(this.get('page_number') < page.get('page_number')){          // for each page after this one,
        imgAreaSelectAPIObj = this.ui.imgAreaSelects[page.get('page_number') - 1]
        if (imgAreaSelectAPIObj === false) return;

        imgAreaSelectAPIObj.cancelSelections();                      // notify the imgAreaSelect of the new selection
        iasSelection = imgAreaSelectAPIObj.createNewSelection(this.get('x1'), 
                                                              this.get('y1'),   
                                                              this.get('x2'), 
                                                              this.get('y2'));
        imgAreaSelectAPIObj.setOptions({show: true});
        imgAreaSelectAPIObj.update();

        new_selection = this.clone();                                // and create a new Selection.
        new_selection.set('page_number', page.get('page_number'));
        new_selection.set('iasId', iasSelection.id);
        this.collection.add(new_selection);
        /* which causes thumbnails to be created, Download All button to know about these selections. */
      }
    });

    //TODO: notify UI to remove each repeated selection's Repeat Lassos button.
    // Old code for that: 
    //   //remove the button
    //   $(e.currentTarget).fadeOut(500, function() { $(this).remove(); });

  },
});

//TODO: write this to localStorage sometimes.
//TODO: get values here from localStroage on startup
Tabula.Options = Backbone.Model.extend({
  initialize: function(){
    this.set('multiselect_mode', true);
    this.set('extraction_method', null);
    this.set('show_advanced_options', localStorage.getItem("tabula-show-advanced-options"))
  },
});

/* What the hell are you doing here, Jeremy? 
  The canonical store of selections now needs to be in Backbone, not in imgareaselect.
  The UI can listen to the Selections; imgAreaselect creates adds to the collection,
  causing the thumbnail to be drawn.

  Clearing or repeating is much easier, because we don't have to mess around with the UI.
  Querying all is likewise easy.

  We could also store extraction option info on the selections, if we want.

  On imgareaselect's _onSelectEnd, add the selection to Selections

  On Selections's remove (or change), find the right imgAreaSelect
*/

Tabula.Selections = Backbone.Collection.extend({
  model: Tabula.Selection,
  url: null, //set on init
  initialize: function(){
    this.url = '/pdfs/' + PDF_ID + '/tables.json?_=' + Math.round(+new Date()).toString();
    _.bindAll(this, 'findByIasId', 'updateOrCreateByIasId');
  },

  findByIasId: function(iasId, pageNumber){
    return this.find(function(selection){ return (selection.get('iasId') == iasId && selection.get('page_number') == pageNumber) });
  },

  updateOrCreateByIasId: function(iasSelection, pageNumber, imageWidth){
    var selection = this.findByIasId(iasSelection.id, pageNumber);
      if(selection){ // if it already exists
        selection.set(iasSelection);
      }else{
        new_selection_args = _.extend({'page_number': pageNumber, 
                                      'imageWidth': imageWidth, 
                                      'iasId': iasSelection.id,
                                      'extractionMethod': Tabula.ui.options.extraction_method,
                                      'pdf_document': this.pdf_document}, 
                                      _.omit(iasSelection, 'id'))
        selection = new Tabula.Selection(new_selection_args);
        console.log("add", new_selection_args);
        this.add(selection);
      }
      return selection;
  }


});

Tabula.Query = Backbone.Model.extend({
  //has selections, data
  //pertains to DataView

  // on modal exit, destroy this.ui.query
  // on selection end or download all button, create this.ui.query
  // in the modal, modify and requery.

  initialize: function(){
    // should be inited with list_of_coords
    _.bindAll(this, 'doQuery');
  },

  doQuery: function(options) {
    this.query_data = {
      'coords': JSON.stringify(this.get('list_of_coords')),
      'extraction_method': Tabula.ui.options.get('extraction_method')
    }

    this.trigger("tabula:query-start");
    $.ajax({
        type: 'POST',
        url: '/pdf/' + PDF_ID + '/data',
        data: this.query_data,
        success: _.bind(function(resp) {
          this.set('data', resp);
          this.trigger("tabula:query-success");

          // this only happens on the first select, when we don't know what the extraction method is yet
          // (because it's set by the heuristic).
          // TODO: only set this on the modal, not globally
          // TODO: only do this if only one coord_set is in this query.
          // TODO: let radio buttons all be unset.
          Tabula.ui.options.set('extraction_method', resp[0]["extraction_method"]);

          if (options !== undefined && _.isFunction(options.success)){
            Tabula.ui.options.success(resp);
          }

          }, this),
        error: _.bind(function(xhr, status, error) {
          Tabula.ui.components['data_view'].hideAndTrash();
          $('#modal-error textarea').html(xhr.responseText);
          $('#modal-error').modal('show');
          if (options !== undefined && _.isFunction(options.error))
            options.error(resp);
        }, this),
      });
  },
})

Tabula.DataView = Backbone.View.extend({  //only one, is the data modal.
  el: '#data-modal',
  $loading: $('#loading'),
  template: Handlebars.compile($('#templates #modal-footer-template').html()), 
  events: {
    'click .download-dropdown': 'dropDownOrUp',
    'click .extraction-method-btn:not(.active)': 'queryWithToggledExtractionMethod',
    'click .toggle-advanced-options': 'toggleAdvancedOptionsShown',
    'click .show-advanced-options': 'showAdvancedOptions',
    'click .hide-advanced-options': 'hideAdvancedOptions',
    'hidden': 'trash'
    //N.B.: Download button (and format-specific download buttons) are an HTML form.
    //TODO: handle flash clipboard thingy here.
  },
  ui: null, //added on create
  extractionMethod: "guess",

  initialize: function(stuff){
    _.bindAll(this, 'render', 'renderLoading', 'renderFooter', 'renderTable', 'showAdvancedOptions','hideAdvancedOptions', 'dropDownOrUp', 'queryWithToggledExtractionMethod', 'getOppositeExtractionMethod', 'trash', 'hideAndTrash', 'renderUnlessMultiSelect');
    this.ui = stuff.ui;
    this.listenTo(this.model, 'tabula:query-start', this.renderUnlessMultiSelect);
    this.listenTo(this.model, 'tabula:query-success', this.renderUnlessMultiSelect);
    this.$modalBody = this.$el.find('.modal-body');
  },

  hideAndTrash: function(){
    this.$el.modal('hide');
    this.trash();
  },

  trash: function(){
    this.undelegateEvents();
    Tabula.ui.trashDataView();
    return this;
  },

  renderLoading: function(){
    $('#switch-method').prop('disabled', true);
    this.$modalBody.prepend(this.$loading.show());
    this.$el.find('.modal-body table').css('visibility', 'hidden');
    this.$modalBody.css('overflow', 'hidden');
    return this;
  },

  renderUnlessMultiSelect: function(){
    console.log(Tabula.ui.options.get('multiselect_mode'));
    if(!Tabula.ui.options.get('multiselect_mode')){
      this.render();
    }
  },

  render: function(){
    this.$el.modal('show'); //bootstrap stuff

    if(!this.model.get('data')){
      this.renderLoading();
      this.renderFooter();
    }else{
      this.renderTable();
      this.renderFooter();
    }

    this.$el.find('.has-tooltip').tooltip();

    return this;
  },

  renderFooter: function(){

    templateOptions = {
      extractionMethodDisabled: _.isNull(this.model.data) ? 'disabled="disabled"' : '',
      pdf_id: PDF_ID,
      list_of_coords: this.model.get('list_of_coords'),
      copyDisabled: Tabula.ui.flash_borked ? 'disabled="disabled" data-toggle="tooltip" title="'+Tabula.ui.flash_borken_message+'"' : '',
    }
    //TODO: on create, show/hide advanced options area as necessary from this.ui.options

    if (Tabula.ui.flash_borked){
      this.$el.find('#copy-csv-to-clipboard').addClass('has-tooltip');
    }

    $('#' + this.ui.options.get('extraction_method') + '-method-btn').button('toggle');
    this.$el.find(".modal-footer-container").html(this.template(templateOptions));
  },

  renderTable: function(){
    this.$loading = this.$loading.detach();
    this.$el.find('.modal-body table').css('visibility', 'visible');
    this.$modalBody.css('overflow', 'auto');

    var tableHTML = '<table class="table table-condensed table-bordered">';
    // this.data is a list of responses (because we sent a list of coordinate sets)
    $.each(_.pluck(this.model.get('data'), 'data'), function(i, rows) {
      $.each(rows, function(j, row) {
        tableHTML += '<tr><td>' + _.pluck(row, 'text').join('</td><td>') + '</td></tr>';
      });
    });
    tableHTML += '</table>';
    this.$modalBody.html(tableHTML);

    if(!Tabula.ui.client){
      Tabula.ui.client = new ZeroClipboard();
    }

    Tabula.ui.client.on( 'ready', _.bind(function(event) {
      Tabula.ui.client.clip( this.$el.find("#copy-csv-to-clipboard") );

      Tabula.ui.client.on( 'copy', _.bind(function(event) {
        var clipboard = event.clipboardData;
        var tableData = this.$el.find('.modal-body table').table2CSV({delivery: null})
        clipboard.setData( 'text/plain', tableData );
      }, this) );

      Tabula.ui.client.on( 'aftercopy', function(event) {
        $('#data-modal #copy-csv-to-clipboard').css('display', 'inline').delay(900).fadeOut('slow');
      } );
    }, this) );

    Tabula.ui.client.on( 'error', _.bind(function(event) {
      //disable all clipboard buttons, add tooltip, event.message
      Tabula.ui.flash_borked = true;
      Tabula.ui.flash_borken_message = event.message;
      this.$el.find('#copy-csv-to-clipboard').addClass('has-tooltip').tooltip();
      console.log( 'ZeroClipboard error of type "' + event.name + '": ' + event.message );
      ZeroClipboard.destroy();
    },this) );

    return this;
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

  showAdvancedOptions: function(){
    this.ui.options.set('show_advanced_options', true);
    var $advancedOptions = $('#advanced-options');
    var $advancedShowButton = $('#basic-options .show-advanced-options');
    $advancedOptions.slideDown();
    $advancedShowButton.hide();
  },
  hideAdvancedOptions: function(){
    this.ui.options.set('show_advanced_options', false);
    var $advancedOptions = $('#advanced-options');
    var $advancedShowButton = $('#basic-options .show-advanced-options');
    $advancedOptions.slideUp();
    $advancedShowButton.show();
  },

  queryWithToggledExtractionMethod: function(e){
    this.ui.options.set('extraction_method', this.getOppositeExtractionMethod());
    Tabula.ui.query.set('extraction_method', this.getOppositeExtractionMethod());
    Tabula.ui.query.doQuery();
  },

  getOppositeExtractionMethod: function(){
    if (this.ui.options.get('extraction_method') == "guess"){
      return; // this should never happen.
    }
    else if (this.ui.options.get('extraction_method') == "original") {
      return "spreadsheet";
    }
    return "original";
  },

});

Tabula.DocumentView = Backbone.View.extend({ //only one
  events: {
    'click button.close#directions' : 'moveSelectionsUp',
  },
  ui: null, //added on create
  page_views: [],

  /* when the Directions area is closed, the pages themselves move up, because they're just normally positioned.
   * The selections on those images, though, do not, and need to be moved up separately.
   */
  // TODO: also move up the repeat lasso button (or change the HTML structure so that this method does that)
  moveSelectionsUp: function(){
    $('div.imgareaselect').each(function(){ 
      $(this).offset({top: $(this).offset()["top"] - $(directionsRow).height() }); 
    });
  },

  initialize: function(stuff){
    _.bindAll(this, 'createImgareaselects', 'render');
    this.ui = stuff.ui;
  },

  render: function(){
    return this;
  },

  //TODO: delegate creating imgareaselect to each child page_view. 

  createImgareaselects : function(tableGuessesTmp, pages){
    var selectsNotYetLoaded = _(pages).filter(function(page){ return !page['deleted']}).length;
    this.ui.tableGuesses = tableGuessesTmp;

    function drawDetectedTablesIfAllAreLoaded(){
      selectsNotYetLoaded--;
      if(selectsNotYetLoaded == 0){
        for(var imageIndex=0; imageIndex < this.ui.imgAreaSelects.length; imageIndex++){
          var pageIndex = imageIndex + 1;
          if(this.ui.imgAreaSelects[imageIndex]){ //not undefined
            this.drawDetectedTables( $('img#page-' + pageIndex), tableGuesses );
          }
        }
      }
    }

    this.ui.imgAreaSelects = _(this.page_collection).map(function(page_view, i){
      return page_view.createImgareaselect(null, drawDetectedTablesIfAllAreLoaded);
    });
  }

});

//TODO: switch back to underscore templates, remove handlebars dependency

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

  initialize: function(stuff){
    this.ui = stuff.ui;
    _.bindAll(this, 'createImgareaselect', 'rotate_page', 'delete_page', 
      '_onSelectStart', '_onSelectChange', '_onSelectEnd', '_onSelectCancel', 'render');
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


    Tabula.ui.imgAreaSelects.push( this.createImgareaselect() ); //TODO: is this gross?
    return this;
  },

  createImgareaselect: function(tableGuessesTmp, drawDetectedTablesIfAllAreLoaded){
    if (this.model.get('deleted')) {
      return false;
    }

    this.$image = this.$el.find('img');
    return this.$image.imgAreaSelect({
      handles: true,
      instance: true,
      allowOverlaps: false,
      show: true,
      multipleSelections: true,

      onSelectStart: this._onSelectStart,
      onSelectChange: this._onSelectChange,
      onSelectEnd: this._onSelectEnd,
      onSelectCancel: this._onSelectCancel,
      onInit: drawDetectedTablesIfAllAreLoaded
    });
  },

  _onSelectStart: function(img, iasSelection) {
    Tabula.ui.pdf_document.selections.updateOrCreateByIasId(iasSelection, this.model.get('number'), this.$image.width()); 
  },

  _onSelectChange: function(img, iasSelection) {
    Tabula.ui.pdf_document.selections.updateOrCreateByIasId(iasSelection, this.model.get('number'), this.$image.width());
    
    // This is for moving the repeat lassos button, I think. -Jeremy 7/31/14
    var b;
    var but_id = $(img).attr('id') + '-' + iasSelection.id;
    if (b = $('button#' + but_id)) {
        var img_pos = $(img).offset();
        $(b)
            .css({
                top: img_pos.top + iasSelection.y1 + iasSelection.height - $('button#' + but_id).height() * 1.5,
                left: img_pos.left + iasSelection.x1 + iasSelection.width + 5
            })
            .data('selection', iasSelection);
    }
  },

  //TODO: deal with this.
  _onSelectEnd: function(img, iasSelection) {
    var selection = Tabula.ui.pdf_document.selections.updateOrCreateByIasId(iasSelection, this.model.get('number'), this.$image.width());

    //TODO: deal with invalid/too-small iasSelections somehow (including thumbnails)
    if (iasSelection.width == 0 && iasSelection.height == 0) {
        $('#thumb-' + $(img).attr('id') + ' #iasSelection-show-' + iasSelection.id).css('display', 'none');
    }
    //TODO: this is dumb, get rid of it. (This just means that very small selections appear on the page
    // but don't actually ever get queried.)
    if (iasSelection.height * iasSelection.width < 5000) return; 
    
    //TODO: deal with this.
    // create button for repeating lassos, only if there are more pages after this
    if (this.pageCount > $(img).data('page')) {
        var but_id = $(img).attr('id') + '-' + iasSelection.id;
        $('body').append('<button class="btn repeat-lassos" id="'+but_id+'">Repeat this iasSelection</button>');
        var img_pos = $(img).offset();
        $('button#' + but_id)
            .css({
                position: 'absolute',
                top: img_pos.top + iasSelection.y1 + iasSelection.height - $('button#' + but_id).height() * 1.5,
                left: img_pos.left + iasSelection.x1 + iasSelection.width + 5
            })
            .data('selection', iasSelection);
    }

    if(!this.shouldPreviewDataAutomatically){
        selection.queryForData();
    }
    Tabula.ui.components['control_panel'].render(); // deal with buttons that need blurred out if there's zero selections, etc.
  },

  // iasSelection
  _onSelectCancel: function(img, iasSelection) {
    // remove repeat lassos button
    var but_id = $(img).attr('id') + '-' + iasSelection.id;
    $('button#' + but_id).remove();
    // find and remove the canceled selection from the collection of selections. (triggering remove events).
    var selection = Tabula.ui.pdf_document.selections.findWhere({iasId: iasSelection.id, page_number: this.model.get('number')});
    console.log("cancel2", selection.cid.toString(), selection.get('iasId'), selection.get('page_number').toString());
    Tabula.ui.pdf_document.selections.remove(selection);

    Tabula.ui.components['control_panel'].render(); // deal with buttons that need blurred out if there's zero selections, etc.
  },

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
              this.ui.imgAreaSelects[page_number-1].remove();
              delete this.ui.imgAreaSelects[page_number-1];

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
//     'click button.repeat-lassos': 'repeatLassos',
//   }
//   page_view: null, //added on create. //TODO: do this.

// });

Tabula.ControlPanelView = Backbone.View.extend({ // only one
  events: {
    'click #should-preview-data-checkbox' : 'updateShouldPreviewDataAutomaticallyButton',
    'click #clear-all-selections': 'clear_all_selection',
    'click #restore-detected-tables': 'restore_detected_tables',
    'click #all-data': 'query_all_data',
    'click #repeat-lassos': 'repeatLassos',
  },
  className: 'followyouaroundbar',

  template: Handlebars.compile($('#templates #control-panel-template').html()),

  shouldPreviewDataAutomatically: !$('#should-preview-data-checkbox').is(':checked'),

  updateShouldPreviewDataAutomaticallyButton: function(){
    this.ui.options.set('multiselect_mode', !$('#should-preview-data-checkbox').is(':checked'))
    this.render();
  },

  repeatFirstPageLassos: function(){
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
    _(this.ui.imgAreaSelects).each(function(imgAreaSelectAPIObj){
        if (imgAreaSelectAPIObj === false) return;
        imgAreaSelectAPIObj.cancelSelections();
    });
  },

  restore_detected_tables: function(){
    for(var imageIndex=0; imageIndex < this.ui.imgAreaSelects.length; imageIndex++){
      var pageIndex = imageIndex + 1;
      this.drawDetectedTables( $('img#page-' + pageIndex), tableGuesses );
    }
    this.toggleClearAllAndRestorePredetectedTablesButtons();
  },

  initialize: function(stuff){
    this.ui = stuff.ui
    _.bindAll(this, 'updateShouldPreviewDataAutomaticallyButton', 'query_all_data', 'render');
  },


  /*TODO: get the parent, get the document_view, get all of its children, get all of their imgAreaSelects
   * then loop over all of them.
   */
  query_all_data : function(){
    list_of_all_coords = [];
    this.ui.imgAreaSelects.forEach(function(imgAreaSelectAPIObj){
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
          list_of_all_coords.push(new_coord);
      });
    });
    this.doQuery(PDF_ID, list_of_all_coords);
  },

  render: function(){
    // makes the "follow you around bar" actually follow you around. ("sticky nav")
    $('.followyouaroundbar').affix({top: 70 });

    var numOfSelectionsOnPage = this.ui.totalSelections();
    console.log('numOfSelectionsOnPage', numOfSelectionsOnPage);
    this.$el.html(this.template({
                  'if_multiselect_checked': this.ui.options.get('multiselect_mode') ? '' : 'checked="checked"',
                  'disable_clear_all_selections': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '' ,
                  'disable_download_all': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '',
                  'show_restore_detected-tables': this.ui.hasPredetectedTables() && numOfSelectionsOnPage <= 0,
                  }));

    return this;
  },
});

Tabula.SidebarView = Backbone.View.extend({ // only one
  tagName: 'ul',
  className: 'thumbnail-list',
  thumbnail_views: [],
  ui: null, // defined on initialize
  initialize: function(stuff){
    this.ui = stuff.ui;
    _.bindAll(this, 'addThumbnail', 'removeThumbnail', 'changeThumbnail')
    //TODO: the methods for handling these
    this.listenTo(this.ui.pdf_document.selections, 'all', this.render);
    this.listenTo(this.ui.pdf_document.selections, 'add', this.addThumbnail); // render a thumbnail selection
    this.listenTo(this.ui.pdf_document.selections, 'change', this.changeThumbnail); // render a thumbnail selection
    this.listenTo(this.ui.pdf_document.selections, 'remove', this.removeThumbnail); // remove a thumbnail selection
    //TODO: this.listenTo(this.ui.pdf_document.selections, 'reset', this.addAll); // remove all, then render new ones
  },
  addThumbnail: function (new_selection){
    //TODO: sometimes thumbnails get drawn on the wrong page!!
    console.log(new_selection, new_selection.get('page_number'));
    this.thumbnail_views[new_selection.get('page_number') - 1].createSelectionThumbnail(new_selection)
  },
  changeThumbnail: function (selection){
    this.thumbnail_views[selection.get('page_number') - 1].changeSelectionThumbnail(selection)
  },
  removeThumbnail: function (selection){
    console.log("removeThumbnail", selection);
    this.thumbnail_views[selection.get('page_number') - 1].removeSelectionThumbnail(selection)
  }
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
  // },
  template: Handlebars.compile($('#templates #thumbnail-template').html()),

  initialize: function(){
    _.bindAll(this, 'render', 'createSelectionThumbnail', 'changeSelectionThumbnail', 'removeSelectionThumbnail');
  },

  render: function(){
    if(this.model.get('deleted')){
         return;
    }

    // TODO: redundant?
    // this.$el.attr('data-page', this.model.get('number'))
    //         .attr('data-original-width', this.model.get('width'))
    //         .attr('data-original-height', this.model.get('height'))
    //         .attr('data-rotation', this.model.get('rotation'));
    this.$el.html(this.template({
                    'number': this.model.get('number'),
                    'image_url': this.model.get('image_url')
                  }));

    if(this.model.get('number') == 1){
      this.$el.find('img').attr('data-position', "right")
         .attr('data-intro', "Click a thumbnail to skip directly to that page.");
    }

    // stash some selectors (which don't exist at init)
    this.$img = this.$el.find('img');
    this.img = this.$img[0];

    return this;
  },

  createSelectionThumbnail: function(selection) {
    var $sshow = $('<div class="selection-show" id="selection-show-' + selection.cid + '" />').css('display', 'block');
    this.$el.append( $sshow );
    this.changeSelectionThumbnail(selection);
  },

  changeSelectionThumbnail: function(selection){
    var $sshow = this.$el.find('#selection-show-' + selection.cid);
    var thumbScale = this.$img.width() / selection.get('imageWidth');

    $sshow.css('top', selection.get('y1') * thumbScale + 'px')
        .css('left', selection.get('x1') * thumbScale + 'px')
        .css('width', ((selection.get('x2') - selection.get('x1')) * thumbScale) + 'px')
        .css('height', ((selection.get('y2') - selection.get('y1')) * thumbScale) + 'px');
  },

  removeSelectionThumbnail: function(selection){
    console.log('remove', selection);
    var $sshow = this.$el.find('#selection-show-' + selection.cid);
    $sshow.remove();
  }
})

Tabula.UI = Backbone.View.extend({
    el : '#tabula-app',

    events : {
      'click a.tooltip-modal': 'tooltip',
      'click a#help-start': function(){ Tabula.tour.ended ? Tabula.tour.restart(true) : Tabula.tour.start(true); },
    },
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    lastQuery: [{}],
    pageCount: undefined,
    components: {},
    imgAreaSelects: [],

    global_options: null,

    model: Tabula.Document,

    //TODO: add the little Help box above the pages.

    initialize: function(){
      _.bindAll(this, 'render', 'hasPredetectedTables', 'addOne', 'addAll', 'totalSelections',
        'createDataView','trashDataView');

      this.pdf_document = new Tabula.Document({
        pdf_id: PDF_ID,
      });

      this.options = new Tabula.Options();

      this.createTour();

      this.listenTo(this.pdf_document.page_collection, 'all', this.render);
      this.listenTo(this.pdf_document.page_collection, 'add', this.addOne);
      this.listenTo(this.pdf_document.page_collection, 'reset', this.addAll);

      this.components['document_view'] = new Tabula.DocumentView({ui: this}); //creates page_views
      this.components['control_panel'] = new Tabula.ControlPanelView({ui: this});
      this.components['sidebar_view'] = new Tabula.SidebarView({ui: this});

      this.pdf_document.page_collection.fetch();
    },

    createDataView: function(){
      this.components['data_view'] = new Tabula.DataView({ui: this, model: Tabula.ui.query});
    },

    trashDataView: function(){
      this.components['data_view'] = null;
    },

    hasPredetectedTables: function(){
      return false; !_(tableGuesses).isEmpty()
    },

    addOne: function(page) {
      var page_view = new Tabula.PageView({model: page, collection: this.pdf_document.page_collection});
      var thumbnail_view = new Tabula.ThumbnailView({model: page, collection: this.pdf_document.page_collection})
      this.components['document_view'].page_views.push(page_view);
      this.components['sidebar_view'].thumbnail_views.push(thumbnail_view);
      this.components['document_view'].$el.append(page_view.render().el); // is this a good idea? TODO: 
      this.components['sidebar_view'].$el.append(thumbnail_view.render().el); // is this a good idea? TODO: 
    },

    addAll: function() {
      this.pdf_document.page_collection.each(this.addOne, this);
    },

    totalSelections: function(){
      if(_.isUndefined(this.imgAreaSelects)){
        return 0;
      }

      return _.reduce(this.imgAreaSelects, function(memo, s){
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

      $('.has-tooltip').tooltip();

      //TODO: render, but hide, the dataview too.

      query_parameters = {};

      this.pageCount = this.pdf_document.page_collection.size();

      /* TODO: do this stuff somewhere
       * this.setAdvancedOptionsShown();
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

      var list_of_coords = JSON.parse(this.lastQuery.coords);

      Tabula.ui.query.doQuery({
        success: _.bind(function(data) {
                   var colors = this.colors;
                   console.log(list_of_coords);
                   $.each(data[0].vertical_separators, function(i, vert) {
                     newCanvas.drawLine({
                       strokeStyle: colors[i % colors.length],
                       strokeWidth: 1,
                       x1: vert * scale, y1: list_of_coords[0].y1 * scale,
                       x2: vert * scale, y2: list_of_coords[0].y2 * scale
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

    // doQuery was here
    drawDetectedTables: function($img, tableGuesses){
      alert("not yet reimplemented"); return; //TODO:

      //$img = $(e);
      var imageIndex = $img.data('page');
      arrayIndex = imageIndex - 1;
      var imgAreaSelectAPIObj = this.ui.imgAreaSelects[arrayIndex];

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
            this.createSelectionThumbnail($img, selection); //TODO: api changed.
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
