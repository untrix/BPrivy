/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */


/* JSLint directives */
/*global $, IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

    /********************** UI Widgets in Javascript!  **************************
     * WDL = Widget Description Language. WDL objects are evaluated by wdl-interpretor
     * WDT = WDL Template. Functions that produce WDL objects. These may be executed either
     *       directly by javascript or by the wdl-interpretor.
     * WDI = WDL Template invoked inside an iteration. Gets additional w$i and w$rec properties
     *       inside its (w$)ctx argument.
     * W$EL = Widget Element. This is the element finally produced by the wdl-interpretor.
     *       It is a proxy to the DOM element. If the DOM is laid on a two-dimensional plane
     *       then w$el elements are laid out on a parallel plane, with the same hierarchy
     *       as the DOM elements and with cross-links between each pair of DOM and w$ element.
     * Set of WDL Properties in order of processing:
     * wdl = 
     * {
     *     'tag' or 'html' are mandatory
     *     'cons' or 'proto' maybe be optionally present. But not both.
     *     cons == widget element constructor. It should construct descendants of WidgetElement.prototype
     *     proto== Prototype object. If this is specified, then it should be a descendant of
     *             WidgetElement.proto. w$exec will construct an object inherited from proto.
     *             If neither of cons or proto are present, then a simple WidgetElement will be constructed.
     *     attr == same as in jquery
     *     text == same as in jquery - run before child nodes are inserted
     *     prop == same as in jquery
     *     css  == same as in jquery
     *     addClass == same as in jquery
     *     on   ==  same syntax as jQuery. Will bind 'this' to this element (i.e. currentTarget).
     *                In this case 'this' is bound to the same element as the one catching the event.
     *     onTarget = same syntax as jQuery. However, will bind 'this' to the target element
     *                which may be different than the handling/catching element.
     *     ctx == Object that holds name:value pairs to be populated into the context (ctx/w$ctx).
     *            Meant for passing properties down to descendants, back up to parents or onto
     *            elements further down the time-line. The elements will catch these properties
     *            using iface and _iface properties. These properties are inserted into ctx
     *            before children are processed. The property values may be directly specified
     *            in the wdl (maybe dynamically created by a wdt or wdi function but ultimately
     *            hard-bound into the resulting wdl object), or w$exec may be instructed to pick
     *            them up from the context of from the lexical-environment denoted by 'w$'.
                  Copy props to ctx with values:
                  1. Directly from the javascript runtime.
                  2. For the props under w$, copy them from the wdl-interpretor runtime. In this case
                     the value of the prop defined below should be name of the prop in the wdl-runtime.
                  3. Props listed under w$ctx are copied over from the context object - ctx - only makes
                     sense when you're copying into something other than the context itself, like iface
                     or _iface.
     *          e.g. ctx:{ prop1:hard-boundvalue, w$:{ element:'w$el' }, w$ctx:{ prop3:'prop-from-ctx' } }
     * 
     *     iface == Set of name:value pairs to insert into the WidgetElement before processing children. This
     *            allows descendants and later elements to take values directly from the WidgetElement instead
     *            of from the context. Value sources are same as described above for ctx.
                  Copy props to ctx with values:
                  1. Directly from the javascript runtime.
                  2. For the props under w$, copy them from the wdl-interpretor runtime. In this case
                     the value of the prop defined below should be name of the prop in the wdl-runtime.
                  3. Props listed under w$ctx are copied over from the context object - ctx - only makes
                     sense when you're copying into something other than the context itself, like iface
                     or _iface.
     *     children == children wdls, inserted in order of appearence.
     *              As a special case, a w$undefined value of a child-wdl is an indication to skip that
     *              child element instead of throwing an exception (exception will be thrown if (!child))
     *     iterate:
     *     iterate2:{ it:iterator, wdi:wdl-template-func-or-plain-object }
     *              Insert children iteratively. Iterator should have a next() function that returns a 'record'
     *              object to be fed into the wdi function. The wdi property shoudl hold a wdl-template function
     *              that is expected to be executed at runtime and with each iteration w$ctx.w$rec property is
     *              populated with the record obtained by iterator.next(). The iteration number (starting with 1)
     *              is populated into w$ctx.w$i.
     *     _iface: Same as iface, except that this directive is processed after children are created. Meant
     *              to catch values thrown by children.
     *     _final: Can have three properties {show:true/false/other, exec:func, appendTo:DOM-element}
     *     _final.show: true=>show the element, false=>hide the element, other value or absent=> do nothing 
     *     _final.exec: a function to execute
     *     _final.appendTo: instructs w$exec to append the created element to a DOM element.
     *     _text:   Text (node) to append to the element after all children. Appends a
     *              text node created by document.createTextNode() method.
     *     
     * }
     */

function BP_GET_W$(g)
{   // NOTE: Requires g.g_win to be the target DOM window. Instantiate a fresh module
    // for the DOM window where you want to use this.
    "use strict";
    var window = null, document = null, console = null,
        g_doc = g.g_win.document;
    var m;
    /** @import-module-begin CSPlatform */
    m = g.BP_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    var addHandlers = IMPORT(m.addHandlers); // Compatibility function
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError),
        logwarn = IMPORT(m.logwarn);
    /** @import-module-begin */
    m = g.BP_COMMON;
    var MOD_COMMON = IMPORT(m);
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
            //$el: {value: $el, writable:false, configurable:true}, // pointer to jquery wrapped DOM element object
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
        $(this.el).append(w.el);
        //this.children.push(wgt);
    };
    WidgetElement.prototype.prepend = function(w) {$(this.el).prepend(w.el);};
    WidgetElement.prototype.appendTo = function(w) {w.append(this);};
    WidgetElement.prototype.prependTo = function(w) {w.prepend(this);};
    WidgetElement.prototype.insertAfter = function(w) 
    {
        $(this.el).insertAfter(w.el);
        //w.el.after(this.el);
    };
    WidgetElement.prototype.replaceWith = function(w) 
    {
        $(this.el).replaceWith(w.el);
        //this.el.replace(w.el);
    };
    WidgetElement.prototype.show = function() {this.el.style.removeProperty('display');};
    WidgetElement.prototype.hide = function() {this.el.style.display = 'none';};
    WidgetElement.prototype.toggle = function()
    {
        if (this.el.style.display) {this.show(); return true;} 
        else {this.hide(); return false;}
    };
    WidgetElement.prototype.destroy = function()
    {
        // This is a destructor, but unfortunately a new jQuery object is being created here.
        $(this.el).remove(); // This will hopefully clear data from the entire subtree rooted here.
        
        // Object-props are being deleted below in order to prevent circular references.
        this.clearRefs();
    };
    WidgetElement.prototype.clearRefs = function()
    {
        MOD_COMMON.delProps(this.w$);
        MOD_COMMON.delProps(this);
    };
    WidgetElement.prototype.cssClass = function (_class)
    { this.el.className = _class; };
    WidgetElement.prototype.addClass = function (className)
    {
        $(this.el).addClass(className);
        //this.el.classList.add(className);  
    };
    WidgetElement.prototype.removeClass = function (className)
    {
        $(this.el).removeClass(className);
        //this.el.classList.remove(className);
    };
    WidgetElement.prototype.$ = function () {return $(this.el); };
    // Returns an object to be used as a prototype for a widget element.
    function w$defineProto (cons, props, ancestorProto) // props has same syntax as Object.defineProperties
    {
        // var proto = newInherited(WidgetElement.prototype);
        // Object.defineProperties(proto, props);
        // return proto;
        cons.prototype = Object.create((ancestorProto || WidgetElement.prototype), props);
        cons.prototype.constructor = cons;
        return cons.prototype;
    }
    
    function copyIndirect (sk, sv, dst) 
    {
        // sk = source object of keys for the destination as well as provides keys for the 'sv' object
        // dst = destination object, obtains key p from sk and value = sv[sk[p]]
        // sv = object that provides values to the destination. For prop p, value = sv[sk[p]]
        if (!(sk && sv && dst)) {BP_ERROR.logdebug('invalid args to copyIndirect'); return;}
        
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
    
    function w$eTargetProxy (e)
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
    
    function w$eventProxy (e)
    {
        var wel = w$get(e.currentTarget), func;
        if (wel) {
            func = wel.w$.on? wel.w$.on[e.type] :undefined;
        }
        if (func) {
            func.apply(wel, [e]);
        }
    }
    
    function w$on (wel, on, proxy)
    {
        if (wel && on) {
            wel.w$.on = on;
            var _on = {}, keys = Object.keys(on), i;
            for (i=keys.length-1; i>=0; i--) {
                _on[keys[i]] = proxy; //w$eventProxy;
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
            throw new BPError("Bad WDL: not a JS object", 'BadWDL', 'NotJSObject');
        }
        else if (!wdl.tag && !wdl.html)
        {
            throw new BPError("Bad WDL: " + JSON.stringify(wdl), 'BadWDL');
        }
        
        var el, $el, i=0, w$el, _final, wcld, keys, key, val, w$ ={},
            n=0, cwdl, temp_ctx;

        // Create the DOM element
        if (wdl.tag) {
            el = g_doc.createElement(wdl.tag);
            $el = $(el);
        }
        else { // wdl.html
            $el = $(wdl.html); 
            el = $el[0];
        }
        // Create the widget element
        if (wdl.cons) {
            w$el = new wdl.cons();
            w$el.cons($el);
        }
        else if (wdl.proto) {
            w$el = wdl.proto();
            w$el.cons($el);
        }
        else {
            w$el = new WidgetElement($el);
        }
        
        var txt1 = wdl.text || "";
        
        if (wdl.attr) {$el.attr(wdl.attr);}
        if (wdl.text) {$el.text(wdl.text);}
        if (wdl.prop) {$el.prop(wdl.prop);}
        if (wdl.css)  {$el.css(wdl.css);}
        if (wdl.addClass){$el.addClass(wdl.addClass);}
        
        // $el.attr(wdl.attr || {})
            // .text(wdl.text || "")
            // .prop(wdl.prop || {})
            // .css(wdl.css || {})
            // .addClass(wdl.addClass || "");

        w$on(w$el, wdl.on, w$eventProxy); // will bind this to e.currentTarget
        w$on(w$el, wdl.onTarget, w$eTargetProxy); // will bind this to e.target

        // Update w$ - the 'lexical env'.
        w$.w$el = w$el;
        
        // Update the context now that the element is created
        if (!ctx) {temp_ctx = ctx={};} // setup a new context if one is not provided
        if (wdl.ctx)  {
            w$evalProps(wdl.ctx, w$, ctx, ctx);
        }

        // Populate element's interface pre-children
        if (wdl.iface) { w$evalProps(wdl.iface, w$, ctx, w$el); }

        // Process and insert child widgets
        for (i=0, n=wdl.children? wdl.children.length:0; i<n; i++) {
            cwdl = wdl.children[i];
            if (cwdl !== w$undefined) {
                try {
                    w$el.append(w$exec(cwdl, ctx, true));
                }
                catch (err) {
                    logwarn(err);
                }
            }
        }

        function iterate (it, wdi)
        {
            var rec, isFunc=false, _cwdl, j;
            
            if (!it || !wdi) {return;}

            if (typeof wdi === 'function') { isFunc = true; }

            for (j=1,_cwdl=wdi; ((rec = it.next())); _cwdl=wdi) 
            {try {
                if (isFunc) {
                    ctx.w$rec = rec;
                    ctx.w$i = j;
                    _cwdl = wdi(ctx);
                } // compile wdi to wdl
                if (_cwdl !== w$undefined) {
                    w$el.append(w$exec(_cwdl, ctx, true));
                    j++;
                }
            } catch (e) {
                logwarn(e);
            }}
            
            it = null;
        }
        // now the iterative children-1
        if (wdl.iterate) {
            iterate(wdl.iterate.it, wdl.iterate.wdi);
        } 
        // iterative children-2
        if (wdl.iterate2) {
            iterate(wdl.iterate2.it, wdl.iterate2.wdi);
        } 

        function walk (walker, wdi)
        {
            var rec, isFunc=false, _cwdl, j;
            
            if (!walker || !wdi) {return;}

            if (typeof wdi === 'function') { isFunc = true; }

            //for (j=1,_cwdl=wdi; ((rec = it.next())); _cwdl=wdi)
            j = 1;
            walker.walk(function(rec)
            {try {
                _cwdl = wdi;
                if (isFunc) {
                    ctx.w$rec = rec;
                    ctx.w$i = j;
                    _cwdl = wdi(ctx);
                } // compile wdi to wdl
                if (_cwdl !== w$undefined) {
                    w$el.append(w$exec(_cwdl, ctx, true));
                    j++;
                }
            } catch (e) {
                logwarn(e);
            }});

            walker = null;
        }
        // iterative children using the walk API
        if (wdl.walk) {
            walk(wdl.walk.walker, wdl.walk.wdi);
        }

        // Populate w$el's interface post-children
        if (wdl._iface) { w$evalProps(wdl._iface, w$, ctx, w$el); }
        // Insert text nodes after children
        if (wdl._text) { $el.append(g_doc.createTextNode(wdl._text)); }
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
         
        // Clear DOM refs inside the temp_ctx to aid GC
        (!temp_ctx) || (MOD_COMMON.delProps(temp_ctx));
            
        return w$el;
    }

    var iface = Object.freeze(
    {
       w$undefined: w$undefined,
       w$exec: w$exec,
       w$get: w$get,
       w$set: w$set,
       w$defineProto: w$defineProto,
       Widget: WidgetElement
   });
   BP_ERROR.log("constructed mod_w$");
   return iface;
}