/* jshint undef: true, unused: true */
/* global $, paper, Backbone, _, console */

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else context[name] = definition();
})('RegexSelection', this, function (name, context) {



  var RegexSelection = Backbone.View.extend({
    selection_type: 'regex',
    tagName: 'div',
    className: 'regex-table-region',

    template:
    "<div class='fixed-handle n-border'></div>" +
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
    },

    remove: function(){
      this.trigger('remove', this);
      Backbone.View.prototype.remove.call(this);
    },

    render: function() {
      this.$el.append(this.template);
      return this;
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
    }
  });

  return RegexSelection;
});
