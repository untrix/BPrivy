/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE, BP_MOD_W$ */
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
    /** @import-module-begin W$ */
    var w$ = IMPORT(BP_MOD_W$);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    var addHandlers = IMPORT(m.addHandlers); // Compatibility function
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

    // CSS Class Names. Visible as value of 'class' attribute in HTML
    // and used as keys in CSS selectors. These need to be globally
    // unique as well. We need these here in order to ensure they're
    // globally unique and also as a single location to map to CSS files.
    var css_class_li = "com-bprivy-li "; // Space at the end allows concatenation
    var css_class_ioFields = "com-bprivy-io-fieldset ";// Space at the end allows concatenation
    var css_class_field ="com-bprivy-field ";// Space at the end allows concatenation
    var css_class_userIn = "com-bprivy-user-in ";// Space at the end allows concatenation
    var css_class_userOut = "com-bprivy-user-out ";// Space at the end allows concatenation
    var css_class_passIn = "com-bprivy-pass-in ";// Space at the end allows concatenation
    var css_class_passOut = "com-bprivy-pass-out ";// Space at the end allows concatenation
    var css_class_tButton = "com-bprivy-tB ";

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
    
    var io =
    {
        autoFill: function (ev) {
            BP_MOD_ERROR.loginfo('autoFill invoked');
        },
        toggleIO: function (ev) {
            BP_MOD_ERROR.loginfo('toggleIO invoked');            
        }
    };
    
    function iItem_wdt (ctx, w$rec, w$i)
    {
        return  {tag:'div', text:"This is an input item"};
    }
    
    function oItem_wdt (ctx, w$rec, w$i)
    {
        return  {tag:'div', text:"This is an output item"};
    }
    
    function ioItem_wdt (ctx, w$rec, w$i)    {        var wdl =        {tag:'div', attr:{id:eid_ioItem+w$i, class:css_class_li}, text:"Hello World",            children:[            {html:'<button type="button">',
             attr:{class:css_class_tButton,id:eid_fButton+w$i},             text:u_cir_F,
             on:{ click:io.autoFill},            },
            {html:'<button type="button">',
             attr:{ class:css_class_tButton, id:eid_tButton+w$i },
             text:ctx.io_bInp?u_cir_S:u_cir_E,
             on:{ click:io.toggleIO }
            },
            iItem_wdt(ctx, w$rec, w$i), oItem_wdt(ctx, w$rec, w$i),
            ],
         // save references to o and i item objects. Will be used by toggleIO
         _data:{ ctx:{oItem:"oItem", iItem:"iItem", io_bInp:"io_bInp"} }        };    }    
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
            e.dataTransfer.setDragImage(w$.exec(image_wdt,{imgPath:"icon16.png"}).el, 0, 0);
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
         ctx:{ io_bInp:false, w$:{ panel_wel:"w$el" } },

            // Create children
            children:[
            {tag:"div", attr:{ id:eid_panelTitle },
                children:[                cs_panelTitleText_wdl,                xButton_wdt]
            },
            cs_panelList_wdt],
            iterate:{ it:ctx.it, wdl:ioItem_wdt },

         // Post processing steps
         _data:{ w$ctx:{}, w$:{} }, // props to be copied to w$el.data after creating children
         _iface:{ die:function(){this.$el.remove();}, w$:{id:"id"} },
         _final:{ appendTo:document.body, show:true, exec:function(ctx, w$){w$.w$el.$el.draggable();} }
        };
        
        return wdl;
    }
   
    var iface = 
    {
       cs_panel_wdt: cs_panel_wdt,
    };
   return Object.freeze(iface);
}());
