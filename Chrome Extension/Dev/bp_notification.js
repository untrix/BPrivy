/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */
/*global IMPORT, chrome, webkitNotifications, BP_GET_ERROR, BP_GET_COMMON, BP_GET_TRAITS,
  BP_GET_MEMSTORE, BP_GET_W$, BP_GET_CONNECT, BP_GET_LISTENER */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin NOTIFICATIONS
 */
function BP_GET_NTFN_WDL(g)
{   'use strict';
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document;

    /** @import-module-begin */
    var BP_ERROR    = IMPORT(g.BP_ERROR);
    var BP_CONNECT  = IMPORT(g.BP_CONNECT),
        dt_pRecord  = IMPORT(BP_CONNECT.dt_pRecord);
    var BP_W$       = IMPORT(g.BP_W$),
        w$defineProto=IMPORT(BP_W$.w$defineProto);
    var BP_TRAITS   = IMPORT(g.BP_TRAITS),
        eid_pfx     = IMPORT(BP_TRAITS.eid_pfx),
        fn_site     = IMPORT(BP_TRAITS.fn_site),
        fn_userid   = IMPORT(BP_TRAITS.fn_userid),
        fn_pass     = IMPORT(BP_TRAITS.fn_pass);
    /** @import-module-end **/

    /** @globals-begin */
    var g_notification;

    /** @globals-end **/

    function TempPItems() {}
    function NtfnTitle() {}
    function IoItem() {}
    function FieldPass() {}
    function FieldUser() {}
    function FieldSite() {}
    function Field() {}
    function NoButton() {}
    function YesButton() {}
    function OffButton() {}
    function FilterSiteButton() {}
    function HomeButton() {}

    TempPItems.wdt = function (ctx)
    {
        var walker = ctx.walker;

        return {
        cons: TempPItems,
        tag:'div',
        attr:{ id:'com-untrix-panel' },
        ctx:{ w$:{ itemList:'w$el' } },
            children:[
            {tag:'div',
             attr:{ id:"com-untrix-panelTitle" },
                children:[
                {tag:'div',
                 attr:{ id:"com-untrix-panelTitleText" },
                 text:"Unsaved passwords"
                },
                HomeButton.wdt,
                OffButton.wdt
                ],

            },
            ],
            walk:{ walker:walker, wdi:IoItem.wdi },
        _final:{ show:true, appendTo:g_doc.body }
        };
    };
    TempPItems.prototype = w$defineProto(TempPItems,
    {
        reload: {value:function()
        {

        }}
    });

    NtfnTitle.wdt = function(ctx)
    {
        return {
        tag:'div'
        };
    };

    IoItem.wdi = function(w$ctx)
    {
        var actn = w$ctx.w$rec,
            u = actn.u,
            p = actn.p,
            H = actn.l.H;

        return {
        tag:'article',
        cons:IoItem,
        ctx:{ u:u, p:p, H:H },
        css:{ display:'block' },
        iface:{ actn:actn },
            children: [
            FieldSite.wdt,
            FieldUser.wdt,
            NoButton.wdt,
            FilterSiteButton.wdt,
            YesButton.wdt
            ],
        };
    };
    IoItem.prototype = w$defineProto(IoItem,
    {
        doDelete: {value:function(){BP_ERROR.logdebug('click');}},
        doSave: {value:function(){BP_ERROR.logdebug('click');}},
        filterSite: {value:function(){BP_ERROR.logdebug('click');}}
    });

    FieldPass.wdt = function(ctx, args)
    {
        args = args || {};
        args.fn = fn_pass;
        args.placeholder = 'Password';
        args.v = ctx.p;

        return Field.wdt(ctx, args);
    };
    FieldPass.prototype = w$defineProto(FieldPass,
    {

    }, Field.prototype);

    FieldUser.wdt = function(ctx, args)
    {
        args = args || {};
        args.fn = fn_userid;
        args.placeholder = 'Username';
        args.v = ctx.u;
        return Field.wdt(ctx, args);
    };
    FieldUser.prototype = w$defineProto(FieldUser,
    {

    }, Field.prototype);

    FieldSite.wdt = function(ctx, args)
    {
        args = args || {};
        args.fn = fn_site;
        args.placeholder = 'Site';
        args.v = ctx.H;
        return Field.wdt(ctx, args);
    };
    FieldSite.prototype = w$defineProto(FieldSite,
    {

    }, Field.prototype);

    Field.wdt = function(ctx, args)
    {
        // v = args.v,
        // placeholder = args.placeholder
        // value = args.v
        return {
        tag:'data',
        attr:{ type:'text', value:args.v, placeholder:args.placeholder },
        text: args.v,
        iface:{ fn:args.fn, value:args.v }
        };
    };
    Field.prototype = w$defineProto(Field,
    {

    });

    NoButton.wdt = function (w$ctx)
    {
        var item = w$ctx.item;
        return {
        cons: NoButton,
        html:'<button type="button"></button>',
        css:{ float:'right' },
        attr:{ title:'Do not save' },
        iface:{ item:item },
        on:{ click:NoButton.prototype.onClick },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-thumbs-down'
            }]
        };
    };
    NoButton.prototype = w$defineProto (NoButton,
    {
        onClick: {value: function click (e)
        {
            if (this.item) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                this.item.doDelete();
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });

    YesButton.wdt = function (w$ctx)
    {
        var item = w$ctx.item;
        return {
        cons: YesButton,
        html:'<button type="button"></button>',
        css:{ float:'right' },
        attr:{ title:'Save' },
        iface:{ item:item },
        on:{ click:YesButton.prototype.onClick },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-thumbs-up'
            }]
        };
    };
    YesButton.prototype = w$defineProto (YesButton,
    {
        onClick: {value: function click (e)
        {
            if (this.item) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                this.item.doSave();
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });

    FilterSiteButton.wdt = function (w$ctx)
    {
        var item = w$ctx.item;
        return {
        cons: FilterSiteButton,
        html:'<button type="button"></button>',
        css:{ float:'right' },
        attr:{ title:'Never for this site' },
        iface:{ item:item },
        on:{ click:FilterSiteButton.prototype.onClick },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-ban-circle'
            }]
        };
    };
    FilterSiteButton.prototype = w$defineProto (FilterSiteButton,
    {
        onClick: {value: function click (e)
        {
            if (this.item) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                this.item.filterSite();
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });

    OffButton.wdt = function (w$ctx)
    {
        var item = w$ctx.item;
        return {
        cons: OffButton,
        html:'<button type="button"></button>',
        css:{ float:'right' },
        attr:{ title:'Disable notifications. Auto save passwords' },
        iface:{ item:item },
        on:{ click:OffButton.prototype.onClick },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-off'
            }]
        };
    };
    OffButton.prototype = w$defineProto (OffButton,
    {
        onClick: {value: function click (e)
        {
            if (this.item) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                BP_ERROR.logdebug('click');
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });

    HomeButton.wdt = function (w$ctx)
    {
        var item = w$ctx.item;
        return {
        cons: HomeButton,
        html:'<button type="button"></button>',
        css:{ float:'right' },
        attr:{ title:'More info / details' },
        iface:{ item:item },
        on:{ click:HomeButton.prototype.onClick },
            children:[
            {tag:"i",
            css:{ 'vertical-align':'middle' },
            addClass:'icon-home'
            }]
        };
    };
    HomeButton.prototype = w$defineProto (HomeButton,
    {
        onClick: {value: function click (e)
        {
            if (this.item) {
                e.stopPropagation(); // We don't want the enclosing web-page to interefere
                e.preventDefault(); // Causes event to get cancelled if cancellable
                BP_ERROR.logdebug('click');
                return false; // Causes the event to be cancelled (except mouseover event).
            }
        }}
    });


    return Object.freeze(
    {
        tempPassWdt: TempPItems.wdt
    });
}

/**
 * @ModuleBegin MOD_PANEL
 */
(function()
{
    "use strict";
    // g => Global Env.
    var g = {
        g_win:window,
        g_console:console,
        g_chrome:chrome,
        //webkitNotifications: webkitNotifications,
        $:$, jQuery:jQuery
    };

    g.BP_CS_PLAT = chrome.extension.getBackgroundPage().BP_GET_CS_PLAT(g);
    var BP_CS_PLAT = IMPORT(g.BP_CS_PLAT);
    // Module object used within bp_main.html
    g.BP_MAIN = BP_CS_PLAT.getBackgroundPage().BP_MAIN;
    g.BP_PLAT = g.BP_MAIN.g.BP_PLAT;
    if (true) {
        g.BP_ERROR = BP_GET_ERROR(g);
        g.BP_COMMON = BP_GET_COMMON(g);
        g.BP_TRAITS = BP_GET_TRAITS(g);
        g.BP_CONNECT = BP_GET_CONNECT(g);
        g.BP_W$ = BP_GET_W$(g);
        g.BP_LISTENER = BP_GET_LISTENER(g);
    }
    else {
        g.BP_ERROR = g.BP_MAIN.g.BP_ERROR;
        g.BP_COMMON = g.BP_MAIN.g.BP_COMMON;
        g.BP_TRAITS = g.BP_MAIN.g.BP_TRAITS;
        g.BP_CONNECT = g.BP_MAIN.g.BP_CONNECT;
        g.BP_W$ = g.BP_MAIN.g.BP_W$;
        g.BP_LISTENER = g.BP_MAIN.g.BP_LISTENER;
    }
    g.BP_MEMSTORE= g.BP_MAIN.g.BP_MEMSTORE;
    g.BP_NTFN_WDL = BP_GET_NTFN_WDL(g);

    /** @Import-module-begin */
    var BP_W$ = IMPORT(g.BP_W$),
        w$exec = IMPORT(BP_W$.w$exec);
    var BP_MEMSTORE = IMPORT(g.BP_MEMSTORE);
    var BP_CONNECT = IMPORT(g.BP_CONNECT),
        dt_pRecord = IMPORT(BP_CONNECT.dt_pRecord);
    /** @import-module-end **/

    var walker = new BP_MEMSTORE.DataWalker(dt_pRecord, 'temp_'+dt_pRecord);
    w$exec(g.BP_NTFN_WDL.tempPassWdt, {walker:walker});
}());
