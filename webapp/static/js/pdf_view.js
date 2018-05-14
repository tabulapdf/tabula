Tabula = Tabula || {};

var clip = null;
var base_uri = $('base').attr("href");

PDF_ID = window.location.pathname.replace(base_uri, '').split('/')[1];
Tabula.LazyLoad = 10; // max number of pages around the cursor to show (2x Tabula.LazyLoad pages are shown)
Tabula.HideOnLazyLoad = false; // ideally, set to true, but this requires differently positioned selections, see https://github.com/tabulapdf/tabula/issues/245#issuecomment-75182061

ZeroClipboard.config( { swfPath: (base_uri || '/') + "swf/ZeroClipboard.swf" } );

Tabula.entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};
Tabula.escapeHtml = function(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return Tabula.entityMap[s];
  });
}


Tabula.Page = Backbone.Model.extend({
  // number: null, //set on initialize
  // width: null, //set on initialize
  // height: null, //set on initialize
  // rotation: null, //set on initialize
  initialize: function(){
    this.set('number_zero_indexed', this.get('number') - 1);
  },
  imageUrl: function(){
    var resolution = Math.max(Tabula.pdf_view.pdf_document.get('thumbnail_sizes')) || 800;
    this.set('image_url', (base_uri || '/') + 'pdfs/' + PDF_ID + '/document_'+resolution+'_' + this.get('number') + '.png');
    return this.get('image_url');
  }
});

Tabula.Pages = Backbone.Collection.extend({
  model: Tabula.Page,
  url: null, //set on initialize
  comparator: 'number',
  initialize: function(){
    this.url = (base_uri || '/') + 'pdfs/' + PDF_ID + '/pages.json?_=' + Math.round(+new Date()).toString();
  }
});

Tabula.Document = Backbone.Model.extend({
  page_collection: null, //set on initialize
  selections: null, //set on initialize
  pdf_id: PDF_ID, //set on initialize
  url: null, //set on initialize

  initialize: function(options){
    this.page_collection = new Tabula.Pages([], {pdf_document: this});
    this.selections = new Tabula.Selections([], {pdf_document: this});
    this.autodetected_selections = new Tabula.AutodetectedSelections([], {pdf_document: this});
    this.url = (base_uri || '/') + 'pdf/' + this.pdf_id + '/metadata.json';

    this.set('original_filename', '');
    this.set('new_filename', false);
  },
});

Tabula.Selection = Backbone.Model.extend({
  pdf_id: PDF_ID,

  initialize: function(){
    _.bindAll(this, 'repeatLassos', 'toCoords');
  },

  updateCoords: function(){
    var page = Tabula.pdf_view.pdf_document.page_collection.findWhere({number: this.get('page_number')});
    var imageWidth = this.get('imageWidth');

    var original_pdf_width = page.get('width');
    var original_pdf_height = page.get('height');
    // var pdf_rotation = page.get('rotation');

    var scale = original_pdf_width / imageWidth;
    var rp = this.attributes.getDims().relativePos;
    this.set({
      x1: rp.left * scale,
      x2: (rp.left + rp.width) * scale,
      y1: rp.top * scale,
      y2: (rp.top + rp.height) * scale,
      width: rp.width * scale, // not used by Tabula right now, but used in the UI elsewhere
      height: rp.height * scale, // not used by Tabula right now, but used in the UI elsewhere
    });
  },

  toCoords: function(){
    if (this.attributes.getDims){
      this.updateCoords();
    }
    var selection_coords = {
      page: this.get('page_number'),
      extraction_method: this.get('extractionMethod') || 'guess',
      selection_id: this.id,
      x1:  this.get('x1'),
      x2: this.get('x2'),
      y1: this.get('y1'),
      y2: this.get('y2'),
      width:  this.get('width'),
      height:  this.get('height')
    };
    return selection_coords;
  },

  repeatLassos: function() {
    Tabula.pdf_view.pdf_document.page_collection.each(_.bind(function(page){
      if(this.get('page_number') < page.get('number')){          // for each page after this one,
        new_selection = this.clone();                            // and create a new Selection.
        new_selection.set('page_number', page.get('number'));
        this.collection.add(Tabula.pdf_view.renderSelection(new_selection.toCoords()));
        /* which causes thumbnails to be created, Download All button to know about these selections. */
      }
    }, this));
  },
  repeatLassoOnce: function() {
    var current_page_number = this.get('page_number');
    var next_page = Tabula.pdf_view.pdf_document.page_collection.at(Tabula.pdf_view.pdf_document.page_collection.indexOf(Tabula.pdf_view.pdf_document.page_collection.findWhere({number: current_page_number}))+1);
    new_selection = this.clone();                            // and create a new Selection.
    new_selection.set('page_number', next_page.get('number'));
    this.collection.add(Tabula.pdf_view.renderSelection(new_selection.toCoords()));
  },
});

// Not currently used at all.
Tabula.Options = Backbone.Model.extend({
  initialize: function(){
    _.bindAll(this, 'write');
    // this.set('multiselect_mode', localStorage.getItem("tabula-multiselect-mode") !== "false");
  },
  write: function(){
    // localStorage.setItem("tabula-multiselect-mode", this.get('multiselect_mode'));
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
  // model: Tabula.Selection,
  comparator: 'page_number',
  updateOrCreateByVendorSelectorId: function(vendorSelection, pageNumber, imageWidth){
    var selection = this.get(vendorSelection.id);

    if (selection) { // if it already exists
      selection.set(_.omit(vendorSelection, 'id'));
    }
    else {
      new_selection_args = _.extend({'page_number': pageNumber,
                                    'imageWidth': imageWidth,
                                    'extraction_method': Tabula.pdf_view.options.extraction_method,
                                    'hidden': false,
                                    'pdf_document': this.pdf_document},
                                    vendorSelection);
      selection = new Tabula.Selection(new_selection_args);
      this.add(selection);
    }
    return selection;
  },
  createHiddenSelection: function(sel){
      new_selection_args = _.extend({'page_number': sel.page,
                                    'extraction_method': 'spreadsheet',
                                    'id': Math.random().toString(),
                                    'hidden': true,
                                    'pdf_document': this.pdf_document},
                                    sel);
      selection = new Tabula.Selection(new_selection_args);
      this.add(selection);
      return selection;
  }

});


Tabula.AutodetectedSelections = Tabula.Selections.extend({
  url: null, //set on init
  initialize: function(){
    this.url = (base_uri || '/') + 'pdfs/' + PDF_ID + '/tables.json?_=' + Math.round(+new Date()).toString();
    _.bindAll(this, 'updateOrCreateByVendorSelectorId');
  },

  parse: function(response){
    // a JSON list of pages, which are each just a list of coords
    var tables = [];
    var selections = _(response).map(_.bind(function(page_tables, listIndex){
      var pageIndex = listIndex + 1;

      return _(page_tables).map(_.bind(function(tableCoords){
        if(tableCoords[2] * tableCoords[3] < 400){ //exclude tiny autodetected selections
          return null;
        }
        return {
          x1: tableCoords[0],
          y1: tableCoords[1],
          x2: tableCoords[0] + tableCoords[2],
          y2: tableCoords[1] + tableCoords[3],
          width: tableCoords[2],
          height: tableCoords[3],
          page: pageIndex,
          extraction_method: 'spreadsheet',
          selection_id: null
        };
      }, this));
    }, this));
    return _.select(_.flatten(selections), function(i){ return i; });
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
    _.bindAll(this, 'doQuery', 'setExtractionMethod', 'convertTo', 'convertToCSV',
                    'convertToTabulaExtractorScript', 'convertToBoundingBoxJSON');
  },

  convertTo: function(format){
    if(!this.get('data')){
      throw Error("You need to query for data before converting it locally.");
    }else{
      switch(format.toLowerCase()){
        // case "XML":
        //   return this.convertToXML();
        // break;
        case "bbox":
          return this.convertToBoundingBoxJSON();
        case "tsv":
          return this.convertToCSV("\t");
        case "csv":
          return this.convertToCSV();
        case "\uD83D\uDCA9SV":
          return this.convertToCSV("\uD83D\uDCA9SV");
        case "script":
          return this.convertToTabulaExtractorScript();
        default:
          throw Error("Unknown format: " + format);
      }
    }
  },
  convertToCSV: function(delimiter_maybe_undef){
    var delimiter = typeof delimiter_maybe_undef == "undefined" ? ',' : delimiter_maybe_undef
    var csv = _(this.get('data')).chain().pluck('data').map(function(table){
      return _(table).chain().map(function(row){
        return _.map(row, function(cell){ 
          var text = cell.text;
          text = text.replace("\"", "\\\""); //escape quotes
          text = text.indexOf(delimiter) > -1 ? "\"" + text + "\"" : text; //enquote cells containing the delimiter.
          return text;
        }).join(delimiter);
      }).value();
    }).flatten(true).value().join("\n");
    return csv;
  },
  convertToBoundingBoxJSON: function(){
    return JSON.stringify(this.get('list_of_coords'), null, 4);
  },
  convertToTabulaExtractorScript: function(){
    return _(this.get('list_of_coords')).map(function(c){
      var extraction_method_switch = "";
      if(c.extraction_method == "original"){
          var extraction_method_switch = "--no-spreadsheet";
      }else if(c.extraction_method == "spreadsheet"){
           var extraction_method_switch = "--spreadsheet";
         }
      return "tabula "+extraction_method_switch+" -a "+roundTo(c.y1, 3)+","+roundTo(c.x1, 3)+","+roundTo(c.y2, 3)+","+roundTo(c.x2, 3)+" -p "+c.page+" \"$1\"";
    }).join("\n");
  },

  doQuery: function(options) {
    this.query_data = {
      'coords': JSON.stringify(this.get('list_of_coords')),
      'new_filename': null,
    };

    // print selection coordinates to the console
    // way easier FOR NOW than downloading the script/JSON
    console.log(_.map(this.get('list_of_coords'), function(l){ return [l.y1, l.x1, l.y2, l.x2].join(', '); }).join("\n") );

    // shallow copy the selections collection
    // so if hte user somehow changes the selections between starting the query and it finishing,
    // there isn't an error
    var stashed_selections = new Tabula.Selections(Tabula.pdf_view.pdf_document.selections.models.slice());

    this.trigger("tabula:query-start");
    window.tabula_router.navigate('pdf/' + PDF_ID + '/extract'); // TODO: this should probably go in a view!! -JBM
    $.ajax({
        type: 'POST',
        url: (base_uri || '/') + 'pdf/' + PDF_ID + '/data',
        data: this.query_data,
        success: _.bind(function(resp) {
          this.set('data', resp);

          // this only needs to happen on the first select, when we don't know what the extraction method is yet
          // (because it's set by the heuristic on the server-side).
          // TODO: only execute it when one of the list_of_coords has guess or undefined as its extraction_method
          _(resp).each(_.bind(function(resp_item, i){
            var coord_set = this.get('list_of_coords')[resp_item['spec_index']];
          // _(_.zip(this.get('list_of_coords'), resp)).each(function(stuff, i){
            // var coord_set = stuff[0];
            // var resp_item = stuff[1];
            // if(!coord_set) return; // DIRTY HACK, see https://github.com/tabulapdf/tabula/issues/497
            //                        // if one set of coords returns 2+ tables, 
            //                        // then this zip won't work.
            if (stashed_selections.get(coord_set.selection_id)){
              stashed_selections.get(coord_set.selection_id).
                set('extraction_method', resp_item["extraction_method"]);
            }
            coord_set["extraction_method"] = resp_item["extraction_method"];
          },this));

          this.trigger("tabula:query-success");

          if (options !== undefined && _.isFunction(options.success)){
            Tabula.pdf_view.options.success(resp);
          }

          }, this),
        error: _.bind(function(xhr, status, error) {
          console.log("error!", xhr, status);
          var error_text = xhr.responseText;
          window.raw_xhr_responseText = xhr.responseText; // for consoles, etc.
          if(error_text.indexOf("DOCTYPE") != -1){ // we're in Jar/Jetty/whatever land, not rackup land
            var error_html = $('<div></div>').html( error_text );
            var summary = error_html.find('#summary').text().trim();
            var meta = error_html.find('#meta').text().trim();
            var info = error_html.find('#info').text().trim();
            error_text = [summary, meta, info].join("<br />");
          }
          var debugging_text = "Tabula API version: " + Tabula.api_version + "\nFilename: " + Tabula.pdf_view.pdf_document.get('original_filename') + "\n" + error_text
          this.set('error_message', debugging_text);
          this.trigger("tabula:query-error");
          if (options !== undefined && _.isFunction(options.error))
            options.error(resp);
        }, this),
      });
  },
  setExtractionMethod: function(extractionMethod){
    _(this.get('list_of_coords')).each(function(coord_set){ coord_set['extraction_method'] = extractionMethod; });
  },
 getDataArray: function(){
    // this.data is a list of responses (because we sent a list of coordinate sets)
    // $.each( _.pluck(this.model.get('data'), 'data'), function(i, rows) {
    //   $.each(rows, function(j, row) {
    //     tableHTML += '<tr><td>' + _.pluck(row, 'text').join('</td><td>') + '</td></tr>';
    //   });
    // });

    /* via https://stackoverflow.com/questions/24816/escaping-html-strings-with-jquery
     * if a PDF contains the string "<iframe>" we want to display that, not an actual iframe!
     */

    if (!this.get('data')){ return []; }
    var data = _(this.get('data')).chain().pluck('data').map(function(table){
      return _(table).chain().map(function(row){
        return (_.pluck(row, 'text')).map(Tabula.escapeHtml);
      }).value();
    })/*.flatten(true)*/.value();
    return data.length == 1 && data[0].length === 0 ? [] : data; // checking whether there's no data, i.e. data == [[]]
  }
});

Tabula.DataView = Backbone.View.extend({  // one per query object.
  el: '#tabula-dataview',
  template: _.template($('#templates #export-page-template').html().replace(/nestedscript/g, 'script')),

  events: {
    'click .extraction-method-btn:not(.active)': 'queryWithToggledExtractionMethod',
    'click #download-data': 'setFormAction',
    'keyup .filename': 'updateFilename',
    //N.B.: Download button (and format-specific download buttons) are an HTML form, so not handled here.
    //TODO: handle flash clipboard thingy here.
    // 'click #copy-csv-to-clipboard':
    'click #revise-selections': 'closeAndRenderSelectionView'
  },
  pdf_view: null, //added on create
  extractionMethod: "guess",



  initialize: function(stuff){
    _.bindAll(this, 'render', 'renderFlashClipboardNonsense', 'updateFilename', 'queryWithToggledExtractionMethod', 'closeAndRenderSelectionView', 'setFormAction');
    this.pdf_view = stuff.pdf_view;
    this.listenTo(this.model, 'tabula:query-start', this.render);
    this.listenTo(this.model, 'tabula:query-success', this.render);
    this.listenTo(this.model, 'tabula:query-error', this.render);
  },
  disableDownloadButton: function(){
    $('#download-data').addClass('download-in-progress');
    $('#download-data').prop('disabled', 'disabled');
    window.setTimeout( function(){
      $('#download-data').removeClass('download-in-progress');
      $('#download-data').removeProp('disabled');
    }, 2000);
  },
  updateFilename: function(){
    var new_filename = this.$el.find('#control-panel input.filename').val();
    if(new_filename.length){
      this.pdf_view.pdf_document.set('new_filename', new_filename);
    }
  },
  closeAndRenderSelectionView: function(){
    window.tabula_router.navigate('pdf/' + PDF_ID);
    this.$el.empty();
    this.undelegateEvents();
    this.pdf_view.$el.show();
    this.pdf_view.render();

    $('body').removeClass('page-export');
    $('body').addClass('page-selections');

    var oldSelections = this.pdf_view.pdf_document.selections.models.map(function(sel){
      var selection = Tabula.pdf_view.renderSelection(sel.toCoords());
      // selection.attributes.rebind(); // o. m. g.
      return selection;
    });
    this.pdf_view.pdf_document.selections.reset(oldSelections);
    _(this.pdf_view.components["sidebar_view"].thumbnail_list_view.thumbnail_views).each(function(v){ v.delegateEvents() });
  },

  setFormAction: function(e){
    var formActionUrl = $(e.currentTarget).data('action');
    this.$el.find('#download-form').attr('action', formActionUrl);
    this.$el.find('#download-form').submit();
    this.disableDownloadButton();
  },

  render: function(e){
    document.title="Export Data | Tabula";
    var uniq_extraction_methods = _.uniq(_(this.model.get('list_of_coords')).pluck('extraction_method'));

    // save the current scroll position (if unset), then scroll to the top
    if(!Tabula.pdf_view.selectionScrollTop){
      Tabula.pdf_view.selectionScrollTop = $(document).scrollTop();
    }
    $(document).scrollTop(0);

    //TODO: move flash_borked to this object (dataview) away from pdf_view
    $('body').removeClass('page-selections');
    $('body').addClass('page-export');
    this.delegateEvents();

    this.pdf_view.$el.hide();
    $('.selection-box').css('visibility', 'hidden');
    $('.table-region').remove();
    $('.selection-show').remove(); // nuke thumbs, we'll put 'em back in a second

    this.$el.html(this.template({
      pdf_id: PDF_ID,
      data: this.model.getDataArray(),
      loading: !(this.model.get('data') || this.model.get('error_message')),
      error_message: this.model.get('error_message')
    }));
    this.$el.find('#control-panel').html(
      _.template($('#templates #export-control-panel-template').html().replace(/nestedscript/g, 'script'))(
        _(this.pdf_view.pdf_document.attributes).extend({
          pdf_id: PDF_ID,
          list_of_coords: JSON.stringify(this.model.get('list_of_coords')),
          copyDisabled: Tabula.pdf_view.flash_borked ? 'disabled="disabled" data-toggle="tooltip" title="'+Tabula.pdf_view.flash_borken_message+'"' : '',
          disableIfNoData: (_.isNull(this.model.get('data')) || typeof(this.model.get('data')) === "undefined") ? 'disabled="disabled"' : ''
        })
    ));
    this.$el.find('#sidebar').html(
      _.template($('#templates #export-page-sidebar-template').html().replace(/nestedscript/g, 'script')) (
        {
          pdf_id: PDF_ID,
          disableExtractionMethodButtons: _.isNull(this.model.data) || uniq_extraction_methods.length > 1 ? 'disabled="disabled"' : '',
        }
    ));
    this.renderFlashClipboardNonsense();
    if(!this.model.get('data')) this.startSpinner();

    if (uniq_extraction_methods.length == 1){
      // prospectively support renaming the methods in tabula-extractor to "lattice"/"stream"
      // and cope with "basic" extraction algorithm ID in tabula-java
      // https://github.com/tabulapdf/tabula-extractor/issues/96
      if (["basic", "original", "stream"].indexOf(uniq_extraction_methods[0]) > -1){
        uniq_extraction_methods[0] = "original";
      }else if(["spreadsheet", "lattice"].indexOf(uniq_extraction_methods[0]) > -1){
        uniq_extraction_methods[0] = "spreadsheet";
      }
      this.$el.find('#' + uniq_extraction_methods[0] + '-method-btn').button('toggle');
    }else{
      console.log("A mix of unique extraction methods found, not selecting either extraction method radio button: " + uniq_extraction_methods.join(", "))
    }

    this.$el.find('.has-tooltip').tooltip();

    return this;
  },

  startSpinner: function(){
    var SPINNER_OPTS = {
      lines: 10, // The number of lines to draw
      length: 5, // The length of each line
      width: 2, // The line thickness
      radius: 5, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb
      speed: 1.1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: true, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };
    new Spinner(SPINNER_OPTS).spin($('#spinner').get(0));
  },

  renderFlashClipboardNonsense: function(){
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
            console.log('clippy thingy clicked', $('#download-form select').val());

            var button_text = this.$el.find("#copy-csv-to-clipboard .clipboard-text");
            button_text.text("Copied!");
            window.setTimeout(_.bind(function(){
              button_text.text("Copy to Clipboard");
            },this), 2000);

            var tableData = Tabula.pdf_view.query.convertTo($('#download-form select').val());
            clipboard.setData( 'text/plain', tableData );
          }, this) );

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
  },
  pdf_view: null, //added on create
  page_views: {},
  rectangular_selector: null,

  _selectionsGetter: function(target) {
    return _(Tabula.pdf_view.pdf_document.selections.where({page_number: $(target).data('page')})).map(function(i){ return i.attributes; });
  },

  initialize: function(stuff){
    _.bindAll(this, 'render', 'removePage', 'addSelection', '_onRectangularSelectorEnd', '_selectionsGetter');
    this.pdf_view = stuff.pdf_view;
    this.listenTo(this.collection, 'remove', this.removePage);

    // attach rectangularSelector to main page container
    this.rectangular_selector = new RectangularSelector(
      this.$el,
      {
        selector: '#pages-container .pdf-page img',
        end: this._onRectangularSelectorEnd,
        areas: this._selectionsGetter,
        validSelection: function(selection) {
            return (selection.absolutePos.width > $(selection.pageView).width() * 0.01) &&
                (selection.absolutePos.height > $(selection.pageView).height() * 0.01);
        }
      }
    );
  },

  addSelection: function (d) {
    var page_number = $(d.pageView).data('page') || d.pageNumber;
    var pv = this.page_views[page_number];
    var rs = new ResizableSelection({
      position: d.absolutePos,
      target: pv.$el.find('img'),
      areas: this._selectionsGetter
    });
    rs.on({
      resize: _.debounce(pv._onSelectChange, 100),
      remove: pv._onSelectCancel
    });
    pv._onSelectEnd(rs);
    this.$el.append(rs.el);
    rs.$el.css('z-index', 100 - this._selectionsGetter($(d.pageView)).length);
  },

  // listens to mouseup of RectangularSelector
  _onRectangularSelectorEnd: function(d) {
    this.addSelection(d);
  },

  removePage: function(pageModel){
    var page_view = this.page_views[pageModel.get('number')];

    page_view.$el.fadeOut(200, function(){
      deleted_page_height = page_view.$el.height();
      deleted_page_top = page_view.$el.offset()["top"];
      page_view.remove();
    });
  },

  render: function(){
    if(!Tabula.LazyLoad){ // old-style, non-lazyload behavior
      _(this.page_views).each(_.bind(function(page_view, index){
        var already_on_page = $('#page-' + parseInt(index)+1).length;
        if(!already_on_page) this.$el.append(page_view.render().el);
      }, this));
    }else{
      //useful in the console for debugging: 
      // $('.pdf-page:visible').map(function(i, el){ return $(el).find('img').data('page') }).get();


      // just so pages end up in the right order, we have to loop AWAY FROM the cursor in both directions
      // so if the cursor is at 1.
      for (var number=Tabula.pdf_view.lazyLoadCursor;number>0;number--){
        var page_view = this.page_views[number];
        if(!page_view) continue; // this is the first render, and there are no pages (probably!)
        var page_el = $('#page-' + number);
        var visible_on_page = page_el.filter(':visible').length;
        if(visible_on_page && Tabula.HideOnLazyLoad){
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) >= Tabula.LazyLoad ) {
            $('#page-' + number).hide();
            // console.log('hide', number)
          }
        }else{
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) < Tabula.LazyLoad ) {
            if(page_el.length){
              page_view.$el.show();
              // console.log('show ' + number);
            }else{
              this.$el.prepend(page_view.render().el);
            }
          }
        }
      }
      for (var number=Tabula.pdf_view.lazyLoadCursor+1;number<=_(this.page_views).keys().length;number++){
        var page_view = this.page_views[number];
        if(!page_view) continue; // this is the first render, and there are no pages (probably!)
        var page_el = $('#page-' + number);
        var visible_on_page = page_el.filter(':visible').length;
        if(visible_on_page && Tabula.HideOnLazyLoad){
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) >= Tabula.LazyLoad ) {
            $('#page-' + number).hide();
          }
        }else{
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) < Tabula.LazyLoad ) {
            if(page_el.length){
              page_view.$el.show();
              // console.log('show ' + number);
            }else{
              this.$el.append(page_view.render().el);

            }
          }
        }
      }
    }
              // should remove the "hidden" selections
              // then should render the selections for this page from autodetectedSelections the "normal" way.
              Tabula.pdf_view.pdf_document.selections.filter(function(sel){ return sel.get('hidden') && sel.get('page') <= number}).map(function(hidden_selection){
                Tabula.pdf_view.pdf_document.selections.remove(hidden_selection);
                var new_selection = Tabula.pdf_view.renderSelection(hidden_selection.attributes); // adds it to Tabula.pdf_view.pdf_document.selections
                return new_selection;
              });
    return this;
  }
});

Tabula.PageView = Backbone.View.extend({ // one per page of the PDF
  document_view: null, //added on create
  className: 'pdf-page',
  iasAlreadyInited: false,
  selections: null,

  id: function(){
    return 'page-' + this.model.get('number');
  },

  template: _.template($('#templates #page-template').html().replace(/nestedscript/g, 'script')) ,

  'events': {
   // 'click i.rotate-left i.rotate-right': 'rotate_page',
  },

  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    _.bindAll(this, 'rotate_page', 'createTables',
      '_onSelectStart', '_onSelectChange', '_onSelectEnd', '_onSelectCancel', 'render');
    this.listenTo(Tabula.pdf_view.pdf_document, 'change', function(){ this.render(); });
    this.listenTo(Tabula.pdf_view.pdf_document, 'change', function(){ this.render(); });
  },

  render: function(){
    this.$el.html(this.template({
                    'number': this.model.get('number'),
                    'image_url': this.model.imageUrl()
                  }));
    this.$el.find('img').attr('data-page', this.model.get('number'))
                        .attr('data-original-width', this.model.get('width'))
                        .attr('data-original-height', this.model.get('height'));
                        // .attr('data-rotation', this.model.get('rotation'));
    this.$image = this.$el.find('img');
    return this;
  },

  createTables: function(asfd){
    this.iasAlreadyInited = true;
  },

  _onSelectStart: function(selection) {
    Tabula.pdf_view.pdf_document.selections.updateOrCreateByVendorSelectorId(selection,
                                                                  this.model.get('number'),
                                                                  this.$image.width());
  },

  _onSelectChange: function(selection) {
    Tabula.pdf_view.pdf_document.selections.updateOrCreateByVendorSelectorId(selection,
                                                                  this.model.get('number'),
                                                                  this.$image.width());
  },

  _onSelectEnd: function(selection) {
    var sel = Tabula.pdf_view.pdf_document.selections.updateOrCreateByVendorSelectorId(selection,
                                                                            this.model.get('number'),
                                                                            this.$image.width());

    // deal with invalid/too-small selections somehow (including thumbnails)
    if (selection.width === 0 && selection.height === 0) {
      $('#thumb-' + this.$image.attr('id') + ' #vendorSelection-show-' + selection.id).css('display', 'none');
      selection.remove();
    }

    // if this is not the last pager
    if(this.model != this.model.collection.last()) {
      var but_id = this.model.get('number') + '-' + selection.id;  //create a "Repeat this Selection" button
      var button = $('<div class="btn-group repeat-lassos-group" id="'+but_id+'"> \
      <button type="button" class="btn btn-default repeat-lassos">Repeat this Selection</button>\
      <button type="button" class="btn btn-default dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
        <span class="caret"></span>\
        <span class="sr-only">Toggle Dropdown</span>\
      </button>\
      <ul class="dropdown-menu">\
        <li><a class="dropdown-item repeat-lassos" href="#">Repeat to All Pages</a></li>\
        <li><a class="dropdown-item repeat-lasso-once" href="#">Repeat to Next Page</a></li>\
      </ul>\
    </div>');
      button.find("button").data("selectionId", selection.id);
      button.find("a").data("selectionId", selection.id);
      selection.$el.append(button);
    }

    Tabula.pdf_view.components['control_panel'].render(); // deals with buttons that need blurred out if there's zero selections, etc.
  },

  // vendorSelection
  _onSelectCancel: function(selection) {
    // remove repeat lassos button
    var but_id = this.$image.attr('id') + '-' + selection.id;
    $('button#' + but_id).remove();

    // find and remove the canceled selection from the collection of selections. (triggering remove events).
    var sel = Tabula.pdf_view.pdf_document.selections.get(selection.id);
    removed_selection = Tabula.pdf_view.pdf_document.selections.remove(sel);

    Tabula.pdf_view.components['control_panel'].render(); // deal with buttons that need blurred out if there's zero selections, etc.
  },

  rotate_page: function(t) {
      alert('not implemented');
  }
});

Tabula.ControlPanelView = Backbone.View.extend({ // only one
  events: {
    'click #clear-all-selections': 'clearAllSelections',
    'click #restore-detected-tables': 'restoreDetectedTables',
    'click #all-data': 'queryAllData',
    'click #repeat-lassos': 'repeatLassos',
    'click #save-template': 'saveTemplate',
  },

  template: _.template($('#templates #select-control-panel-template').html().replace(/nestedscript/g, 'script')),
  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    this.saved_template_collection = stuff.saved_template_collection;
    _.bindAll(this, 'queryAllData', 'render', 'saveTemplate');
    this.listenTo(this.pdf_view.pdf_document, 'sync', this.render );
    this.saved_template_library_view = new Tabula.SavedTemplateLibraryView({collection: this.saved_template_collection})
  },

  /* in case there's a PDF with a complex format that's repeated on multiple pages */
  repeatFirstPageLassos: function(){
    alert('not yet implemented');
    return;
    /* TODO: write this */
  },

  clearAllSelections: function(){
    _(Tabula.pdf_view.pdf_document.selections.models.slice()).each(function(i){ if(typeof i.attributes.remove !== "undefined") i.attributes.remove(); }); // call remove() on the vendorSelection of each seleciton; except for "hidden" selections that don't have one.
    Tabula.pdf_view.pdf_document.selections.reset([]);
    Tabula.pdf_view.components['control_panel'].render(); // deal with buttons that need blurred out if there's zero selections, etc.
    // reset doesn't trigger the right events because we have to remove from the collection and from the page (with selection.remove())
    // we can't use _.each because we're mutating the collection that we're iterating over
    // ugh
  },

  saveTemplate: function(e){
    $btn = $(e.currentTarget);
    $btnText = $btn.find(".button-text");
    var oldButtonText = $btnText.text();
    $btn.attr("disabled", "disabled");
    $btnText.text("Saving...");
    this.pdf_view.saveTemplate(function(){ 
      $btnText.text("Saved!");
      window.setTimeout( function(){
        $btn.removeAttr("disabled");
        $btn.removeProp("disabled");
        $btnText.text(oldButtonText);
      }, 2000);
    });
  },

  restoreDetectedTables: function(){
    var autodetected_selections = this.pdf_view.pdf_document.autodetected_selections.models.map(function(sel){
      return Tabula.pdf_view.renderSelection(sel.attributes);
    });
    this.pdf_view.pdf_document.selections.reset(autodetected_selections);
  },

  queryAllData : function(){
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
    var numOfSelectionsOnPage = this.pdf_view.totalSelections();
    this.$el.html(this.template(
              _(this.pdf_view.pdf_document.attributes).extend({
                  'disable_clear_all_selections': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '' ,
                  'disable_download_all': numOfSelectionsOnPage <= 0 ? 'disabled="disabled"' : '',

                  // three states: autodetection still incomplete, autodetection done but no tables found, autodetection done and tables found
                  'restore_detected_tables': this.pdf_view.hasAutodetectedTables ? "autodetect-finished" : "autodetect-in-progress",
                  'disabled_if_there_are_selections': numOfSelectionsOnPage > 0 || this.pdf_view.pdf_document.autodetected_selections.size() === 0 ? 'disabled="disabled"' : '',

                  'disable_save_template':numOfSelectionsOnPage == 0 ? 'disabled="disabled"' : '',
                  'disable_load_template': numOfSelectionsOnPage > 0 ? 'disabled="disabled"' : ''

                  })));
    
    this.$el.find("#template-dropdown-templates-list-container").html(this.saved_template_library_view.render().el);

    return this;
  },
});

Tabula.SidebarView = Backbone.View.extend({
  className: 'sidebar-view',
  thumbnail_list_view: null, // defined on initialize
  pdf_view: null,            // defined on initialize
  template: _.template($('#templates #select-sidebar-template').html().replace(/nestedscript/g, 'script')),
  initialize: function(stuff){
    _.bindAll(this, 'render')
    this.pdf_view = stuff.pdf_view;
    this.thumbnail_list_view = new Tabula.ThumbnailListView(stuff);
  },
  render: function(){
    this.$el.html(this.template({
                    'original_filename': this.pdf_view.pdf_document.get('original_filename')
                  }));
    this.thumbnail_list_view.$el = this.$el.find("#thumbnail-list");
    this.thumbnail_list_view.render();
    return this;
  }
}),

Tabula.ThumbnailListView = Backbone.View.extend({ // only one
  tagName: 'ul',
  className: 'thumbnail-list',
  thumbnail_views: {},
  pdf_view: null, // defined on initialize
  initialize: function(stuff){
    this.pdf_view = stuff.pdf_view;
    _.bindAll(this, 'addSelectionThumbnail', 'removeSelectionThumbnail', 'changeSelectionThumbnail',
                    'removeThumbnail', 'render');

    this.listenTo(this.collection, 'remove', this.removeThumbnail);

    this.listenTo(this.pdf_view.pdf_document.selections, 'sync', this.render);
    this.listenTo(this.pdf_view.pdf_document.selections, 'add', this.addSelectionThumbnail); // render a thumbnail selection
    this.listenTo(this.pdf_view.pdf_document.selections, 'change', this.changeSelectionThumbnail); // render a thumbnail selection
    this.listenTo(this.pdf_view.pdf_document.selections, 'remove', this.removeSelectionThumbnail); // remove a thumbnail selection
  },
  addSelectionThumbnail: function (new_selection){
    if(this.thumbnail_views[new_selection.get('page_number')].$el.find('img').length){
      this.thumbnail_views[new_selection.get('page_number')].createSelectionThumbnail(new_selection);
    }
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

  render: function(){
    if(!Tabula.LazyLoad){ // old-style, un-lazyload behavior where all pages are shown at once.
      _(this.thumbnail_views).each(_.bind(function(thumbnail_view, index){
        var already_on_page = $('#page-' + parseInt(index)+1).length;
        if(!already_on_page) this.$el.append(thumbnail_view.render().el);
      }, this));
    }else{

      for (var number=Tabula.pdf_view.lazyLoadCursor;number>0;number--){
        var thumbnail_view = this.thumbnail_views[number];
        if(!thumbnail_view) continue; // this is the first render, and there are no pages (or there's a problem!)
        var thumb_el = $('#thumb-page-' + number);
        var visible_on_page = thumb_el.filter(':visible').length;
        if(visible_on_page && Tabula.HideOnLazyLoad){
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) >= Tabula.LazyLoad ) {
            $('#thumb-page-' + number).hide();
            // console.log('hide', number)
          }
        }else{
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) < Tabula.LazyLoad ) {
            if(thumb_el.length){
              thumbnail_view.$el.show();
              // console.log('show ' + number);
            }else{
              this.$el.prepend(thumbnail_view.render().el);
              // console.log('append ' + number);
            }
          }
        }
      }
      for (var number=Tabula.pdf_view.lazyLoadCursor+1;number<=_(this.thumbnail_views).keys().length;number++){
        var thumbnail_view = this.thumbnail_views[number];
        if(!thumbnail_view) continue; // this is the first render, and there are no pages (probably!)
        var thumb_el = $('#thumb-page-' + number);
        var visible_on_page = thumb_el.filter(':visible').length;
        if(visible_on_page && Tabula.HideOnLazyLoad){
          if(! (Math.abs(Tabula.pdf_view.lazyLoadCursor - number) < Tabula.LazyLoad )) {
            $('#thumb-page-' + number).hide();
            // console.log('hide', number)
          }
        }else{
          if(Math.abs(Tabula.pdf_view.lazyLoadCursor - number) < Tabula.LazyLoad ) {
            if(thumb_el.length){
              thumbnail_view.$el.show();
              // console.log('show ' + number);
            }else{
              this.$el.append(thumbnail_view.render().el);
              // console.log('append ' + number);
            }
          }
        }
      }

    }

    return this;
  }
});

Tabula.ThumbnailView = Backbone.View.extend({ // one per page
  'events': {
    // on load, create an empty div with class 'selection-show' to be the selection thumbnail.
    'load .thumbnail-list li img': function() { $(this).after($('<div />', { class: 'selection-show'})); },
    'click .delete-page': 'deletePage',
    'click a': 'scrollToPage'
  },
  tagName: 'li',
  className: "page-thumbnail page",
  id: function(){
    return 'thumb-page-' + this.model.get('number');
  },

  // initialize: function(){
  // },
  template: _.template($('#templates #thumbnail-template').html().replace(/nestedscript/g, 'script')),

  initialize: function(){
    _.bindAll(this, 'render', 'createSelectionThumbnail', 'changeSelectionThumbnail', 'removeSelectionThumbnail');
    this.listenTo(Tabula.pdf_view.pdf_document, 'change', function(){ this.render(); });
    this.listenTo(Tabula.pdf_view.pdf_document, 'change', function(){ this.render(); });
  },

  // why do we have this?
  // due to #586 / https://github.com/tabulapdf/tabula/commit/d3bdb4957ebc84ef2c2b0ceebb6f2ea5cca0faed,
  // Tabula now works under a relative path, using the <base> tag.
  // however, the base tag breaks anchor links, since <base> applies to them too.
  // so we have to replicate the "normal" anchor-link click behavior here.
  scrollToPage: function(e){
    console.log("scrollToPage");
    var hashToGoTo = $(e.currentTarget).attr('href').replace("#", "")
    document.location.hash=hashToGoTo;
    e.preventDefault();
  },

  deletePage: function(){
    if (!confirm('Delete page ' + this.model.get('number') + '?')) return;
    Tabula.pdf_view.pdf_document.page_collection.remove( this.model );
  },

  render: function(){
    this.$el.html(this.template({
                    'number': this.model.get('number'),
                    'image_url': this.model.imageUrl()
                  }));

    // stash some selectors (which don't exist at init)
    this.$img = this.$el.find('img');
    this.img = this.$img[0];
    this.$img.attr('data-page', this.model.get('number'));

    return this;
  },

  createSelectionThumbnail: function(selection) {
    var $sshow = $('<div class="selection-show" id="selection-show-' + selection.cid + '" />').css('display', 'block');
    this.$el.append( $sshow );
    this.changeSelectionThumbnail(selection);
  },

  changeSelectionThumbnail: function(selection){
    var $sshow = this.$el.find('#selection-show-' + selection.cid);

    // don't break everything if the sidebar happens to be broken.
    var thumbScale = this.$img ? this.$img.width() / selection.get('imageWidth') : 0;
    var left = parseFloat(this.$el.css('padding-left'));
    var top = parseFloat(this.$el.css('padding-top'));

    // if data has gotten messed up somewhere
    if(!selection.attributes) return;

    // if thumbnail doesn't exist (probably because this selection is hidden in an unshown page)
    if(!selection.attributes.getDims) return;

    var s = selection.attributes.getDims().relativePos;

    $sshow.css('top', (top + (s.top * thumbScale)) + 'px')
      .css('left', (left + (s.left * thumbScale)) + 'px')
      .css('width', (s.width * thumbScale) + 'px')
      .css('height', (s.height * thumbScale) + 'px');
  },

  removeSelectionThumbnail: function(selection){
    var $sshow = this.$el.find('#selection-show-' + selection.cid);
    $sshow.remove();
  }
});

Tabula.PDFView = Backbone.View.extend(
  _.extend({
    el : '#tabula-app',

    events : {
    },
    lastQuery: [{}],
    pageCount: undefined,
    lazyLoadCursor:  parseInt(window.location.hash.replace("#page-", '')) || 1, // 0 is invalid, because pages are one-indexed
    components: {},

    hasAutodetectedTables: false,
    global_options: null,

    initialize: function(){
      _.bindAll(this, 'render', 'addOne', 'addAll', 'totalSelections', 'renderSelection',
        'createDataView', 'checkForAutodetectedTables', 'getData', 'handleScroll',
        'loadSavedTemplate', 'saveTemplate', 'saveTemplateAs');

      this.pdf_document = new Tabula.Document({
        pdf_id: PDF_ID,
      });

      this.pdf_document.fetch({
        success: function(m){ }, 
        error: function(m, r, o){ console.log("error", m, r, o) }
      });

      this.options = new Tabula.Options();
      this.listenTo(this.options, 'change', this.options.write);

      // we'll never be ~adding~ individual pages, I don't think (hence no 'add' event)
      this.listenTo(this.pdf_document.page_collection, 'sync', this.addAll);
      this.listenTo(this.pdf_document.page_collection, 'reset', this.addAll);
      this.listenTo(this.pdf_document.page_collection, 'remove', this.removePage);
      // this caused page ordering issues. Makes me wonder if pdf_view rendering is not idempotent.
      // anyways, I don't remember why I had this. probably you shouldn't reenable it.
      // this.listenTo(this.pdf_document.page_collection, 'all', _.bind(function(){ console.log('pdfview render page all'); this.render()}, this));
      this.saved_template_collection = new Tabula.TemplatesCollection(); // this is mandatorily ordered above `new Tabula.ControlPanelView`
      this.saved_template_collection.fetch();

      this.components['document_view'] = new Tabula.DocumentView({el: '#pages-container' , pdf_view: this, collection: this.pdf_document.page_collection}); //creates page_views
      this.components['control_panel'] = new Tabula.ControlPanelView({pdf_view: this, saved_template_collection: this.saved_template_collection});
      this.components['sidebar_view'] = new Tabula.SidebarView({pdf_view: this, collection: this.pdf_document.page_collection});

      $(document).on('scroll', _.throttle(this.handleScroll, 100, {leading: false}));
      $('#sidebar').on('scroll', _.throttle(this.handleScroll, 100, {leading: false}));


      $('body').
        on("click", ".repeat-lassos", function(e){
          var selectionId = $(e.currentTarget).data('selectionId');
          var selection = Tabula.pdf_view.pdf_document.selections.get(selectionId);
          selection.repeatLassos();
          e.preventDefault();
        });
      $('body').
        on("click", ".repeat-lasso-once", function(e){
          var selectionId = $(e.currentTarget).data('selectionId');
          var selection = Tabula.pdf_view.pdf_document.selections.get(selectionId);
          selection.repeatLassoOnce();
          e.preventDefault();
        });


      window.tabula_router.route("pdf/:file_id/extract", function(){
        Tabula.pdf_view.createDataView();
        Tabula.pdf_view.query.doQuery();
      } );

      _(['', '/', '/select']).each(function(path_suffix){
        window.tabula_router.route("pdf/:file_id" + path_suffix, function(){
          Tabula.pdf_view.components['data_view'].closeAndRenderSelectionView();
        });
      });
    },

    handleScroll: function(e){
      // check which page_view is "active" (i.e. topmost that's partially in the window)
      var pdf_pages = $('.pdf-page');
      var new_cursor = 0;
      for (i=0; i<pdf_pages.length; i++){
        var el = pdf_pages[i];
        if(isElementPartiallyInContainer(el, this.components['document_view'].el)){
          $('.page-thumbnail.active').removeClass('active');
          this.components['sidebar_view'].thumbnail_list_view.thumbnail_views[i+1].$el.addClass('active');
          new_cursor = Math.max(new_cursor, parseInt($(el).find('img').data('page')));
          break;
        }
      }
      var thumbs = $('.page-thumbnail');
      for (i=0; i<thumbs.length; i++){
        var el = thumbs[i];
        if(isElementPartiallyInContainer(el, this.components['sidebar_view'].el)){
          new_cursor = Math.max(new_cursor, parseInt($(el).find('img').data('page')));
          break;
        }
      }
      Tabula.pdf_view.lazyLoadCursor = new_cursor;

      this.components['document_view'].render(); 
      this.components['sidebar_view'].thumbnail_list_view.render();
      // console.log("cursor", Tabula.pdf_view.lazyLoadCursor)
    },

    getData: function(){
      this.pdf_document.page_collection.fetch({
        success: _.bind(function(){
          this.checkForAutodetectedTables();
        }, this),
        error: _.bind(function(){
          console.log('404'); //TODO: make this a real 404, with the right error code, etc.
          $('#tabula').html("<h1>Error: We couldn't find your document.</h1><h2>Double-check the URL and try again?</h2><p>And if it doesn't work, <a href='https://github.com/tabulapdf/tabula/issues/new'> report a bug</a> and explain <em>exactly</em> what steps you took that caused this problem");
        }),
      });
    },

    checkForAutodetectedTables: function(){
      this.pdf_document.autodetected_selections.fetch({
        success: _.bind(function(){
          this.hasAutodetectedTables = true;
          window.clearTimeout(this.autodetect_timer);
          this.render();
        }, this),
        error: _.bind(function(){
          console.log("no predetected tables (404 on tables.json)");
          this.autodetect_timer = window.setTimeout(this.checkForAutodetectedTables, 2000);
          this.render();
        }, this)
      });
    },

    renderSelection: function(sel){
      // for a Tabula.Selection object's toCoords output (presumably taken out of the selection collection)
      // cause it to be rendered onto the page, and as a thumbnail
      // and causes it to get an 'id' attr.
      console.log("sel.page", sel);
      var pageView = Tabula.pdf_view.components['document_view'].page_views[sel.page];
      var page = Tabula.pdf_view.pdf_document.page_collection.findWhere({number: sel.page});
      if(!page){
        // the page we're trying to render a selection on might have been deleted.
        // or, we may be trying to load a template with more pages on it than this PDF has.
        console.log("can't render selection on page " + sel.page + " because that page can't be found", sel)
        return;
      }
      var original_pdf_width = page.get('width');
      var original_pdf_height = page.get('height');
      // var pdf_rotation = page.get('rotation');

      // TODO: create selection models for pages that aren't lazyloaded, but obviously don't display them.
      if(Tabula.LazyLoad && !pageView){
        return [];
      }

      // mimics drawing the selection onto the page
      var $img = pageView.$el.find('img');
      var image_width = $img.width();
      if (!$img.length || $img.data('loaded') !== 'loaded' || !$img.height() ){ // if this page isn't shown currently or the image hasn't been rendered yet, then create a hidden selectionx
        return this.pdf_document.selections.createHiddenSelection(sel);
      }
      var scale = image_width / original_pdf_width;
      var offset = $img.offset();
      var absolutePos = _.extend({}, offset,
                                {
                                  'top':  offset.top + (sel.y1 * scale),
                                  'left': offset.left + (sel.x1 * scale),
                                  'width': (sel.width * scale),
                                  'height': (sel.height * scale)
                                });
      // TODO: refactor to only have this ResizableSelection logic in one place.
      var vendorSelection = new ResizableSelection({
        position: absolutePos,
        target: pageView.$el.find('img'),
        areas: function(){ return Tabula.pdf_view.components['document_view']._selectionsGetter($img) }
      });
      vendorSelection.on({
        resize: _.debounce(pageView._onSelectChange, 100),
        remove: pageView._onSelectCancel
      });

      Tabula.pdf_view.components['document_view'].$el.append(vendorSelection.el);

      pageView._onSelectEnd(vendorSelection); // draws the thumbnail

      // put the selection into the selections collection
      selection = this.pdf_document.selections.updateOrCreateByVendorSelectorId(vendorSelection, sel.page, image_width);
      return selection;

    },

    removePage: function(removedPageModel){
      $.post((base_uri || '/') + 'pdf/' + PDF_ID + '/page/' + removedPageModel.get('number'),
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

    addOne: function(page) {
      if(page.get('deleted')){
        return;
      }
      var page_view = new Tabula.PageView({model: page, collection: this.pdf_document.page_collection});
      var thumbnail_view = new Tabula.ThumbnailView({model: page, collection: this.pdf_document.page_collection});


      this.components['document_view'].page_views[ page.get('number') ] =  page_view;
      this.components['sidebar_view'].thumbnail_list_view.thumbnail_views[ page.get('number') ] = thumbnail_view;
    },

    addAll: function() {
      // a failed attempt at lazy load. kept in case I change my mind.
      // if(Tabula.LazyLoad){
      //   _(this.pdf_document.page_collection.slice(0, Tabula.LazyLoad)).each(this.addOne, this);
      // }else{
        this.pdf_document.page_collection.each(this.addOne, this);
      // }
    },

    totalSelections: function() {
      return this.pdf_document.selections.size();
    },

    loadSavedTemplate: function(template_model){
      var existent_page_numbers = Tabula.pdf_view.pdf_document.page_collection.models.map(function(page){ return page.get('number')});

      _(Tabula.pdf_view.pdf_document.selections.models.slice()).each(function(i){ if(typeof i.attributes.remove !== "undefined") i.attributes.remove(); }); // call remove() on the vendorSelection of each seleciton; except for "hidden" selections that don't have one.
      template_model.fetch({success: _.bind(function(template_model){
        var selections_to_load = _(_(template_model.get('selections')).filter(function(sel){ return existent_page_numbers.indexOf(sel.page) >= 0 })).map(function(sel){
          return Tabula.pdf_view.renderSelection(sel);
        });
        this.pdf_document.selections.reset(selections_to_load);
      }, this)});
    },

    saveTemplate: function (cb) {
      var name = (this.loadedSavedState && this.loadedSavedState.name) || (this.pdf_document.attributes.original_filename).replace(".pdf", "")
      console.log(this.pdf_document.attributes);
      this.saveTemplateAs(null, name, cb)
    },

    saveTemplateAs: function(id, name, cb){
      var list_of_coords = Tabula.pdf_view.pdf_document.selections.invoke("toCoords");
      // {"name": "fake test template", "selection_count": 0, "page_count": 0, "time": "1499535056", "id": "asdfasdf"}
      var templateMetadata = {
        name: name,
        selection_count: list_of_coords.length,
        page_count: _(_(list_of_coords).map(function(obj){ return obj["page"] })).uniq().length,
        time: Math.floor(Date.now() / 1000),
        template: _(list_of_coords).map(function(obj){ return _.omit(obj, 'selection_id') })
      };
      var saved_template = new Tabula.SavedTemplate(templateMetadata);
      saved_template.save(null,{success: cb, error: cb});
    },

    render : function(){
      document.title="Select Tables | Tabula";
      this.components['document_view'].render();

      $('#control-panel').append(this.components['control_panel'].render().el);
      $('#sidebar').append(this.components['sidebar_view'].render().el);
      this.components['sidebar_view'].thumbnail_list_view.$el = this.components['sidebar_view'].$el.find("#thumbnail-list");
      this.components['sidebar_view'].thumbnail_list_view.render();

      $('.has-tooltip').tooltip();

      this.pageCount = this.pdf_document.page_collection.size();

      // an attempt to restore the scroll position when you return to revise selections
      // I'm not sure why it doesn't work without a timeout -- maybe because the images haven't rendered yet?
      if(this.selectionScrollTop){
        $('html').scrollTop(this.selectionScrollTop);
        this.selectionScrollTop = 0;
      }

      return this;
    },
  }, Tabula.DebugPDFView));


Tabula.SavedTemplateView = Backbone.View.extend({
  tagName: 'li',
  className: 'saved-template',
  events: {
    'click a': 'loadTemplate'
  },
  template: _.template("<a><%= name %></a>"),
  initialize: function(){
    _.bindAll(this, 'render', 'loadTemplate');
  },
  render: function(){
    this.$el.append(this.template(this.model.attributes));
    this.$el.addClass('file-id-' + this.model.get('id')); // more efficient lookups than data-attr
    if(Tabula.pdf_view.totalSelections() > 0){
      this.$el.find("a").attr("disabled", "disabled");
      this.$el.find("a").css({"color": "gray", "cursor": "default"})
    }
    this.$el.data('id', this.model.get('id')); //more cleanly accesse than a class
    return this;
  },
  loadTemplate: function(e){
    if($(e.currentTarget).attr("disabled")){
      return;
    }
    Tabula.pdf_view.loadSavedTemplate(this.model); // TODO: make this not a reference to global Tabula.pdf_view
  }
});
Tabula.SavedTemplateLibraryView = Backbone.View.extend({
  tagName: 'ul',
  initialize: function(stuff){
    _.bindAll(this, 'render');
    this.listenTo(this.collection, 'change', this.render);
  },
  render: function(){
    this.$el.empty();
    this.collection.each(_.bind(function(saved_template_model){
      var template_view = new Tabula.SavedTemplateView({model: saved_template_model, collection: this.collection});
      this.$el.append(template_view.render().el);
    }, this));
    return this;
  }
});



function isElementPartiallyInViewport (el) {
  if (el instanceof jQuery) {
      el = el[0];
  }
  var rect = el.getBoundingClientRect();
  return (
      ( (rect.top > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight) ) ||
      (rect.bottom < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0) ) && /*or $(window).height() */
      ( (rect.left > 0 && rect.left < (window.innerWidth || document.documentElement.clientWidth) ) ||
      (rect.right < (window.innerWidth || document.documentElement.clientWidth) && rect.right > 0) ) /*or $(window).height() */
  );
}


// checks if el is overlaps the overlaps the visible portion of the container
function isElementPartiallyInContainer (el, container) {
  if (el instanceof jQuery) {
      el = el[0];
  }
  if (container instanceof jQuery) {
      container = container[0];
  }
  var rect = el.getBoundingClientRect();
  var container_rect = container.getBoundingClientRect();
  var bounding_rect = {}; // the intersection of the viewport and the container
  bounding_rect.top = Math.max(container_rect.top, 0);
  bounding_rect.left = Math.max(container_rect.left, 0);
  bounding_rect.bottom = Math.min(container_rect.bottom, (window.innerHeight || document.documentElement.clientHeight));
  bounding_rect.right = Math.min(container_rect.right, (window.innerWidth || document.documentElement.clientWidth));

  return (
      ( (rect.top >= bounding_rect.top && rect.top <= (bounding_rect.bottom) ) ||
      (rect.bottom <= (bounding_rect.bottom) && rect.bottom >= bounding_rect.top) ) &&
      ( (rect.left >= bounding_rect.left && rect.left <= (bounding_rect.right) ) ||
      (rect.right <= (bounding_rect.right) && rect.right >= bounding_rect.left) )
  );
}



function isElementInViewport (el) {
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

function roundTo(num, fancymathwordforthenumberofdigitsafterthedecimal){
  return Math.round(num * Math.pow(10, fancymathwordforthenumberofdigitsafterthedecimal)) / Math.pow(10, fancymathwordforthenumberofdigitsafterthedecimal);
}
