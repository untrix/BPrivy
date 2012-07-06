/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR, BP_MOD_MEMSTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
var BP_MOD_W$ = (function ()
{
    "use strict";
    var m;
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    var addHandlers = IMPORT(m.addHandlers); // Compatibility function
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/    m = null;

    /********************** WDL Interpretor ************************/
    function WidgetElement($el)
    {
        Object.defineProperties(this,
        {
            el: {value: $el[0]}, // pointer to DOM element object
            $el: {value: $el}, // pointer to jquery wrapped DOM element object
            children: {value: []}, // A set of children, parallel to their DOM elements
            data: {value: {}}
            // Other properties and functions will be inserted here through wdl.
            // That will serve as the JS-interface of the WidgetElement
        });
    }
    WidgetElement.prototype.append = function(wgt)
    {
        this.$el.append(wgt.el); this.children.push(wgt);
    };
    WidgetElement.prototype.show = function() {this.$el.show();};
    WidgetElement.prototype.hide = function() {this.$el.hide();};
   
    var w$ = {};
    w$.copyIndirect = function  (sk, sv, dst) 
    {
        // sk = source object of keys for the destination as well as provides keys for the 'sv' object
        // dst = destination object, obtains key p from sk and value = sv[sk[p]]
        // sv = object that provides values to the destination. For prop p, value = sv[sk[p]]
        if (!(sk && sv && dst)) {BP_MOD_ERROR.logdebug('invalid args to copyIndirect'); return;}
        
        var ks = Object.keys(sk), i, n;
        for (i=0,n=ks.length; i<n; i++)
        {
            dst[ks[i]] = sv[sk[ks[i]]];
        }
    };
       
    w$.evalProps = function (wdl, w$, ctx, dst)
    {
        // wdl = source of keys, dst = destination,
        // w$ = w$ object (optional), ctx = ctx object (optional)
        var k, ks = Object.keys(wdl), i, n;
        for (i=0,n=ks.length; i<n; i++) 
        {
            k = ks[i];
            switch (k)
            {
                case 'w$':
                    w$.copyIndirect(wdl[k], w$, dst);
                    break;
                case 'w$ctx':
                    w$.copyIndirect(wdl[k], ctx, dst);
                    break;
                default:
                    dst[k] = wdl[k];
            }
        }
    };
    
    w$.get = function (arg) // arg should be an element-id or an event
    {
        var w$el;
        switch (typeof arg)
        {
            case 'string':
                w$el = $('#'+arg).data('w$el');
                break;
            case 'object':
                w$el = $(arg.target).data('w$el');
                break;
        }
        return w$el;
    };
    
    w$.exec = function (wdl, ctx, recursion)
    {
        BPError.push("WDL Interpret");
        
        if (typeof wdl === 'function') {
            wdl = wdl(ctx);
        }
        if (!wdl || (typeof wdl !== 'object') || (!wdl.tag && !wdl.html)) {
            throw new BPError("Bad WDL");
        }
        
        var el, $el, i=0, w$el, _final, wcld, keys, key, val, w$ ={},
            n=0;

        // Create the element
        if (wdl.tag) {
            el = document.createElement(wdl.tag);
            $el = $(el);
        }
        else {
            $el = $(wdl.html); 
            el = $el[0];
        }
        w$el = new WidgetElement($el);
        
        $el.attr(wdl.attr || {})
            .text(wdl.text || "")
            .prop(wdl.prop || {})
            .css(wdl.css || {})
            .addClass(wdl.addClass || {})
            .data('w$el', w$el); // point el back to w$el. jQuery ensures no cyclic references.
        addHandlers(el, wdl.on);

        // Update w$ runtime env.
        w$.w$el = w$el;
        w$.id = $el.attr('id');
        
        // Update the context now that the element is created
        if (!ctx) {ctx={};} // setup a new context if one is not provided
        if (wdl.ctx)  {
            w$.evalProps(wdl.ctx, w$, ctx, ctx);
        }
        
        // Process and insert child widgets
        for (i=0, n=wdl.children? wdl.children.length:0; i<n; i++) {
            w$el.append(w$.exec(wdl.children[i], ctx, true)); // insert children
        }
        // now the iterative children
        if (wdl.iterate && wdl.iterate.it && wdl.iterate.wdl) 
        {
            var rec, it=wdl.iterate.it, iwdl = wdl.iterate.wdl, cwdl, isFun=false;

            if (typeof iwdl === 'function') { isFun = true; }

            for (i=0, cwdl=iwdl; (rec = it.get()); i++, cwdl=iwdl) 
            {
                if (isFun) { cwdl = cwdl(ctx, rec, i); } // compile dynamic wdt
                
                w$el.append(w$.exec(cwdl, ctx, true));
            }
        }
        
        // Now update w$el.data after ctx has been populated by children
        if (wdl._data) { w$.evalProps(wdl._data, w$, ctx, w$el.data); }
        
        // Make w$el interface.
        if (wdl._iface) { w$.evalProps(wdl._iface, w$, ctx, w$el); }

        // Finally, post Creation steps
        if ((_final=wdl._final)) {            
            if (_final.show === true) {
                $el.show();
            } else if (_final.show === false) {
                $el.hide();
            }
            
            if (_final.exec) { // execute functions dictated by wdl
                _final.exec(ctx, w$);
            }
            
            // Inserting element into DOM should be done last and only for the top
            // level element.
            if ((!recursion) && _final.appendTo) {
                $el.appendTo(_final.appendTo); 
            }
        }
                
        return w$el;
    };

    var iface = 
    {
       w$exec: w$.exec,
       w$get: w$.get
   };
   return Object.freeze(iface);
}());