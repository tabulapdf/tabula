/* jshint undef: true, unused: true */
/* global $, paper, Backbone, _, console */
(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition();
  else if (typeof define == 'function' && define.amd) define(definition);
  else context[name] = definition();
})('RegexSelection', this, function (name, context) {
  _.extend(regex_select_proto,{
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
    }});
  return Backbone.View.extend(regex_select_proto);
});
