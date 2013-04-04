/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */

/*global $, IMPORT */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin EDITOR
 */
function BP_GET_EDITOR(g)
{
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var MOD_COMMON = IMPORT(m),
        encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault),
        newInherited = IMPORT(m.newInherited);
    /** @import-module-begin W$ */
    m = IMPORT(g.BP_W$);
    var w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        Widget = IMPORT(m.Widget),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin CSPlatform */
    m = g.BP_CS_PLAT;
    var getURL = IMPORT(m.getURL),
        addHandlers = IMPORT(m.addHandlers), // Compatibility function
        rpcToMothership = IMPORT(m.rpcToMothership);
    /** @import-module-begin Connector */
    m = g.BP_CONNECT;
    var MOD_CONNECT = IMPORT(m),
        newPAction = IMPORT(m.newPAction),
        saveRecord = IMPORT(m.saveRecord),
        cm_getDN = IMPORT(m.cm_getDN),
        cm_getDomn = IMPORT(m.cm_getDomn),
        newL = IMPORT(m.newL);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin */
    m = g.BP_TRAITS;
    var MOD_TRAITS = IMPORT(m),
        UI_TRAITS = IMPORT(m.UI_TRAITS),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_pass = IMPORT(m.fn_pass),        // Represents data-type password
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX);

    /** @import-module-begin */
    m = IMPORT(g.BP_MEMSTORE);
    var MEMSTORE = IMPORT(m),
        DNODE_TAG = IMPORT(m.DNODE_TAG),
        DNProto = IMPORT(m.DNProto);
        /** @import-module-end **/    m = null;

    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_ERROR.alert(resp.err);
        }
    }
    function getDNode(l, dt, cback)
    {
        //rpcToMothership({cm:cm_getDN, l:l, dt:dt}, cback);
        cback({result:true, dN:MEMSTORE.getDNode(l, dt)});
    }
    function getDomain(loc, cback)
    {
        //rpcToMothership({cm:cm_getDomn, loc:loc}, cback);
        cback ({result:true, domn:MEMSTORE.MOD_ETLD.getDomain(loc)});
    }

    function image_wdt(ctx)
    {
        var imgPath = ctx.imgPath;
        return {
            tag:"img",
            attrs:{ src:getURL(imgPath) }
        };
    }

    function dNodeTitleText_wdt(ctx)
    {
        var loc = ctx.loc,
            host = loc.hostname,
            site_url = MOD_COMMON.locToURL(loc),
            i = ctx.panel ? ctx.panel.dNIdx : undefined; //ctx.editor ? ++(ctx.editor.i): undefined
        return {
            tag:'a',
            attr:{ href:site_url, target:"_blank" },
            addClass: "com-untrix-dNodeTitle",
            iface:{ "site_url":site_url },
            on:{ click: function (e)
            {
                //window.open(this.site_url);
                //e.preventDefault();
                e.stopPropagation();
            }},
                children:[
                {
                    tag:"h6",
                    text: (i ? (i+". ") : "") + host
                }]
        };
    }

    /**
     * Expand/Collapse button
     */
    function EButton () {}
    EButton.prototype = w$defineProto(EButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            if (this.panel.itemList)
            {
                if (this.isOpen) {
                    this.panel.itemList.hide();
                    this.setClosed();
                }
                else {
                    this.panel.itemList.show();
                    this.setOpen();
                }
            }
            else
            {
                this.panel.createList();
                this.setOpen();
            }
        }},
        setOpen: {value: function()
        {
            this.isOpen = true;
            this.icon.removeClass('icon-resize-full');
            this.icon.addClass('icon-resize-small');
        }},
        setClosed: {value: function()
        {
            this.isOpen = false;
            this.icon.removeClass('icon-resize-small');
            this.icon.addClass('icon-resize-full');
        }}
    });
    EButton.wdt = function (w$ctx)
    {
        var bOpen = w$ctx.bOpen;

        return {
        cons: EButton,
        tag: 'a',
        on:{ click:EButton.prototype.onClick },
        addClass: 'com-untrix-B',
        iface:{ isOpen:bOpen },
        attr:{ href:"#", title:"Expand" },
            children:[
            {tag:"i",
            addClass: bOpen ? 'icon-resize-small' : 'icon-resize-full',
            ctx:{ w$:{ icon:'w$el' } }
            }],

        _iface:{ w$ctx:{ panel:'panel', icon:'icon' } },
        _text: " "
        };
    };

    /**
     * New Item button
     */
    function NButton () {}
    NButton.prototype = w$defineProto(NButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            if (this.panel.itemList)
            {
                this.panel.itemList.newItem();
            }
        }}
    });
    NButton.wdt = function (w$ctx)
    {
        var bOpen = w$ctx.bOpen;

        return {
        cons: NButton,
        tag: 'a',
        on:{ click:NButton.prototype.onClick },
        addClass: 'com-untrix-B com-untrix-lB',
        ctx:{ w$:{ nB:'w$el' } },
        attr:{ href:"#", title:"New Entry" },
            children:[
            {tag:"i",
            addClass:'icon-plus ',
            }],
        _iface:{ w$ctx:{ panel:'panel' } },
        _final:{ show:bOpen}
        };
    };

    function DButton () {}
    DButton.wdt = function(w$ctx)
    {
        var ioItem = w$ctx.ioItem;
        return {
        cons: DButton,
        tag:'a',
        attr:{ href:"#", title:"Delete Entry" },
        addClass: 'com-untrix-B com-untrix-rB',
        on:{ click:DButton.prototype.onClick },
        _iface:{ 'ioItem':ioItem },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-trash",
            }]
        };
    };
    DButton.prototype = w$defineProto(DButton,
    {
        onClick: {value: function(e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.ioItem.deleteRecord();
        }}
    });

    function DButton2 () {}
    DButton2.wdt = function(w$ctx)
    {
        var dNode = w$ctx.panel;
        return {
        cons: DButton2,
        tag:'a',
        attr:{ href:"#", title:"Delete Entry" },
        addClass: 'com-untrix-B com-untrix-rB2',
        on:{ click:DButton2.prototype.onClick },
        _iface:{ 'dNode':dNode },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-trash",
            }]
        };
    };
    DButton2.prototype = w$defineProto(DButton2,
    {
        onClick: {value: function(e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.dNode.destroy();
        }}
    });

    function isValidInput(str) {return Boolean(str);}

    function TButton () {}
    TButton.wdt = function (w$ctx)
    {
        var bInp = w$ctx.io_bInp;
        return {
         cons: TButton,
         tag: 'button',
         attr:{ href:"#", title:"Edit Password", type:'submit' },
         addClass: "com-untrix-B",
         on:{ click:TButton.prototype.toggle },
         ctx: { w$:{ tButton:'w$el' } },
            children:[
            {tag:"i",
            addClass:bInp ? "icon-ok" : "icon-pencil",
            ctx:{ w$:{icon:'w$el'} }
            }],
         _iface:{ w$ctx:{ ioItem:"ioItem", icon:'icon' } }
        };
    };
    TButton.prototype = w$defineProto(TButton,
    {
        toggle: {value: function (e)
        {
            var bInp = this.ioItem.toggleIO();
            // if (bInp) {
                // this.icon.removeClass('icon-pencil');
                // this.icon.addClass('icon-ok');
            // }
            // else {
                // this.icon.removeClass('icon-ok');
                // this.icon.addClass('icon-pencil');
            // }
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
        }}
    });

    function VButton () {}
    VButton.wdt = function(w$ctx)
    {
        return {
        cons: VButton,
        html:'<button type="button"></button>',
        //css:{ float:'right', width:'20px' },
        addClass: "com-untrix-B com-untrix-rB",
        attr:{ title:'View password' },
        on:{ click:VButton.prototype.toggleView },
        iface:{ field:w$ctx.pwdField },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-eye-open",
            }]
        };
    };
    VButton.prototype = w$defineProto(VButton,
    {
        viewField: {value: function(ev)
        {
            if (!this.field) {return;}
            else this.field.view();
        }},
        unViewField: {value: function(ev)
        {
            if (!this.field) {return;}
            else this.field.unView();
        }},
        toggleView: {value: function(ev)
        {
            if (!this.field) {return;}
            if (this.field.viewing) { this.field.unView(); }
            else {this.field.view();}
        }}
    });

    function NewRecord() {}
    NewRecord.prototype = w$defineProto(NewRecord,
    {
        onsubmit: {value: function(e)
        {
            BP_ERROR.log("NewRecord.onsubmit invoked");
            var loc = MOD_COMMON.parseURL($(this.urlF.el).val());
            BP_ERROR.log("NewRecord.onsubmit: url=" + JSON.stringify(loc));
            e.stopPropagation();
            e.preventDefault();// Prevents default action and causes event to get cancelled if cancellable
            this.destroy();
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
        /*else { // create a new pRec and save it back to ioItem.
            pRec = newPAction(ioItem.loc);
            ioItem.rec = pRec; // Save this back to ioItem.
        }*/
        return {
        cons: IItemP,
        tag:'form', attr:{ action:"#" },
        addClass: 'com-untrix-ioItem',
        prop:{ 'data-iitem':true },
        ctx:{ io_bInp:true, w$:{iItem:'w$el'} },
        on:{ submit:IItemP.prototype.onSubmit },
        iface:{ ioItem:ioItem },
            children: [
            TButton.wdt,
            {tag:'input',
             attr:{ type:'text', value:u, placeholder:'Username', name:'u' },
             prop:{ required:true /*,disabled:(u?true:false)*/},
             //addClass:css_class_field+css_class_userIn,
             addClass: "input-large",
             ctx:{ w$:{u:'w$el' } },
             _iface:{ value: u }
            },
            {tag:'input', ref:'pwdField',
             attr:{ type:'password', value:p, placeholder:'Password', name:'p' },
             prop:{ required:true },
             //addClass:css_class_field+css_class_passIn,
             addClass: "input-large",
             ctx:{ w$:{p:'w$el'} },
             _iface:{ value: p },
            },
            VButton.wdt
            //,{tag:'a', attr:{ type:'submit', href:'#' } }
            ],
        _iface:{ w$ctx:{ u:'u', p:'p', tButton:'tButton' } }
        };
    };
    IItemP.prototype = w$defineProto (IItemP,
    {
        checkInput: {value: function()
        {
            var ioItem = this.ioItem,
                nU = this.u.el.value,
                oU = ioItem.rec ? ioItem.rec.u : undefined,
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
            var pRec = newPAction(ioItem.loc, Date.now(), nU, nP);
            saveRecord(pRec, dt_pRecord, function(resp)
            {
                var oRec;
                if (resp.result) {
                    oRec = ioItem.rec;
                    ioItem.rec = pRec;
                    if (oU && (nU !== oU)) {
                        MOD_CONNECT.sendDelActn(oRec, dt_pRecord, function(r){callback(resp);}, true);
                    }
                    else {
                        callback(resp);
                    }
                }
                else {
                    callback(resp);
                }
            }, true);
        }},
        onSubmit: {value: function(e)
        {
            BP_ERROR.log("IITemP.onSubmit invoked");
            this.tButton.toggle.apply(this.tButton,[e]);
            e.stopPropagation();
            e.preventDefault();
        }}
    });

    function OItemP ()
    {}
    OItemP.wdt = function (w$ctx)
    {
        var u, p, d,
            autoFill = w$ctx.autoFill,
            ioItem = w$ctx.ioItem,
            pRec = (ioItem && ioItem.rec) ? ioItem.rec:undefined;
        if (pRec)
        {
            u = pRec.u;
            p = pRec.p;
            d = new Date(pRec.tm);

            return {
            cons: OItemP,
            tag:'div',
            addClass: 'com-untrix-ioItem',
            prop:{ 'data-oitem':true },
            on:{ dblclick:OItemP.prototype.onDblClick },
            ctx:{ io_bInp:false, w$:{ oItem:'w$el' } },
                children:[
                //autoFill ? FButton.wdt : w$undefined,
                TButton.wdt,
                {tag:'span',
                 attr:{ draggable:true },
                 //addClass:css_class_field+css_class_userOut,
                 addClass: "input-large uneditable-input com-untrix-oItem",
                 text:u,
                 ctx:{ w$:{ u:'w$el' } },
                 _iface:{ fn:fn_userid, value:u }
                },
                {tag:'span', ref:'pwdField',
                 attr:{ draggable:true },
                 //addClass:css_class_field+css_class_passOut,
                 addClass: "input-large uneditable-input com-untrix-oItem",
                 text:'*****',
                 ctx:{ w$:{p:'w$el' } },
                 _iface:{ fn:fn_pass, value:p }
                },
                {tag:'span',
                 addClass: "input-medium uneditable-input",
                 text:d.toDateString()
                },
                VButton.wdt
                ],
            _iface:{ ioItem:ioItem, w$ctx:{ u:'u', p:'p', tButton:'tButton' } }
            };
        }
    };
    OItemP.prototype = w$defineProto (OItemP,
    {
        onDblClick: {value: function(e)
        {
            BP_ERROR.log("OITemP.onDblClick invoked");
            this.tButton.toggle.apply(this.tButton,[e]);
            e.stopPropagation();
            e.preventDefault();
        }}
    });

    /**
     * Settings/Options page link
     */
    /*function LinkButton(){}
    LinkButton.wdt = function (w$ctx)
    {
        var url = w$ctx.ioItem ? w$ctx.ioItem.url : undefined;

        return {
        tag: 'a',
        addClass: 'com-untrix-B',
        attr:{ href:url,
               target:"_blank", title:('Open page '+url) },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle', cursor:'auto' },
            addClass:'icon-globe'
            }]
        };
    };*/

    function IoItem () {}
    IoItem.wdi = function (w$ctx)
    {
        var acns=w$ctx.w$rec,
            rec = acns? acns.curr: undefined,
            loc = w$ctx.loc,
            panel = w$ctx.panel,
            bInp = w$ctx.io_bInp,
            url = (rec && rec.l) ? MOD_CONNECT.L.prototype.toURL.apply(rec.l) : undefined;
            //autoFill = panel.autoFill;
        return {
        cons: IoItem,
        tag:'div',
        //addClass: "span8",
        ctx:{ w$:{ ioItem:'w$el' } },
        iface: { 'acns':acns, 'rec':rec, 'loc':loc, 'url':url, 'panel':panel, 'bInp':bInp },
        on: {mousedown:stopPropagation},
            children:[
            //LinkButton.wdt,
            bInp ? IItemP.wdt : OItemP.wdt,
            DButton.wdt
            ],
         // save references to relevant objects.
         _iface:{ w$ctx:{oItem:"oItem", iItem:"iItem"} }
        };
    };
    IoItem.prototype = w$defineProto(IoItem, // same syntax as Object.defineProperties
    {
        toggleIO: {value: function()
        {
            var iI = this.iItem,
                oI = this.oItem,
                ctx={ioItem:this /*,autoFill:this.panel.autoFill*/},
                res,
                self = this;
            if (iI)
            { // Create output element
                res = iI.checkInput();
                if (res===undefined)
                {
                    this.oItem = w$exec(OItemP.wdt, ctx);
                    MOD_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
                    if (this.oItem) {
                        delete this.iItem; // only removes the object-prop
                        this.oItem.insertAfter(iI);
                        iI.destroy();
                        //this.append(this.oItem);
                        this.bInp = false;
                    }
                }
                else if (res === true)
                {
                    iI.saveInput(function(resp)
                    {
                        if (resp.result===true) {
                            self.panel.reload(true);
                        }
                        else {
                            BP_ERROR.warn(resp.err);
                            self.panel.reload(true);
                        }
                    });
                }
            }
            else if (oI)
            { // Create input element, destroy output element
                this.iItem = w$exec(IItemP.wdt, ctx);
                MOD_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
                if (this.iItem) {
                    delete this.oItem;
                    this.iItem.insertAfter(oI);
                    oI.destroy();
                    //this.append(this.iItem);
                    this.bInp = true;
                }
            }

            return Boolean(this.iItem);
        }},
        deleteRecord: {value: function()
        {
            var self = this,
                panel = this.panel;
            function handleResp(resp)
            {
                if (resp.result!==true) {
                    BP_ERROR.warn(resp.err);
                }
                else {self.destroy();}
            }

            if (this.rec) {
                MOD_CONNECT.sendDelActn(this.rec, dt_pRecord, handleResp, true);
            }
            else {
                self.destroy();
            }
        }}
    });

    function PanelList () {}
    PanelList.wdt = function (ctx)
    {
        var loc = ctx.loc,
            panel = ctx.panel,
            it = ctx.it,
            io_bInp = ctx.io_bInp;

        return {
        cons: PanelList,
        tag:'div',
        addClass: 'accordion-body accordion-inner',
        ctx:{ /*'io_bInp':io_bInp,*/ w$:{ itemList:'w$el' } },
        iface:{ loc:loc, panel:panel },
            iterate:{ it:it, wdi:IoItem.wdi },
        _iface:{ w$ctx:{ nB:'nB' } }
        };
    };
    PanelList.prototype = w$defineProto(PanelList,
    {
        newItem: {value: function()
        {
            //w$exec(IoItem.wdi, {io_bInp:true, loc:this.loc, panel:this.panel }).insertAfter(this.nB);
            w$exec(IoItem.wdi, { io_bInp:true, loc:this.loc, panel:this.panel }).prependTo(this);
        }}
    });

    // 'Panel'
    function DNodeWdl () {}
    DNodeWdl.wdi = function(w$ctx)
    {
        if (w$ctx.dt!==dt_pRecord) {
            BPError.logwarn("DNodeWdl.wdi&editwdl.js: bad dt-type passed in");
            return w$undefined;
        }

        var dNode = w$ctx.w$rec,
            dt = w$ctx.dt,
            dNIdx = w$ctx.w$i,
            bOpen = w$ctx.bOpen,
            emptyOk = w$ctx.emptyOk,
            recs, rIt, loc, H;

        recs = DNProto.getData.apply(dNode, [dt]);//dNode.getData(dt)
        // If this node has no data, then have it be skipped.
        if (!recs) {return w$undefined;}
        rIt = new MOD_CONNECT.ItemIterator(recs, true);
        if ((!emptyOk) && (!rIt.num())) {return w$undefined;}

        loc = MOD_COMMON.parseURL('http://' + dNode[DNODE_TAG.URL]);
        H = loc.hostname;

        return {
        cons:DNodeWdl, // w$el constructor
        tag:"div",
        attr:{ id:H },
        //css:{ display:'block', padding:5, 'margin-bottom':2 },
        addClass: "accordion-group com-untrix-dnode",
        // Post w$el creation steps.
        ctx:{ w$:{ panel:"w$el" }, loc:loc, it:rIt },// TODO: populate loc and rIt directly.
        // Copy props to the widget object for future use.
        // NOTE: rIt references MEMSTORE indirectly.
        iface:{ 'dt':dt, 'rIt':rIt, 'loc':loc,  w$:{ panel:"w$el" },
                dNIdx:dNIdx, isOpen:bOpen },

            // Create children
            children:[
            {tag:"div",
             addClass: "com-untrix-dnodeHead accordion-heading",
             on:{ click:function(e){this.panel.toggle(e);} },
             iface:{ w$ctx:{ panel:'panel' } },
                children:[
                //EButton.wdt,
                NButton.wdt,
                dNodeTitleText_wdt
                //DButton2.wdt // TODO: DButton2.onClick needs implementation.
                ]
            },
            bOpen ? PanelList.wdt : w$undefined
            ],

        // Post processing steps
        _iface:{ w$ctx:{itemList:'itemList', nB:'nB' } }
        };
    };
    DNodeWdl.prototype = w$defineProto(DNodeWdl, // Same syntax as Object.defineProperties
    {
        reload: {value: function(bOpen)
        {
            var l = newL(this.loc, this.dt),
                self = this;
            getDNode(l, this.dt, function (resp)
            {
                if (!resp.result) {callbackHandleError(resp); return;}

                var ctx = {
                        w$rec: resp.dN,
                        w$i: self.dNIdx,
                        dt: self.dt,
                        bOpen: bOpen
                    },
                    wel = w$exec(DNodeWdl.wdi, ctx);
                    MOD_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
                    if (wel) {
                        self.replaceWith(wel);
                    }
                    self.destroy();
            });
            BP_ERROR.log("DNode->reload invoked");
        }},
        createList: {value: function()
        {
            if (!this.itemList)
            {
                var panelList = w$exec(PanelList.wdt, {it:this.rIt, loc:this.loc, panel:this.panel});
                if (panelList && (panelList!==w$undefined))
                {
                    this.append(panelList);
                    this.itemList = panelList;
                }
            }
        }},
        toggle: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            if (this.itemList)
            {
                if (this.isOpen) {
                    this.setClosed();
                }
                else {
                    this.setOpen();
                }
            }
            else
            {
                this.createList();
                this.setOpen();
            }
        }},
        setOpen: {value: function()
        {
            this.itemList.show();
            this.nB.show();
            this.isOpen = true;

        }},
        setClosed: {value: function()
        {
            this.nB.hide();
            this.itemList.hide();
            this.isOpen = false;
        }}
    });

    function EditorWdl () {}
    EditorWdl.wdt = function (ctx)
    {
        var dnIt = ctx.dnIt;
        if (!ctx.bOpen) {ctx.bOpen = false;} // An undefined or null value implies no-op in case of '_final.show'.

        return {
        cons:EditorWdl,
        tag:"div",
        onTarget:{ dragstart:EditorWdl.prototype.handleDragStart,
                   drag:EditorWdl.prototype.handleDrag,
                   dragend:EditorWdl.prototype.handleDragEnd },
        attr:{ id:MOD_TRAITS.eid_pfx+'panel' },
        ctx:{ w$:{ editor:'w$el' } },

              iterate:{ it:dnIt, wdi:DNodeWdl.wdi }
        };
    };
    EditorWdl.prototype = w$defineProto(EditorWdl,
    {
        handleDragStart: {value: function handleDragStart (e)
        {   // CAUTION: 'this' is bound to e.target

            if ((!this) || (!this.fn)) { // Ignore if event didn't originate at an oItem
                return;
            }
            //BP_ERROR.loginfo("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = this.value;
            if (this.fn === fn_pass) {
                data = decrypt(this.value);
            }

            e.dataTransfer.items.add('', CT_BP_PREFIX + this.fn); // Keep this on top for quick matching later
            e.dataTransfer.items.add(this.fn, CT_BP_FN); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, CT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(w$exec(image_wdt,{imgPath:"/icons/icon48.png"}).el, 0, 0);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //BP_ERROR.log("handleDragStart:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
            //return true;
        }},
        handleDrag: {value: function handleDrag(e)
        {   // CAUTION: 'this' is bound to e.target
            if ((!this) || (!this.fn)) { // Ignore if event didn't originate at an oItem
                return;
            }
            //BP_ERROR.loginfo("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }},
        handleDragEnd: {value: function handleDragEnd(e)
        {   // CAUTION: 'this' is bound to e.target
            if ((!this) || (!this.fn)) { // Ignore if event didn't originate at an oItem
                return;
            }
            //BP_ERROR.loginfo("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }},
        newDNode: {value: function(site)
        {
            var loc = MOD_COMMON.parseURL('http://' + site),
                self = this;
            getDomain(loc, function(resp)
            {
                if (!resp) {return;}

                if (!resp.domn) {
                    resp = BP_ERROR.confirm('Unrecognized website ['+site+']. Are you sure you want to proceed?');
                    if (!resp) { return; }
                }

                var dNode = MEMSTORE.newDNode(site),
                    dt = dt_pRecord,
                    bOpen = true;

                dNode.makeRecsMap(dt_pRecord);

                var wel = w$exec(DNodeWdl.wdi, {w$rec:dNode, dt:dt, bOpen:bOpen, emptyOk:true});
                if (wel) {
                    self.prepend(wel);
                }
            });
        }},
        filter: {value: function(site)
        {
            //BP_ERROR.log("g_editor: filter invoked on " + site);
            var $coll = $('.com-untrix-dnode', this.el),
                $show = site ? $coll.filter('[id*="'+site.toLowerCase()+'"]') : $coll,
                $hide = site ? $coll.not($show) : $();

            $hide.hide();
            $show.show();

            return $show;
        }}
    });

    BP_ERROR.log("constructed mod_editor");
    return Object.freeze(
    {
        EditorWdl_wdt: EditorWdl.wdt
    });
}