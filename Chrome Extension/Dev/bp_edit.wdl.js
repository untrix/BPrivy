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
    var MOD_COMMON = IMPORT(m),
        encrypt = IMPORT(m.encrypt),
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
        addHandlers = IMPORT(m.addHandlers), // Compatibility function
        rpcToMothership = IMPORT(m.rpcToMothership);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var newPRecord = IMPORT(m.newPRecord),
        saveRecord = IMPORT(m.saveRecord),
        deleteRecord = IMPORT(m.deleteRecord),
        cm_getDN = IMPORT(m.cm_getDN);
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

    var g_doc = document;

    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_MOD_ERROR.alert(resp.err);
        }
    }
    function getDNode(l, dt, cback)
    {
        rpcToMothership({cm:cm_getDN, l:l, dt:dt}, cback);
    }

    function dNodeTitleText_wdt(ctx)
    {
        var loc = ctx.loc,
            host = loc.H || loc.hostname;
        return {
            tag:'a',
            attr:{ href:"http://"+host },
            css:{ display:'inline-block' },
            text:host,
            iface:{ "url":"http://"+host },
            on:{ click: function (e)
                {
                    window.open(this.url);
                    e.preventDefault();
                    e.stopPropagation();
                }}
                // children:[
                // {
                    // tag:"h6",
                    // text: host
                // }]
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
        attr:{ href:"#", title:"New Username / Password" },
            children:[
            {tag:"i",
            addClass:'icon-plus',
            }],
        _iface:{ w$ctx:{ panel:'panel' } },
        _text: " "
        };
    };

    function DButton () {}
    DButton.wdt = function(w$ctx)
    {
        var ioItem = w$ctx.ioItem;
        return {
        cons: DButton,
        tag:'a',
        attr:{ href:"#", title:"Delete Username" },
        css:{ display:'inline-block' },
        //addClass: "span1",
        on:{ click:DButton.prototype.onClick },
        _iface:{ ioItem:ioItem },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-trash",
            }]
        };
    };
    DButton.prototype = w$defineProto(
    {
        onClick: {value: function(e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.ioItem.die();
        }}
    });
        
    function isValidInput(str) {return Boolean(str);}
    
    function TButton () {}
    TButton.wdt = function (w$ctx)
    {
        var bInp = w$ctx.io_bInp;
        return {
         cons: TButton,
         tag: 'a',
         attr:{ href:"#", title:"Edit Password" },
         css:{ display:'inline-block' },
         //addClass: "span1",
         on:{ click:TButton.prototype.toggleButton },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:bInp? "icon-ok" :"icon-pencil",
            ctx:{ w$:{icon:'w$el'} }
            }],
         _iface:{ w$ctx:{ ioItem:"ioItem", icon:'icon' } }
        };
    };
    TButton.prototype = w$defineProto(
    {
        toggleButton: {value: function (e) 
        {
            var bInp = this.ioItem.toggleIO();
            if (bInp) {
                this.icon.$el.removeClass('icon-pencil');
                this.icon.$el.addClass('icon-ok');
            }
            else {
                this.icon.$el.removeClass('icon-ok');
                this.icon.$el.addClass('icon-pencil');                    
            }
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
        }}
    });
    
    function NewRecord() {}
    NewRecord.prototype = w$defineProto(
    {
        onsubmit: {value: function(e)
        {
            console.log("NewRecord.onsubmit invoked");
            var loc = MOD_COMMON.parseURL(this.urlF.$el.val());
            console.log("NewRecord.onsubmit: url=" + JSON.stringify(loc));
            e.stopPropagation();
            e.preventDefault();// Prevents default action and causes event to get cancelled if cancellable
            this.die();
        }}
    });
    NewRecord.wdt = function (ctx)
    {
        return {
            tag:'form',
            attr:{ action:"#" },
            on:{ submit:NewRecord.prototype.onsubmit },
            addClass: "inline-form",
                children:[
                {tag:'input',
                 addClass:'input-large',
                 attr:{ type:'text', placeholder:'Type URL here' },
                 ctx:{ w$:{ urlF:'w$el' } }
                }
                ],
            _iface:{ w$ctx:{urlF:'urlF' } }
        };
    };
    
    function IItemP () {}
    IItemP.wdt = function (w$ctx)
    {
        var u, p, 
        ioItem = w$ctx.ioItem,
        pRec = ioItem.rec;
        
        if (pRec)
        {
            u = pRec.u;
            p = pRec.p;
        }
        else { // create a new pRec and save it back to ioItem.
            pRec = newPRecord(ioItem.loc);
            ioItem.rec = pRec; // Save this back to ioItem.
        }
        return {
        cons: IItemP,
        tag:'div',
        css:{ display:'inline-block' },
        prop:{ 'data-iitem':true },
        ctx:{ w$:{iItem:'w$el'} },
        iface:{ ioItem:ioItem },
            children: [
            {tag:'input',
             attr:{ type:'text', value:u, placeholder:'Username' },
             prop:{ disabled:u?true:false },
             //addClass:css_class_field+css_class_userIn,
             addClass: "input-large",
             ctx:{ w$:{u:'w$el' } },
             _iface:{ value: u } 
            },
            {tag:'input',
             attr:{ type:'password', value:p, placeholder:'Password' },
             //addClass:css_class_field+css_class_passIn,
             addClass: "input-large",
             ctx:{ w$:{p:'w$el'} },
             _iface:{ value: p },
             }
            ],
        _iface:{ w$ctx:{ u:'u', p:'p' } }
        };
    };
    IItemP.prototype = w$defineProto (
    {
        checkInput: {value: function() 
        {
            var ioItem = this.ioItem,
                nU = this.u.el.value,
                oU = ioItem.rec? ioItem.rec.u: undefined,
                nP = encrypt(this.p.el.value),
                oP = ioItem.rec? ioItem.rec.p: undefined;
            
            if (!isValidInput(nU) || !isValidInput(nP)) {
                return false; // inputs are invalid
            }
            
            if ((nU !== oU) || (nP !== oP)) {
                return true; // inputs are valid and different
            }
            // else return undefined; inputs are valid but same.
        }},
        saveInput: {value: function(callback)
        {
            var ioItem = this.ioItem,
                nU = this.u.el.value,
                oU = ioItem.rec? ioItem.rec.u: undefined,
                nP = encrypt(this.p.el.value),
                oP = ioItem.rec? ioItem.rec.p: undefined;

            // save to db
            var pRec = newPRecord(ioItem.loc, Date.now(), nU, nP);
            saveRecord(pRec, dt_pRecord, callback);
            //ioItem.rec = pRec;
            if (oU && (nU !== oU)) {
                this.deleteRecord(dt_pRecord, oU); // TODO: Needs URL
            }                
        }},
        deleteRecord: {value: function(dt, key)
        {
            if (dt === dt_pRecord) {
                deleteRecord({loc:this.ioItem.loc, u:key});
            }
        }}
    });
    
    function OItemP () 
    {}
    OItemP.wdt = function (w$ctx)
    {
        var u, p, 
            autoFill = w$ctx.autoFill,
            ioItem = w$ctx.ioItem,
            pRec = (ioItem && ioItem.rec) ? ioItem.rec:undefined;
        if (pRec) {
            u = pRec.u;
            p = pRec.p;

            return {
            cons: OItemP,
            tag:'div', 
            css:{ 'display':'inline-block' },
            prop:{ 'data-oitem':true },
            ctx:{ w$:{ oItem:'w$el' } },
                children:[
                //autoFill ? FButton.wdt : w$undefined,
                {tag:'span',
                 attr:{ draggable:true },
                 //addClass:css_class_field+css_class_userOut,
                 addClass: "input-large uneditable-input",
                 text:u,
                 ctx:{ w$:{ u:'w$el' } },
                 _iface:{ fn:fn_userid, value:u }
                },
                {tag:'span',
                 attr:{ draggable:true },
                 //addClass:css_class_field+css_class_passOut,
                 addClass: "input-large uneditable-input",
                 text:'*****',
                 ctx:{ w$:{p:'w$el' } },
                 _iface:{ fn:fn_pass, value:p }
                }],
            _iface:{ ioItem:ioItem, w$ctx:{ u:'u', p:'p' } }
            };
        }
    };
    OItemP.prototype = w$defineProto ({});
    
    function IoItem () {}
    IoItem.wdi = function (w$ctx)
    {
        var acns=w$ctx.w$rec,
            rec = acns? acns.curr: undefined,
            loc = w$ctx.loc,
            panel = w$ctx.panel,
            bInp = w$ctx.io_bInp,
            autoFill = panel.autoFill;
        return {
        cons: IoItem,
        tag:'div', 
        //addClass: "span8",
        ctx:{ w$:{ ioItem:'w$el' } },
        iface: { acns:acns, rec:rec, loc:loc, panel:panel, bInp:bInp },
        on: {mousedown:stopPropagation},
            children:[
            TButton.wdt,
            bInp ? IItemP.wdt : OItemP.wdt,
            DButton.wdt
            ],
         // save references to relevant objects.
         _iface:{ w$ctx:{oItem:"oItem", iItem:"iItem"} }
        };
    };
    IoItem.prototype = w$defineProto( // same syntax as Object.defineProperties
    {
        toggleIO: {value: function() 
        {
            var iI = this.iItem, 
                oI = this.oItem,
                ctx={ioItem:this, autoFill:this.panel.autoFill},
                res,
                self = this;
            if (iI)
            { // Create output element
                res = iI.checkInput();
                if (res===undefined) 
                {
                    this.oItem = w$exec(OItemP.wdt, ctx);
                    MOD_COMMON.deleteProps(ctx); // Clear DOM refs inside the ctx to aid GC
                    if (this.oItem) {
                        delete this.iItem; // only removes the object-prop
                        this.oItem.$el.insertAfter(iI.$el);
                        iI.die();
                        //this.append(this.oItem);
                        this.bInp = false;
                    }
                }
                else if (res === true) 
                {
                    iI.saveInput(function(resp)
                    {
                        if (resp.result===true) {
                            self.panel.reload();
                        }
                        else {
                            BP_MOD_ERROR.warn(resp.err);
                            self.panel.reload();
                        }
                    });
                }
            }
            else if (oI)
            { // Create input element, destroy output element
                this.iItem = w$exec(IItemP.wdt, ctx);
                MOD_COMMON.deleteProps(ctx); // Clear DOM refs inside the ctx to aid GC
                if (this.iItem) {
                    delete this.oItem;
                    this.iItem.$el.insertAfter(oI.$el); 
                    oI.die();
                    //this.append(this.iItem);
                    this.bInp = true;
                }
            }
            
            return Boolean(this.iItem);
        }}
    });

    function PanelList () {}
    PanelList.wdt = function (ctx)
    {
        var loc = ctx.loc,
            panel = ctx.panel,
            it = ctx.it;
        return {
        cons: PanelList,
        tag:'div',
        ctx:{ io_bInp:false, w$:{ itemList:'w$el' } },
        iface:{ loc:loc, panel:panel },
             iterate:{ it:it, wdi:IoItem.wdi }
        };
    };
    PanelList.prototype = w$defineProto(
    {
        newItem: {value: function()
        {
            if (!this.newItemCreated) {
                w$exec(IoItem.wdi, {io_bInp:true, loc:this.loc, panel:this.panel }).appendTo(this);
                this.newItemCreated = true;    
            }
            
        }}
    });

    // 'Panel'
    function DNodeWdl () {}
    DNodeWdl.wdi = function(w$ctx) 
    {
        var dNode = w$ctx.w$rec,
            dt = w$ctx.dt,
            recs = DNProto.getData.apply(dNode, [dt]);//dNode.getData(dt)

        // If this node has no data, then have it be skipped.    
        if (!recs) {return w$undefined;}

        var H = dNode.url, //dNode[DNODE_TAG.ITER].myURL,
            rIt = new BP_MOD_TRAITS.RecsIterator(recs);
            
        return {
        cons:DNodeWdl, // w$el constructor
        tag:"div",
        css:{ display:'block', padding:5, 'margin-bottom':2 },
        addClass: "well",         
        // Post w$el creation steps
        ctx:{ w$:{ panel:"w$el" }, loc:{hostname:H}, it:rIt },
        // Copy props to the Wel object as its top-level properties.
        iface:{ H:H, dt:dt },

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
        {
            var l = {H:this.H},
                self = this;
            getDNode(l, this.dt,
            function (resp)
            {
                if (!resp.result) {callbackHandleError(resp); return;}
                
                var ctx = {
                    w$rec: resp.dN,
                    dt: self.dt,
                    },
                    wel = w$exec(DNodeWdl.wdi, ctx);
                    MOD_COMMON.deleteProps(ctx); // Clear DOM refs inside the ctx to aid GC
                    if (wel) {
                        self.$el.replaceWith(wel.$el);
                    }
                    self.die();
            });
            console.log("DNode->reload invoked");
        }},
    });

    function EditorWdl () {}
    EditorWdl.wdt = function (ctx)
    {
        var dnIt = ctx.dnIt;
        
        return {
        cons:EditorWdl,
        tag:"div",
        attr:{ id:'com-bprivy-panel'},
        //css:{ 'background-color':"#e3f1ff" },
            iterate:{ it:dnIt, wdi:DNodeWdl.wdi }
        };
    };
    EditorWdl.prototype = w$defineProto(
    {
        newRecord: {value: function()
        {
            //if (this.wel_newURL) {return;}
            
            var wel = w$exec(NewRecord.wdt);
            if (wel) {
                this.prepend(wel);
                //this.wel_newURL = wel;
            }
        }}
    });
    
    return Object.freeze(
    {
        EditorWdl_wdt: EditorWdl.wdt
    });
    
}());