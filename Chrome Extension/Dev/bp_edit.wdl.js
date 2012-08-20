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
            text: loc.H || loc.hostname,
            css:{ display:'inline-block' }
        };
    }

    /**
     * New Item button 
     */
    function NButton () {}
    NButton.prototype = w$defineProto(
    {
        newItem: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.panel.itemList.newItem();
        }}
    });
    NButton.wdt = function (w$ctx)
    {
        return {
        cons: NButton,
        tag: 'a',
        on:{ click:NButton.prototype.newItem },
        attr:{ href:"#" },
            children:[
            {tag:"i",
            addClass:'icon-plus',
            }],
        _iface:{ w$ctx:{ panel:'panel' } },
        _text: " "
        };
    };

    function PanelList () {}
    PanelList.wdt = function (ctx)
    {
        var loc = ctx.loc || g_loc,
            panel = ctx.panel,
            it = ctx.it;
        return {
        cons: PanelList,
        tag:'div', attr:{ id:eid_panelList },
        onTarget:{ dragstart:PanelList.prototype.handleDragStart,
        drag:PanelList.prototype.handleDrag, 
        dragend:PanelList.prototype.handleDragEnd },
        ctx:{ io_bInp:false, w$:{ itemList:'w$el' } },
        iface:{ loc:loc, panel:panel },
             iterate:{ it:it, wdi:IoItem.wdi }
        };
    };
    PanelList.prototype = w$defineProto(
    {
        handleDragStart: {value: function handleDragStart (e)
        {   // CAUTION: 'this' is bound to e.target
            
            //console.info("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = this.value;
            if (this.fn === fn_pass) {
                data = decrypt(this.value);
            }
            
            e.dataTransfer.items.add('', CT_BP_PREFIX + this.fn); // Keep this on top for quick matching later
            e.dataTransfer.items.add(this.fn, CT_BP_FN); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, CT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(w$exec(image_wdt,{imgPath:"/icons/icon16.png"}).el, 0, 0);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //console.log("handleDragStart:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
            //return true;
        }},
        handleDrag: {value: function handleDrag(e)
        {   // CAUTION: 'this' is bound to e.target
            //console.info("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }},
        handleDragEnd: {value: function handleDragEnd(e)
        {   // CAUTION: 'this' is bound to e.target
            //console.info("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }},
        newItem: {value: function()
        {
            if (!this.newItemCreated) {
                w$exec(IoItem.wdi, {io_bInp:true, loc:this.loc, panel:this.panel }).appendTo(this);
                this.newItemCreated = true;    
            }
            
        }}
    });

    function DNodeWdl () {}
    DNodeWdl.wdi = function(w$ctx) 
    {
        var dNode = w$ctx.w$rec,
            dt = w$ctx.dt,
            recs = DNProto.getData.apply(dNode, [dt]);//dNode.getData(dt)

        // If this node has no data, then have it be skipped.    
        if (!recs) {return w$undefined;}

        var url = dNode[DNODE_TAG.ITER].myKey,
            rIt = new BP_MOD_TRAITS.RecsIterator(recs);
            
        return {
        cons:DNodeWdl, // w$el constructor
        tag:"div",
        css:{ display:'block' },         
        // Post w$el creation steps
        ctx:{ w$:{ panel:"w$el" }, loc:{hostname:url}, it:rIt },
        // Copy props to the Wel object as its top-level properties.
        iface:{ url:url },

            // Create children
            children:[
            {tag:"div",
                children:[
                NButton.wdt,
                dNodeTitleText_wdt
                ]
            },
            PanelList.wdt
            ],

        // Post processing steps
        _iface:{ w$ctx:{itemList:'itemList'} }
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
        tag:"ul",
        attr:{ id:'com-bprivy-panel'},
        css:{ 'background-color':"#e3f1ff" },
            iterate:{ it:dnIt, wdi:DNodeWdl.wdi }
        };
    };
    EditWdl.prototype = BP_MOD_W$.Widget.prototype;
    
    return Object.freeze(
    {
        EditWdl_wdt: EditWdl.wdt
    });
    
}());