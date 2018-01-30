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
      console.log("In endHeaderResize:");
      console.log(this.$el);
      if(this.resizing===true){
        this.resizing = false;
      }
    },

    resizeHeader: function(event){
      console.log("In resizeHeader:");
      console.log("Event:");
      console.log(event);
      if(this.resizing===true){
        var old_height = this.$el.css('height');
        var pot_new_height = event.pageY - this.$el['0'].parentElement.offsetTop;
        console.log("Old Height: "+ old_height);

        var new_height = (pot_new_height<=0) ? 0 : pot_new_height;

        console.log("New Height: "+ new_height);

        this.$el.css({'height': new_height })
      }
    },

    initialize: function(data){

      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
      this.$el.css({
        "top": data.top,
        "left": data.left,
        "width": data.width,
        "height": 0 //A small height amount so it is noticed...need to experiment with this
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
