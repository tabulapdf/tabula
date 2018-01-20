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
    template:"<div class='resize-handle n-border'></div>" +
    "<div class='resize-handle s-border'></div>" +
    "<div class='resize-handle w-border'></div>" +
    "<div class='resize-handle e-border'></div>" +
    "<div class='resize-handle nw-border'></div>" +
    "<div class='resize-handle sw-border'></div>" +
    "<div class='resize-handle se-border'></div>" +
    "<div class='resize-handle ne-border'></div>",
    initialize: function(data){
      console.log("Data");
      console.log(data);
      this.position = {"top":    data.top,
                       "left":   data.left,
                       "width":  data.width,
                       "height": 0};
      this.id = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now();
      this.$el.css(this.position);
      console.log(this.$el);
      }});
    });
