/* jshint undef: true, unused: true */
//HeaderView
//   Backbone View extension for managing user-defined headers.
//
//   TODO: Insert larger blurb here
//
//
//   1/18/2018  REM; created
//
/* global $, paper, Backbone, _, console */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else context[name] = definition();
})('HeaderView', this, function (name, context) {
  return Backbone.View.extend({
    tagName: 'div',
    className:'header-region',
    template:"",
    events:{'mousedown': 'enableHeaderResize',
            'mouseup': 'endHeaderResize',
            'mousemove': 'resizeHeader'},

    enableHeaderResize: function(event){
      this.resizing = true;
    },

    endHeaderResize: function(event){
      console.log("Mouse Up Triggered:");
      if(this.resizing===true){
        this.resizing = false;
      }
    },

    resizeHeader: function(event){
      if(this.resizing===true){
        this.$el.css({'height': event.pageY - this.$el['0'].parentElement.offsetTop + 10 })
        //Note: the 10 acts as a buffer zone, so that resizing the Header does not 'flicker' the mouse between
        //cross-hair and row-resize...there's probably a better way to handle this...
      }

    },

    initialize: function(data){
      console.log("Data");
      console.log(data);
      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
      this.$el.css({
        "top": data.top,
        "left": data.left,
        "width": data.width,
        "height":20 //A small height amount so it is noticed...need to experiment with this
      });

      this.$el.attr('title','Drag down to define header area');
      this.resizing = false;

      //Detect when user moves mouse/release mouse outside of the area
      $(document).on({
        mousemove: _.bind(this.resizeHeader,this),
        mouseup: _.bind(this.endHeaderResize, this)
      });
      }});
    });
