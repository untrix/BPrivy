/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global $, IMPORT */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Panel
 */
function BP_GET_WDL (g)
{   // NOTE: Requires g.g_win to be the target DOM window. Instantiate a fresh module
    // for the DOM window where you want to use this.
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m),
        encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault),
        newInherited = IMPORT(m.newInherited),
        addHandlers = IMPORT(m.addHandlers);
    /** @import-module-begin W$ */
    m = IMPORT(g.BP_W$);
    var w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        Widget = IMPORT(m.Widget),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin CSPlatform */
    m = g.BP_CS_PLAT;
    var BP_CS_PLAT = IMPORT(m),
        getURL = IMPORT(m.getURL);
    /** @import-module-begin Connector */
    m = g.BP_CONNECT;
    var newPAction = IMPORT(m.newPAction),
        BP_CONNECT = IMPORT(m);
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
        eid_pfx = IMPORT(m.eid_pfx),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    // Names used in the code. A mapping is being defined here because
    // these names are externally visible and therefore may need to be
    // changed in order to prevent name clashes with other libraries.
    // These are all merely nouns/strings and do not share a common
    // semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
    var eid_panel = eid_pfx+"panel"; // Used by panel elements
    var eid_panelTitle =eid_pfx+"panelTitle"; // Used by panel elements
    var eid_panelTitleText = eid_pfx+"TitleText";
    var eid_panelList =eid_pfx+"panelList"; // Used by panel elements
    var eid_ioItem = eid_pfx+"ioItem-";
    var eid_opElement = eid_pfx+'op-'; // ID prefix of an output line of panel
    var eid_userOElement = eid_pfx+"useridO-"; // ID Prefix used by panel elements
    var eid_passOElement = eid_pfx+"passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = eid_pfx+"useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = eid_pfx+"passI-"; // ID Prefix Used by panel elements
    var eid_inForm = eid_pfx+"iform-";
    var eid_tButton = eid_pfx+"tB-"; // ID prefix for IO toggle button
    var eid_xButton = eid_pfx+"xB"; // ID of the panel close button
    var eid_fButton = eid_pfx+"fB"; // ID of the fill fields button

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
    var css_class_nButton = "com-bprivy-nB ";
    var css_class_xButton = "com-bprivy-xB ";

    // Other Globals
    var g_loc = g_doc.location;
    var g_ioItemID = 0;
    var u_cir_s = '\u24E2';
    var u_cir_S = '\u24C8';
    var u_cir_e = '\u24D4';
    var u_cir_E = '\u24BA';
    var u_cir_F = '\u24BB';
    var u_cir_N = '\u24C3';
    var u_cir_X = '\u24CD';
    /** @globals-end **/

    function MiniDB(readOnly)
    {
        this.clear();
        // property 'readOnly' is enumerable:false, writable:false, configurable:false
        Object.defineProperty(this, 'readOnly', {value:readOnly}); //enumerable:false, writable:false, configurable:false
        //Object.defineProperty(this, 'site', {value:undefined, enumerable:true, writable:true, configurable:true});
        if (!readOnly) {
            BP_COMMON.bindProto(this, MiniDB.wProto);
        }
    }
    MiniDB.prototype = Object.freeze(
    {
        ingest: function(db, dbInfo, loc, site)
        {
            if (db)
            {
                this.empty();
                if (db.pRecsMap) {this.pRecsMap = db.pRecsMap;}
                if (db.tRecsMap) {this.tRecsMap = db.tRecsMap;}
                if (db.eRecsMapArray) {this.eRecsMapArray = db.eRecsMapArray;}
                if (this.pRecsMap) {this.numUserids = this.numRecs(this.pRecsMap);}
                else {this.numUserids = 0;}
                if (this.tRecsMap) {this.numUnsaved = this.numRecs(this.tRecsMap);}
                else {this.numUnsaved = 0;}
                if (dbInfo) {
                    if (dbInfo.dbName) {this.dbName = dbInfo.dbName;}
                    if (dbInfo.dbPath) {this.dbPath = dbInfo.dbPath;}
                }
                this.site = site;
            }
            else
            {
                this.clear();
            }
            this.loc = loc;
            //this.preventEdits();
        },
        ingestDT: function(recs, dt)
        {
            if (dt===dt_pRecord) {
                this.pRecsMap = recs;
                this.numUserids = this.numRecs(this.pRecsMap);
            }
            else if (dt===dt_eRecord) {
                this.eRecsMapArray = recs;
            }
        },
        ingestT: function(recs)
        {
            this.tRecsMap = recs;
            this.numUnsaved = this.numRecs(this.tRecsMap);
        },
        numRecs: function(recsMap)
        {
            var num = 0;
            BP_COMMON.iterKeys(recsMap, function(k, iHist)
            {
                if (!BP_CONNECT.itemDeleted(iHist)) { num++; }
            });
            return num;
        },
        clear: function ()
        {
            this.empty();
            this.preventEdits();
        },
        rmData: function ()
        {
            var k = this.eRecsMapArray;
            this.empty();
            this.eRecsMapArray = k;
            this.preventEdits();
        },
        empty: function ()
        {
            BP_COMMON.clear(this); // clears enumerable own properties
            this.eRecsMapArray = BP_COMMON.EMPTY_ARRAY;
            this.pRecsMap = BP_COMMON.EMPTY_OBJECT;
            this.tRecsMap = {}; //BP_COMMON.EMPTY_OBJECT;
            this.numUserids = this.numUnsaved = 0;
        },
        preventEdits: function ()
        {
            /*Object.defineProperties(this,
            {
                eRecsMapArray: {configurable:true, enumerable:true},
                pRecsMap: {configurable:true, enumerable:true},
                tRecsMap: {configurable:true, enumerable:true},
                dbName: {configurable:true, enumerable:true},
                dbPath: {configurable:true, enumerable:true},
                numUserids: {configurable:true, enumerable:true},
                numUnsaved: {configurable:true, enumerable:true}
            });*/
        },
        has: function (uid, considerAll)
        {
            // return (Object.keys(this.pRecsMap).indexOf(username) >=0) ||
                   // (Object.keys(this.tRecsMap).indexOf(username) >=0);            return (this.pRecsMap && this.pRecsMap[uid] && this.pRecsMap[uid].curr &&
                        (considerAll || (!BP_CONNECT.itemDeleted(this.pRecsMap[uid])))) ||
                   (this.tRecsMap && this.tRecsMap[uid] && this.tRecsMap[uid].curr &&
                        (considerAll || (!BP_CONNECT.itemDeleted(this.tRecsMap[uid])))) ;
        },
        had: function (uid) {return this.has(uid, true);},
        hasPass: function (pass)
        {
            var found = false;
            function checkPass(u, iHist) {if (iHist.curr.p===pass) {found=true; return true;}}
            if (!BP_COMMON.iterKeys(this.pRecsMap, checkPass)) {
                return BP_COMMON.iterKeys(this.tRecsMap, checkPass);
            }
            else { return true; }
        },
        matches: function (uid, pass)
        {
            return (this.pRecsMap && this.pRecsMap[uid] && (this.pRecsMap[uid].curr.p===pass)) ||
                   (this.tRecsMap && this.tRecsMap[uid] && (this.tRecsMap[uid].curr.p===pass)) ;
        }
    });
    // All functions that modify the recMaps should be kept outside the prototype
    // This is a fake prototype whose functions will be bound individually to every
    // writable object.
    MiniDB.wProto = Object.freeze(
    {
        saveTRec: function(rec)
        {   // Should be invoked with
            var d;
            if (this.tRecsMap) {
                d = this.tRecsMap[rec.u] || {};
                d.curr = rec;
                this.tRecsMap[rec.u] = d;
            }
            this.numUnsaved = this.numRecs(this.tRecsMap);
        },
        delTRec: function(rec)
        {
            if (this.tRecsMap && this.tRecsMap[rec.u]) {
                delete this.tRecsMap[rec.u];
            }
            --this.numUnsaved;
        }
    });

    function image_wdt(ctx)
    {
        var imgPath = ctx.imgPath;
        return {
            tag:"img",
            attrs:{ src:getURL(imgPath) }
        };
    }

    function cs_panelTitleText_wdt (ctx)
    {
        // uses ctx.dbName and ctx.dbPath and ctx.panel
        return {
            tag:"div",
            attr:{ id: eid_panelTitleText, title:ctx.dbPath },
            text: ctx.dbName || "No Keyring loaded",
            children: (ctx.dbName && ctx.site) ? [{tag:'div', text:('('+ctx.site+')'), css:{'font-weight':'normal'}}] : w$undefined
        };
    }

    function unsavedTitleText_wdt (ctx)
    {
        return {
            tag:"div",
            attr:{ id: eid_panelTitleText },
            css:{ display: 'block'},
            text: "Unsaved Passwords (Verify then Save)"
        };
    }

    function ShowButton () {}
    ShowButton.wdt = function (ctx)
    {
        return {
        cons: ShowButton,
        html:'<button type="button"></button>',
        attr:{ class:css_class_nButton + ' icon-chevron-down'},
        iface:{ panel:ctx.panel },
        on:{ 'click': ShowButton.prototype.onClick },
        css:{ width:'20px', float:'left' },
            /*children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass: 'icon-chevron-down'
            }],*/
        };
    };
    ShowButton.prototype = w$defineProto(ShowButton,
    {
        onClick: {value: function(ev)
        {
            var isVisible;

            ev.stopPropagation();
            ev.preventDefault();

            if (this.panel.itemList) {
                isVisible = this.panel.itemList.toggle();

                if (isVisible) {
                    this.removeClass('icon-chevron-down');
                    this.addClass('icon-chevron-up');
                }
                else {
                    this.removeClass('icon-chevron-up');
                    this.addClass('icon-chevron-down');
                }
            }
        }}
    });

    /**
     * New Item button
     */
    function NButton () {}
    NButton.prototype = w$defineProto(NButton,
    {
        newItem: {value: function ()
        {
            this.panel.itemList.newItem();
        }}
    });
    NButton.wdt = function (w$ctx)
    {
        return {
        cons: NButton,
        html:'<button type="button"></button>',
        attr:{ class:css_class_nButton, title:'New entry'},
        on:{ click:NButton.prototype.newItem },
        css:{ width:'20px', float:'left' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-plus'
            }],
        _iface:{ w$ctx:{ panel:'panel' } }
        };
    };

    /**
     * Home page link
     */
    function SButton(){}
    SButton.wdt = function (w$ctx)
    {
        var panel = w$ctx.panel;

        return {
        tag: 'a', cons:SButton,
        on:{ click:SButton.prototype.onClick },
        attr:{ 'class':css_class_xButton,
        	   href:'#',
        	   //href:BP_CS_PLAT.getURL("/bp_manage.html"),
               target:"_blank", title:'Home / Settings' },
        iface:{ panel:panel },
        css:{ width:'20px' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle', cursor:'auto' },
            addClass:'icon-home'
            }]
        };
    };
    SButton.prototype = w$defineProto(SButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.panel.openPath('/bp_manage.html');
        }}
    });

    /**
     * Edit Passwords link
     */
    function EButton(){}
    EButton.wdt = function (w$ctx)
    {
        var panel = w$ctx.panel;

        return {
        tag: 'a', cons:EButton,
        on:{ click:EButton.prototype.onClick },
        attr:{ 'class':css_class_xButton,
               href:'#',
               title:'See All Passwords' },
        iface:{ panel:panel },
        css:{ width:'20px' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle', cursor:'auto' },
            addClass:'icon-list'
            }]
        };
    };
    EButton.prototype = w$defineProto(EButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.panel.openPath('/bp_manage.html?action=edit');
        }}
    });
    /**
     * Open Wallet link
     */
    function OButton(){}
    OButton.wdt = function (w$ctx)
    {
        var panel = w$ctx.panel;

        return {
        tag: 'a',
        on:{ click:OButton.prototype.onClick },
        attr:{ 'class':css_class_xButton,
        	   href:'#',
               title:'(Re)Load Keyring' },
        iface:{ panel:panel },
        css:{ width:'20px' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle', cursor:'auto' },
            addClass:'icon-folder-open'
            }]
        };
    };
    w$defineProto(OButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            this.panel.openPath('/bp_manage.html?action=open');
        }}
    });

    /**
     * Close Wallet link
     */
    function CButton(){}
    CButton.wdt = function (w$ctx)
    {
        var panel = w$ctx.panel,
        	off = w$ctx.off;

        return {
        tag: 'a',
        on:{ click:CButton.prototype.onClick },
        attr:{ 'class':css_class_xButton,
        	   href:'#',
               title:'Unload Keyring' },
        iface:{ panel:panel, off:off },
        css:{ width:'20px' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle', cursor:'auto' },
            addClass:'icon-off'
            }]
        };
    };
    w$defineProto(CButton,
    {
        onClick: {value: function (e)
        {
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            try {
	            this.off(function ()
	            {
	                BP_ERROR.success('Keyring has been closed');
	            });
            }
            catch (ex) {
            	BP_ERROR.warn(ex);
            }
        }}
    });

    /**
     * Panel Dismiss/Close button - 'x' button
     */
    function XButton () {}
    XButton.wdt = function (w$ctx)
    {
        // make sure panel is captured into private closure, so we won't lose it.
        // values inside ctx will get changed as other wdls and wdts are executed.
        var panel = w$ctx.panel;

        return {
        cons: XButton,
        html:'<button type="button"></button>',
        css:{ float:'right', width:'20px' },
        attr:{ title:'Dismiss' },
        //attr:{ /*class:css_class_xButton,*/},
        //text:u_cir_X,
        on:{ click:XButton.prototype.x },
        iface:{ panel:panel },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-remove'
            }]
        };
    };
    XButton.prototype = w$defineProto (XButton,
    {
        x: {value: function click (e)
        {
            if (this.panel) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                this.panel.close();
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });

    /**
     * AutoFill button
     */
    function FButton(){}
    FButton.prototype =  w$defineProto(FButton,
    {
        onClick: {value: function(ev)
        {
            if (!this.ioItem.bInp) {
                this._autoFill(this.ioItem.oItem.u.value, this.ioItem.oItem.p.value);
            }
            else {
                this._autoFill(this.ioItem.iItem.u.value, this.ioItem.iItem.p.value);
            }
        }}
    });
    FButton.wdt = function(w$ctx)
    {
        var ioItem = w$ctx.ioItem,
            autoFill = ioItem.panel.autoFill,
            disabled = Boolean(!autoFill);
        return {
        cons: FButton,
        html:'<button type="button"></button>',
        attr:{ class:css_class_tButton, title:'auto fill', disabled:disabled },
        ctx:{ w$:{ fButton:"w$el" } },
        on:{ click:FButton.prototype.onClick },
        css:{ width:'20px', cursor: (disabled?'not-allowed':undefined) },
        iface:{ ioItem:ioItem, _autoFill:autoFill },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-arrow-left" + (disabled ? " icon-white" : "")
            }]
        };
    };

    function DButton () {}
    DButton.wdt = function(w$ctx)
    {
        var ioItem = w$ctx.ioItem;
        return {
        cons: DButton,
        html:'<button type="button"></button>',
        css:{ float:'right', width:'20px' },
        attr:{ title:'Delete password' },
        on:{ click:DButton.prototype.onClick },
        _iface:{ ioItem:ioItem },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:"icon-trash",
            }]
        };
    };
    DButton.prototype = w$defineProto(DButton,
    {
        onClick: {value: function(ev)
        {
            this.ioItem.deleteRecord();
        }}
    });

    function VButton () {}
    VButton.wdt = function(w$ctx)
    {
        return {
        cons: VButton,
        html:'<button type="button"></button>',
        css:{ float:'right', width:'20px' },
        attr:{ title:VButton.prototype.titleView },
        on:{ click:VButton.prototype.toggleView },
        iface:{ field:w$ctx.pwdField },
            children:[
            {tag:"i", ref:'icon',
            css:{ 'vertical-align':'middle' },
            addClass:"icon-eye-open"
            }],
        _cull:['icon']
        };
    };
    VButton.prototype = w$defineProto(VButton,
    {
        titleView: {value:'View password'},
        titleUnview: {value:'Hide password'},
        viewField: {value: function(ev)
        {
            if (!this.field) {return;}
            else {
                this.field.view();
                this.icon.removeClass('icon-eye-open');
                this.icon.addClass('icon-eye-close');
                this.el.title = this.titleUnview;
            }
        }},
        unViewField: {value: function(ev)
        {
            if (!this.field) {return;}
            else {
                this.field.unView();
                this.icon.removeClass('icon-eye-close');
                this.icon.addClass('icon-eye-open');
                this.el.title = this.titleView;
            }
        }},
        toggleView: {value: function(ev)
        {
            if (!this.field) {return;}
            if (this.field.viewing) { this.unViewField(); }
            else {this.viewField();}
        }}
    });

    function isValidInput(str) {return Boolean(str);}

    function TButton () {}
    TButton.wdt = function (w$ctx)
    {
        var bInp = w$ctx.io_bInp;
        return {
         cons: TButton,
         html:'<button type="submit">',
         attr:{ class:css_class_tButton, title:(bInp ? 'Submit' : 'Edit') },
         on:{ click:TButton.prototype.toggleIO2 },
         css:{ width:'20px' },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:bInp? "icon-ok" :"icon-pencil",
            ctx:{ w$:{icon:'w$el'} }
            }],
         _iface:{ w$ctx:{ ioItem:"ioItem", icon:'icon' } }
        };
    };
    TButton.prototype = w$defineProto(TButton,
    {
        toggleIO2: {value: function (ev)
        {
            var bInp = this.ioItem.toggleIO();
            if (bInp) {
                this.icon.removeClass('icon-pencil');
                this.icon.addClass('icon-ok');
                this.el.title = 'Submit';
            }
            else {
                this.icon.removeClass('icon-ok');
                this.icon.addClass('icon-pencil');
                this.el.title = 'Edit';
            }
        }}
    });

    function IItemP () {}
    IItemP.wdt = function (w$ctx)
    {
        var u, p, disableU,
        ioItem = w$ctx.ioItem,
        pRec = ioItem.rec,
        isTRec = ioItem.isTRec;

        if (pRec)
        {
            u = pRec.u;
            p = pRec.p;
        }
        /*else { // create a new pRec and save it back to ioItem.
            pRec = newPAction(ioItem.loc);
            ioItem.rec = pRec; // Save this back to ioItem.
        }*/

        disableU = Boolean(u&&(!isTRec));

        return {
        cons: IItemP,
        tag:'form',
        addClass:css_class_ioFields,
        attr:{ 'data-untrix':'true', action:"#" },
        ctx:{ w$:{iItem:'w$el'} },
        on:{ 'submit':IItemP.prototype.onSubmit },
        save:[ 'ioItem' ],
            children: [
            {tag:'input',
             attr:{ type:'text', value:u, placeholder:'Username', 'data-untrix':'true', tabindex:1 },
             prop:{ disabled:disableU, required:true, autofocus:(!disableU) },
             addClass:css_class_field+css_class_userIn,
             ctx:{ w$:{ u:'w$el' } },
             _iface:{ value: u }
            },
            {tag:'input', ref:'pwdField', save:['ioItem'],
             attr:{ type:'password', value:p, placeholder:'Password', 'data-untrix':'true', tabindex:2 },
             prop:{ required:true, autofocus:disableU },
             addClass:css_class_field+css_class_passIn,
             ctx:{ w$:{p:'w$el'} },
             //on:{ 'change':function(){this.ioItem.toggleIO();} },
             _iface:{ value: p },
            },
            VButton.wdt,
            TButton.wdt // submit button
            ],
        _iface:{ w$ctx:{ u:'u', p:'p' } },
        //_final:{show:true}
        };
    };
    IItemP.prototype = w$defineProto (IItemP,
    {
        onSubmit: {value: function(e){
            this.ioItem.toggleIO();
            e.stopPropagation();
            e.preventDefault();
        }},
        checkInput: {value: function()
        {
            var ioItem = this.ioItem,
                nU = this.u.el.value,
                nP = encrypt(this.p.el.value),
                isTRec = ioItem.isTRec,
                oU, oP;

            if (!isValidInput(nU) || !isValidInput(nP)) {
                return false; // inputs are invalid
            }

            if (isTRec) {
                // If this is a temporary-Rec, then the input must be saved if
                // valid.
                return true;
            }
            else
            {
                oU = ioItem.rec? ioItem.rec.u: undefined;
                oP = ioItem.rec? ioItem.rec.p: undefined;
                if ((nU !== oU) || (nP !== oP)) {
                    return true; // inputs are valid and different
                }
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
            // Save into the main store, not temp store. Therefore toTempStore should be false.
            ioItem.panel.saveRec(pRec, dt_pRecord, function(resp)
            {
                var oRec;
                if (resp.result && (!ioItem.isTRec)) {
                    oRec = ioItem.rec;
                    //ioItem.rec = pRec;
                    if (oU && (nU !== oU)) {
                        // This behaviour is blocked at a higher-level so we should never come here.

                        // If user edited the userid, then delete the old userid. This means
                        // that we loose history on that userid as well.
                        ioItem.panel.delRec(oRec, dt_pRecord, function(){callback(resp);}, false);
                    }
                    else {
                        callback(resp);
                    }
                }
                else {
                    callback(resp);
                }
            });
        }}
    });

    function OItemP () {}
    OItemP.wdt = function (w$ctx)
    {
        var u, p,
            //autoFill = w$ctx.autoFill,
            ioItem = w$ctx.ioItem,
            pRec = (ioItem && ioItem.rec) ? ioItem.rec:undefined;
        if (pRec) {
            u = pRec.u;
            p = pRec.p;

            return {
            cons: OItemP,
            tag:'div',
            attr:{ 'data-untrix':'true' },
            addClass:css_class_ioFields,
            on:{ dblclick:OItemP.prototype.onDblClick },
            ctx:{ w$:{ oItem:'w$el' } },
                children:[
                {tag:'data',
                 attr:{ draggable:'true', 'data-untrix':'true' },
                 addClass:css_class_field+css_class_userOut,
                 text:u,
                 ctx:{ w$:{ u:'w$el' } },
                 _iface:{ fn:fn_userid, value:u }
                },
                {tag:'data', ref:'pwdField',
                 attr:{ draggable:'true', 'data-untrix':'true' },
                 addClass:css_class_field+css_class_passOut,
                 text: p ? '*****' : '',
                 ctx:{ w$:{p:'w$el' } },
                 _iface:{ fn:fn_pass, value:p }
                },
                VButton.wdt,
                TButton.wdt
                ],
            _iface:{ ioItem:ioItem, w$ctx:{ u:'u', p:'p' } }
            //_final:{show:true}
            };
        }
    };
    OItemP.prototype = w$defineProto (OItemP,
    {
        onDblClick: {value: function(e)
        {
            //BP_ERROR.logdebug("OITemP.onDblClick invoked");
            this.ioItem.toggleIO();
            e.stopPropagation();
            e.preventDefault();
        }}

    });

    function IoItem () {}
    IoItem.wdi = function (w$ctx)
    {
        var iHist=w$ctx.w$rec,
            rec = iHist? iHist.curr: undefined,
            recLoc = (rec  && rec.l) ? BP_CONNECT.lToLoc(rec.l) : undefined,
            loc = recLoc || w$ctx.loc,
            panel = w$ctx.panel,
            bInp = w$ctx.io_bInp,
            autoFill = panel.autoFill,
            isNewItem = w$ctx.isNewItem,
            itemList = w$ctx.itemList,
            isTRec = w$ctx.isTRec;

        return {
        cons: IoItem,
        tag:'div',
        attr:{ class:css_class_li, 'data-untrix':'true' },
        ctx:{ w$:{ ioItem:'w$el' }, trash:IoItem.prototype.toggleIO },
        iface: { rec:rec, loc:loc, panel:panel, bInp:bInp, isTRec:isTRec,
                 isNewItem:isNewItem, itemList:itemList },
        on: {mousedown:stopPropagation}, // Needed to allow dragging.
            children:[
            FButton.wdt,
            //TButton.wdt,
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
                ctx={ioItem:this, autoFill:this.panel.autoFill},
                res,
                self = this,
                panel = this.panel;
            if (iI)
            { // Create output element
                ctx.io_bInp = false;
                res = iI.checkInput();
                if (res===undefined)
                {
                    this.oItem = w$exec(OItemP.wdt, ctx);
                    BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
                    if (this.oItem) {
                        delete this.iItem;
                        iI.destroy();
                        this.append(this.oItem);
                        this.bInp = false;
                    }
                }
                else if (res === true)
                {
                    iI.saveInput(function(resp)
                    {
                        if ((resp.result===true)) {

                            if (self.isTRec) {
                                // will destroy the self object.
                                self.deleteRecord();
                            }
                            panel.reload();
                        }
                        else {
                            BP_ERROR.warn(resp.err);
                            panel.reload();
                        }
                    });
                }
            }
            else if (oI)
            { // Create input element, destroy output element
                ctx.io_bInp = true;
                this.iItem = w$exec(IItemP.wdt, ctx);
                BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
                if (this.iItem) {
                    delete this.oItem; oI.destroy();
                    this.append(this.iItem);
                    this.bInp = true;
                }
            }

            return Boolean(this.iItem);
        }},
        deleteRecord: {value: function()
        {
            var self = this,
                panel = this.panel,
                isNewItem = this.isNewItem,
                itemList = this.itemList;
            function handleResp(resp)
            {
                if (resp.result!==true) {
                    BP_ERROR.warn(resp.err);
                }
                else {
                    self.destroy();
                    if (isNewItem) {
                        itemList.newItemCreated = false;
                    }
                }
            }

            if (!this.rec) {
                self.destroy();
                if (isNewItem) {
                    itemList.newItemCreated = false;
                }
            }
            else {
                if (!this.isTRec) {
                    self.panel.delRec(this.rec, dt_pRecord, handleResp);
                }
                else {
                    self.panel.delTempRec(this.rec, dt_pRecord, handleResp);
                }
            }
        }}
    });

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
             iterate:{ it:it, wdi:IoItem.wdi },
        //_final:{ show:false }
        };
    };
    // PanelList of temporary records.
    PanelList.wdt2 = function (ctx)
    {
        var loc = ctx.loc || g_loc,
            panel = ctx.panel,
            it2 = ctx.it2;
        return {
        cons: PanelList,
        tag:'div', attr:{ id:eid_panelList },
        onTarget:{ dragstart:PanelList.prototype.handleDragStart,
         drag:PanelList.prototype.handleDrag,
         dragend:PanelList.prototype.handleDragEnd },
        ctx:{ io_bInp:true, w$:{ itemList2:'w$el' }, isTRec:true },
        iface:{ loc:loc, panel:panel, isTRec:true },
             iterate:{ it:it2, wdi:IoItem.wdi },
        //_final:{ show:false }
        };
    };
    PanelList.prototype = w$defineProto(PanelList,
    {
        handleDragStart: {value: function handleDragStart (e)
        {   // CAUTION: 'this' is bound to e.target

            //BP_ERROR.loginfo("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = this.value;
            if (this.fn === fn_pass) {
                data = decrypt(this.value);
            }

            e.dataTransfer.items.add('', CT_BP_PREFIX + this.fn); // Keep this on top for quick matching later
            e.dataTransfer.items.add(this.fn, CT_BP_FN); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, CT_TEXT_PLAIN); // Keep this last
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //BP_ERROR.logdebug("handleDragStart:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
            //return true;
        }},
        handleDrag: {value: function handleDrag(e)
        {   // CAUTION: 'this' is bound to e.target
            //BP_ERROR.loginfo("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }},
        handleDragEnd: {value: function handleDragEnd(e)
        {   // CAUTION: 'this' is bound to e.target
            //BP_ERROR.loginfo("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }},
        newItem: {value: function()
        {
            if ((!this.isTRec) && (!this.newItemCreated)) {
                var ctx = BP_COMMON.copy2(this.panel.origCtx, {});
                BP_COMMON.copy2({io_bInp:true, loc:this.loc, panel:this.panel, itemList:this, isNewItem:true }, ctx);
                w$exec(IoItem.wdi, ctx).appendTo(this);
                this.newItemCreated = true;
            }
        }}
    });

    function Panel () {}
    Panel.wdt = function(ctx)
    {
        var loc = ctx.loc || g_loc,
            reload = ctx.reload,
            autoFill = ctx.autoFill,
            onClosed = ctx.onClosed,
            it2 = ctx.it2,
            saveRec = ctx.saveRec,
            delRec = ctx.delRec,
            delTempRec = ctx.delTempRec,
            origCtx = BP_COMMON.copy2(ctx, {}),
            dbName = ctx.dbName,
            showRecs = (UI_TRAITS.getTraits(dt_pRecord).showRecs(loc)&&dbName),
            popup = ctx.popup,
            openPath = ctx.openPath,
            onBlur = ctx.onBlur,
            off = ctx.off;

        //BP_ERROR.logdebug('In panel.wdt. showRecs = ' + showRecs);
        return {
        cons:Panel,
        tag:"article",
        attr:{ id:eid_panel, 'data-untrix':'true'/*, tabindex:-1*/ },
        css: popup ? {border:"none"} : { position:'fixed', top:'0px', right:'0px', padding:'4px', 'border-radius':'4px'},
        // Post w$el creation steps
        ctx:{ w$:{ panel:"w$el" }, loc:loc },
        //on:{ 'blur': onBlur },
        iface:{ reload:reload, id:eid_panel, autoFill:autoFill, onClosed:onClosed,
                saveRec:saveRec, delRec:delRec, delTempRec:delTempRec, origCtx:origCtx,
                openPath:openPath },

            // Create children
            children:[
            {tag:"div",
             attr:{ id:eid_panelTitle },
             css:{ cursor:(popup?'auto':'move')},
                children:[
                //showRecs ? ShowButton.wdt : w$undefined,
                showRecs ? NButton.wdt : w$undefined,
                cs_panelTitleText_wdt,
                XButton.wdt,
                ctx.dbName? EButton.wdt: w$undefined,
                ctx.dbName? CButton.wdt: w$undefined,                OButton.wdt,
                SButton.wdt
                ]
            },
            showRecs ? PanelList.wdt : w$undefined,
            it2.num() ? unsavedTitleText_wdt : w$undefined,
            showRecs ? PanelList.wdt2 : w$undefined],

        // Post processing steps
        _iface:{ w$:{}, w$ctx:{ itemList:'itemList', itemlist2:'itemlist2' } },
        _final:{
            appendTo:g_doc.body,
            show:true,
            exec: popup ? undefined : Panel.prototype.makeDraggable
            }
        };
    };
    w$defineProto( Panel, // same syntax as Object.defineProperties
    {
        makeDraggable: {value: function(ctx, w$)
        {
            // Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
            // by setting position:relative. Also we cant use right:0px here because draggable() does not like it.
            // Hence we need to calculate the left value :(
            // var panelW = this.$().outerWidth() || 300;
            // var winW = g_doc.body.clientWidth || $(g_doc.body).innerWidth();
            // var left = (winW-panelW);
            // left = (left>0)? left: 0;
            // this.$().css({position: 'fixed', top: '0px', 'left': left + "px"});
            this.$().draggable();
        }},
        close: {value: function()
        {
            var _onClosed = this.onClosed;
            this.destroy();
            _onClosed();
        }}
    });

    var iface =
    {
       MiniDB: MiniDB,
       cs_panel_wdt: Panel.wdt
    };

    BP_ERROR.logdebug("constructed mod_wdl");
    return Object.freeze(iface);
}
