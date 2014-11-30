Tabula = Tabula || {};

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
  comparator: 'number',
  initialize: function(){
    this.url = '/pdfs/' + PDF_ID + '/pages.json?_=' + Math.round(+new Date()).toString();
  }
});

Tabula.Document = Backbone.Model.extend({
  page_collection: null, //set on initialize
  selections: null, //set on initialize
  pdf_id: PDF_ID, //set on initialize
  initialize: function(options){
    this.page_collection = new Tabula.Pages([], {pdf_document: this});
    this.selections = new Tabula.Selections([], {pdf_document: this});
  }
});

Tabula.Selection = Backbone.Model.extend({
  pdf_id: PDF_ID,

  initialize: function(){
    _.bindAll(this, 'queryForData', 'repeatLassos', 'toCoords');
  },


  // XXX TODO I don't like that a model (selection) takes care of
  // controlling a view (Manuel)
  queryForData: function(){
    var selection_coords = this.toCoords();
    Tabula.pdf_view.query = new Tabula.Query({list_of_coords: [selection_coords], extraction_method: this.get('extractionMethod')});
    Tabula.pdf_view.createDataView();
    Tabula.pdf_view.query.doQuery();
  },

  toCoords: function(){
    var page = Tabula.pdf_view.pdf_document.page_collection.at(this.get('page_number') - 1);
    var imageWidth = this.get('imageWidth');

    var original_pdf_width = page.get('width');
    var original_pdf_height = page.get('height');
    var pdf_rotation = page.get('rotation');

    var scale = (Math.abs(pdf_rotation) == 90 ? original_pdf_height : original_pdf_width) / imageWidth;

    var rp = this.attributes.getDims().relativePos;
    var selection_coords = {
      x1: rp.left * scale,
      x2: (rp.left + rp.width) * scale,
      y1: rp.top * scale,
      y2: (rp.top + rp.height) * scale,
      page: this.get('page_number'),
      extraction_method: this.get('extractionMethod') || 'guess',
      selection_id: this.id
    };
    return selection_coords;
  },

  // XXX Refactor for ResizableSelection
  repeatLassos: function() {
    Tabula.pdf_view.pdf_document.page_collection.each(_.bind(function(page){
      if(this.get('page_number') < page.get('number')){          // for each page after this one,
        imgAreaSelectAPIObj = Tabula.pdf_view.imgAreaSelects[page.get('number')];
        if (imgAreaSelectAPIObj === false) return;

        imgAreaSelectAPIObj.cancelSelections();                      // notify the imgAreaSelect of the new selection
        iasSelection = imgAreaSelectAPIObj.createNewSelection(this.get('x1'),
                                                              this.get('y1'),
                                                              this.get('x2'),
                                                              this.get('y2'));
        imgAreaSelectAPIObj.setOptions({show: true});
        imgAreaSelectAPIObj.update();

        new_selection = this.clone();                                // and create a new Selection.
        new_selection.set('page_number', page.get('number'));
        new_selection.set('id', page.get('number') * 100000 + iasSelection.id);
        new_selection.id = page.get('number') * 100000 + iasSelection.id;
        this.collection.add(new_selection);
        /* which causes thumbnails to be created, Download All button to know about these selections. */
      }
    }, this));
  },
});

Tabula.Options = Backbone.Model.extend({
  initialize: function(){
    _.bindAll(this, 'write');
    this.set('multiselect_mode', localStorage.getItem("tabula-multiselect-mode") !== "false");
    this.set('extraction_method', null); // don't write this one to localStorage
    this.set('show_advanced_options', localStorage.getItem("tabula-show-advanced-options")  !== "false");
    this.set('show-directions', localStorage.getItem("tabula-show-directions")  !== "false");
  },
  write: function(){
    localStorage.setItem("tabula-multiselect-mode", this.get('multiselect_mode'));
    localStorage.setItem("tabula-show-advanced-options", this.get('show_advanced_options'));
    localStorage.setItem("tabula-show-directions", this.get('show-directions'));
  }
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
    _.bindAll(this, 'updateOrCreateByIasId');
  },

  parse: function(response){
    // a JSON list of pages, which are each just a list of coords
    var tables = [];
    selections = _(response).map(_.bind(function(page_tables, listIndex){
      var pageIndex = listIndex + 1;
      var pageView = Tabula.pdf_view.components['document_view'].page_views[pageIndex];
      var page = pageView.model;

      var original_pdf_width = page.get('width');
      var original_pdf_height = page.get('height');
      var pdf_rotation = page.get('rotation');

      pageView.createTables = _.bind(function(){
        var image_width = pageView.$el.find('img').width();
        var thumb_height = pageView.$el.find('img').height();
        var scale = (original_pdf_width / image_width);
        selections = _(page_tables).map(_.bind(function(tableCoords){
          var my_x2 = tableCoords[0] + tableCoords[2];
          var my_y2 = tableCoords[1] + tableCoords[3];

          var iasSelection = pageView.imgAreaSelect.createNewSelection( Math.floor(tableCoords[0] / scale),
                                        Math.floor(tableCoords[1] / scale),
                                        Math.floor(my_x2 / scale),
                                        Math.floor(my_y2 / scale));

          pageView.imgAreaSelect.setOptions({show: true});
          pageView.imgAreaSelect.update();
          if (!iasSelection){
            return null;
          }

          // put the selection into the selections collection
          selection = this.updateOrCreateByIasId(iasSelection, page.get('number'), image_width);
          return selection;
        }, this));
        pageView.imgAreaSelect.setOptions({show: true});
        return _(selections).select(function(s){ return !!s; });
      }, this);

      if (pageView.iasAlreadyInited){
        selections = pageView.createTables();
      }else{
        selections = [];
      }
      return selections;
    }, this));
    return _.flatten(selections);
  },

  updateOrCreateByIasId: function(iasSelection, pageNumber, imageWidth){
    var selection = this.get(iasSelection.id);

    if (selection) { // if it already exists
      selection.set(_.omit(iasSelection, 'id'));
    }
    else {
      new_selection_args = _.extend({'page_number': pageNumber,
                                    'imageWidth': imageWidth,
                                    'extractionMethod': Tabula.pdf_view.options.extraction_method,
                                    'pdf_document': this.pdf_document},
                                    iasSelection);
      selection = new Tabula.Selection(new_selection_args);
      this.add(selection);
    }
    return selection;
  }

});

Tabula.Query = Backbone.Model.extend({
  //has selections, data
  //pertains to DataView

  // on modal exit, destroy this.pdf_view.query
  // on selection end or download all button, create this.pdf_view.query
  // in the modal, modify and requery.

  initialize: function(){
    // should be inited with list_of_coords
    _.bindAll(this, 'doQuery', 'setExtractionMethod');
  },

  doQuery: function(options) {
    this.query_data = {
      'coords': JSON.stringify(this.get('list_of_coords')),
      // ignored by backend 'extraction_method': Tabula.pdf_view.options.get('extraction_method')
      // because each element of list_of_coords has its own extraction_method key/value
    };

    this.trigger("tabula:query-start");
    $.ajax({
        type: 'POST',
        url: '/pdf/' + PDF_ID + '/data',
        data: this.query_data,
        success: _.bind(function(resp) {
          this.set('data', resp);

          // this only needs to happen on the first select, when we don't know what the extraction method is yet
          // (because it's set by the heuristic on the server-side).
          // TODO: only execute it when one of the list_of_coords has guess or undefined as its extraction_method
          _(_.zip(this.get('list_of_coords'), resp)).each(function(stuff, i){
            var coord_set = stuff[0];
            var resp_item = stuff[1];
            Tabula.pdf_view.pdf_document.selections.get(coord_set.selection_id).
                set('extraction_method', resp_item["extraction_method"]);
            coord_set["extraction_method"] = resp_item["extraction_method"];
          });

          this.trigger("tabula:query-success");

          if (options !== undefined && _.isFunction(options.success)){
            Tabula.pdf_view.options.success(resp);
          }

          }, this),
        error: _.bind(function(xhr, status, error) {
          console.log("error!");
          Tabula.pdf_view.components['data_view'].hideAndTrash();
          $('#modal-error textarea').html(xhr.responseText);
          $('#modal-error').modal('show');
          if (options !== undefined && _.isFunction(options.error))
            options.error(resp);
        }, this),
      });
  },
  setExtractionMethod: function(extractionMethod){
    _(this.get('list_of_coords')).each(function(coord_set){ coord_set['extraction_method'] = extractionMethod; });
  }
});

Tabula.DataView = Backbone.View.extend({  // one per query object.
  el: '#data-modal',
  $loading: $('#loading'),
  template: _.template($('#templates #modal-footer-template').html().replace(/nestedscript/g, 'script')),
  events: {
    'click .download-dropdown': 'dropDownOrUp',
    'click .extraction-method-btn:not(.active)': 'queryWithToggledExtractionMethod',
    'click .toggle-advanced-options': 'toggleAdvancedOptions',
    'click .download-btn': 'setFormAction',
    'hidden': 'handleHidden',
    //N.B.: Download button (and format-specific download buttons) are an HTML form.
    //TODO: handle flash clipboard thingy here.
  },
  pdf_view: null, //added on create
  extractionMethod: "guess",

  initialize: function(stuff){
    _.bindAll(this, 'render', 'renderLoading', 'renderFooter', 'renderTable', 'toggleAdvancedOptions', 'dropDownOrUp', 'queryWithToggledExtractionMethod', 'handleHidden', 'trash', 'hideAndTrash', 'setFormAction');
    this.pdf_view = stuff.pdf_view;
    this.listenTo(this.model, 'tabula:query-start', this.render);
    this.listenTo(this.model, 'tabula:query-success', this.render);
    this.$modalBody = this.$el.find('.modal-body');
  },

  // turns out, bootstrap sucks and when the Tooltips are hidden,
  // they fire the same 'hidden' event as the modal.
  handleHidden: function(e){
    if($(e.target).attr('id') == "data-modal" ) {
      this.trash();
    }
  },

  setFormAction: function(e){
    var formActionUrl = $(e.currentTarget).data('action');
    this.$el.find('form').attr('action', formActionUrl);
  },

  hideAndTrash: function(){
    this.$el.modal('hide');
    this.trash();
  },

  trash: function(e){
    Tabula.pdf_view.trashDataView();
    return this;
  },

  renderLoading: function(){
    this.$modalBody.prepend(this.$loading.show());
    this.$el.find('.modal-body table').css('visibility', 'hidden');
    this.$modalBody.css('overflow', 'hidden');
    return this;
  },

  render: function(){
    this.$el.modal('show'); //bootstrap stuff

    if(!this.model.get('data')){
      this.renderLoading();
      this.renderFooter(true);
    }else{
      this.renderTable();
      this.renderFooter(false);
    }

    this.$el.find('.has-tooltip').tooltip();

    return this;
  },

  renderFooter: function(loading){
    var uniq_extraction_methods = _.uniq(_(this.model.get('list_of_coords')).pluck('extraction_method'));

    templateOptions = {
      extractionMethodDisabled: _.isNull(this.model.data) || uniq_extraction_methods.length > 1 ? 'disabled="disabled"' : '',
      pdf_id: PDF_ID,
      list_of_coords: JSON.stringify(this.model.get('list_of_coords')),
      copyDisabled: Tabula.pdf_view.flash_borked ? 'disabled="disabled" data-toggle="tooltip" title="'+Tabula.pdf_view.flash_borken_message+'"' : ''
    };

    //on create, show/hide advanced options area as necessary from this.pdf_view.options
    if(this.pdf_view.options.get('show_advanced_options')){
      this.$el.addClass("advanced-options-shown");
    }

    if (Tabula.pdf_view.flash_borked){
      this.$el.find('#copy-csv-to-clipboard').addClass('has-tooltip');
    }
    var modalFooter = this.$el.find(".modal-footer-container");
    modalFooter.html(this.template(templateOptions));

    // this has to happen after the footer is already in the page, for bootstrap reasons.
    if (uniq_extraction_methods.length == 1){
      this.$el.find('#' + uniq_extraction_methods[0] + '-method-btn').button('toggle');
    }

    // disable/enable buttons based on whether data has loaded yet.
    if(loading){
      $('.extraction-method-btn').prop('disabled', true).addClass('disabled');
      modalFooter.find(".btn").prop('disabled', true).addClass('disabled');
    }else{
      $('.extraction-method-btn').prop('disabled', false).removeClass('disabled');
      modalFooter.find(".btn").prop('disabled', false).removeClass('disabled');
    }
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

    if(!Tabula.pdf_view.client){
      try{
        Tabula.pdf_view.client = new ZeroClipboard();
      }catch(e){
        this.$el.find('#copy-csv-to-clipboard').hide();
      }
    }
    if( !Tabula.pdf_view.flash_borked ){
        Tabula.pdf_view.client.on( 'ready', _.bind(function(event) {
          Tabula.pdf_view.client.clip( this.$el.find("#copy-csv-to-clipboard") );

          Tabula.pdf_view.client.on( 'copy', _.bind(function(event) {
            var clipboard = event.clipboardData;
            var tableData = this.$el.find('.modal-body table').table2CSV({delivery: null});
            clipboard.setData( 'text/plain', tableData );
          }, this) );

          Tabula.pdf_view.client.on( 'aftercopy', function(event) {
            $('#data-modal #copy-csv-to-clipboard').css('display', 'inline').delay(900).fadeOut('slow');
          } );

          this.$el.find('.modal-footer button').prop('disabled', '');

        }, this) );

        Tabula.pdf_view.client.on( 'error', _.bind(function(event) {
          //disable all clipboard buttons, add tooltip, event.message
          Tabula.pdf_view.flash_borked = true;
          Tabula.pdf_view.flash_borken_message = event.message;
          this.$el.find('#copy-csv-to-clipboard').addClass('has-tooltip').tooltip();
          console.log( 'ZeroClipboard error of type "' + event.name + '": ' + event.message );
          ZeroClipboard.destroy();
          this.$el.find('.modal-footer button').prop('disabled', '');
        },this) );
    }

    return this;
  },

  dropDownOrUp: function(e){
    var $el = $(e.currentTarget);
    $ul = $el.parent().find('ul');

    window.setTimeout(function(){      // TODO: if we upgrade to bootstrap 3.0
                                       // we don't need this gross timeout and can, instead,
                                       // listen for the `dropdown's shown.bs.dropdown` event
      if(!isElementInViewport($ul)){
        $el.addClass('dropup');
        $ul.addClass('bottom-up');
      }
    }, 100);
  },

  toggleAdvancedOptions: function(e){
    this.pdf_view.options.set('show_advanced_options', !this.pdf_view.options.get('show_advanced_options'));
    if(this.pdf_view.options.get('show_advanced_options')){
      this.$el.addClass("advanced-options-shown");
    }else{
      this.$el.removeClass("advanced-options-shown");
    }
    return false;
  },


  queryWithToggledExtractionMethod: function(e){
    this.model.set('data', null);
    var extractionMethod = $(e.currentTarget).data('method');
    this.pdf_view.options.set('extraction_method', extractionMethod);
    Tabula.pdf_view.query.setExtractionMethod(extractionMethod);
    Tabula.pdf_view.query.doQuery();
  },
});

Tabula.DocumentView = Backbone.View.extend({ // Singleton
  events: {
    'click button.close#directions' : 'closeDirections'
  },
  pdf_view: null, //added on create
  page_views: {},
  rectangular_selector: null,

  /* when the Directions area is closed, the pages themselves move up, because they're just static positioned.
   * The selections on those images, though, do not move up, and need to be moved up separately, since they're fixed.
   */
  closeDirections: function(){
    this.pdf_view.options.set('show-directions', false);

    var directionsRow = $('#directionsRow');
    var height = directionsRow.height();
    $('div.imgareaselect-box').each(function(){
      $(this).offset({top: $(this).offset()["top"] - height });
    });
    directionsRow.remove();
  },

  initialize: function(stuff){
    _.bindAll(this, 'render', 'removePage', '_onRectangularSelectorEnd');
    this.pdf_view = stuff.pdf_view;
    this.listenTo(this.collection, 'remove', this.removePage);

    // attach rectangularSelector to main page container
    this.rectangular_selector = new RectangularSelector(
      this.$el,
      {
        selector: '#main-container .pdf-page img',
        end: this._onRectangularSelectorEnd,
        areas: _.bind(function(target) {
          return _.pluck(
            this.page_views[$(target).data('page')].selections,
            'absolutePos');
        }, this)
      }
    );
  },

  // listens to mouseup of RectangularSelector
  _onRectangularSelectorEnd: function(d) {
    var page_number = $(d.pageView).data('page');
    var pv = this.page_views[page_number];
    var rs = new ResizableSelection({
      position: d.absolutePos,
      target: $(d.pageView)
    });
    rs.on({
      resize: _.debounce(pv._onSelectChange, 100),
      remove: pv._onSelectCancel
    });
    pv._onSelectEnd(rs);
    this.$el.append(rs.el);
  },

  removePage: function(pageModel){
    var page_view = this.page_views[pageModel.get('number')];

    page_view.$el.fadeOut(200, function(){

      // move all the stuff for the following pages' imgAreaSelect objects up.
      deleted_page_height = page_view.$el.height();
      deleted_page_top = page_view.$el.offset()["top"];

      $('div.imgareaselect').each(function(){
        if( $(this).offset()["top"] > (deleted_page_top + deleted_page_height) ) {
          $(this).offset({top: $(this).offset()["top"] - deleted_page_height });
        }
      });

      //TODO: edit imgAreaSelect to:
      // (a) not be position fixed (so I don't have to move their location manualy)
      //   e.g. something like _(Tabula.pdf_view.imgAreaSelects).each(function(ias){ ias.adjust(); });
      // (b) listen on document, no matter how many exist on the page.
      page_view.imgAreaSelect.remove();
      page_view.remove();
    });
  },

  render: function(){
    if(!this.pdf_view.options.get('show-directions')){
      this.$el.find('#directionsRow').remove();
    }
    return this;
  }
});

Tabula.PageView = Backbone.View.extend({ // one per page of the PDF
  document_view: null, //added on create
  className: 'row pdf-page',
  iasAlreadyInited: false,
  selections: null,

  id: function(){
    return 'page-' + this.model.get('number');
  },

  template: _.template($('#templates #page-template').html().replace(/nestedscript/g, 'script')) ,

  /* we don't need this yet, disabling
  'events': {
    'click i.rotate-left i.rotate-right': 'rotate_page',
  },
  */

  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    this.selections = [];
    _.bindAll(this, 'rotate_page', 'createTables',
      '_onSelectStart', '_onSelectChange', '_onSelectEnd', '_onSelectCancel', 'render');
  },

  render: function(){
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

    this.$image = this.$el.find('img');

    return this;
  },

  createTables: function(asfd){
    this.iasAlreadyInited = true;
  },

  _onSelectStart: function(iasSelection) {
    Tabula.pdf_view.pdf_document.selections.updateOrCreateByIasId(iasSelection,
                                                                  this.model.get('number'),
                                                                  this.$image.width());
  },

  _onSelectChange: function(selection) {
    Tabula.pdf_view.pdf_document.selections.updateOrCreateByIasId(selection,
                                                                  this.model.get('number'),
                                                                  this.$image.width());
  },

  _onSelectEnd: function(selection) {
    var sel = Tabula.pdf_view.pdf_document.selections.updateOrCreateByIasId(selection,
                                                                            this.model.get('number'),
                                                                            this.$image.width());
    this.selections.push(selection);

    // deal with invalid/too-small selections somehow (including thumbnails)
    if (selection.width === 0 && selection.height === 0) {
      $('#thumb-' + this.$image.attr('id') + ' #iasSelection-show-' + selection.id).css('display', 'none');
      selection.remove();
    }

    // if this is not the last page
    if(this.model != this.model.collection.last()) {
      var but_id = this.model.get('number') + '-' + selection.id;  //create a "Repeat this Selection" button
      var button = $('<button class="btn repeat-lassos" id="'+but_id+'">Repeat this Selection</button>');
      button.data("selectionId", (this.model.get('number') * 100000) + selection.id );
      selection.$el.append(button);
    }

    if(!Tabula.pdf_view.options.get('multiselect_mode')){
        selection.queryForData();
    }
    Tabula.pdf_view.components['control_panel'].render(); // deals with buttons that need blurred out if there's zero selections, etc.
  },

  // iasSelection
  _onSelectCancel: function(selection) {
    // remove repeat lassos button
    var but_id = this.$image.attr('id') + '-' + selection.id;
    $('button#' + but_id).remove();

    this.selections = _.without(this.selections,
                                _.findWhere(this.selections, { id: selection.id}));

    // find and remove the canceled selection from the collection of selections. (triggering remove events).
    var selectionId = (this.model.get('number') * 100000) + selection.id;
    var sel = Tabula.pdf_view.pdf_document.selections.get(selectionId);
    removed_selection = Tabula.pdf_view.pdf_document.selections.remove(sel);

    Tabula.pdf_view.components['control_panel'].render(); // deal with buttons that need blurred out if there's zero selections, etc.
  },

  rotate_page: function(t) {
      alert('not implemented');
  }
});


/* I'm not sure having a SelectionView makes sense. But,
 * TODO: something needs to manage the repeat lasso button other than the body element.
 */

Tabula.ControlPanelView = Backbone.View.extend({ // only one
  events: {
    'click #should-preview-data-checkbox' : 'updateShouldPreviewDataAutomaticallyButton',
    'click #clear-all-selections': 'clear_all_selection',
    'click #restore-detected-tables': 'restore_detected_tables',
    'click #all-data': 'query_all_data',
    'click #repeat-lassos': 'repeatLassos',
  },
  className: 'followyouaroundbar',

  template: _.template($('#templates #control-panel-template').html().replace(/nestedscript/g, 'script')),

  shouldPreviewDataAutomatically: !$('#should-preview-data-checkbox').is(':checked'),

  updateShouldPreviewDataAutomaticallyButton: function(){
    this.pdf_view.options.set('multiselect_mode', !$('#should-preview-data-checkbox').is(':checked'));
    this.render();
  },

  /* in case there's a PDF with a complex format that's repeated on multiple pages */
  repeatFirstPageLassos: function(){
    alert('not yet implemented');
    return;
    /* TODO: write this */
  },

  clear_all_selection: function(){
    _.each(this.pdf_view.components.document_view.page_views,
           function(pv,i,l) {
             _.each(pv.selections, function(s, j, sels) {
               s.remove();
             });
           });
  },

  restore_detected_tables: function(){
    this.pdf_view.pdf_document.selections.reset([]);
    this.pdf_view.pdf_document.selections.fetch();
  },

  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    _.bindAll(this, 'updateShouldPreviewDataAutomaticallyButton', 'query_all_data', 'render');
  },

  query_all_data : function(){
    var list_of_all_coords = Tabula.pdf_view.pdf_document.selections.invoke("toCoords");

    //TODO: figure out how to handle extraction methods when there are multiple selections
    // should it be set globally, or per selection?
    // actually, how to handle extraction method is a bit of an open question.
    // should we support in the UI extraction methods per selection?
    // if so, what does the modal show if its showing results from more than one selection?
    // maybe it only shows them if they match?
    // or not at all ever?
    // but then we need to make it clearer in the UI that you are "editing" a selection.
    // which will require different reactions with multiselect mode:
    // when you finish a query, then still pop up its data.
    // when you click or move an already-selected query, then you're "editing" it?
    // hmm.
    Tabula.pdf_view.query = new Tabula.Query({list_of_coords: list_of_all_coords, extraction_method: 'guess'});
    Tabula.pdf_view.createDataView();
    Tabula.pdf_view.query.doQuery();
  },

  render: function(){
    // makes the "follow you around bar" actually follow you around. ("sticky nav")
    $('.followyouaroundbar').affix({top: 70 });

    var numOfSelectionsOnPage = this.pdf_view.totalSelections();
    this.$el.html(this.template({
                  'if_multiselect_checked': this.pdf_view.options.get('multiselect_mode') ? '' : 'checked="checked"',
                  'disable_clear_all_selections': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '' ,
                  'disable_download_all': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '',
                  'show_restore_detected_tables': (this.pdf_view.hasPredetectedTables && numOfSelectionsOnPage <= 0) ? '' : 'display: none;',
                  }));

    return this;
  },
});

Tabula.SidebarView = Backbone.View.extend({ // only one
  tagName: 'ul',
  className: 'thumbnail-list',
  thumbnail_views: {},
  pdf_view: null, // defined on initialize
  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    _.bindAll(this, 'addSelectionThumbnail', 'removeSelectionThumbnail', 'changeSelectionThumbnail', 'removeThumbnail');

    this.listenTo(this.collection, 'remove', this.removeThumbnail);

    this.listenTo(this.pdf_view.pdf_document.selections, 'all', this.render);
    this.listenTo(this.pdf_view.pdf_document.selections, 'add', this.addSelectionThumbnail); // render a thumbnail selection
    this.listenTo(this.pdf_view.pdf_document.selections, 'change', this.changeSelectionThumbnail); // render a thumbnail selection
    this.listenTo(this.pdf_view.pdf_document.selections, 'remove', this.removeSelectionThumbnail); // remove a thumbnail selection
  },
  addSelectionThumbnail: function (new_selection){
    this.thumbnail_views[new_selection.get('page_number')].createSelectionThumbnail(new_selection);
  },
  changeSelectionThumbnail: function (selection){
    this.thumbnail_views[selection.get('page_number')].changeSelectionThumbnail(selection);
  },
  removeSelectionThumbnail: function (selection){
    this.thumbnail_views[selection.get('page_number')].removeSelectionThumbnail(selection);
  },

  removeThumbnail: function(pageModel){
    var thumbnail_view = this.thumbnail_views[pageModel.get('number')];
    thumbnail_view.$el.fadeOut(200, function(){ thumbnail_view.remove(); });
  },
});

Tabula.ThumbnailView = Backbone.View.extend({ // one per page
  'events': {
    // on load, create an empty div with class 'selection-show' to be the selection thumbnail.
    'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); },
    'click i.delete-page': 'delete_page',
  },
  tagName: 'li',
  className: "thumbnail pdf-page",
  id: function(){
    return 'thumb-page-' + this.model.get('number');
  },

  // initialize: function(){
  // },
  template: _.template($('#templates #thumbnail-template').html().replace(/nestedscript/g, 'script')),

  initialize: function(){
    _.bindAll(this, 'render', 'createSelectionThumbnail', 'changeSelectionThumbnail', 'removeSelectionThumbnail');
  },

  delete_page: function(){
    if (!confirm('Delete page ' + this.model.get('number') + '?')) return;
    Tabula.pdf_view.pdf_document.page_collection.remove( this.model );
  },

  render: function(){
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
    var $sshow = this.$el.find('#selection-show-' + selection.cid);
    $sshow.remove();
  }
});

Tabula.PDFView = Backbone.View.extend({
    el : '#tabula-app',

    events : {
      'click a.tooltip-modal': 'tooltip',
      'click a#help-start': function(){ Tabula.tour.ended ? Tabula.tour.restart(true) : Tabula.tour.start(true); },
    },
    colors: ['#f00', '#0f0', '#00f', '#ffff00', '#FF00FF'],
    lastQuery: [{}],
    pageCount: undefined,
    components: {},

    hasPredetectedTables: false,
    global_options: null,

    initialize: function(){
      _.bindAll(this, 'render', 'addOne', 'addAll', 'totalSelections',
        'createDataView','trashDataView');

      this.pdf_document = new Tabula.Document({
        pdf_id: PDF_ID,
      });

      this.options = new Tabula.Options();
      this.listenTo(this.options, 'change', this.options.write);

      this.createTour();

      this.listenTo(this.pdf_document.page_collection, 'all', this.render);
      this.listenTo(this.pdf_document.page_collection, 'add', this.addOne);
      this.listenTo(this.pdf_document.page_collection, 'reset', this.addAll);
      this.listenTo(this.pdf_document.page_collection, 'remove', this.removePage);

      this.components['document_view'] = new Tabula.DocumentView({el: '#main-container' , pdf_view: this, collection: this.pdf_document.page_collection}); //creates page_views
      this.components['control_panel'] = new Tabula.ControlPanelView({pdf_view: this});
      this.components['sidebar_view'] = new Tabula.SidebarView({pdf_view: this, collection: this.pdf_document.page_collection});

      $('#document').append($('#loading').show())

      this.pdf_document.page_collection.fetch({
        success: _.bind(function(){
          $('#loading').detach();
          this.pdf_document.selections.fetch({
            success: _.bind(function(){
              this.hasPredetectedTables = true;
            }, this),
            // error: function(){ console.log("no predetected tables (404 on tables.json)")}
          });
        }, this),
        error: _.bind(function(){
          console.log('404'); //TODO: make this a real 404, with the right error code, etc.
          $('#tabula').html("<h1>Error: We couldn't find your document.</h1><h2>Double-check the URL and try again?</h2><p>And if it doesn't work, <a href='https://github.com/tabulapdf/tabula/issues/new'> report a bug</a> and explain <em>exactly</em> what steps you took that caused this problem");
        }),
      });

      $('body'). // imgareaselect selections are fixed positioned in CSS, just attached to the body in DOM
        on("click", ".imgareaselect-box .repeat-lassos", function(e){
          var selectionId = $(e.currentTarget).data('selectionId');
          var selection = Tabula.pdf_view.pdf_document.selections.get(selectionId);
          selection.repeatLassos();
        });
    },

    removePage: function(removedPageModel){
      $.post('/pdf/' + PDF_ID + '/page/' + removedPageModel.get('number'),
           { _method: 'delete' },
           function () {
               Tabula.pdf_view.pageCount -= 1;
           });

      // removing the views is handled by the views themselves.

      //remove selections
      var selections = this.pdf_document.selections.where({page_number: removedPageModel.get('number')});
      this.pdf_document.selections.remove(selections);
    },

    createDataView: function(){
      this.components['data_view'] = new Tabula.DataView({pdf_view: this, model: Tabula.pdf_view.query});
    },

    trashDataView: function(){
      // the modal HTML stays on the page, so undelegate the events we bound to it via Backbone
      // (but keeping the Bootstrap events)
      this.components['data_view'].undelegateEvents();
      this.components['data_view'] = null;
    },

    addOne: function(page) {
      if(page.get('deleted')){
        return;
      }
      var page_view = new Tabula.PageView({model: page, collection: this.pdf_document.page_collection});
      var thumbnail_view = new Tabula.ThumbnailView({model: page, collection: this.pdf_document.page_collection});
      this.components['document_view'].page_views[ page.get('number') ] =  page_view;
      this.components['sidebar_view'].thumbnail_views[ page.get('number') ] = thumbnail_view;
      this.components['document_view'].$el.append(page_view.render().el);
      this.components['sidebar_view'].$el.append(thumbnail_view.render().el);
    },

    addAll: function() {
      this.pdf_document.page_collection.each(this.addOne, this);
    },

    totalSelections: function() {
      var rv = _.reduce(
        _.map(
          _.values(this.components.document_view.page_views),
          function(pv) { return pv.selections.length; }
        ),
        function(m, l) {
          return m + l;
        }, 0);
      return rv;
    },

    render : function(){
      this.components['document_view'].render();
      $('#control-panel-container').append(this.components['control_panel'].render().el);
      $('.sidebar-nav.well').append(this.components['sidebar_view'].render().el);

      $('.has-tooltip').tooltip();

      this.pageCount = this.pdf_document.page_collection.size();

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
          element: "#page-div-1 .page-image",
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
        var original_pdf_width = parseInt($(image).data('original-width'));
        var original_pdf_height = parseInt($(image).data('original-height'));
        var thumb_width = $(image).width();

        var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? original_pdf_height : original_pdf_width);

        var lq = $.extend(this.lastQuery,
                          {
                              pdf_page_width: original_pdf_width,
                              render_page: render === true,
                              clean_rulings: clean === true,
                              show_intersections: show_intersections === true
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
      var original_pdf_width = parseInt($(image).data('original-width'));
      var original_pdf_height = parseInt($(image).data('original-height'));
      var pdf_rotation = parseInt($(image).data('rotation'));

      var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? original_pdf_height : original_pdf_width);

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
      var original_pdf_width = parseInt($(image).data('original-width'));
      var original_pdf_height = parseInt($(image).data('original-height'));
      var pdf_rotation = parseInt($(image).data('rotation'));

      var scale = thumb_width / (Math.abs(pdf_rotation) == 90 ? original_pdf_height : original_pdf_width);

      var list_of_coords = JSON.parse(this.lastQuery.coords);

      Tabula.pdf_view.query.doQuery({
        success: _.bind(function(data) {
                   var colors = this.colors;
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
