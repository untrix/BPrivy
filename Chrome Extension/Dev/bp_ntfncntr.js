/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012-2013 Untrix Inc
 * All Rights Reserved
 */

/* JSLint directives */
/*global $, BP_MOD_PLAT, BP_GET_CONNECT, BP_GET_COMMON, IMPORT, IMPORT_LATER, localStorage,
  BP_GET_MEMSTORE, BP_GET_DBFS, BP_GET_FILESTORE, BP_GET_ERROR, BP_GET_TRAITS,
  BP_GET_CS_PLAT, BP_GET_PLAT, BP_GET_LISTENER, BP_GET_W$, BP_GET_WDL, chrome,
  BP_MAIN */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin NTNF_CNTR
 * This module manages end-user notifications UI.
 */
function BP_GET_NTNF_CNTR(g)
{   'use strict';
    var window = null, document = null, console = null,
        g_win = g.g_win;

    /** @import-module-begin */
    var BP_ERROR    = IMPORT(g.BP_ERROR),
        BPError     = IMPORT(BP_ERROR.BPError);
    var BP_COMMON   = IMPORT(g.BP_COMMON);
    var MEMSTORE    = IMPORT(g.BP_MEMSTORE);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_CONNECT  = IMPORT(g.BP_CONNECT),
        dt_pRecord  = IMPORT(BP_CONNECT.dt_pRecord);
    var BP_PLAT     = IMPORT(g.BP_PLAT);
    var BP_CS_PLAT  = IMPORT(g.BP_CS_PLAT);
    var BP_DBFS     = IMPORT(g.BP_DBFS);
    var DB_EVENTS   = IMPORT(BP_DBFS.EVENTS),
        DB_FS       = IMPORT(BP_DBFS.DB_FS);
    var MAIN_EVENTS = IMPORT_LATER(); // delayed import at init time.
    var BP_WIN      = IMPORT_LATER();

    /** @import-module-end **/

    /** @globals-begin */
    var g_notification;
    /** @globals-end **/

    function onClose(ev)
    {
        g_notification = null;
    }

    function close()
    {
        if (g_notification) {
            g_notification.close();
            g_notification = null;
        }
    }

    /*function create()
    {
        g_notification = BP_PLAT.notifications.createHTMLNotification(
          'bp_notification.html'  // html url - can be relative
        );
        g_notification.onerror = onClose;
        g_notification.onclose = onClose;
        g_notification.onclick = onClose;
        g_notification.show();
    }*/

    function notify(title, text, cbackFunc, timeout)
    {
        close();
        var iconPath = DB_FS.getDBPath() ? 'icons/icon48.png' : 'icons/greyIcon48.png',
            notificationOptions = {icon:BP_CS_PLAT.getURL(iconPath),
                                   body: text || ""};

/*
        g_notification = BP_PLAT.notifications.createNotification(
          BP_CS_PLAT.getURL(iconPath), // ICON URL
          title || "",
          text || ""
        );
*/
        g_notification = new g_win.Notification(title || "", notificationOptions);

        g_notification.onshow = function(ev)
        {   // close after a few seconds
            if (timeout) {
                g.g_win.setTimeout(close, timeout*1000);
            }
        };
        g_notification.onclose = onClose;
        g_notification.onclick = function(ev) {
            try {
                if (cbackFunc) { cbackFunc(ev); }
                close();
            }
            catch (e) {
                BP_ERROR.logwarn(e);
                close();
            }
        };
        //g_notification.show();
    }

    function onChange(ev)
    {
        /*if (!g_notification) {
            if (ev.detail.drec && ev.detail.drec.actn && ev.detail.drec.actn.a !== 'd') {
                create();
            }
        }*/
    }

    function onMainEvent(ev)
    {
        var eventType = ev.type,
            detail = ev.detail,
            site, n;

        switch(eventType)
        {
            case 'bp_boot_loaded':
                if ((!detail.tabId) || (!detail.loc.protocol) || (detail.loc.protocol.indexOf('http')!==0)) {
                    break;
                }
                else if (n=MEMSTORE.numTRecs(detail.loc, true)) {
                    BP_PLAT.showBadge({tabId:detail.tabId, title:"You have unsaved passwords. Click here to see them.",
                                        text:n.toString(),
                                        color:'#0F0'});
                }
                break;
            case 'bp_saved_temp':
                site = MEMSTORE.getSite(detail.loc, dt_pRecord);
                if (n=MEMSTORE.numTRecs(detail.loc, true))
                {
                    BP_WIN.iterTabs(function(tabInfo) {
                        BP_PLAT.showBadge({tabId:tabInfo.tabId,
                                            title:"You have unsaved passwords. Click here to see them.",
                                            text:n.toString(),
                                            color:'#0F0'});
                    }, site);
                }
                else {
                    BP_WIN.iterTabs(function(tabInfo){
                        BP_PLAT.removeBadge({tabId:tabInfo.tabId});
                    }, site);
                    // BP_PLAT.removeBadge({tabId:detail.tabId});
                }
                break;
        }
    }

    // is chrome specific.
    function onTabUpdated( tabId, changeInfo, tab )
    {
        if (DB_FS.getDBPath() && (changeInfo.url || (changeInfo.status==='loading'))) {
            //BP_ERROR.logdebug('onTabUpdated@MOD_WIN: tabId = ' + tabId + ' url = ' + changeInfo.url);
            // if the tab has navigated to another page, then delete all previous
            // data.
            var loc = BP_COMMON.parseURL(tab.url),
                n = MEMSTORE.numTRecs(loc, true);
            if (loc && n) {
                BP_PLAT.showBadge({tabId:tabId,
                                    title:"You have unsaved passwords. Click here to see them.",
                                    text:n.toString(),
                                    color:'#0F0'});
            }
        }
    }

    // function onFocus(ev)
    // {
        // if (ev.detail.frameUrl && ev.detail.tabId)
        // {
            // var loc = BP_COMMON.parseURL(ev.detail.frameUrl),
                // n = MEMSTORE.numTRecs(loc, true),
                // tabId = ev.detail.tabId;
            // if (n) {
                // BP_PLAT.showBadge({tabId:tabId,
                                    // title:"You have unsaved passwords. Click here to see them.",
                                    // text:n.toString(),
                                    // color:'#0F0'});
            // }
            // else {
                // BP_PLAT.removeBadge({tabId:tabId});
            // }
        // }
    // }

    function onLoadDB(ev)
    {
        BP_PLAT.setButton("icons/icon48.png");
        BP_PLAT.removeBadge();
        BP_WIN.iterTabs(function(tabInfo){
            BP_PLAT.removeBadge({tabId:tabInfo.tabId});
        });
    }

    function onUnloadDB(ev)
    {
        BP_PLAT.setButton("icons/greyIcon48.png");
        BP_PLAT.showBadge({text:'off', color:'#000'});
        BP_WIN.iterTabs(function(tabInfo){
            BP_PLAT.showBadge({tabId:tabInfo.tabId, text:'off', color:'#000'});
        });
    }

    function alert (str)
    {
        g_win.alert(str || "Something went wrong :(");
    }

    function confirm (str)
    {
        return g_win.confirm(str);
    }

    function prompt (msg)
    {
        return g_win.prompt(msg);
    }

    function init()
    {
        MAIN_EVENTS = IMPORT(BP_MAIN.EVENTS); // Delayed bind.
        BP_WIN = IMPORT(BP_MAIN.MOD_WIN); // Delayed bind.

        BPError.push('InitNotifications');
        // var scope = new BP_LISTENER.Scope('temp_' + dt_pRecord, dt_pRecord);
        // var cback = new BP_LISTENER.CallbackInfo(onChange);
        //MEMSTORE.Event.listen('bp_change', scope, cback);
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        //MAIN_EVENTS.listen('bp_boot_loaded', new BP_LISTENER.CallbackInfo(onMainEvent));
        MAIN_EVENTS.listen('bp_saved_temp', new BP_LISTENER.CallbackInfo(onMainEvent));
        DB_EVENTS.listen('loadDB', new BP_LISTENER.CallbackInfo(onLoadDB));
        DB_EVENTS.listen('unloadDB', new BP_LISTENER.CallbackInfo(onUnloadDB));
        MAIN_EVENTS.listen('unloadDB', new BP_LISTENER.CallbackInfo(onUnloadDB));
        //MAIN_EVENTS.listen('bp_on_focus', new BP_LISTENER.CallbackInfo(onFocus));
        BPError.pop();
    }

    return Object.freeze(
    {
        init: init,
        notify: notify,
        // User Prompts emitted from the background window so as to keep Google Chrome happy
        alert: alert,
        success: alert,
        confirm: confirm,
        prompt: prompt
    });
}
