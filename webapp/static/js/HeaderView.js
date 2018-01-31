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
    previous_y: 0,
    BUFFER:10, //TODO: make a prototype include buffer as a const
    enableHeaderResize: function(event){
      console.log("In enableHeaderResize:");
      this.resizing = true;
      this.previous_y = (event.pageY - this.$el['0'].parentElement.offsetTop);
      var new_height = parseInt(this.$el.css('height'));

      //So that the user can more easily drag the header area when its up at the top of the page
      if(this.BUFFER>=this.previous_y){
        new_height = this.BUFFER;
      }

      this.$el.css({'height': new_height})

    },

    endHeaderResize: function(event){
      if(this.resizing===true){
        this.resizing = false;
        console.log("In endHeaderResize:");
        console.log(this.$el)
        this.trigger('header_resized',{'header_height':parseInt(this.$el.css('height'))});
      }
    },

    resizeHeader: function(event){
      if(this.resizing===true){
        var mouseLocation = event.pageY - this.$el['0'].parentElement.offsetTop;
        var new_height = mouseLocation;
        if((this.previous_y>new_height) && (new_height<=this.BUFFER)){ //When the user is shrinking the size of the header
          new_height=0;
        }
        else{
          new_height+=this.BUFFER; //buffer added to reduce cursor flicker
        }
        this.$el.css({'height': new_height })
        if(new_height==0){
          this.endHeaderResize(event);
        }
        this.previous_y = mouseLocation; //Updating status variables for next event...
      }
    },

    initialize: function(data){

      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
      this.$el.css({
        "top": data.top,
        "left": data.left,
        "width": data.width,
        "height": this.BUFFER //A small height so that the user can easily drag the header to its intended size
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
