//SelectionPrototypes.js
//   File containing the prototypes for resizableSelection and regexSelection
//
//   The file was created with the intent to to limit code redundancies between RegexSelection and ResizableSelection
//   in a manner that favors composition over inheritance such that future developments will not be
//   constrained by past hierarchical decisions.
//
//   1/11/2018  REM; created by pulling from regexSelection.js and resizableSelection.js
//


// returns true if this tableView does not overlap
// with any other on the same page
var checkOverlaps = function() {
  var thisDims = this.getDims().absolutePos;
  return _.every(
    _.reject(this.areas(this.pageView), function(s) {
      return s.id === this.id;
    }, this),
    function(s) {
      var sDims = s.getDims().absolutePos;
      return thisDims.left + thisDims.width < sDims.left ||
        sDims.left + sDims.width < thisDims.left ||
        thisDims.top + thisDims.height < sDims.top ||
        sDims.top + sDims.height < thisDims.top;
    }, this);
};

var remove = function(){
  this.trigger('remove', this);
  Backbone.View.prototype.remove.call(this);
};

var render = function() {
  this.$el.append(this.template);
  return this;
};

var getDims = function() {
  if((!$(this.pageView).is(':visible') || !this.$el.is(':visible')) && this.cachedDims){
    return this.cachedDims;
  }
  var o = { top: parseFloat(this.$el.css('top')),
    left: parseFloat(this.$el.css('left')) };
  var targetPos = $(this.pageView).offset();
  // console.log($(this.pageView).is(':visible'), this.$el.is(':visible'));
  this.cachedDims = {
    id: this.id,
    "$el": this.$el,
    absolutePos: {
      top: o.top,
      left: o.left,
      width: this.$el.css('box-sizing') == "border-box" ? this.$el.outerWidth() : this.$el.width(),
      height: this.$el.css('box-sizing') == "border-box" ? this.$el.outerHeight(): this.$el.height()
    },
    relativePos: {
      top: o.top - targetPos.top,
      left: o.left - targetPos.left,
      width: this.$el.css('box-sizing') == "border-box" ? this.$el.outerWidth() : this.$el.width(),
      height: this.$el.css('box-sizing') == "border-box" ? this.$el.outerHeight() : this.$el.height()
    }
  };
  return this.cachedDims;
};


var regex_select_proto = {checkOverlaps: checkOverlaps,
                          remove: remove,
                          render: render,
                          getDims: getDims,
                          selection_type : 'regex',
                          tagName: 'div',
                          className: 'regex-table-region',
                          template: "<div class='fixed-handle n-border'></div>" +
                                    "<div class='fixed-handle s-border'></div>" +
                                    "<div class='fixed-handle w-border'></div>" +
                                    "<div class='fixed-handle e-border'></div>" +
                                    "<div class='fixed-handle nw-border'></div>" +
                                    "<div class='fixed-handle sw-border'></div>" +
                                    "<div class='fixed-handle se-border'></div>" +
                                    "<div class='fixed-handle ne-border'></div>",
                          initialize: function(options) {
                            this.bounds = options.bounds;
                            this.pageView = options.target;
                            this.areas = options.areas;
                            this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();

                            _.bindAll(this, 'remove');
                            this.render();
                            this.$el.css(options.position);
                          }};

var resizable_select_proto = {checkOverlaps: checkOverlaps,
                              remove: remove,
                              render: render,
                              getDims: getDims,
                              tagName: 'div',
                              className:'table-region',
                              template:"<div class='resize-handle n-border'></div>" +
                                       "<div class='resize-handle s-border'></div>" +
                                       "<div class='resize-handle w-border'></div>" +
                                       "<div class='resize-handle e-border'></div>" +
                                       "<div class='resize-handle nw-border'></div>" +
                                       "<div class='resize-handle sw-border'></div>" +
                                       "<div class='resize-handle se-border'></div>" +
                                       "<div class='resize-handle ne-border'></div>" +
                                       "<button name='close'>×</button>",
                              events: {
                                'mousedown .resize-handle': 'mouseDownResize',
                                'mousemove': 'mouseMoveResize',
                                'mouseup': 'mouseUpResize',
                                'click button[name=close]': 'remove'
                              },
                              resizeDirectionMatch : /(n|s|w|e|ne|nw|se|sw)-border/,
                              mouseDownResize : function(event) {
                                var d = resizeDirectionMatch.exec($(event.target).attr('class'));
                                if (!d || d.length < 2) {
                                  this.resizing = false;
                                }
                                else {
                                  this.resizing = d[1];
                                  this.trigger('start', this);
                                }},
                              mouseMoveResize : function(event) {
                                if (!this.resizing) return;
                                  var ev = event;
                                  var css = {};
                                  var oldDims = this.getDims().absolutePos;
                                  if (this.resizing.indexOf('n') !== -1) {
                                    css.height = oldDims.height + oldDims.top - ev.pageY;
                                    css.top = ev.pageY;
                                  }
                                  else if (this.resizing.indexOf('s') !== -1) {
                                    css.height = ev.pageY - oldDims.top;
                                  }
                                  if (this.resizing.indexOf('w') !== -1) {
                                    css.width =  oldDims.width + oldDims.left - ev.pageX;
                                    css.left = ev.pageX;
                                  }
                                  else if (this.resizing.indexOf('e') !== -1) {
                                    css.width = ev.pageX - oldDims.left;
                                  }
                                  this.$el.css(css);
                                  this.trigger('resize', this.getDims());
                                  if (!this.checkOverlaps()) {
                                    this.$el.css(oldDims);
                                  }},
                              mouseUpResize : function(event) {
                                  if (this.resizing) {
                                    this.trigger('resize', this.getDims());
                                  }
                                  this.resizing = false;
                              },
                              initialize: function(options) {
                                this.bounds = options.bounds;
                                this.pageView = options.target;
                                this.areas = options.areas;
                                this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
                                this.$el.css(options.position);
                                this.render();
                                $(options.target).on({
                                  mousemove: _.bind(this.mouseMoveResize, this),
                                  mouseup: _.bind(this.mouseUpResize, this)
                                });
                                /* like rectangularSelector, we need to bind a global event
                                *  to watch if the user mouses-up outside the target element. */
                                $(document).on({
                                  mouseup: _.bind(this.mouseUpResize, this)
                                });
                                }};