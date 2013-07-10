/*
 * imgAreaSelect jQuery plugin
 * version 0.9.9
 *
 * Copyright (c) 2008-2012 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://odyniec.net/projects/imgareaselect/
 *
 */

(function($) {

/*
 * Math functions will be used extensively, so it's convenient to make a few
 * shortcuts
 */    
var abs = Math.abs,
    max = Math.max,
    min = Math.min,
    round = Math.round;

function div(cssClass) {
    /**
     * Create a new HTML div element, with optional class cssClass
     * 
     * @return A jQuery object representing the new element
     */
    var mydiv = $('<div/>');
    mydiv.addClass("imgareaselect"); 
    if(cssClass){
        mydiv.addClass(cssClass);
    }
    return mydiv
}

$.imgAreaSelect = function (img, options) {

    // variables that happen once, or apply to all selections on this image.
    var 
        /* jQuery object representing the image */ 
        $img = $(img),

        minWidth, minHeight, maxWidth, maxHeight,

        /* User agent */
        ua = navigator.userAgent,

        //selections lol
        selections = [],

        /* Selection area constraints */
        minWidth, minHeight, maxWidth, maxHeight,

        /* Document element */
        docElem = document.documentElement,

        /* User agent */
        ua = navigator.userAgent,

        /* Image position (relative to viewport) */
        left, top,
        
        /* Image offset (as returned by .offset()) */
        imgOfs = { left: 0, top: 0 },

        /* Image dimensions (as returned by .width() and .height()) */
        imgWidth, imgHeight,

        /* Horizontal and vertical scaling factors, as they relate to the image's true (i.e. not scaled by CSS) height */
        scaleX, scaleY,

        /* temporary global variables because everything is awful TODO: remove */
        startX, startY, 
        
        /* Parent element offset (as returned by .offset()) */
        parOfs = { left: 0, top: 0 },

        /* keeps track of the most recently edited selection, for proper event binding/unbinding. */
        most_recent_selection, 

        /*
         * jQuery object representing the parent element that the plugin
         * elements are appended to. 
         * 
         * Default: body
         */
        $parent = $('body'),

        /* Base z-index for plugin elements */
        zIndex = 0,


        /* Has the image finished loading? */
        imgLoaded;

    //variables that we have once per selection.
    function Selection(x1, y1, x2, y2, noScale){
        this.$box = div("imgareaselect-box");
        this.$area = div("imgareaselect-area");
        this.$border = div("imgareaselect-border-1").add(div("imgareaselect-border-2")).add(div("imgareaselect-border-3")).add(div("imgareaselect-border-4"));
        //$outer = div("imgareaselect-outer-1").add(div("imgareaselect-outer-2")).add(div("imgareaselect-outer-3")).add(div("imgareaselect-outer-4")),
        
        this.$closeBtn = div("imgareaselect-closebtn");
        this.$closeBtn.html("<div class='closeBtnInner'>×</div>");
        this.$closeBtn.on('click.imgareaselect-closebtn', _.bind(this.cancelSelection, this)); // function(event){ this.cancelSelection(true); event.stopPropagation(); return false; });

        /* set up handles */
        this.$handles = $([]);
        if (options.handles != null) {
            this.$handles.remove();
            this.$handles = $([]);

            this.i = options.handles ? options.handles == 'corners' ? 4 : 8 : 0;

            while (this.i--)
                this.$handles = this.$handles.add(div());
            
            /* Add a class to handles and set the CSS properties */
            this.$handles.addClass(options.classPrefix + '-handle').css({
                position: 'absolute',
                /*
                 * The font-size property needs to be set to zero, otherwise
                 * Internet Explorer makes the handles too large
                 */
                fontSize: 0,
                zIndex: zIndex + 1 || 1
            });
            
            /*
             * If handle width/height has not been set with CSS rules, set the
             * default 5px
             */
            if (!parseInt(this.$handles.css('width')) >= 0)
                this.$handles.width(5).height(5);
            
            /*
             * If the borderWidth option is in use, add a solid border to
             * handles
             */
            if (this.o = options.borderWidth)
                this.$handles.css({ borderWidth: o, borderStyle: 'solid' });

            /* Apply other style options */
            styleOptions(this.$handles, { borderColor1: 'border-color',
                borderColor2: 'background-color',
                borderOpacity: 'opacity' });
        };

        /*
         * Additional element to work around a cursor problem in Opera
         * (explained later)
         */
        this.$areaOpera;
                            
        /* Plugin elements position */
        this.position = 'absolute';
        
        /* X/Y coordinates of the starting point for move/resize operations */ 
        this.startX, this.startY;
                
        /* Current resize mode ("nw", "se", etc.) */
        this.resize;
                
        /* Aspect ratio to maintain (floating point number) */
        this.aspectRatio;
        
        /* Are this box's elements currently displayed? */
        this.shown;
        
        /* Current selection (relative to parent element) */
        this.x1, this.y1, this.x2, this.y2;
        
        
        /* Various helper variables used throughout the code */ 
        this.$p, this.d, this.i, this.o, this.w, this.h, this.adjusted;

        if (options.disable || options.enable === false) {
            /* Disable the plugin */
            this.$box.unbind('mousemove.imgareaselect').unbind('mousedown.imgareaselect', areaMouseDown);
        }else {
            /* Enable the plugin */
            if (options.resizable || options.movable){
                this.$box.on('mousemove.imgareaselect', _.bind(this.areaMouseMove, this)).on('mousedown.imgareaselect', _.bind(this.areaMouseDown, this));
            }
        }

        /* Current selection (relative to scaled image) */
        this.selection = { x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0 };

        if (x1 && y1 && x2 && y2 ){ //if dimensions are specified, set them and display the selection.
            this.setSelection(x1, y1, x2, y2, noScale);
            this.shown = true;
            this.doUpdate();
        }

        $parent.append(this.$box);
        this.$box/*.add($outer)*/.css({ position: this.position,
            overflow: 'hidden', zIndex: zIndex || '0' });
        this.$box.css({ zIndex: zIndex + 2 || 2 });
        this.$closeBtn.css({ zIndex: zIndex + 3 || 3 });
        this.$area.add(this.$border).css({ position: 'absolute', fontSize: 0 });
        
        $parent.append(this.$closeBtn);
        this.$box.append(this.$area.add(this.$border).add(this.$areaOpera)).append(this.$handles);
    }; //ends the object

    /**
     * Set the current selection
     * 
     * @param x1
     *            X coordinate of the upper left corner of the selection area
     * @param y1
     *            Y coordinate of the upper left corner of the selection area
     * @param x2
     *            X coordinate of the lower right corner of the selection area
     * @param y2
     *            Y coordinate of the lower right corner of the selection area
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            new selection
     */
    Selection.prototype.setSelection = function(x1, y1, x2, y2, noScale) {
        var sx = noScale || scaleX || 1; //TODO: the options version should override this, but it doesnt'. Fix.
        var sy = noScale || scaleY || 1;

        this.selection = {
            x1: round(x1 / sx || 0),
            y1: round(y1 / sy || 0),
            x2: round(x2 / sx || 0),
            y2: round(y2 / sy || 0)
        };

        this.selection.width = this.selection.x2 - this.selection.x1;
        this.selection.height = this.selection.y2 - this.selection.y1;
    };


    /**
     * Update plugin elements
     * 
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    Selection.prototype.update = function(resetKeyPress) {
        /* If plugin elements are hidden, do nothing */
        if (!this.shown) return;
        /*
         * Set the position and size of the container box and the selection area
         * inside it
         */
        this.$box.css({ left: viewX(this.selection.x1), top: viewY(this.selection.y1) })
            .add(this.$area).width(this.w = this.selection.width).height(this.h = this.selection.height);

        /*
         * Reset the position of selection area, borders, and handles (IE6/IE7
         * position them incorrectly if we don't do this)
         */ 
        this.$area.add(this.$border).add(this.$handles).css({ left: 0, top: 0 });

        this.$closeBtn.css({left: left + this.selection.x2 + 4, top: top + this.selection.y1 - 20});

        /* Set border dimensions */
        this.$border
            .width(max(this.w - this.$border.outerWidth() + this.$border.innerWidth(), 0))
            .height(max(this.h - this.$border.outerHeight() + this.$border.innerHeight(), 0));

        /* Arrange the outer area elements */
        /*$($outer[0]).css({ left: left, top: top,
            width: selection.x1, height: imgHeight });
        $($outer[1]).css({ left: left + selection.x1, top: top,
            width: w, height: selection.y1 });
        $($outer[2]).css({ left: left + selection.x2, top: top,
            width: imgWidth - selection.x2, height: imgHeight });
        $($outer[3]).css({ left: left + selection.x1, top: top + selection.y2,
            width: w, height: imgHeight - selection.y2 });*/
        
        this.w -= this.$handles.outerWidth();
        this.h -= this.$handles.outerHeight();
        
        /* Arrange handles */
        switch (this.$handles.length) {
        case 8:
            $(this.$handles[4]).css({ left: this.w >> 1 }); // n >> 1 just means Math.floor(n / 2)
            $(this.$handles[5]).css({ left: this.w, top: this.h >> 1 });
            $(this.$handles[6]).css({ left: this.w >> 1, top: this.h });
            $(this.$handles[7]).css({ top: this.h >> 1 });
        case 4:
            this.$handles.slice(1,3).css({ left: this.w });
            this.$handles.slice(2,4).css({ top: this.h });
        }

        if (resetKeyPress !== false) {
            /*
             * Need to reset the document keypress event handler -- unbind the
             * current handler
             */
            if ($.imgAreaSelect.onKeyPress != docKeyPress)
                $(document).unbind($.imgAreaSelect.keyPress,
                    $.imgAreaSelect.onKeyPress);

            if (options.keys)
                /*
                 * Set the document keypress event handler to this instance's
                 * docKeyPress() function
                 */
                $(document)[$.imgAreaSelect.keyPress](
                    $.imgAreaSelect.onKeyPress = docKeyPress);
        }

        /*
         * Internet Explorer displays 1px-wide dashed borders incorrectly by
         * filling the spaces between dashes with white. Toggling the margin
         * property between 0 and "auto" fixes this in IE6 and IE7 (IE8 is still
         * broken). This workaround is not perfect, as it requires setTimeout()
         * and thus causes the border to flicker a bit, but I haven't found a
         * better solution.
         * 
         * Note: This only happens with CSS borders, set with the borderWidth,
         * borderOpacity, borderColor1, and borderColor2 options (which are now
         * deprecated). Borders created with GIF background images are fine.
         */ 
        if ($.browser.msie && this.$border.outerWidth() - this.$border.innerWidth() == 2) {
            this.$border.css('margin', 0);
            setTimeout(function () { this.$border.css('margin', 'auto'); }, 0);
        }
    };

    /**
     * Do the complete update sequence: recalculate offsets, update the
     * elements, and set the correct values of x1, y1, x2, and y2.
     * 
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    Selection.prototype.doUpdate = function(resetKeyPress) {
        adjust();
        this.update(resetKeyPress);

        this.x1 = viewX(this.selection.x1);
        this.y1 = viewY(this.selection.y1);
        this.x2 = viewX(this.selection.x2); 
        this.y2 = viewY(this.selection.y2);
    };
    
    /**
     * Hide or fade out an element (or multiple elements)
     * 
     * @param $elem
     *            A jQuery object containing the element(s) to hide/fade out
     * @param fn
     *            Callback function to be called when fadeOut() completes
     */
    Selection.prototype.hide = function($elem, fn) {
        options.fadeSpeed ? $elem.fadeOut(options.fadeSpeed, fn) : $elem.hide(); 
    };

    /**
     * Selection area mousemove event handler
     * 
     * @param event
     *            The event object
     */
    Selection.prototype.areaMouseMove = function(event) {
        var x = selX(evX(event)) - this.selection.x1,
            y = selY(evY(event)) - this.selection.y1;

        if (!this.adjusted) {
            adjust();
            this.adjusted = true;

            this.$box.one('mouseout', function () { this.adjusted = false; });
        }

        /* Clear the resize mode */
        this.resize = '';

        if (options.resizable) {
            /*
             * Check if the mouse pointer is over the resize margin area and set
             * the resize mode accordingly
             */
            if (y <= options.resizeMargin)
                this.resize = 'n';
            else if (y >= this.selection.height - options.resizeMargin)
                this.resize = 's';
            if (x <= options.resizeMargin)
                this.resize += 'w';
            else if (x >= this.selection.width - options.resizeMargin)
                this.resize += 'e';
        }

        this.$box.css('cursor', this.resize ? this.resize + '-resize' :
            options.movable ? 'move' : '');
        if (this.$areaOpera)
            this.$areaOpera.toggle();
    };


    /**
     * Selection area mousedown event handler
     * 
     * @param event
     *            The event object
     * @return false
     */
    Selection.prototype.areaMouseDown = function(event) {
        if (event.which != 1) return false;

        adjust();

        most_recent_selection = this;

        if (this.resize) {
            /* Resize mode is in effect */
            $('body').css('cursor', this.resize + '-resize');

            this.x1 = viewX(this.selection[/w/.test(this.resize) ? 'x2' : 'x1']);
            this.y1 = viewY(this.selection[/n/.test(this.resize) ? 'y2' : 'y1']);
            
            $(document).on('mousemove.imgareaselect', _.bind(this.selectingMouseMove, this))
                .one('mouseup', docMouseUp);
            this.$box.unbind('mousemove.imgareaselect');
        }
        else if (options.movable) {
            this.startX = left + this.selection.x1 - evX(event);
            this.startY = top + this.selection.y1 - evY(event);

            this.$box.unbind('mousemove.imgareaselect');

            $(document).on('mousemove.imgareaselect', _.bind(this.movingMouseMove, this))
                .one('mouseup', _.bind(function () {
                    options.onSelectEnd(img, this.getSelection());

                    $(document).unbind('mousemove.imgareaselect');
                    this.$box.on('mousemove.imgareaselect', _.bind(this.areaMouseMove, this));
                }, this));
        }else{
            $img.mousedown(event);
        }
        return false;
    };

    /**
     * TODO: documentation goes here lol.
     *
     * id is guaranteed to be unique only within this API object.
     */

    Selection.prototype.getSelection = function(noScale){
        var sx = noScale || scaleX, sy = noScale || scaleY;

        return { x1: round(this.selection.x1 * sx),
            y1: round(this.selection.y1 * sy),
            x2: round(this.selection.x2 * sx),
            y2: round(this.selection.y2 * sy),
            width: round(this.selection.x2 * sx) - round(this.selection.x1 * sx),
            height: round(this.selection.y2 * sy) - round(this.selection.y1 * sy) ,
            id: selections.indexOf(this)
        };
    };

    /**
     * Adjust the x2/y2 coordinates to maintain aspect ratio (if defined)
     * 
     * @param xFirst
     *            If set to <code>true</code>, calculate x2 first. Otherwise,
     *            calculate y2 first.
     */
    Selection.prototype.fixAspectRatio = function(xFirst) {
        if (this.aspectRatio)
            if (xFirst) {
                this.x2 = max(left, min(left + imgWidth,
                    this.x1 + abs(this.y2 - this.y1) * this.aspectRatio * (this.x2 > this.x1 || -1)));    
                this.y2 = round(max(this.top, min(top + imgHeight,
                    y1 + abs(this.x2 - this.x1) / this.aspectRatio * (this.y2 > this.y1 || -1))));
                this.x2 = round(this.x2);
            }
            else {
                this.y2 = max(top, min(top + imgHeight,
                    y1 + abs(this.x2 - this.x1) / this.aspectRatio * (this.y2 > this.y1 || -1)));
                this.x2 = round(max(left, min(left + imgWidth,
                    x1 + abs(this.y2 - this.y1) * this.aspectRatio * (this.x2 > this.x1 || -1))));
                this.y2 = round(this.y2);
            }
    };

    /**
     * Selection area mousedown event handler
     * 
     * @param otherSelection
     *            Another selection object.
     * @return "" whether the
     *            '' otherwise.
     */

    Selection.prototype.overlapsOrAbuts = function(otherSelection){
        var left_infringement_amount = 0;
        var right_infringement_amount = 0;
        var top_infringement_amount = 0;
        var bottom_infringement_amount = 0;

        if( (this.x2 > otherSelection.x1 && this.x1 < otherSelection.x2) && //infringe from the left
                ((this.y1 >= otherSelection.y1 && this.y1 <= otherSelection.y2) ||
                (this.y2 >= otherSelection.y1 && this.y2 <= otherSelection.y2)||
                (this.y1 <= otherSelection.y1 && this.y2 >= otherSelection.y2))){ 
           //console.log("infringes on the left");
            left_infringement_amount = this.x2 - otherSelection.x1;
        }
        if((this.x1 < otherSelection.x2 && this.x2 > otherSelection.x1) && //infringe from the right
                ((this.y1 >= otherSelection.y1 && this.y1 <= otherSelection.y2) ||
                (this.y2 >= otherSelection.y1 && this.y2 <= otherSelection.y2)||
                (this.y1 <= otherSelection.y1 && this.y2 >= otherSelection.y2))){ 
           //console.log("infringes on the right");
            right_infringement_amount = otherSelection.x2 - this.x1;
        }
        if( (this.y2 > otherSelection.y1 && this.y1 < otherSelection.y2)  && //infringe from the top
                ((this.x1 >= otherSelection.x1 && this.x1 <= otherSelection.x2) ||
                (this.x2 >= otherSelection.x1 && this.x2 <= otherSelection.x2) ||
                (this.x1 <= otherSelection.x1 && this.x2 >= otherSelection.x2))){
           //console.log("infringes on the top");
            top_infringement_amount = this.y2 - otherSelection.y1;
        }
        if((this.y1 < otherSelection.y2 && this.y2 > otherSelection.y1) && //infringe from the bottom
                ((this.x1 >= otherSelection.x1 && this.x1 <= otherSelection.x2) ||
                (this.x2 >= otherSelection.x1 && this.x2 <= otherSelection.x2)||
                (this.x1 <= otherSelection.x1 && this.x2 >= otherSelection.x2))){
           //console.log("infringes on the bottom");
            bottom_infringement_amount = otherSelection.y2 - this.y1;
        }
        if (top_infringement_amount == 0 && bottom_infringement_amount == 0 && left_infringement_amount == 0 && right_infringement_amount == 0){
            return false;
        }else{
            return true;
        }
    };

    Selection.prototype.doesOverlap = function(otherSelection){
        var left_infringement_amount = 0;
        var right_infringement_amount = 0;
        var top_infringement_amount = 0;
        var bottom_infringement_amount = 0;

        if( (this.x2 > otherSelection.x1 && this.x1 < otherSelection.x2) && //infringe from the left
                ((this.y1 > otherSelection.y1 && this.y1 < otherSelection.y2) ||
                (this.y2 > otherSelection.y1 && this.y2 < otherSelection.y2)||
                (this.y1 < otherSelection.y1 && this.y2 > otherSelection.y2))){ 
           //console.log("infringes on the left");
            left_infringement_amount = this.x2 - otherSelection.x1;
        }
        if((this.x1 < otherSelection.x2 && this.x2 > otherSelection.x1) && //infringe from the right
                ((this.y1 > otherSelection.y1 && this.y1 < otherSelection.y2) ||
                (this.y2 > otherSelection.y1 && this.y2 < otherSelection.y2)||
                (this.y1 < otherSelection.y1 && this.y2 > otherSelection.y2))){ 
           //console.log("infringes on the right");
            right_infringement_amount = otherSelection.x2 - this.x1;
        }
        if( (this.y2 > otherSelection.y1 && this.y1 < otherSelection.y2)  && //infringe from the top
                ((this.x1 > otherSelection.x1 && this.x1 < otherSelection.x2) ||
                (this.x2 > otherSelection.x1 && this.x2 < otherSelection.x2) ||
                (this.x1 < otherSelection.x1 && this.x2 > otherSelection.x2))){
           //console.log("infringes on the top");
            top_infringement_amount = this.y2 - otherSelection.y1;
        }
        if((this.y1 < otherSelection.y2 && this.y2 > otherSelection.y1) && //infringe from the bottom
                ((this.x1 > otherSelection.x1 && this.x1 < otherSelection.x2) ||
                (this.x2 > otherSelection.x1 && this.x2 < otherSelection.x2)||
                (this.x1 < otherSelection.x1 && this.x2 > otherSelection.x2))){
           //console.log("infringes on the bottom");
            bottom_infringement_amount = otherSelection.y2 - this.y1;
        }
        if (top_infringement_amount == 0 && bottom_infringement_amount == 0 && left_infringement_amount == 0 && right_infringement_amount == 0){
            return false;
        }else{
            return {top: top_infringement_amount, 
                    bottom: bottom_infringement_amount, 
                    left: left_infringement_amount, 
                    right: right_infringement_amount,
                    otherSelection: otherSelection};
        }
    };

    Selection.prototype.fixMoveOverlaps = function(infringements){
        var otherSelection = infringements.otherSelection;
        //assume proper orientation.
        if (infringements){
           //console.log(infringements);
            if( min(infringements['left'], infringements['right']) < min(infringements['top'], infringements['bottom']) ){

                if (((infringements['left'] < infringements['right'] || this.selection.width > (imgWidth - otherSelection.selection.x2 )) && this.selection.width <= otherSelection.selection.x1)){ // prefer to move the selection into the nearest legal space.                
                   //console.log("go left", this.selection.width, otherSelection.selection.x1);
                    var newX1 = this.x1 - infringements['left']
                    var newX2 = this.x2 - infringements['left'] 
                }else{
                   //console.log("go right", this.selection.width, imgWidth - otherSelection.selection.x2);
                    var newX1 = this.x1 + infringements['right'] 
                    var newX2 = this.x2 + infringements['right'] 
                }
                
                //only move the selection if it doesn't go outside the image!
                if ( (newX1 == max(left, min(newX1, left + imgWidth))) && (newX2 == max(left, min(newX2, left + imgWidth))) ){
                    this.x1 = newX1;
                    this.x2 = newX2;
                }else{
                   //console.log("illegal x");
                    this.x1 = (max(newX1, newX2) < left + imgWidth) ? otherSelection.x1: otherSelection.x2;
                    this.x2 = abs(newX2 - newX1) - ((max(newX1, newX2) < left + imgWidth) && (newX2 < left + imgWidth)) ? otherSelection.x1 : otherSelection.x2;
                }
            }else{
                var newY1 = this.y1 + (infringements['top'] < infringements['bottom'] ? -1 * infringements['top'] : infringements['bottom'] )
                var newY2 = this.y2 + (infringements['top'] < infringements['bottom'] ? -1 * infringements['top'] : infringements['bottom'] )
                
                //only move the selection if it doesn't go outside the image!
                if ( (newY1 < top + imgHeight) && (newY1 > top) && (newY2 < top + imgHeight) && (newY2 > top)){
                    this.y1 = newY1;
                    this.y2 = newY2;
                }else{
                   //console.log("illegal y");
                    this.y1 = (max(newY1, newY2) < top + imgHeight) ? otherSelection.y2 : otherSelection.y1;
                    this.y2 = abs(newY2 - newY1) + (max(newY1, newY2) < top + imgHeight)? otherSelection.y2 : otherSelection.y1;
                }
            }
        }
    };

    Selection.prototype.fixResizeOverlaps = function(otherSelection){
        //assume proper orientation.
        if(this == otherSelection){
           //console.log("comparing this selectiont to itself; that shouldn't happen");
        }else{
            if(!this.resize || this.resize.length == 2){
                this.fixTwoAxisResizeOverlaps(otherSelection);
            }else if(this.resize && this.resize.length == 1){
                this.fixOneAxisResizeOverlaps(this.doesOverlap(otherSelection));
            }else{
               //console.log("no infringement", this.resize);
            }
            this.selection = { x1: selX(min(this.x1, this.x2)), x2: selX(max(this.x1, this.x2)),
                y1: selY(min(this.y1, this.y2)), y2: selY(max(this.y1, this.y2)),
                width: abs(this.x2 - this.x1), height: abs(this.y2 - this.y1) };
        }
    };

    Selection.prototype.fixOneAxisResizeOverlaps = function(infringements){
       //console.log("fix 1 axis");
        var otherSelection = infringements.otherSelection;
        if (infringements){
            if(this.resize == "n"){
                this.y1 = otherSelection.y2;
            }else if(this.resize == "s"){
                this.y2 = otherSelection.y1;
            }else if(this.resize == "w"){
                this.x1 = otherSelection.x2;
            }else if(this.resize == "e"){
                this.x2 = otherSelection.x1;
            }
        }
    }

    Selection.prototype.fixTwoAxisResizeOverlaps = function(otherSelection){
        //TODO: refactor to actually change points based on doesOverlaps' return.

        /* if the non-moving point is "inside" the bounds of another selection on only the x axis */
        var x_axis_properly_oriented = this.x2 > this.x1;
        var y_axis_properly_oriented = this.y2 > this.y1;

        if((x_axis_properly_oriented ? this.x1 : this.x2) >= otherSelection.x1 && (x_axis_properly_oriented ? this.x1 : this.x2) < otherSelection.x2){
            if(y_axis_properly_oriented ? (this.y2 > otherSelection.y1 && this.y1 < otherSelection.y2) : (this.y2 < otherSelection.y2 && this.y1 > otherSelection.y1)){
               //console.log("disallowing overlap on y-axis");
                // set this.y2 to the top point if the current selection is oriented upright, (i.e. such that y2 > y1), bottom otherwise.
                this.y2 = y_axis_properly_oriented ? otherSelection.y1 : otherSelection.y2;
            }
        //if the non-moving point is "inside" the bounds of another selection on only the y axis
        }else if((y_axis_properly_oriented ? this.y1 : this.y2) > otherSelection.y1 && (y_axis_properly_oriented ? this.y1 : this.y2) < otherSelection.y2){
            if(x_axis_properly_oriented ? (this.x2 >= otherSelection.x1 && this.x1 <= otherSelection.x1) : (this.x2 < otherSelection.x2 && this.x1 > otherSelection.x2 )){
               //console.log("disallowing overlap on x-axis");
                // set this.x2 to the rightmost point if the current selection is oriented correctly, (i.e. such that x2 > x1), leftmost otherwise.
                this.x2 = x_axis_properly_oriented ? otherSelection.x1 : otherSelection.x2;
            }
        }else{
            if (   //if the non-moving point is not within the bounds of another selection on any axis
                ((y_axis_properly_oriented ? (this.y2 >= otherSelection.y1 && this.y1 < otherSelection.y2) : (this.y2 < otherSelection.y2 && this.y1 >= otherSelection.y1)) && 
                 (x_axis_properly_oriented ? (this.x2 >= otherSelection.x1 && this.x1 <= otherSelection.x1) : (this.x2 < otherSelection.x2 && this.x1 > otherSelection.x2 ))) 
                   //or if this selection wholly contains another selection.
              || ((x_axis_properly_oriented ? this.x1 : this.x2) <= otherSelection.x1 && (y_axis_properly_oriented ? this.y1 : this.y2) <= otherSelection.y1 
                   && (!x_axis_properly_oriented ? this.x1 : this.x2) > otherSelection.x2 && (!y_axis_properly_oriented ? this.y1 : this.y2) > otherSelection.y2)
            ){
               //console.log("disallowing overlap on both axes");
                //reset the "less-infringing" amount.
                var x_infringement_distance = x_axis_properly_oriented ? this.x2 - otherSelection.x1 : otherSelection.x2 - this.x2;
                var y_infringement_distance = y_axis_properly_oriented ? this.y2 - otherSelection.y1 : otherSelection.y2 - this.y2;
                if(x_infringement_distance > y_infringement_distance){
                    this.y2 = y_axis_properly_oriented ? otherSelection.y1 : otherSelection.y2;
                }else{
                    this.x2 = x_axis_properly_oriented ? otherSelection.x1 : otherSelection.x2;
                }
            }
        }
    }

    // Selection.prototype.fixOverlaps = function(otherSelection){
    //     //TODO: this doesn't respect minHeight, minWidth
    //     console.log("fixOverlaps");
    //     this.fixResizeOverlaps(otherSelection); //fixes x1, x2
    //     this.x2 = max(left, min(this.x2, left + imgWidth));
    //     this.y2 = max(top, min(this.y2, top + imgHeight));
    //     this.selection = { x1: selX(min(this.x1, this.x2)), x2: selX(max(this.x1, this.x2)),
    //         y1: selY(min(this.y1, this.y2)), y2: selY(max(this.y1, this.y2)),
    //         width: abs(this.x2 - this.x1), height: abs(this.y2 - this.y1) };
    //     this.update();
    // }

    /**
     * Resize the selection area respecting the minimum/maximum dimensions and
     * aspect ratio
     */
    Selection.prototype.doResize = function() {
        /*
         * Make sure the top left corner of the selection area stays within
         * image boundaries (it might not if the image source was dynamically
         * changed).
         *
         * How this works: this.x2 and this.y2 are set directly from the event.
         * Then, this.x2 and this.y2 are reset based on imgWidth/imgHeight.
         * And, then, if allowOverlaps is false, they're restricted not to be 
         */

        this.x1 = min(this.x1, left + imgWidth);
        this.y1 = min(this.y1, top + imgHeight);

        if (abs(this.x2 - this.x1) < minWidth) {
            /* Selection width is smaller than minWidth */
            x2 = x1 - minWidth * (x2 < x1 || -1);

            if (this.x2 < left)
                this.x1 = left + minWidth;
            else if (this.x2 > left + imgWidth)
                this.x1 = left + imgWidth - minWidth;
        }

        if (abs(this.y2 - this.y1) < minHeight) {
            /* Selection height is smaller than minHeight */
            this.y2 = this.y1 - minHeight * (this.y2 < this.y1 || -1);

            if (this.y2 < top)
                this.y1 = top + minHeight;
            else if (this.y2 > top + imgHeight)
                this.y1 = top + imgHeight - minHeight;
        }

        this.x2 = max(left, min(this.x2, left + imgWidth));
        this.y2 = max(top, min(this.y2, top + imgHeight));
        
        this.fixAspectRatio(abs(this.x2 - this.x1) < abs(this.y2 - this.y1) * this.aspectRatio);

        if (abs(this.x2 - this.x1) > maxWidth) {
            /* Selection width is greater than maxWidth */
            this.x2 = this.x1 - maxWidth * (this.x2 < this.x1 || -1);
            this.fixAspectRatio();
        }

        if (abs(this.y2 - this.y1) > maxHeight) {
            /* Selection height is greater than maxHeight */
            this.y2 = this.y1 - maxHeight * (this.y2 < this.y1 || -1);
            this.fixAspectRatio(true);
        }


        if(!options.allowOverlaps){
            /* Restrict the dimensions of the selection based on the other selections that already exist. 
             * It's not possible for a selection to begin inside another one (except via the API, moving).
             *
             */
            _(_(selections).filter(_.bind(function(otherSelection){ return otherSelection && this != otherSelection }, this))).each( _.bind( function(otherSelection){ this.fixResizeOverlaps(otherSelection) }, this) );

            var overlaps = _(_(selections).filter(_.bind(function(otherSelection){ return otherSelection && this != otherSelection; }, this)))
                .map(_.bind(function(otherSelection){ return this.doesOverlap(otherSelection) || this == otherSelection; }, this) );
           //console.log(overlaps);
            var legal = (_(overlaps).map(function(o){ return !o; }).indexOf(false) == -1) && 
            ( this.x1 > 0 && this.x2 < left + imgWidth && //if you ask "lolwut?," I'd agree.
             this.y1 > 0 && this.y2 < imgHeight + top );
            
            //console.log("legal", legal, this.x2, imgWidth);

            if(legal){
                this.selection = { x1: selX(min(this.x1, this.x2)), x2: selX(max(this.x1, this.x2)),
                    y1: selY(min(this.y1, this.y2)), y2: selY(max(this.y1, this.y2)) };
                this.selection.width = abs(this.selection.x2 - this.selection.x1);
                this.selection.height = abs(this.selection.y2 - this.selection.y1);
            }else{
                this.x2 = this.oldX2
                this.y2 = this.oldY2;
                this.selection = { x1: selX(min(this.x1, this.x2)), x2: selX(max(this.x1, this.x2)),
                    y1: selY(min(this.y1, this.y2)), y2: selY(max(this.y1, this.y2)) };
                this.selection.width = abs(this.selection.x2 - this.selection.x1);
                this.selection.height = abs(this.selection.y2 - this.selection.y1);
            }
        }else{
            this.selection = { x1: selX(min(this.x1, this.x2)), x2: selX(max(this.x1, this.x2)),
                y1: selY(min(this.y1, this.y2)), y2: selY(max(this.y1, this.y2)) };
            this.selection.width = abs(this.selection.x2 - this.selection.x1);
            this.selection.height = abs(this.selection.y2 - this.selection.y1);
        }

        this.update();

        options.onSelectChange(img, this.getSelection());
    }

    /**
     * Mousemove event handler triggered when the user is selecting an area (or resizing)
     * 
     * @param event
     *            The event object
     * @return false
     */
    Selection.prototype.selectingMouseMove = function(event) {
        this.oldX2 = this.x2;
        this.oldY2 = this.y2;

        $('.imgareaselect-closebtn').css("cursor", "default");

        this.x2 = (/w|e|^$/.test(this.resize) || this.aspectRatio) ? evX(event) : viewX(this.selection.x2);
        this.y2 = (/n|s|^$/.test(this.resize) || this.aspectRatio) ? evY(event) : viewY(this.selection.y2);

        this.doResize();

        return false;
    }

    /**
     * Move the selection area
     * 
     * @param newX1
     *            New viewport X1
     * @param newY1
     *            New viewport Y1
     */
    Selection.prototype.doMove = function(newX1, newY1) {
        oldX1 = this.selection.x1;
        oldY1 = this.selection.y1;
        oldX2 = this.selection.x2;
        oldY2 = this.selection.y2;

        this.x2 = (this.x1 = newX1) + this.selection.width;
        this.y2 = (this.y1 = newY1) + this.selection.height;

        if(!options.allowOverlaps){ 
            //move stuff
            _(_(selections).filter(function(s){ return s})).each(_.bind(function(otherSelection){ this.fixMoveOverlaps(this.doesOverlap(otherSelection)) }, this) );

            //check if those moves are legal.
            var overlaps = _(_(selections).filter(function(otherSelection){ return otherSelection && this != otherSelection; }))
                .map(_.bind(function(otherSelection){ return this.doesOverlap(otherSelection) }, this) );
           //console.log(overlaps);
            var legal = (_(overlaps).map(function(o){ return !o; }).indexOf(false) == -1) && 
            ( min(this.x1, this.x2) > left && max(this.x1 + this.selection.width, this.x2) < (left + imgWidth) && //if you ask "lolwut?," I'd agree.
             min(this.y1, this.y2) > top && max(this.y1 + this.selection.height, this.y2) < top + imgHeight );
            
           //console.log("legal", legal, max(this.x1, this.x2), left, imgWidth);

            if(legal){
                $.extend(this.selection, { x1: selX(this.x1), y1: selY(this.y1), x2: selX(this.x2),
                    y2: selY(this.y2) });
            }else{
                this.x1 = oldX1;
                this.y1 = oldY1;
                this.x2 = oldX2;
                this.y2 = oldY2;
                $.extend(this.selection, { x1: oldX1, y1: oldY1, x2: oldX2, y2: oldY2 });
            }
        }else{
            $.extend(this.selection, { x1: selX(this.x1), y1: selY(this.y1), x2: selX(this.x2),
                y2: selY(this.y2) });
        }

        this.update();

        options.onSelectChange(img, this.getSelection());
    }

    /**
     * Mousemove event handler triggered when the selection area is being moved
     * 
     * @param event
     *            The event object
     * @return false
     */
    Selection.prototype.movingMouseMove = function(event) {
        this.x1 = max(left, min(this.startX + evX(event), left + imgWidth - this.selection.width));
        this.y1 = max(top, min(this.startY + evY(event), top + imgHeight - this.selection.height));

        this.doMove(this.x1, this.y1);

        event.preventDefault();     
        return false;
    }

    Selection.prototype.cancelSelection = function(skipCallbacks) {
        $(document).unbind('mousemove.imgareaselect')
            .unbind('mouseup', this.cancelSelection);
        this.hide(this.$box /*.add(this.$outer)*/);
        this.hide(this.$closeBtn);
        this.shown = false;

        //remove this selection from the closure-global `selections` list.
        var index_of_this = selections.indexOf(this);
        if(index_of_this >= 0){
            selections.splice(index_of_this, 1, null);
        }

        if (!skipCallbacks && !(this instanceof $.imgAreaSelect)) {
            options.onSelectChange(img, this.getSelection()); 
            options.onSelectEnd(img, this.getSelection());
        }
        options.onSelectCancel(img, this.getSelection(), index_of_this);

    }























    //methods on the plugin

    function startSelection() {
        $(document).unbind('mousemove', startSelection).unbind('mouseup.nozerosize');

        s = new Selection();
        selections.push(s);
        most_recent_selection = s;

        adjust();
        //TODO: move most of this to the constructor?
        s.startX = startX;
        s.startY = startY;
        s.x1 = startX;
        s.y1 = startY;
        s.x2 = s.x1;
        s.y2 = s.y1;

        s.doResize(); // I think this does the actual drawing? -J
        s.resize = '';
        //if (!$outer.is(':visible'))
            /* Show the plugin elements */
        //   $box/*.add($outer)*/.hide().fadeIn(options.fadeSpeed||0);
        s.shown = true;

        $(document).on('mousemove.imgareaselect', _.bind(s.selectingMouseMove, s)).one('mouseup', docMouseUp);
        s.$box.unbind('mousemove.imgareaselect');

        options.onSelectStart(img, s.getSelection());
    }



    /**
     * Document mouseup event handler
     * 
     * @param event
     *            The event object
     */
    function docMouseUp(event) {
        /* Set back the default cursor */
        $('body').css('cursor', '');
        $('.imgareaselect-closebtn').css("cursor", "pointer");
        /*
         * If autoHide is enabled, or if the selection has zero width/height,
         * hide the selection and the outer area
         */

        if (options.autoHide /*|| selection.width * selection.height == 0*/)
            hide(most_recent_selection.$box/*.add($outer)*/, function () { $(most_recent_selection).hide(); });

        $(document).unbind('mousemove.imgareaselect');
        most_recent_selection.$box.on('mousemove.imgareaselect', _.bind(most_recent_selection.areaMouseMove, most_recent_selection));
        
        options.onSelectEnd(img, most_recent_selection.getSelection());
    }


    /**
     * Recalculate image and parent offsets
     */
    function adjust() {
        /*
         * Do not adjust if image has not yet loaded or if width is not a
         * positive number. The latter might happen when imgAreaSelect is put
         * on a parent element which is then hidden.
         */
        if (!imgLoaded || !$img.width())
            return;

        /*
         * Get image offset. The .offset() method returns float values, so they
         * need to be rounded.f
         */
        imgOfs = { left: round($img.offset().left), top: round($img.offset().top) };
        
        /* Get image dimensions */
        imgWidth = $img.innerWidth();
        imgHeight = $img.innerHeight();
        
        imgOfs.top += ($img.outerHeight() - imgHeight) >> 1;
        imgOfs.left += ($img.outerWidth() - imgWidth) >> 1;

        /* Set minimum and maximum selection area dimensions */
        minWidth = round(options.minWidth / scaleX) || 0;
        minHeight = round(options.minHeight / scaleY) || 0;
        maxWidth = round(min(options.maxWidth / scaleX || 1<<24, imgWidth));
        maxHeight = round(min(options.maxHeight / scaleY || 1<<24, imgHeight));
        
        /*
         * Workaround for jQuery 1.3.2 incorrect offset calculation, originally
         * observed in Safari 3. Firefox 2 is also affected.
         */
        if ($().jquery == '1.3.2' && position == 'fixed' &&
            !docElem['getBoundingClientRect'])
        {
            imgOfs.top += max(document.body.scrollTop, docElem.scrollTop);
            imgOfs.left += max(document.body.scrollLeft, docElem.scrollLeft);
        }

        /* Determine parent element offset */ 
        parOfs = /absolute|relative/.test($parent.css('position')) ?
            { left: round($parent.offset().left) - $parent.scrollLeft(),
                top: round($parent.offset().top) - $parent.scrollTop() } :
            this.position == 'fixed' ?
                { left: $(document).scrollLeft(), top: $(document).scrollTop() } :
                { left: 0, top: 0 };
                
        left = viewX(0);
        top = viewY(0);
        
        /*
         * Check if selection area is within image boundaries, adjust if
         * necessary
         */
        _(selections).each(function(s){
            if (s && (s.selection.x2 > imgWidth || s.selection.y2 > imgHeight)){
                s.doResize();
            }
        });
    }

    //"static" lol
    /*
     * Translate selection coordinates (relative to scaled image) to viewport
     * coordinates (relative to parent element)
     */
    
    /**
     * Translate selection X to viewport X
     * 
     * @param x
     *            Selection X
     * @return Viewport X
     */
    function viewX(x) {
        return x + imgOfs.left - parOfs.left;
    }

    /**
     * Translate selection Y to viewport Y
     * 
     * @param y
     *            Selection Y
     * @return Viewport Y
     */
    function viewY(y) {
        return y + imgOfs.top - parOfs.top;
    }

    /*
     * Translate viewport coordinates to selection coordinates
     */
    
    /**
     * Translate viewport X to selection X
     * 
     * @param x
     *            Viewport X
     * @return Selection X
     */
    function selX(x) {
        return x - imgOfs.left + parOfs.left;
    }

    /**
     * Translate viewport Y to selection Y
     * 
     * @param y
     *            Viewport Y
     * @return Selection Y
     */
    function selY(y) {
        return y - imgOfs.top + parOfs.top;
    }
    
    /*
     * Translate event coordinates (relative to document) to viewport
     * coordinates
     */
    
    /**
     * Get event X and translate it to viewport X
     * 
     * @param event
     *            The event object
     * @return Viewport X
     */
    function evX(event) {
        return event.pageX - parOfs.left;
    }

    /**
     * Get event Y and translate it to viewport Y
     * 
     * @param event
     *            The event object
     * @return Viewport Y
     */
    function evY(event) {
        return event.pageY - parOfs.top;
    }

    /**
     * Image mousedown event handler
     * 
     * @param event
     *            The event object
     * @return false
     */


    function imgMouseDown(event) {
        if (event.which != 1 /*|| $outer.is(':animated') */) return false;

        adjust();
        startX = /*x1 =*/ evX(event);
        startY = /*y1 =*/ evY(event);

        $(document).on("mousemove.imgareaselect", startSelection).on('mouseup.nozerosize.imgareaselect', function(){
            $(document).unbind("mousemove.imgareaselect");
        });
        //for multi-select, remove mouseup(); a click on the image doesn't erase the previous selection.
        // on second thought, I'm not sure that's what's going on. I think mouseup just erases the selection if you didn't move the mouse.
        // on third thought, I need to reengineer this so that I have a cancelSelection fucntion.
        return false;
    }


    /**
     * Image load event handler. This is the final part of the initialization
     * process.
     */
    function imgLoad() {
        imgLoaded = true;

        setOptions(options = $.extend({
            classPrefix: 'imgareaselect',
            movable: true,
            parent: $('body'),
            resizable: true,
            resizeMargin: 10,
            onInit: function () {},
            onSelectStart: function () {},
            onSelectChange: function () {},
            onSelectEnd: function () {}
        }, options));

        _(selections).each(function(s){ 
            if(s){
                s.$box/*.add(s.$outer)*/.css({ visibility: '' });

                if (options.show) {
                    shown = true;
                    s.adjust();
                    s.update();
                    s.$box/*.add(s.$outer)*/.hide().fadeIn(options.fadeSpeed||0);
                }
            }
        });

        /*
         * Call the onInit callback. The setTimeout() call is used to ensure
         * that the plugin has been fully initialized and the object instance is
         * available (so that it can be obtained in the callback).
         */
        setTimeout(function () { options.onInit(img, _(selections).map(function(s){ return s.getSelection() })) }, 0); 
    }

    var docKeyPress = function(event) {
        var k = options.keys, d, t, key = event.keyCode;
        
        d = !isNaN(k.alt) && (event.altKey || event.originalEvent.altKey) ? k.alt :
            !isNaN(k.ctrl) && event.ctrlKey ? k.ctrl :
            !isNaN(k.shift) && event.shiftKey ? k.shift :
            !isNaN(k.arrows) ? k.arrows : 10;

        if (k.arrows == 'resize' || (k.shift == 'resize' && event.shiftKey) ||
            (k.ctrl == 'resize' && event.ctrlKey) ||
            (k.alt == 'resize' && (event.altKey || event.originalEvent.altKey)))
        {
            /* Resize selection */
            
            switch (key) {
            case 37:
                /* Left */
                d = -d;
            case 39:
                /* Right */
                t = max(x1, x2);
                x1 = min(x1, x2);
                x2 = max(t + d, x1);
                fixAspectRatio();
                break;
            case 38:
                /* Up */
                d = -d;
            case 40:
                /* Down */
                t = max(y1, y2);
                y1 = min(y1, y2);
                y2 = max(t + d, y1);
                fixAspectRatio(true);
                break;
            default:
                return;
            }

            doResize();
        }
        else {
            /* Move selection */
            
            x1 = min(x1, x2);
            y1 = min(y1, y2);

            switch (key) {
            case 37:
                /* Left */
                doMove(max(x1 - d, left), y1);
                break;
            case 38:
                /* Up */
                doMove(x1, max(y1 - d, top));
                break;
            case 39:
                /* Right */
                doMove(x1 + min(d, imgWidth - selX(x2)), y1);
                break;
            case 40:
                /* Down */
                doMove(x1, y1 + min(d, imgHeight - selY(y2)));
                break;
            default:
                return;
            }
        }

        return false;
    };

    /**
     * Apply style options to plugin element (or multiple elements)
     * 
     * @param $elem
     *            A jQuery object representing the element(s) to style
     * @param props
     *            An object that maps option names to corresponding CSS
     *            properties
     */
    function styleOptions($elem, props) {
        for (var option in props)
            if (options[option] !== undefined)
                $elem.css(props[option], options[option]);
    }

    /**
     * Set plugin options
     * 
     * @param newOptions
     *            The new options object
     */
    function setOptions(newOptions) {
        if (newOptions.parent){
            _(_(selections).filter(function(s){ return s})).each(function(s){
                ($parent = $(newOptions.parent)).append(s.$box)/*.append($outer)*/;
            });
        }

        /* Merge the new options with the existing ones */
        $.extend(options, newOptions);

        adjust();

        if (newOptions.handles != null) {
            /* Recreate selection area handles */
            _(_(selections).filter(function(s){ return s})).each(function(s){ 
                s.$handles.remove();
                s.$handles = $([]);

                i = newOptions.handles ? newOptions.handles == 'corners' ? 4 : 8 : 0;

                while (i--)
                    s.$handles = s.$handles.add(div());
                
                /* Add a class to handles and set the CSS properties */
                s.$handles.addClass(options.classPrefix + '-handle').css({
                    position: 'absolute',
                    /*
                     * The font-size property needs to be set to zero, otherwise
                     * Internet Explorer makes the handles too large
                     */
                    fontSize: 0,
                    zIndex: zIndex + 1 || 1
                });
                
                /*
                 * If handle width/height has not been set with CSS rules, set the
                 * default 5px
                 */
                if (!parseInt(s.$handles.css('width')) >= 0)
                    s.$handles.width(5).height(5);
                
                /*
                 * If the borderWidth option is in use, add a solid border to
                 * handles
                 */
                if (o = options.borderWidth)
                    s.$handles.css({ borderWidth: o, borderStyle: 'solid' });

                /* Apply other style options */
                styleOptions(s.$handles, { borderColor1: 'border-color',
                    borderColor2: 'background-color',
                    borderOpacity: 'opacity' });
            });
        }

        /* Calculate scale factors */
        scaleX = options.imageWidth / imgWidth || 1;
        scaleY = options.imageHeight / imgHeight || 1;

        /* Set selection */
        if (newOptions.x1 != null) {
            setSelection(newOptions.x1, newOptions.y1, newOptions.x2,
                newOptions.y2);
            newOptions.show = !newOptions.hide;
        }

        if (newOptions.keys)
            /* Enable keyboard support */
            options.keys = $.extend({ shift: 1, ctrl: 'resize' },
                newOptions.keys);

        /* Add classes to plugin elements */
        //$outer.addClass(options.classPrefix + '-outer');
        _(_(selections).filter(function(s){ return s})).each(function(s){
            s.$area.addClass(options.classPrefix + '-selection');
            for (i = 0; i++ < 4;)
                $(s.$border[i-1]).addClass(options.classPrefix + '-border' + i);

            /* Apply style options */
            styleOptions(s.$area, { selectionColor: 'background-color',
                selectionOpacity: 'opacity' });
            styleOptions(s.$border, { borderOpacity: 'opacity',
                borderWidth: 'border-width' });
            /*styleOptions($outer, { outerColor: 'background-color',
                outerOpacity: 'opacity' });*/
            if (o = options.borderColor1)
                $(s.$border[0]).css({ borderStyle: 'solid', borderColor: o });
            if (o = options.borderColor2)
                $(s.$border[1]).css({ borderStyle: 'dashed', borderColor: o });

            /* Append all the selection area elements to the container box */
            s.$box.append(s.$area.add(s.$border).add(s.$areaOpera)).append(s.$handles);


            /*if (msie) {
                if (o = ($outer.css('filter')||'').match(/opacity=(\d+)/))
                    $outer.css('opacity', o[1]/100);
                if (o = ($border.css('filter')||'').match(/opacity=(\d+)/))
                    $border.css('opacity', o[1]/100);
            }*/
            
            if (newOptions.hide)
                hide(s.$box/*.add(s.$outer)*/);
            else if (newOptions.show && imgLoaded) {
                s.shown = true;
                s.$box/*.add(s.$outer)*/.fadeIn(options.fadeSpeed||0);
                s.doUpdate();
            }

            $img/*.add($outer)*/.unbind('mousedown', imgMouseDown);
            
            if (options.disable || options.enable === false) {
                /* Disable the plugin */
                s.$box.unbind('mousemove.imgareaselect').unbind('mousedown.imgareaselect', s.areaMouseDown);
            }
            else {
                if (options.enable || options.disable === false) {
                    /* Enable the plugin */
                    if (options.resizable || options.movable)
                        s.$box.mousemove(_.bind(s.areaMouseMove,s)).on('mousedown.imgareaselect', _.bind(s.areaMouseDown, s));
                }
            }
        });

        /* Calculate the aspect ratio factor */
        aspectRatio = (d = (options.aspectRatio || '').split(/:/))[0] / d[1];

        $img.unbind('mousedown', imgMouseDown);
        
        if (options.disable || options.enable === false) {
            /* Disable the plugin */
            $(window).unbind('resize', this.windowResize);
        }
        else {
            if (options.enable || options.disable === false) {  
                $(window).resize(this.windowResize);
            }
            if (!options.persistent)
                $img/*.add($outer)*/.mousedown(imgMouseDown);
        }


        options.enable = options.disable = undefined;
    }
    
    /**
     * Remove plugin completely
     */
    this.remove = function () {
        /*
         * Call setOptions with { disable: true } to unbind the event handlers
         */
        this.setOptions({ disable: true });
        _(selections).each(function(s){
            if(s){
                s.$box/*.add($outer)*/.remove();
                s.$closeBtn.remove();
            }
        })
    };

    /*
     * Public API
     */
    
     /*
      *
      *
      *
      */
    this.getImg = function(){
        return $img;
    }

    this.getDebugPositioning = function(){
        return {left: left, 
        top: top,
        imgWidth: imgWidth, 
        imgHeight: imgHeight};
    }

    /**
     * Get current options
     * 
     * @return An object containing the set of options currently in use
     */
    this.getOptions = function () { return options; };
    
    /**
     * Set plugin options
     * 
     * @param newOptions
     *            The new options object
     */
    this.setOptions = setOptions;    

    /**
     * Get all of the current selections.
     * 
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            returned selection
     * @return An array of selection objects.
     */
     this.getSelections = function(noScale) {
        // filter out the nulls.
        return _( _(selections).filter(function(s){ return !!s; }) ).map(function(s){
            return s.getSelection(noScale);
        });
    }

    /**
     * Create a new selection
     * 
     * @param x1
     *            X coordinate of the upper left corner of the selection area
     * @param y1
     *            Y coordinate of the upper left corner of the selection area
     * @param x2
     *            X coordinate of the lower right corner of the selection area
     * @param y2
     *            Y coordinate of the lower right corner of the selection area
     * @param noScale
     *            If set to <code>true</code>, scaling is not applied to the
     *            new selection
     * @return selection object from the newly-created Selection. May be
     *            different from given coordinates if they overlap.
     */
    this.createNewSelection = function(x1, y1, x2, y2){
        if(!options.multipleSelections){
            selections[0].setSelection(x1, y2, x2, y2, noScale)
        }else{
            var s = new Selection(x1, y1, x2, y2);
            if(!options.allowOverlaps){
                //this selection is guaranteed not to be in `selections` yet.
                var overlaps = _(_(selections).filter(function(otherSelection){ return otherSelection; }))
                    .map(function(otherSelection){ return s.overlapsOrAbuts(otherSelection)} );
                var legal = (_(overlaps).map(function(o){ return !o; }).indexOf(false) == -1);
            }
            if(options.allowOverlaps || legal){
                //if the selection is illegal, don't create it.
                selections.push(s);
                return s.getSelection();
            }else{
                //but if the selection is illegal and overlaps only one other thing, change that other one
                if (_(overlaps).reject(function(v){ return v; }).length <= 1){
                    //return their union.
                    var overlap_index = _(overlaps).map(function(v){ return v; }).indexOf(true);
                    var overlap = selections[overlap_index];
                    overlap.setSelection( min(overlap.selection.x1, x1, overlap.selection.x2, x2),
                                          min(overlap.selection.y1, y1, overlap.selection.y2, y2),
                                          max(overlap.selection.x1, x1, overlap.selection.x2, x2),
                                          max(overlap.selection.y1, y1, overlap.selection.y2, y2) );
                    overlap.update();
                    s.cancelSelection(true);
                    return false;
                }else{
                    s.cancelSelection(true);
                    return false;
                }
            }
        }
    };

    this.setSelection = function (x1, y2, x2, y2, noScale){
        if(!options.multipleSelections){
            selections[0].setSelection(x1, y2, x2, y2, noScale)
            return true;
        }else{
            //this method makes no sense with multiple selections.
            return false;
        }
    };



    //TODO: create a setSelection method that modifies all selection objects. (maybe?)
    
    this.update = function(){ _(_(selections).filter(function(s){ return s})).each(function(s){ s.doUpdate() }); };

    
    /**
     * Window resize event handler
     */
    this.windowResize = function() {
        this.update();
    };


    /**
     * Cancel selection
     */
    this.cancelSelections = function(){ 
        //shoudl work fine as is for !options.multipleSelections
        // I can't simply do `_(selections).each(function(s){ s.cancelSelection(true); });` because cancelSelection modifies `selections` concurrently with iterating over `selections`, so some selections get skipped.
        var selectionsIndex = selections.length
        while(selectionsIndex >= 1){
            if(selections[selectionsIndex - 1]) //skip the nulls.
                selections[selectionsIndex - 1].cancelSelection(true);
            selectionsIndex--;
            //console.log(selectionsIndex, selections);
        }
    };
    
    this.cancelSelection = function(){
        if(!options.multipleSelections){
            selections[0].cancelSelection(true);
        }else{
            return false;
        }
    };

    /**
     * Update plugin elements
     * 
     * @param resetKeyPress
     *            If set to <code>false</code>, this instance's keypress
     *            event handler is not activated
     */
    //this.update = doUpdate;

    /* Do the dreaded browser detection */
    var msie = (/msie ([\w.]+)/i.exec(ua)||[])[1],
        opera = /opera/i.test(ua),
        safari = /webkit/i.test(ua) && !/chrome/i.test(ua);

    /* 
     * Traverse the image's parent elements (up to <body>) and find the
     * highest z-index
     */
    $p = $img;

    while ($p.length) {
        zIndex = max(zIndex,
            !isNaN($p.css('z-index')) ? $p.css('z-index') : zIndex);
        /* Also check if any of the ancestor elements has fixed position */ 
        if ($p.css('position') == 'fixed')
            position = 'fixed';

        $p = $p.parent(':not(body)');
    }
    
    /*
     * If z-index is given as an option, it overrides the one found by the
     * above loop
     */
    zIndex = options.zIndex || zIndex;

    if (msie)
        $img.attr('unselectable', 'on');

    /*
     * In MSIE and WebKit, we need to use the keydown event instead of keypress
     */
    $.imgAreaSelect.keyPress = msie || safari ? 'keydown' : 'keypress';

    /*
     * There is a bug affecting the CSS cursor property in Opera (observed in
     * versions up to 10.00) that prevents the cursor from being updated unless
     * the mouse leaves and enters the element again. To trigger the mouseover
     * event, we're adding an additional div to $box and we're going to toggle
     * it when mouse moves inside the selection area.
     */
    if (opera)
        $areaOpera = div().css({ width: '100%', height: '100%',
            position: 'absolute', zIndex: zIndex + 2 || 2 });

    /*
     * We initially set visibility to "hidden" as a workaround for a weird
     * behaviour observed in Google Chrome 1.0.154.53 (on Windows XP). Normally
     * we would just set display to "none", but, for some reason, if we do so
     * then Chrome refuses to later display the element with .show() or
     * .fadeIn().
     */
     //Jeremy is doing this in teh construcotr.
    // _(selections).each(function(s){ 
    //     s.$box/*.add($outer)*/.css({ visibility: 'hidden', position: position,
    //         overflow: 'hidden', zIndex: zIndex || '0' });
    //     s.$box.css({ zIndex: zIndex + 2 || 2 });
    //     s.$closeBtn.css({ zIndex: zIndex + 3 || 3 });
    //     s.$area.add($border).css({ position: 'absolute', fontSize: 0 });
    // })


    /*
     * If the image has been fully loaded, or if it is not really an image (eg.
     * a div), call imgLoad() immediately; otherwise, bind it to be called once
     * on image load event.
     */
    img.complete || img.readyState == 'complete' || !$img.is('img') ?
        imgLoad() : $img.one('load', imgLoad);

    /* 
     * MSIE 9.0 doesn't always fire the image load event -- resetting the src
     * attribute seems to trigger it. The check is for version 7 and above to
     * accommodate for MSIE 9 running in compatibility mode.
     */
    if (!imgLoaded && msie && msie >= 7)
        img.src = img.src;
};

/**
 * Invoke imgAreaSelect on a jQuery object containing the image(s)
 * 
 * @param options
 *            Options object
 * @return The jQuery object or a reference to imgAreaSelect instance (if the
 *         <code>instance</code> option was specified)
 */
$.fn.imgAreaSelect = function (options) {
    options = options || {};

    this.each(function () {
        /* Is there already an imgAreaSelect instance bound to this element? */
        if ($(this).data('imgAreaSelect')) {
            /* Yes there is -- is it supposed to be removed? */
            if (options.remove) {
                /* Remove the plugin */
                $(this).data('imgAreaSelect').remove();
                $(this).removeData('imgAreaSelect');
            }
            else
                /* Reset options */
                $(this).data('imgAreaSelect').setOptions(options);
        }
        else if (!options.remove) {
            /* No exising instance -- create a new one */
            
            /*
             * If neither the "enable" nor the "disable" option is present, add
             * "enable" as the default
             */ 
            if (options.enable === undefined && options.disable === undefined)
                options.enable = true;

            $(this).data('imgAreaSelect', new $.imgAreaSelect(this, options));
        }
    });
    
    if (options.instance)
        /*
         * Return the imgAreaSelect instance bound to the first element in the
         * set
         */
        return $(this).data('imgAreaSelect');

    return this;
};

})(jQuery);