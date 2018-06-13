/* jshint undef: true, unused: true */
//FooterView
//   Backbone View extension for managing user-defined footers.
//
//   Allows user to define an area at the bottom of a page that should not be considered content when performing a regex
//   search
//
//
//   2/21/2018  REM; created
//
/* global $, paper, Backbone, _, console */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else context[name] = definition();
})('FooterView', this, function (name, context) {
  return Backbone.View.extend({
    tagName: 'div',
    className:'footer-region',
    template:"",
    events:{'mousedown': 'enableFooterResize',
      'mouseup': 'endFooterResize',
      'mousemove': 'resizeFooter'},
    previous_y: 0, //Record of mouse height (relative to page) updated in between resize operations
    gui_page_height: null, //Set when the corresponding image of page has been loaded
    gui_page_top_offset: null, //Set when parent element has been loaded
    BUFFER:10, //TODO: make a prototype include buffer as a const to reduce object overhead...
    height_on_start_of_resize: 0, //Footer height before the user begins resize operation
    resizing: false,

    enableFooterResize: function(event){
      console.log("In enableFooterResize:");

      if(this.resizing == false) {
        this.height_on_start_of_resize = parseInt(this.$el.css('height'));
        this.resizing = true;

        if(this.gui_page_top_offset==null){
          this.gui_page_top_offset = this.$el['0'].parentElement.offsetTop;
        }


        console.log("Height at start:"+this.height_on_start_of_resize);
        this.previous_y = (event.pageY - this.gui_page_top_offset);

        //NOTE: gui_page_height will be undefined if the corresponding page image is not loaded before enableFooterResize is called
        if(this.gui_page_height==null) {
          this.gui_page_height = $(this.$el['0'].parentElement).find('img').height();
        }


        //So that the user can more easily drag the footer area up when it is initially at the bottom of the page
        if(this.BUFFER>=(this.gui_page_height-this.previous_y)){
          this.$el.css({'top': this.gui_page_height-this.BUFFER,
                        'height': this.BUFFER});
        }
      }

    },

    endFooterResize: function(event){
      if(this.resizing===true){
        this.resizing = false;
        console.log("In endFooterResize:");
        console.log(this.$el);
        sendback={};
        sendback['footer_height'] =parseInt(this.$el.css('height'));
        console.log("Height at finish:"+sendback['footer_height']);
        this.trigger('footer_resized',sendback);
      }
    },

    resizeFooter: function(event){

      if(this.resizing===true){
        console.log("In resizeFooter:");
        var mouseLocation = event.pageY - this.gui_page_top_offset;
        var new_height = this.gui_page_height - mouseLocation;

        var new_top = parseInt(this.$el.css('top'));

        if((this.previous_y<new_height) && ((this.gui_page_height-new_height)<=this.BUFFER)){ //When the user is shrinking the size of the footer
          new_height=0;
          new_top=this.gui_page_height;
          this.$el.css({'top': new_top,
            'height': new_height});
        }
        else{
          new_height+=this.BUFFER; //buffer added to reduce cursor flicker
          new_top = this.gui_page_height - new_height;
        }

        if((this.checkHeaderOverlap({'new_top':new_top}))||((new_height==0)&&(new_top==this.gui_page_height))){
          while(this.checkHeaderOverlap(++new_top)){} //Resize to borderline
          this.endFooterResize(event);
        }
        else{
          this.$el.css({'top': new_top,
            'height': new_height});
        }
        this.previous_y = mouseLocation; //Updating status variables for next mousemove...
      }

    },

    checkHeaderOverlap: function(data){
      //Returns true if overlap with header is detected...
      console.log(this.$el['0'].parentElement);
      var header_el = $(this.$el['0'].parentElement).find('.header-region');
      console.log("In checkHeaderOverlap:");
      console.log(header_el);

      console.log("Header Height:"+header_el.css('height'));
      console.log("Footer Top:"+data.new_top);


      return ((parseInt(header_el.css('height')))>data.new_top)

    },

    initialize: function(data){

      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
      this.$el.css({
        "top": data.top,
        "left": data.left,
        "width": data.width,
        "height": 0
      });

      this.$el.attr('title','Drag up to define footer area');


      //Detect when user moves mouse/release mouse outside of the area
      $(document).on({
        mousemove: _.bind(this.resizeFooter,this),
        mouseup: _.bind(this.endFooterResize, this)
      });
    }});
});
