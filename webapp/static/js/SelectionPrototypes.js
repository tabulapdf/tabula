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


var regex_select_proto = {
  checkOverlaps: checkOverlaps,
  remove: remove,
  render: render,
  getDims: getDims
};

var resizable_select_proto = {checkOverlaps: checkOverlaps,
                              remove: remove,
                              render: render,
                              getDims: getDims
};