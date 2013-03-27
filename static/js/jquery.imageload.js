/*
 * jquery.imageload -  reliable image load event 
 *
 * Copyright (c) 2011 Jess Thrysoee (jess@thrysoee.dk)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

/*jshint jquery:true*/

(function ($) {

   // global 
   $.ImageLoader = function (src) {
      var img, loader;

      // internal image
      img = new Image();

      loader = $.Deferred(function (deferred) {
         var ns = '.ImageLoader',
             events;

         // load is unreliable on IE so listen for readystatechange instead
         events = $.map([$.browser.msie ? 'readystatechange' : 'load', 'abort', 'error'], function (type) {
            return type + ns;
         }).join(' ');

         $(img).bind(events, function (e) {

            if (e.type === 'readystatechange') {
               if (this.readyState !== 'complete') {
                  // ignore and handle when error is fired
                  return false;
               }
            }

            if (e.type === 'abort' || e.type === 'error') {
               deferred.rejectWith(this, [e]);
            } else {
               deferred.resolveWith(this, [e]);
            }

            $(this).unbind(ns);

            return false;
         });
      }).promise();


      // start image download
      loader.load = function () {
         if (!img.src) {
            img.src = src;
         }
         return this;
      };


      return loader;
   };


   // plugin
   $.fn.imageLoad = function (callback) {
      return this.filter('img').each(function () {
         var img = this;

         if (!img.src) {
            $.error('imageLoad: undefined src attribute');
         }

         // load internal image
         $.ImageLoader(img.src).load().then(function (e) {
            // call with the external image as 'this'
            callback.call(img, e);
         }, function (e) {
            callback.call(img, e);
         });

      });
   };

}(jQuery));