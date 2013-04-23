/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012-2013 Untix Inc
 * All Rights Reserved
 */

/* JSLint directives */
/*global $, BP_MOD_PLAT, BP_GET_CONNECT, BP_GET_COMMON, IMPORT, IMPORT_LATER, localStorage,
  BP_GET_MEMSTORE, BP_GET_DBFS, BP_GET_FILESTORE, BP_GET_ERROR, BP_GET_TRAITS,
  BP_GET_CS_PLAT, BP_GET_PLAT, BP_GET_LISTENER, BP_GET_W$, BP_GET_WDL, chrome,
  webkitNotifications, BP_MAIN */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin NTNF_CNTR
 * This module manages end-user notifications UI.
 */
function BP_GET_NTNF_CNTR(g)
{   'use strict';
    var window = null, document = null, console = null;

    /** @import-module-begin */
    var BP_ERROR    = IMPORT(g.BP_ERROR),
        BPError     = IMPORT(BP_ERROR.BPError);
    var BP_COMMON   = IMPORT(g.BP_COMMON);
    var MEMSTORE    = IMPORT(g.BP_MEMSTORE);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_CONNECT  = IMPORT(g.BP_CONNECT),
        dt_pRecord  = IMPORT(BP_CONNECT.dt_pRecord);
    var BP_PLAT     = IMPORT(g.BP_PLAT);
    var BP_CS_PLAT	= IMPORT(g.BP_CS_PLAT);
    var MAIN_EVENTS  = IMPORT_LATER(); // delayed import at init time.

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
			g_notification.cancel();
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

    function notify(title, text, cbackFunc)
    {
    	close();

        g_notification = BP_PLAT.notifications.createNotification(
          BP_CS_PLAT.getURL('icons/icon48.png'), // ICON URL
          title || "",
          text || ""
        );
        g_notification.ondisplay = function(ev)
        {	// close after a few seconds
        	g.g_win.setTimeout(close, 10000);
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
        g_notification.show();
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
            detail = ev.detail;

        switch(eventType)
        {
            case 'bp_boot_loaded':
                if (!detail.loc.protocol || (detail.loc.protocol.indexOf('http')!==0)) {break;}
                if (MEMSTORE.numTRecs(detail.loc, true)) {
                    BP_PLAT.showBadge({tabId:detail.tabId, title:"You have unsaved passwords. Click here to see them.", text:'save'});
                }
                break;
            case 'bp_saved_temp':
                if (MEMSTORE.numTRecs(detail.loc, true)) {
                    BP_PLAT.showBadge({tabId:detail.tabId, title:"You have unsaved passwords. Click here to see them.", text:'save'});
                }
                else {
                    BP_PLAT.removeBadge({tabId:detail.tabId});
                }
                break;
        }
    }

    // is chrome specific.
    function onTabUpdated( tabId, changeInfo, tab )
    {
        if (changeInfo.url || (changeInfo.status==='loading')) {
            //BP_ERROR.logdebug('onTabUpdated@MOD_WIN: tabId = ' + tabId + ' url = ' + changeInfo.url);
            // if the tab has navigated to another page, then delete all previous
            // data.
            var loc = BP_COMMON.parseURL(tab.url);
            if (loc && MEMSTORE.numTRecs(loc, true)) {
                    BP_PLAT.showBadge({tabId:tabId, title:"You have unsaved passwords. Click here to see them.", text:'save'});
                }
        }
    }

    function init()
    {
        MAIN_EVENTS = IMPORT(BP_MAIN.EVENTS); // Delayed bind.

        BPError.push('InitNotifications');
        // var scope = new BP_LISTENER.Scope('temp_' + dt_pRecord, dt_pRecord);
        // var cback = new BP_LISTENER.CallbackInfo(onChange);
        //MEMSTORE.Event.listen('bp_change', scope, cback);
        chrome.tabs.onUpdated.addListener(onTabUpdated);
        //MAIN_EVENTS.listen('bp_boot_loaded', new BP_LISTENER.CallbackInfo(onMainEvent));
        MAIN_EVENTS.listen('bp_saved_temp', new BP_LISTENER.CallbackInfo(onMainEvent));
    }

    return Object.freeze(
    {
        init: init,
        notify: notify
    });
}
var BP_PLUGIN;
/** @globals-end */

var BP_MAIN = (function()
{
    "use strict";
    var g = {g_win:window,
             g_console:console,
             g_chrome:chrome,
             webkitNotifications: webkitNotifications,
             $:$,
             jQuery:jQuery},
        g_doc = document,
        g_win = window;

    g.BP_CONFIG = BP_CONFIG;
    g.BP_ERROR = BP_GET_ERROR(g);
    g.BP_COMMON = BP_GET_COMMON(g);
    g.BP_TRAITS = BP_GET_TRAITS(g);
    g.BP_PLAT = BP_GET_PLAT(g);
    g.BP_LISTENER = BP_GET_LISTENER(g);
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    g.BP_CONNECT = BP_GET_CONNECT(g);
    g.BP_MEMSTORE = BP_GET_MEMSTORE(g);
    g.BP_DBFS = BP_GET_DBFS(g);
    g.BP_FILESTORE = BP_GET_FILESTORE(g);
    g.BP_NTFN_CNTR= BP_GET_NTNF_CNTR(g);
    // These are for use by panel.js, they are not used by bp_main.js
    //g.BP_W$ = BP_GET_W$(g);
    //g.BP_WDL = BP_GET_WDL(g);

    /** @import-module-begin MainPlatform */
    var m = g.BP_PLAT,
        BP_PLAT = IMPORT(m);
    var registerMsgListener = IMPORT(m.registerMsgListener);
    /** @import-module-begin **/
    var BP_CS_PLAT = g.BP_CS_PLAT;
    /** @import-module-begin **/
    m = g.BP_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-begin Connector */
    m = g.BP_CONNECT;
    var BP_CONNECT = IMPORT(g.BP_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var cm_loadDB = IMPORT(m.cm_loadDB);
    var cm_mergeInDB = IMPORT(m.cm_mergeInDB);
    var cm_createDB = IMPORT(m.cm_createDB);
    var cm_getDBPath = IMPORT(m.cm_getDBPath);
    /** @import-module-begin MemStore */
    m = g.BP_MEMSTORE;
    var MEMSTORE = IMPORT(m),
        MOD_ETLD = IMPORT(m.MOD_ETLD);
    var FILE_STORE = IMPORT(g.BP_FILESTORE);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = g.BP_ERROR.BPError,
        Activity = g.BP_ERROR.Activity;
    /** @import-module-begin */
    var DBFS = IMPORT(g.BP_DBFS);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_NTFN_CNTR = IMPORT(g.BP_NTFN_CNTR);
    /** @import-module-end **/    m = null;

    var MOD_WIN,    // defined later.
        EVENTS = BP_LISTENER.newListeners(),
        g_forms = {}; // Form submissions to watch for

    /**
     * Invoked when a new record - eRec or pRec - is generated by the user. This is not
     * invoked for bulk-loads like loadDB, importCSV or mergeDB.
     * @param {Object} rq Request received from BP_CONNECT
     */
    function insertNewRec(rec, dt)
    {
        var res, dr, root, dnode;

        if (!DBFS.getDBPath()) {throw new BPError("", 'UserError', 'NoDBLoaded');}

        switch (dt)
        {
            case dt_eRecord:
            case dt_pRecord:
                dr = MEMSTORE.insertRec(rec, dt);
                if (dr) {
                    res = true;
                    if (MEMSTORE.DT_TRAITS.getTraits(dt).toPersist(dr.notes) &&
                        FILE_STORE.UC_TRAITS.insertNewRec.toPersist(dr.notes))
                    {
                        res = FILE_STORE.insertRec(rec, dt);
                    }
                }
                break;
            default: // do nothing
        }

        return res ? dr : undefined;
    }

    function makeDashResp(result)
    {
        return {
            result: result,
            dbName:DBFS.getDBName(),
            dbPath:DBFS.getDBPath(),
            dbStats:DBFS.getDBStats(),
            memStats:MEMSTORE.getStats()
        };
    }

    function getRecs (loc, callback)
    {
        var recs, resp={loc:loc};
        recs = MEMSTORE.getRecs(loc);
        resp.dbInfo = {
            dbName : DBFS.getDBName(),
            dbPath : DBFS.getDBPath()
        };
        resp.db = recs;
        resp.result = true;
        if (callback) {
            callback(resp);
        }
        return resp;
    }

    function saveRecord(rec, dt, callback, dontGet, _/*tabId*/)
    {
        var dr, resp, recs;
        dr = insertNewRec(rec, dt);
        if (dr && (!dontGet)) {
            recs = MEMSTORE.getDTRecs(BP_CONNECT.lToLoc(rec.l), dt);
        }
        resp = {result:Boolean(dr), recs:recs};
        if (callback) {callback(resp);}

        if (dr) { // event trigger
            MEMSTORE.Event.trigger(dr);
        }
        return resp;
    }

    function saveTempRec(rec, dt, callback, dontGet, tabId)
    {
        var notes, result, resp, recs, loc, dr, dnode, root;
        if (DBFS.getDBPath())
        {
            dr = MEMSTORE.insertTempRec(rec, dt);
            loc = BP_CONNECT.lToLoc(rec.l);
            if (!dontGet) {
                recs = MEMSTORE.getTRecs(loc);
            }
            result = true;
        }
        else {result = false;}
        resp = {result:result, recs:recs};
        if (callback) {callback(resp);}
        if (dr) { // event trigger
            EVENTS.dispatch('bp_saved_temp', {tabId:tabId, loc:loc});
            MEMSTORE.Event.trigger(dr);
        }
        return resp;
    }

    function sendDelActn(_rec, dt, callback, dontGet, toTemp, tabId)
    {
        var del = BP_CONNECT.getDTProto(dt).newDelActn.apply(_rec);
        //BP_ERROR.logdebug('Producing Delete Action' + (toTemp?' to temp: ':': ') + JSON.stringify(del));
        if (toTemp) {
            saveTempRec(del, dt, callback, dontGet, tabId);
        }
        else {
            saveRecord(del, dt, callback, dontGet, tabId);
        }
    }

    function getDBPath(callback)
    {
        var resp = makeDashResp(true),
            dbPath = DBFS.getDBPath();

        if (callback) {callback(resp);}
        return resp;
    }

    function onBefReq(details)
    {
        if (g_forms[details.url]) {
            window.alert("onBefReq: " + details.url);
            //delete g_forms[details.url];
        }
        // else {
            // BP_ERROR.logdebug("onBefReq: " + details.url);
        // }
    }

    function unloadDB(clearCrypt, cback)
    {
    	BPError.push("UnloadDB");
        FILE_STORE.unloadDB(clearCrypt);
        if (cback) { cback(); }
    }

    function off(cback)
    {
        unloadDB(true);
        BP_PLAT.closeAll(g_win);
        if (cback) { cback(); }
    }

    function onRequest(rq, sender, funcSendResponse)
    {
        var result, recs, dbPath, dbStats, fnames, notes,
            cm = rq.cm,
            bSaveRec;
        //BP_ERROR.loginfo("onRequest: " + cm + (rq.dt ? (" dt="+rq.dt) : ""));

        rq.atvt ? (BPError.atvt = new Activity(rq.atvt)) : (BPError.atvt = new Activity("BPMain::OnRequest"));

        try  {
            switch (cm) {
                case BP_CONNECT.cm_saveRec:
                    BPError.push("SaveRecord" + rq.dt);
                    bSaveRec = true;
                    saveRecord(rq.rec, rq.dt, funcSendResponse, rq.dontGet, sender.tab.id);
                    break;
                case BP_CONNECT.cm_tempRec:
                    BPError.push("SaveTempRecord" + rq.dt);
                    saveTempRec(rq.rec, rq.dt, funcSendResponse, rq.dontGet, sender.tab.id);

                    break;
                case 'cm_bootLoaded':
                    BPError.push("CSBootLoaded");
                    //BP_PLAT.showPageAction(sender.tab.id);
                    //funcSendResponse({result:true, cm:((MEMSTORE.numTRecs(rq.loc, true)) ? 'cm_loadDll' : undefined) });
                    funcSendResponse({result:true});
                    EVENTS.dispatch('bp_boot_loaded', {tabId:sender.tab.id, loc:rq.loc});
                    break;
                case cm_getRecs:
                    BPError.push("GetRecs");
                    //chrome.pageAction.show(sender.tab.id);
                    funcSendResponse(getRecs(rq.loc));
                    break;
                case cm_loadDB:
                    BPError.push("LoadDB");
                    dbPath = FILE_STORE.loadDB(rq.dbPath, rq.keyPath, rq.k);
                    funcSendResponse(makeDashResp(Boolean(dbPath)));
                    break;
                case BP_CONNECT.cm_deleteDB:
                    BPError.push("DeleteDB");
                    result = FILE_STORE.deleteDB(rq.dbPath);
                    funcSendResponse({result:result});
                    break;
                case BP_CONNECT.cm_unloadDB:
                    unloadDB(rq.clearCrypt);
                    funcSendResponse(makeDashResp(true));
                    break;
                case BP_CONNECT.cm_off:
                    off();
                    funcSendResponse(makeDashResp(true));
                    break;
                case BP_CONNECT.cm_mergeInDB:
                    BPError.push("MergeInDB");
                    result = FILE_STORE.mergeInDB(rq.dbPath, rq.keyPath, rq.k);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_mergeOutDB:
                    BPError.push("MergeOutDB");
                    result = FILE_STORE.mergeOutDB(rq.dbPath, rq.keyPath, rq.k);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_mergeDB:
                    BPError.push("MergeDB");
                    result = FILE_STORE.mergeDB(rq.dbPath, rq.keyPath, rq.k);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_compactDB:
                    BPError.push("CompactDB");
                    dbPath = FILE_STORE.compactDB();
                    funcSendResponse(makeDashResp(Boolean(dbPath)));
                    break;
                case BP_CONNECT.cm_cleanDB:
                    BPError.push("CleanDB");
                    dbStats = FILE_STORE.cleanLoadDB();
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_createDB:
                    BPError.push("CreateDB");
                    dbPath = FILE_STORE.createDB(rq.dbName, rq.dbDir, rq.keyDirOrPath, rq.k, rq.option);
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_getDBPath:
                    BPError.push("GetDBPath");
                    funcSendResponse(getDBPath());
                    break;
                case BP_CONNECT.cm_importCSV:
                    BPError.push("ImportCSV");
                    result = FILE_STORE.importCSV(rq.dbPath, rq.obfuscated);
                    funcSendResponse(makeDashResp(result));
                    break;
                case BP_CONNECT.cm_exportCSV:
                    BPError.push("ExportCSV");
                    fnames = FILE_STORE.exportCSV(rq.dirPath, rq.obfuscated);
                    funcSendResponse({result: (fnames.length>0), 'fnames':fnames});
                    break;
                case BP_CONNECT.cm_getDB:
                    BPError.push("GetDB");
                    funcSendResponse({result:true, dB:MEMSTORE.getDB(rq.dt)});
                    break;
                case BP_CONNECT.cm_getDN:
                    BPError.push("GetDNode");
                    funcSendResponse({result:true, dN:MEMSTORE.getDNode(rq.l, rq.dt)});
                    break;
                case BP_CONNECT.cm_getDomn:
                    BPError.push("GetDomain");
                    funcSendResponse({result:true, domn:MOD_ETLD.getDomain(rq.loc)});
                    break;
                case BP_CONNECT.cm_closed:
                    BPError.push("PanelClosed");
                    funcSendResponse({result:true});
                    break;
                case "form":
                    BPError.push("FormSubmit");
                    BP_ERROR.logdebug("Form Submitted: " + JSON.stringify(rq.form));
                    try
                    {
                        // Needed because the page would've reloaded by now and therefore
                        // we'll get a invalid-port exception.
                        funcSendResponse({result:true});
                    }
                    catch (err) {BP_ERROR.logwarn(err);}
                    break;
                // case "watchF":
                    // BPError.push("WatchForm");
                    // BP_ERROR.logdebug("Watching Form: "+rq.url);
                    // g_forms[rq.url] = true;
                    // break;
                case 'cm_onFocus':
                    BPError.push("cmOnFocus");
                    rq.tabId = sender.tab.id;
                    EVENTS.dispatch('bp_on_focus', rq);
                    //BP_ERROR.logdebug('onRequest@bp_main.js received ' + cm + ": " + JSON.stringify(rq));
                    break;
                case 'cm_onUnload':
                    BPError.push("cmOnUnload");
                    rq.tabId = sender.tab.id;
                    EVENTS.dispatch('bp_on_unload', rq);
                    //BP_ERROR.logdebug('onRequest@bp_main.js received ' + cm + ": " + JSON.stringify(rq));
                    break;
                case 'cm_autoFillable':
                	BPError.push("cmAutoFillable");
                    rq.tabId = sender.tab.id;
                    EVENTS.dispatch('bp_autoFillable', rq);
                    //BPError.push("cmOnFocus");
                    //BP_ERROR.logdebug('onRequest@bp_main.js received ' + cm + ": " + JSON.stringify(rq));
                    break;
                case 'cm_openPath':
                	BPError.push("cmOpenPath");
                    MOD_WIN.openPath(rq.path);
                    break;
                default: // do nothing
            }
        }
        catch (err)
        {
            BP_ERROR.logwarn(err);
            if (bSaveRec) {FILE_STORE.unloadDB();} // Seems that we lost DB-connection
            var resp = makeDashResp(false);
            resp.err = new BPError(err);
            funcSendResponse(resp);
        }
    }

    /**
     * @defun-mod MOD_WIN
     */
    MOD_WIN = (function()
    {
        var g_tabs = {},
        	MAIN_EVENTS = EVENTS;

        function makeTabInfo(tabId)
        {
            if (!tabId) {return;}
            if (!g_tabs[tabId]) {
                g_tabs[tabId] = {
                    lastFocused: undefined,
                    autoFillable: {}
                };
            }
            return g_tabs[tabId];
        }
        function clickReq (url)
        {
            //return getRecs(BP_COMMON.parseURL(url));
            return {cm: BP_CONNECT.cm_clickBP};
        }

        function clickResp (url)
        {}

        function onTabRemoved( tabId )
        {
            //BP_ERROR.logdebug('onTabRemoved@MOD_WIN: tabId = ' + tabId );
            delete g_tabs[tabId];
        }

        // is chrome specific.
        function onTabUpdated( tabId, changeInfo, tab )
        {
            if (changeInfo.url || (changeInfo.status==='loading')) {
                //BP_ERROR.logdebug('onTabUpdated@MOD_WIN: tabId = ' + tabId + ' url = ' + changeInfo.url);
                // if the tab has navigated to another page, then delete all previous
                // data.
                delete g_tabs[tabId];
            }
        }

        function onFocus(ev)
        {
            var tabInfo = makeTabInfo(ev.detail.tabId);
            //BP_ERROR.logdebug('onFocus@MOD_WIN: ' + JSON.stringify(ev.detail));
            if (tabInfo) {tabInfo.lastFocused = ev.detail;}
        }

        function onUnload(ev)
        {
            //BP_ERROR.logdebug('onUnload@MOD_WIN: ' + JSON.stringify(ev.detail));
            if (ev.detail.isTopLevel) {
                delete g_tabs[ev.detail.tabId];
            }
            else {
                if (g_tabs[ev.detail.tabId]) {
                    delete g_tabs[ev.detail.tabId].autoFillable[ev.detail.frameUrl];
                }
            }
        }

        function onAutoFillable(ev)
        {
            // tabId, autoFillable, frameUrl
            var tabInfo = makeTabInfo(ev.detail.tabId);

            if (tabInfo && ev.detail.frameUrl) {
                if (ev.detail.autoFillable) {
                    tabInfo.autoFillable[ev.detail.frameUrl] = true;
                }
                else {
                    delete tabInfo.autoFillable[ev.detail.frameUrl];
                }
            }
        }

        function getLastFocused(tabId) {
            return g_tabs[tabId] ? g_tabs[tabId].lastFocused : BP_COMMON.EMPTY_OBJECT;
        }

        function getAutoFillable(tabId) {
            return g_tabs[tabId] ? g_tabs[tabId].autoFillable : BP_COMMON.EMPTY_OBJECT;
        }

        function openPath (path, ops)
        {
            var url = BP_CS_PLAT.getURL(path),
            	loc = BP_COMMON.parseURL2(url),
            	ops = ops || {},
            	urlMatch;

            loc.search = loc.hash = loc.href = null;

            urlMatch = BP_COMMON.locToURL(loc) + "*";

            chrome.tabs.query({url:urlMatch}, function(tabs)
            {
                if (tabs.length) {
                    chrome.tabs.update(tabs[0].id, {url:url, active:true});
                    chrome.windows.update(tabs[0].windowId , {focused:true});
                }
                else {
                    if ((ops.type !== 'popup') && (ops.type !== 'panel')) {
                        chrome.tabs.create({url:url, active:true});
                        chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {focused:true});
                    }
                    else {
                        // NOTE: It is better to open dialogs within a tab (i.e. not a popup)
                        // because as a tab, the Google-Chrome profile to which the dialog
                        // belongs is very clear. However, as a popup it will not be clear which
                        // profile the window belongs to and that will be confusing and frustrating.
                        chrome.windows.create({
                            url:url,
                            focused:true,
                            type:ops.type,
                            width:ops.width,
                            height:ops.height});
                    }
                }
            });
        }

        chrome.tabs.onUpdated.addListener(onTabUpdated);
        chrome.tabs.onRemoved.addListener(onTabRemoved);        MAIN_EVENTS.listen('bp_on_focus', new BP_LISTENER.CallbackInfo(onFocus));
        MAIN_EVENTS.listen('bp_on_unload', new BP_LISTENER.CallbackInfo(onUnload));
        MAIN_EVENTS.listen('bp_autoFillable', new BP_LISTENER.CallbackInfo(onAutoFillable));

        return Object.freeze (
        {
            clickReq: clickReq,
            clickResp: clickResp,
            getLastFocused: getLastFocused,
            getAutoFillable: getAutoFillable,
            openPath: openPath
        });
    }());

    /**
     * Compares two versions.
     * @param {Object} verStr First version string        - e.g. "1.1.0.2"
     * @param {Object} ver2   Second version number array - e.g. [1,1,0,2]
     * @return Returns a number - zero, positive or negative depending on
     *  the result. If the string/array is too-short then the missing numbers
     *  are assumed to be zero.
     */
    function cmpVersion(verStr, ver2)
    {
        function cmp (num1, num2)
        {
            num1 = num1 ? Number(num1) : 0;
            num2 = num2 ? Number(num2) : 0;

            return (num1 - num2);
            // if (num1 === num2) { return 0; }
            // else if (num1 > num2) { return 1;}
            // else { return -1; }
        }

        if (!verStr || (typeof verStr !== 'string')) {return;}

        var ver1 = verStr.split('.');
        return cmp(ver1[0], ver2[0]) || cmp(ver1[1], ver2[1]) ||
               cmp(ver1[2], ver2[2]) || cmp(ver1[3], ver2[3]);
    }

    function makeVerStr(arr)
    {
        var i, n, str="";
        if (arr && (typeof arr === "object") && (arr.constructor===Array))
        {
            n = (arr.length < 4) ? arr.length : 4;
            for (i=0; i<n; i++) {
                if (i>0) str += ".";
                str += arr[i];
            }
        }
        else {
            str = "0";
        }

        return str;
    }

    function isWindows()
    {
        return (g_win.navigator.appVersion.indexOf("Win")!=-1);
    }

    function eulaAccepted()
    {
        var eula = localStorage['l.v'] || "0",
            tpl  = localStorage['tpl.v'] || "0",
            eulaCurr= BP_CONFIG.eulaVer,
            tplCurr = BP_CONFIG.tplVer;

        // Check EULA accepted.
        if ((cmpVersion(eula,eulaCurr) < 0) || (cmpVersion(tpl,tplCurr) < 0)) {
            return false;
        }
        else {
            return true;
        }
    }
    function acceptEula()
    {
        localStorage['l.v'] = makeVerStr(BP_CONFIG.eulaVer);
        localStorage['tpl.v'] = makeVerStr(BP_CONFIG.tplVer);
    }

    function init()
    {
        var dbPath;

        function loadPlugin ()
        {
            BP_PLUGIN = g_doc.getElementById('com-untrix-bpplugin');
            if (!BP_MAIN.isWindows()) {
                //MOD_WIN.openPath('/bp_dialog.html?action=unsupportedOS');
                BP_ERROR.logwarn("Unsupported Operating System");
            }
            else if (!BP_PLUGIN.getpid) {
                MOD_WIN.openPath('/bp_dialog.html?action=installPlugin');
                BP_ERROR.logwarn("Plugin Not Loaded");
            }
            else {
                if (cmpVersion(BP_PLUGIN.version, BP_CONFIG.pluginVer) < 0) {
                    MOD_WIN.openPath('/bp_dialog.html?action=upgradePlugin');
                    BP_ERROR.logwarn("Plugin Needs Upgrade");
                }
                else {
                    BP_ERROR.logdebug("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
                }
            }
            //BP_PLUGIN.clearCryptCtx();
        }

        function checkEula()
        {
            if (!eulaAccepted()) {
                g_win.open('bp_license.html', 'bp_license', null, false);
                throw new BPError("EULA not accepted yet");
            }
        }

        try
        {
            checkEula(); // throws.
            BP_PLAT.init(g_doc, MOD_WIN);
            registerMsgListener(onRequest);
            MEMSTORE.loadETLD();
            MEMSTORE.clear();
            // Initialize notifications only after all modules
            // that it listens to have been inited.
            BP_NTFN_CNTR.init();
            loadPlugin();
            // BP_NTFN_CNTR.notify('', 'Click here to open a Keyring', function()
            // {
            	// MOD_WIN.openPath('/bp_manage.html?action=open');
            // });
        }
        catch (e)
        {
            // delete localStorage['db.path'];
            MEMSTORE.clear();
            BP_ERROR.logwarn(e);
        }
    }

    BP_ERROR.logdebug("constructed mod_main");
    return Object.freeze(
    {
        init: init,
        g: g,
        // MOD_CONNECT
        saveRecord: saveRecord,
        saveTempRec: saveTempRec,
        sendDelActn: sendDelActn,
        getRecs: getRecs,
        getDBPath: getDBPath,
        unloadDB: unloadDB,
        off: off,
        cmpVersion: cmpVersion,
        isWindows: isWindows,
        eulaAccepted: eulaAccepted,
        acceptEula: acceptEula,
        MOD_WIN: MOD_WIN,
        EVENTS: EVENTS
    });
}());

BP_MAIN.g.BP_COMMON.addEventListener(window, 'load', function(e)
{ "use strict";
  BP_MAIN.init();
  BP_MAIN.g.BP_ERROR.logdebug("inited main");
});
