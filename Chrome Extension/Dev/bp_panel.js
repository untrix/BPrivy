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

/**
 * @ModuleBegin Panel
 */
var BP_MOD_WDL = (function ()
{
    "use strict";
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var encrypt = IMPORT(m.encrypt);
    var decrypt = IMPORT(m.decrypt);
    var stopPropagation = IMPORT(m.stopPropagation);
    var preventDefault = IMPORT(m.preventDefault);    
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    // Names used in the code. A mapping is being defined here because
    // these names are externally visible and therefore may need to be
    // changed in order to prevent name clashes with other libraries.
    // These are all merely nouns/strings and do not share a common
    // semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
    var eid_panel = "com-bprivy-panel"; // Used by panel elements
    var eid_panelTitle ="com-bprivy-panelTitle"; // Used by panel elements
    var eid_panelTitleText = "com-bprivy-TitleText";
    var eid_panelList ="com-bprivy-panelList"; // Used by panel elements
    var eid_ioItem = "com-bprivy-ioItem-";
    var eid_opElement = 'com-bprivy-op-'; // ID prefix of an output line of panel
    var eid_userOElement = "com-bprivy-useridO-"; // ID Prefix used by panel elements
    var eid_passOElement = "com-bprivy-passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = "com-bprivy-useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = "com-bprivy-passI-"; // ID Prefix Used by panel elements
    var eid_inForm = "com-bprivy-iform-";
    var eid_tButton = "com-bprivy-tB-"; // ID prefix for IO toggle button
    var eid_xButton = "com-bprivy-xB"; // ID of the panel close button
    var eid_fButton = "com-bprivy-fB"; // ID of the fill fields button

    // These are 'data' attribute names. If implemented as jQuery data
    // these won't manifest as HTML content attributes, hence won't
    // clash with other HTML elements. However, their names could clash
    // with jQuery. Hence they are placed here so that they maybe easily
    // changed if needed.
    var prop_value = "bpValue";
    var prop_dataType = "bpDataType";
    var prop_peerID = 'bpPeerID';
    var prop_panelID = 'bpPanelID';
    var prop_ctx = 'bpPanelCtx';
    var CT_TEXT_PLAIN = 'text/plain';
    var CT_BP_PREFIX = 'application/x-bprivy-';
    var CT_BP_DT = CT_BP_PREFIX + 'dt';
    var CT_BP_PASS = CT_BP_PREFIX + ft_pass;
    var CT_BP_USERID = CT_BP_PREFIX + ft_userid;

    // Other Globals
    var g_win = window;
    var g_doc = g_win.document;
    var g_loc = g_doc.location;
    var g_ioItemID = 0;
    var u_cir_s = '\u24E2';
    var u_cir_S = '\u24C8';
    var u_cir_e = '\u24D4';
    var u_cir_E = '\u24BA';
    var u_cir_F = '\u24BB';
    var u_cir_X = '\u24CD';
    /** @globals-end **/
   
    // Returns a newly created object inherited from the supplied object or constructor
    // argument. If the argument is a constructor, then the o.prototype is set to a new
    // object created using that constructor. Otherwise o.prototype=argument
    function newInherited(arg)
    {
        function Inheritor(){}
        if (typeof arg === 'object') {
            Inheritor.prototype = arg;
        }
        else if (typeof arg === 'function') {
            Inheritor.prototype = new arg();
        }
        return new Inheritor();
    }
    
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
       
    function evalProps (wdl, w$, ctx, dst)
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
    
    function w$get (arg) 
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
    }
    
    function w$exec (wdl, ctx, recursion)
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
            $el = $(wdl.html); el = $el[0];
        }
        w$el = new WidgetElement($el);
        
        $el.attr(wdl.attr || {})
            .on(wdl.on || {})
            .text(wdl.text || "")
            .prop(wdl.prop || {})
            .css(wdl.css || {})
            .addClass(wdl.addClass || {})
            .data('w$el', w$el); // point el back to w$el. jQuery ensures no cyclic references.
        
        // Update w$ runtime.
        w$.w$el = (w$el);
        w$.id = $el.attr('id');
        
        // Update the context now that the element is created
        if (!ctx) {ctx={};} // setup a new context if one is not provided
        if (wdl.ctx)  {
            evalProps(wdl.ctx, w$, ctx, ctx);
        }
        
        // Process and insert child widgets
        for (i=0, n=wdl.children? wdl.children.length:0; i<n; i++) {
            w$el.append(w$exec(wdl.children[i], ctx, true)); // insert children
        }
        
        // Now update w$el.data after ctx has been populated by children
        if (wdl._data) { evalProps(wdl._data, w$, ctx, w$el.data); }
        
        // Make w$el interface.
        if (wdl._iface) { evalProps(wdl._iface, w$, ctx, w$el); }

        // Finally, post Creation steps
        if ((_final=wdl._final)) {            
            if (_final.show === true) {
                $el.show();
            } else if (_final.show === false) {
                $el.hide();
            }
            
            if (_final.exec) {
                _final.exec(w$el);
            }
            
            // Inserting element into DOM should be done last and only for the top
            // level element.
            if ((!recursion) && _final.appendTo) {
                $el.appendTo(_final.appendTo); 
            }
        }
                
        return w$el;
    }
    
    /********************** UI Widgets in Javascript!  **************************
     * WDL = Widget Description Language. WDL objects are evaluated by wdl-compiler
     * WDT = WDL Template. Functions that produce WDL objects. These may be executed either
     *       directly by javascript or by the WDL-compiler.
     * W$EL = Widget Element. This is the element finally produced by the wdl-compiler.
     *       It is a proxy to the DOM element. If the DOM is laid on a two-dimensional plane
     *       then w$el elements are laid out on a parallel plane, with the same hierarchy
     *       as the DOM elements and with cross-links between each pair of DOM and w$ element.
     */

    function image_wdt(ctx)
    {
        var imgPath = ctx.imgPath;
        return {tag:"img", attrs:{ src:getURL(imgPath) }};
    }
    
    var cs_panelTitleText_wdl = {
        tag:"div", attr:{ id: eid_panelTitleText }, text:"BPrivy"
    };

    function xButton_wdt(ctx)
    {
        // make sure wel is captured into private closure, so we won't lose it.
        // values inside ctx will get changed as other wdls and wdts are executed.
        var w$el = ctx.panel_wel;
        function click (e)
        {
            // Need to do this using jquery so that it will remove $.data of all descendants
            if (w$el) {
                w$el.die();
                
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }
        // $el = element to be 'x'd.
        var wdl =
        {html:'<button type="button" accesskey="q">', attr:{ id:eid_xButton, accesskey:'q'},
         text:u_cir_X, on:{ click:click }
        };
        
        return wdl;
    }
    
    // function ioItem_wdt_var (ctx, rec, idx)    // {        // var wdl =        // {tag:'div', attr:{id:eid_ioItem+idx, class:css_class_li},            // children:[            // {html:'<button type="button">', attr:{class:css_class_tButton,id:eid_fButton+idx,disabled:true},             // text:u_cir_F, on:{ click:function(){console.log('fButton click');}}             // }            // ]//                     // };    // }//     
    function cs_panelList_wdt (ctx)
    {
        function handleDragStart (e)
        {
            //console.info("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = $(e.target).data(prop_value);
            if ($(e.target).data(prop_dataType) === ft_pass) {
                data = decrypt(data);
            }
            
            e.dataTransfer.items.add('', CT_BP_PREFIX + $(e.target).data(prop_dataType)); // Keep this on top for quick matching later
            e.dataTransfer.items.add($(e.target).data(prop_dataType), CT_BP_DT); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, CT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(w$exec(image_wdt,{imgPath:"icon16.png"}).el, 0, 0);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        function handleDrag(e)
        {
            //console.info("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }
        
        function handleDragEnd(e)
        {
            //console.info("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        var wdl = 
        {tag:'div', attr:{ id:eid_panelList },
         on:{ dragstart:handleDragStart, drag:handleDrag, dragend:handleDragEnd }
              //,var_child:{ array:ctx.recs[dt_pRecord], ctx:ctx, wdt_var:ioItem_wdt_var }
        };
        return wdl;
    }
    
    function cs_panel_wdt (ctx)
    {
        var wdl = 
        {tag:"div",
         attr:{ id:eid_panel },
         css:{ position:'fixed', top:'0px', 'right':"0px" },
         
         // Post w$el creation steps
         // Copy props to ctx with values:
         // 1. Directly from the javascript runtime.
         // 2. For the props under w$, copy them from the wdl-compiler runtime. In this case
         //    the value of the prop defined below should be name of the prop in the wdl-runtime.
         // 3. Props listed under w$ctx are copied over from the context object - ctx - only makes
         //    sence when you're copying into something other than the context itself.
         ctx:{ w$:{ panel_wel:"w$el" } }, // props to be copied to ctx with values from javascript runtime (earlier binding compared to w$)

            // Create children
            children:[
            {tag:"div", attr:{ id:eid_panelTitle },
                children:[                cs_panelTitleText_wdl,                xButton_wdt]
            },
            cs_panelList_wdt],

         // Post processing steps
         _data:{ w$:{}, w$ctx:{} }, // props to be copied to w$el.data after creating children
         _iface:{ die:function(){this.$el.remove();}, w$:{id:"id"} },
         _final:{ appendTo:document.body, show:true, exec:function(wel){wel.$el.draggable();} }
        };
        
        return wdl;
    }
    
    /********************** Declarative Code Begin ***************************

    var BUTTON_TRAITS = {};
    Object.defineProperties(BUTTON_TRAITS,
    {
        html:
        {
            value: '<button type="button"></button>'
        }
    }); Object.freeze(BUTTON_TRAITS);
    
    var xBUTTON_TRAITS = newInherited(BUTTON_TRAITS);
    Object.defineProperties(BUTTON_TRAITS,
    {
        eid: {value: "com-bprivy-xB"}
    }); Object.freeze(xBUTTON_TRAITS);
    
    var PANEL_TRAITS = {};
    Object.defineProperties(PANEL_TRAITS,
    {
        hasXButton: {value: false},
        html:
        {
            value:  '<div style="display:none">' + 
                        '<div id="com-bprivy-panelTitle">' +
                            '<div id="com-bprivy-TitleText"></div>'+
                        '</div>' +
                        '<div id="com-bprivy-panelList"></div>' +
                    '</div>'
        },
        eid: {value: "com-bprivy-panel"},
        eid_title: {value: "com-bprivy-panelTitle"},
        eid_titleText: {value: "com-bprivy-TitleText"}
    }); Object.freeze(PANEL_TRAITS);
    
    var CS_PANEL_TRAITS = newInherited(PANEL_TRAITS);
    Object.defineProperties(CS_PANEL_TRAITS,
    {
        hasXButton: {value: true}
    }); Object.freeze(CS_PANEL_TRAITS);
    
    ********************** Declarative Code End ***************************/
   
    /********************** Procedural Code Begin ***************************/
    
    /** @begin-class-def Button */
    // function newButton ()    // {        // var me = newInherited(DomElement);//                 // Object.defineProperties(me,        // {            // traits: {value: BUTTON_TRAITS, writable:true, enumerable:true}        // });//                 // return me;    // }
    /** @end-class-def Button **/
    
    // = {doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db, autoFill: autoFill, autoFillable: autoFillable}
    /** @begin-class-def Panel */
    // function newPanel (args) // pseudo constructor    // {        // // args.keys() === [dt_traits, ui_traits]        // // ui_traits.keys() === [html]//         // var me = newInherited(DomElement);        // Object.defineProperties(me,        // {            // traits: {value: PANEL_TRAITS},            // ioItems: { // Array of ioItems                // value: []            // },            // destroy: { // Destructor                // value: function() {}             // },            // show: { // shows/hides the panel                // value: function(show, position) {}            // }        // });//                 // me.$el = $(me.traits.html)//                 // return me;    // }

    /** @end-class-def Panel **/
   
   var iface = {
       cs_panel_wdt: cs_panel_wdt,
       w$exec: w$exec,
       w$get: w$get
   };
   return Object.freeze(iface);
}());
