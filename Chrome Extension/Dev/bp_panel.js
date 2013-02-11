/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, BP_DLL, BP_GET_CONNECT, BP_GET_CS_PLAT, IMPORT, BP_GET_COMMON, chrome,
  BP_GET_ERROR, BP_GET_MEMSTORE, BP_GET_W$, BP_GET_TRAITS, BP_GET_WDL, BP_GET_PLAT,
  BP_GET_LISTENER */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin MOD_PANEL
 */
(function()
{
    "use strict";
    // g => Global Env.
    var g = {g_win:window, g_console:console, g_chrome:chrome},
        DEBUG = DEBUG || false;
    g.BP_CS_PLAT = chrome.extension.getBackgroundPage().BP_GET_CS_PLAT(g);
    var BP_CS_PLAT = IMPORT(g.BP_CS_PLAT);
    // Module object used within bp_main.html
    g.BP_MAIN = BP_CS_PLAT.getBackgroundPage().BP_MAIN;
    g.BP_PLAT = g.BP_MAIN.g.BP_PLAT;
    if (false) {
        g.BP_ERROR = BP_GET_ERROR(g);
        g.BP_COMMON = BP_GET_COMMON(g);
        g.BP_TRAITS = BP_GET_TRAITS(g);
        g.BP_CONNECT = BP_GET_CONNECT(g);
        g.BP_W$ = BP_GET_W$(g);
        g.BP_WDL = BP_GET_WDL(g);
        g.BP_MEMSTORE = g.BP_MAIN.g.BP_MEMSTORE;
    }
    else {
        g.BP_ERROR = g.BP_MAIN.g.BP_ERROR;
        g.BP_COMMON = g.BP_MAIN.g.BP_COMMON;
        g.BP_TRAITS = g.BP_MAIN.g.BP_TRAITS;
        g.BP_CONNECT = g.BP_MAIN.g.BP_CONNECT;
        g.BP_W$ = BP_CS_PLAT.getBackgroundPage().BP_GET_W$(g);
        g.BP_WDL = BP_CS_PLAT.getBackgroundPage().BP_GET_WDL(g);
        g.BP_MEMSTORE = g.BP_MAIN.g.BP_MEMSTORE;
    }
    
    var m;
    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-begin Traits */
    m = IMPORT(g.BP_TRAITS);
    var BP_TRAITS = IMPORT(m),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_userid2= IMPORT(m.fn_userid2),
        fn_pass2 = IMPORT(m.fn_pass2),
        fn_pass = IMPORT(m.fn_pass),        // Represents data-type password
        fn_btn  = IMPORT(m.fn_btn),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS);        // Submit button
    /** @import-module-begin */
    m = g.BP_MAIN;
    var BP_MAIN = IMPORT(m),
        getRecs = IMPORT(m.getRecs),
        saveRecord = IMPORT(m.saveRecord),
        //saveTempRec = IMPORT(m.saveTempRec),
        sendDelActn = IMPORT(m.sendDelActn);
    /** @import-module-begin */
    m = g.BP_CONNECT;
    var BP_CONNECT = IMPORT(m),
        ItemIterator = IMPORT(m.ItemIterator),
        newEAction = IMPORT(m.newEAction),
        newPAction = IMPORT(m.newPAction);
    /** @import-module-begin */
    m = g.BP_WDL;
    var cs_panel_wdt = IMPORT(m.cs_panel_wdt),
        MiniDB = IMPORT(m.MiniDB);
    /** @import-module-begin W$ */
        m = IMPORT(g.BP_W$);
    var w$exec = IMPORT(m.w$exec),
        w$get = IMPORT(m.w$get),
        w$set = IMPORT(m.w$set);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin */
    var BP_PLAT = IMPORT(g.BP_PLAT);
    var BP_MEMSTORE = IMPORT(g.BP_MEMSTORE);
    /** @import-module-end **/ m = null;

    /** @globals-begin */
    var data_ct = "untrix_ct",
        data_fn = "untrix_fn", // Careful here ! HTML5 will take all capitals in the IDL name
                               // and convert to lowercase with a hyphen prefix. Not sure
                               // if the normalized name needs to be used in querySelector
                               // of whether the IDL name will suffice. For the time being
                               // I am steering clear of hyphens and uppercase.
        // sel => selector
        sel_fn_u = "[data-"+data_fn+"="+fn_userid+']',
        sel_fn_p = "[data-"+data_fn+"="+fn_pass+']',
        sel_ct_u = "[data-"+data_ct+"="+CT_BP_USERID+']',
        sel_ct_p = "[data-"+data_ct+"="+CT_BP_PASS+']',
        MOD_DB = new MiniDB(true), // create a read-only db.
        MOD_PANEL,
        MOD_CS;
    /** @globals-end **/

    MOD_PANEL = (function()
    {
        var m_panel, m_id_panel, m_bUserClosed = false, m_bAutoFillable;
        
        function close()
        {
            if (m_id_panel && m_panel /*(panel = w$get('#'+m_id_panel))*/ ) 
            {
                m_panel.destroy();
                m_id_panel = undefined;
                m_panel = undefined;
                return true;
            }
            
            return false;          
        }
        
        function destroy()
        {
            if (close()) 
            {
                // Remember to not keep any data lingering around ! Delete data the moment we're done
                // using it. Data should not be stored in the CS if it is not visible to the user.
                MOD_DB.rmData();
                return true;
            }
            
            return false;
        }
        /**
         * Invoked by panel when closed directly from its UI. Not invoke when panel.destroy()
         * is called.
         */
        function onClosed()
        {
            m_panel = undefined;
            m_id_panel = undefined;
            m_bUserClosed = true;
            window.close();
        }

        function create(/*loc*/)
        {
            close();
            m_bUserClosed = false;
            var ctx = {
                it: new ItemIterator(MOD_DB.pRecsMap, true),
                it2: new ItemIterator(MOD_DB.tRecsMap, true),
                reload:MOD_PANEL.create, // this function
                onClosed:onClosed,
                saveRec: MOD_CS.saveRec,
                delRec: MOD_CS.delRec,
                delTempRec: MOD_CS.delTempRec,
                //autoFill: (MOD_FILL.info().autoFillable()?MOD_FILL.autoFill:undefined),
                autoFill: m_bAutoFillable ? MOD_CS.autoFill : undefined,
                dbName:MOD_DB.dbName,
                dbPath:MOD_DB.dbPath,
                popup:true,
                loc:MOD_DB.loc,
                openPath: BP_MAIN.MOD_WIN.openPath,
                unloadDB: BP_MAIN.unloadDB
            };
            m_panel = w$exec(cs_panel_wdt, ctx);
            
            m_id_panel = m_panel.id;
            BP_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
        }

        function userClosed()
        {return m_bUserClosed;}
        
        return Object.freeze(
        {
            create: create,
            destroy: destroy,
            onClosed: onClosed,
            userClosed: userClosed,
            putAutoFillable: function(b) {m_bAutoFillable = Boolean(b);},
            isAutoFillable: function () {return Boolean(m_bAutoFillable);}
        });
    }());
      
    MOD_CS = (function()
    {
        var g_tabId, g_frameUrl, g_loc, g_site;
        
        function autoFill(userid, pass)
        {
            BP_PLAT.sendMessage(g_tabId, g_frameUrl, {cm:'cm_autoFill', userid:userid, pass:pass});
        }
        /*
         * Show panel using the dbInfo returned in the response.
         */
        function cbackShowPanel (resp)
        {
            try
            {// failure here shouldn't prevent from displaying the panel.
                if (resp && (resp.result===true))
                {
                    var db = resp.db;
                    //BP_ERROR.loginfo("cbackShowPanel@bp_panel.js received DB-Records\n"/* + JSON.stringify(db)*/);
                    try { // failure here shouldn't block rest of the call-flow
                        MOD_DB.ingest(resp.db, resp.dbInfo, resp.loc);
                    } 
                    catch (err) {
                        BP_ERROR.logwarn(err);
                    }
                }
                else 
                {
                    MOD_DB.clear(); // Just to be on the safe side
                    (resp && BP_ERROR.logdebug(resp.err));
                }
            }
            catch (err) 
            {
                BP_ERROR.logwarn(err);
            }

            MOD_PANEL.create();
        }
        
        function heuristicFrameUrl(tabId, tabUrl )
        {
            var lastFocused = BP_MAIN.MOD_WIN.getLastFocused(tabId),
                frameUrl = lastFocused ? lastFocused.frameUrl : undefined,
                autoFillable, fillableUrls,
                fillableUrl, i, j, found;
            
            if (frameUrl) 
            {
                if (!lastFocused.isTopLevel) {
                    // Is a nested browsing context (i.e. Frame)
                    //BP_ERROR.logdebug('heuristicFrameUrl: lastFocused is nested browsing context. returning ' + frameUrl);
                    return frameUrl;
                }
                else { // topLevel browsing context
                    if ( lastFocused.elName === 'input' ) {
                        //BP_ERROR.logdebug('heuristicFrameUrl: lastFocused is top-level browsing context. elName = ' + lastFocused.elName + ' returning ' + frameUrl);
                        return frameUrl;
                    }
                    else {
                        autoFillable = BP_MAIN.MOD_WIN.getAutoFillable(tabId);
                        if (autoFillable[frameUrl]) {
                            //BP_ERROR.logdebug('heuristicFrameUrl: returning autoFillable top-level window: ' + frameUrl);
                            return frameUrl;
                        }
                        else {
                            // top-window is not autofillable. Check if any other frame is autofillable.
                            fillableUrls = Object.keys(autoFillable);

                            if (fillableUrls.length) {
                                //BP_ERROR.logdebug('heuristicFrameUrl: force returning first autoFillable frameUrl = ' + fillableUrl);
                                return fillableUrls[0];
                            }
                            else {
                                //BP_ERROR.logdebug('heuristicFrameUrl: No autofillable frame found. returning top-level frameUrl = ' + frameUrl);
                                return frameUrl;
                            }
                        }
                    }
                }
            }
            else {
                //BP_ERROR.logdebug('heuristicFrameUrl: returning tabUrl: ' + tabUrl);
                return tabUrl;
            }
        }

        function onLoad()
        {
            document.body.style.margin = '2px';
            chrome.tabs.query({currentWindow:true, highlighted:!DEBUG, index:DEBUG?0:undefined}, function(tabs)
            {
                var recsResp, resp3, lastFocused;

                if (!tabs.length) {
                    BP_ERROR.logdebug('No tabs shown?');
                    cbackShowPanel(); 
                    return;
                }

                g_tabId = tabs[0].id;
                g_frameUrl = heuristicFrameUrl(g_tabId, tabs[0].url);

                g_loc = BP_COMMON.parseURL(g_frameUrl) || {};
                //BP_ERROR.logdebug('onLoad@bp_panel.js: target frame url is ' + g_frameUrl);

                recsResp = getRecs(g_loc);
                g_site = recsResp.db ? recsResp.db.site : undefined;

                //BP_ERROR.logdebug('onLoad@bp_panel.js: site url is ' + g_site);
                MOD_PANEL.putAutoFillable(BP_MAIN.MOD_WIN.getAutoFillable(g_tabId)[g_frameUrl]);
                cbackShowPanel(recsResp);

                // the following is needed to perform an on-demand scan on the page to catch
                // those cases where a form may have just been displayed but not trigger a
                // mutation event (happens if the element existed from the start but was
                // originally hidden, and later displayed).
                if ( (BP_COMMON.isSupportedScheme(g_loc.protocol)) &&
                     (g_loc.hostname !== 'chrome.google.com') )// This is a very troublesome URL.
                {
                    BP_PLAT.sendMessage(g_tabId, g_frameUrl, {cm:'cm_autoFillable'}, function(resp2)
                    {
                        var loc, bRepaint, bReload, site;
                        //BP_ERROR.logdebug('onLoad@bp_panel.js: received cm_autoFillable response: ' + JSON.stringify(resp2));
                        if (!resp2) 
                        {
                            BP_ERROR.logdebug('onLoad@bp_panel.js: cm_autoFillable returned error');
                            return;
                        }
                        
                        // if (resp2.frameUrl && (resp2.frameUrl !== g_frameUrl))
                        // {
                           // g_frameUrl = resp2.frameUrl;
                           // g_site = site;
                           // loc = BP_COMMON.parseURL(g_frameUrl);
                           // bReload = true;
                        // }
                        if (MOD_PANEL.isAutoFillable() !== Boolean(resp2.autoFillable)) {
                            MOD_PANEL.putAutoFillable(Boolean(resp2.autoFillable));
                            bRepaint = true;;
                        }

                        if (!bReload && bRepaint) {
                            //BP_ERROR.logdebug('onLoad@bp_panel.js: reloading');
                            // TODO: Instead of reload this should simply be 
                            // MOD_PANEL.makeAutoFillable(true/false) - but we don't have that
                            // API yet.
                            cbackShowPanel(recsResp);
                        }
                        /*else if (bReload) {
                            BP_ERROR.logdebug('onLoad@bp_panel.js: refetching');
                            resp3 = getRecs(loc);
                            cbackShowPanel(resp3);
                        }*/
                    });
                }
            });
        }

        function saveRec (rec, dt, callbackFunc)
        {
            saveRecord(rec, dt, function(resp)
            {
                if (resp.result && resp.recs) {
                    MOD_DB.ingestDT(resp.recs, dt);
                }
                if (callbackFunc) {
                    callbackFunc(resp);
                }
            }, false, g_tabId);
        }

        function delRec (rec, dt, callbackFunc, toTemp)
        {
            sendDelActn(rec, dt, function(resp)
            {
                if (resp.result && resp.recs) {
                    if (!toTemp) {MOD_DB.ingestDT(resp.recs, dt);}
                    else {MOD_DB.ingestT(resp.recs);}
                }
                if (callbackFunc) {
                    callbackFunc(resp);
                }
            }, false, toTemp, g_tabId);
        }

        return Object.freeze(
        {
            onLoad: onLoad,
            saveRec: function(a,b,c) {saveRec(a,b,c);},
            delRec: function(a,b,c) {delRec(a,b,c);},
            delTempRec: function(a,b,c) {delRec(a,b,c,true);},
            autoFill: autoFill
        });
    }());
    
    MOD_CS.onLoad();
    BP_ERROR.log("loaded panel.js");    
}());