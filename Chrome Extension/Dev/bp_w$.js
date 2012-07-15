/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */


/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR,
  BP_MOD_MEMSTORE, BP_MOD_TRAITS */
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
    var logwarn = IMPORT(m.logwarn);
    /** @import-module-begin */
    m = BP_MOD_COMMON;
    var newInherited = IMPORT(m.newInherited);
    /** @import-module-end **/    m = null;

    /********************** WDL Interpretor ************************/
    var w$undefined = Object.freeze({});
    function WidgetElement($el)
    {
        this.cons($el);
    }
    WidgetElement.prototype.cons = function($el) 
    {
        Object.defineProperties(this,
        {   // Properties are kept configurable so that they may be deleted by the
            // destructor. This is necessary in order to remove circular references.
            el: {value: $el[0], configurable:true}, // pointer to DOM element object
            $el: {value: $el, configurable:true}, // pointer to jquery wrapped DOM element object
            w$: {value: {}, configurable:true}, //Meant for saving event handlers
            // Other properties and functions will be inserted here through wdl.
            // That will serve as the JS-interface of the WidgetElement
        });
        // point $el back to w$el. Hopefully this won't be a cyclic reference between w$el
        // jQuery. We'll try to remove this everywhere before destruction.
        $el.data('w$el', this);
    };
    WidgetElement.prototype.append = function(w)
    {
        this.$el.append(w.el); 
        //this.children.push(wgt);
    };
    WidgetElement.prototype.prepend = function(w) {this.$el.prepend(w.el);};
    WidgetElement.prototype.appendTo = function(w) {w.append(this);};
    WidgetElement.prototype.prependTo = function(w) {w.prepend(this);};
    WidgetElement.prototype.show = function() {this.el.style.removeProperty('display');};
    WidgetElement.prototype.hide = function() {this.el.style.display = 'none';};
    WidgetElement.prototype.die = function()
    {   // Props are being deleted below in order to prevent circular references.
        delete this.el;
        delete this.w$;
        this.$el.remove();
        delete this.$el;
    };
   
    // Returns an object to be used as a prototype for a widget element.
    function w$defineProto (props) // props has same syntax as Object.defineProperties
    {
        var proto = newInherited(WidgetElement.prototype);
        Object.defineProperties(proto, props);
        return proto;
    }
    
    function copyIndirect (sk, sv, dst) 
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
    }
       
    function w$evalProps (wdl, w$, ctx, dst)
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
                    copyIndirect(wdl[k], w$, dst);
                    break;
                case 'w$ctx':
                    copyIndirect(wdl[k], ctx, dst);
                    break;
                default:
                    dst[k] = wdl[k];
            }
        }
    }
    
    function w$get (sel) 
    {
        return $(sel).data('w$el');
    }
    function w$set (sel) // arg should be anything that can be given to jQuery
    {
        var w$el = $(sel).data('w$el');
        if (!w$el) {
            w$el = new WidgetElement($(sel));
        }
        return w$el;
    }
    
    function w$eventProxy (e)
    {
        var wel = w$get(e.currentTarget), func, wel2;
        if (wel) {
            func = wel.w$.on? wel.w$.on[e.type] :undefined;
        }
        if (func) {
            wel2 = w$get(e.target);
            func.apply(wel2, [e]);
        }
    }
    
    function w$on (wel, on)
    {
        if (wel && on) {
            wel.w$.on = on;
            var _on = {}, keys = Object.keys(on), i;
            for (i=keys.length-1; i>=0; i--) {
                _on[keys[i]] = w$eventProxy;
            }
            addHandlers(wel.el, _on);    
        }
    }
    
    function w$exec(wdl, ctx, recursion)
    {
        BPError.push("WDL Interpret");
        
        if (typeof wdl === 'function') {
            wdl = wdl(ctx); // compile wdt to wdl
        }
        if (!wdl || (typeof wdl !== 'object')) {
            throw new BPError("Bad WDL: not JS object");
        }
        else if (!wdl.tag && !wdl.html)
        {
            throw new BPError("Bad WDL: " + JSON.stringify(wdl));
        }
        
        var el, $el, i=0, w$el, _final, wcld, keys, key, val, w$ ={},
            n=0, cwdl;

        // Create the DOM element
        if (wdl.tag) {
            el = document.createElement(wdl.tag);
            $el = $(el);
        }
        else {
            $el = $(wdl.html); 
            el = $el[0];
        }
        // Create the widget element
        if (wdl.proto) {
            w$el = newInherited(wdl.proto);
            w$el.cons($el);
        }
        else {
            w$el = new WidgetElement($el);
        }
        
        $el.attr(wdl.attr || {})
            .text(wdl.text || "")
            .prop(wdl.prop || {})
            .css(wdl.css || {})
            .addClass(wdl.addClass || {});
        w$on(w$el, wdl.on); // Didn't want to use jQuery.on for fear of bad performance.

        // Update w$ runtime env.
        w$.w$el = w$el;
        //w$.id = $el.attr('id'); // This does not make sense.
        
        // Update the context now that the element is created
        if (!ctx) {ctx={};} // setup a new context if one is not provided
        if (wdl.ctx)  {
            w$evalProps(wdl.ctx, w$, ctx, ctx);
        }
        
        // Populate element's interface pre-children
        if (wdl.iface) { w$evalProps(wdl.iface, w$, ctx, w$el); }

        // Process and insert child widgets
        for (i=0, n=wdl.children? wdl.children.length:0; i<n; i++) {
            cwdl = wdl.children[i];
            if (cwdl !== w$undefined) {
                w$el.append(w$exec(cwdl, ctx, true));
            }
        }
        // now the iterative children
        if (wdl.iterate && wdl.iterate.it && wdl.iterate.wdi) 
        {
            var rec, it=wdl.iterate.it, wdi = wdl.iterate.wdi, isFunc=false;

            if (typeof wdi === 'function') { isFunc = true; }

            for (i=0, cwdl=wdi; ((rec = it.next())); i++, cwdl=wdi) 
            {try {
                if (isFunc) {
                    ctx.w$rec = rec; ctx.w$i = i;
                    cwdl = cwdl(ctx);
                } // compile wdi to wdl
                
                w$el.append(w$exec(cwdl, ctx, true));
            } catch (e) {
                logwarn(e);
            }}
        }
        
        // Now update w$el.data after ctx has been populated by children
        //if (wdl._data) { w$evalProps(wdl._data, w$, ctx, w$el.data); }
        
        // Populate w$el's interface post-children
        if (wdl._iface) { w$evalProps(wdl._iface, w$, ctx, w$el); }

        // Finally, post Creation steps
        if ((_final=wdl._final)) {            
            if (_final.show === true) {
                w$el.show();
            } else if (_final.show === false) {
                w$el.hide();
            }
            
            if (_final.exec) { // execute functions dictated by wdl
                _final.exec.apply(w$el, [ctx, w$]);
            }
            
            // Inserting element into DOM should be done last and only for the top
            // level element.
            if ((!recursion) && _final.appendTo) {
                $el.appendTo(_final.appendTo); 
            }
        }
                
        return w$el;
    }

    var iface = 
    {
       w$undefined: w$undefined,
       w$exec: w$exec,
       w$get: w$get,
       w$set: w$set,
       w$defineProto: w$defineProto,
       Widget: WidgetElement
   };
   return Object.freeze(iface);
}());