/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE, BP_MOD_W$, BP_MOD_TRAITS, BP_MOD_WDL */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin EDITOR
 */
var BP_MOD_EDITOR = (function ()
{
    "use strict";
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault),
        newInherited = IMPORT(m.newInherited);
    /** @import-module-begin W$ */
    m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        Widget = IMPORT(m.Widget),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL),
        addHandlers = IMPORT(m.addHandlers); // Compatibility function
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var newPRecord = IMPORT(m.newPRecord),
        saveRecord = IMPORT(m.saveRecord),
        deleteRecord = IMPORT(m.deleteRecord);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-begin */
    m = BP_MOD_TRAITS;
    var MOD_TRAITS = IMPORT(m),
        UI_TRAITS = IMPORT(m.UI_TRAITS),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_pass = IMPORT(m.fn_pass),        // Represents data-type password
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin */
    m = IMPORT(BP_MOD_WDL);
    var NButton = IMPORT(m.NButton),
        SButton = IMPORT(m.SButton);
    /** @import-module-begin */
    m = IMPORT(BP_MOD_MEMSTORE);
    var DNODE_TAG = IMPORT(m.DNODE_TAG),
        DNProto = IMPORT(m.DNProto);
        /** @import-module-end **/    m = null;

    function dNodeTitleText_wdt(ctx)
    {
        var loc = ctx.loc;
        return {
            tag:"div",
            text: loc.H || loc.hostname
        };
    }

    function DNodeWdl () {}
    DNodeWdl.wdi = function(w$ctx) 
    {
        var dNode = w$ctx.w$rec,
            dt = w$ctx.dt,
            recs = DNProto.getData.apply(dNode, dt);

        // If this node has no data, then have it be skipped.    
        if (!recs) {return w$undefined;}

        var url = dNode[DNODE_TAG.ITER].myKey;    
            
        return {
        cons:DNodeWdl, // w$el constructor
        tag:"div",
        css:{ display:'block' },
         
        // Post w$el creation steps
        // Copy props to ctx with values:
        // 1. Directly from the javascript runtime.
        // 2. For the props under w$, copy them from the wdl-interpretor runtime. In this case
        //    the value of the prop defined below should be name of the prop in the wdl-runtime.
        // 3. Props listed under w$ctx are copied over from the context object - ctx - only makes
        //    sence when you're copying into something other than the context itself.
        ctx:{ w$:{ panel:"w$el" }, loc:{hostname:"xyz"} },
        // Copy props to the Wel object as its top-level properties.
        iface:{ url:url },

            // Create children
            children:[
            {tag:"div",
                children:[
                NButton.wdt,
                dNodeTitleText_wdt,
                //SButton.wdt
                ]
            }//,
            //PanelList.wdt
            ]

        // Post processing steps
        //_iface:{ w$:{}, w$ctx:{itemList:'itemList'} }
        };
    };
    DNodeWdl.prototype = w$defineProto( // same syntax as Object.defineProperties
    {
        reload: {value: function() 
        { //TODO: Implement this
        }},
    });

    function EditWdl () {}
    EditWdl.wdt = function (ctx)
    {
        var dnIt = ctx.dnIt;
        
        return {
        cons:EditWdl,
        tag:"div",
            iterate:{ it:dnIt, wdi:DNodeWdl.wdi }
        };
    };
    EditWdl.prototype = BP_MOD_W$.Widget.prototype;
    
    return Object.freeze(
    {
        EditWdl_wdt: EditWdl.wdt
    });
    
}());