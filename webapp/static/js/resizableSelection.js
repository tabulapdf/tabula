/* jshint undef: true, unused: true */
/* global $, paper, Backbone, _, console */

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else context[name] = definition();
})('ResizableSelection', this, function (name, context) {


  var resizeDirectionMatch = /(n|s|w|e|ne|nw|se|sw)-border/;

  var ResizableSelection = Backbone.View.extend({

    tagName: 'div',
    className: 'table-region',

    events: {
      'mousedown .resize-handle': 'mouseDownResize',
      'mousemove': 'mouseMoveResize',
      'mouseup': 'mouseUpResize',
      'click button[name=close]': 'remove'
    },

    template:
    "<div class='resize-handle n-border'></div>" +
      "<div class='resize-handle s-border'></div>" +
      "<div class='resize-handle w-border'></div>" +
      "<div class='resize-handle e-border'></div>" +
      "<div class='resize-handle nw-border'></div>" +
      "<div class='resize-handle sw-border'></div>" +
      "<div class='resize-handle se-border'></div>" +
      "<div class='resize-handle ne-border'></div>" +
      "<button name='close'>×</button>",

    initialize: function(options) {
      this.bounds = options.bounds;
      this.pageView = options.target;
      this.areas = options.areas;

      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();

      this.render();
      this.$el.css(options.position);

      $(options.target).on({
        mousemove: _.bind(this.mouseMoveResize, this),
        mouseup: _.bind(this.mouseUpResize, this)
      });

      /* like rectangularSelector, we need to bind a global event
       * to watch if the user mouses-up outside the target element. */
       $(document).on({
         mouseup: _.bind(this.mouseUpResize, this)
       });
    },

    render: function() {
      this.$el.append(this.template);
      return this;
    },

    remove: function() {
      this.trigger('remove', this);
      Backbone.View.prototype.remove.call(this);
    },


    getDims: function() {
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
    },

    mouseDownResize: function(event) {
      var d = resizeDirectionMatch.exec($(event.target).attr('class'));
      if (!d || d.length < 2) {
        this.resizing = false;
      }
      else {
        this.resizing = d[1];
        this.trigger('start', this);
      }
    },

    mouseMoveResize: function(event) {
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
      }
    },

    mouseUpResize: function(event) {
      if (this.resizing) {
        this.trigger('resize', this.getDims());
      }
      this.resizing = false;
    },

    // returns true if this tableView does not overlap
    // with any other on the same page
    checkOverlaps: function() {
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
    }
  });

  return ResizableSelection;
});
