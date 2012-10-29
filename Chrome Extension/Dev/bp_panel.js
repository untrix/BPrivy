/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, BP_DLL, BP_GET_CONNECT, BP_GET_CS_PLAT, IMPORT, BP_GET_COMMON,
  BP_GET_ERROR, BP_GET_MEMSTORE, BP_GET_W$, BP_GET_TRAITS, BP_GET_WDL, BP_GET_PLAT */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

//////////// DO NOT HAVE DEPENDENCIES ON ANY BP MODULE OR GLOBAL ///////////////////
function IMPORT(sym)
{
    'use strict';
    var window = null, document = null, console = null;
    if(sym===undefined || sym===null) {
        throw new ReferenceError("Linker:Symbol Not Found");
    }
    else {
        return sym;
    }
}

/**
 * @ModuleBegin MOD_PANEL
 */
(function()
{
    "use strict";
    // g => Global Env.
    var g = {g_win:window, g_console:console};
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    var BP_CS_PLAT = IMPORT(g.BP_CS_PLAT);
    g.BP_ERROR = BP_CS_PLAT.getBackgroundPage().BP_GET_ERROR(g);
    g.BP_COMMON = BP_CS_PLAT.getBackgroundPage().BP_GET_COMMON(g);
    g.BP_TRAITS = BP_CS_PLAT.getBackgroundPage().BP_GET_TRAITS(g);
    g.BP_CONNECT = BP_CS_PLAT.getBackgroundPage().BP_GET_CONNECT(g);
    g.BP_W$ = BP_GET_W$(g);
    g.BP_WDL = BP_GET_WDL(g);
    // Module object used within bp_main.html
    g.BP_MAIN = BP_CS_PLAT.getBackgroundPage().BP_MAIN;
    g.BP_PLAT = g.BP_MAIN.BP_PLAT;
    
    var m;
    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-begin Traits */
    m = IMPORT(g.BP_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
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
        newERecord = IMPORT(m.newERecord),
        newPRecord = IMPORT(m.newPRecord);
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
    /** @import-module-end **/ m = null;

    /** @globals-begin */
    var data_ct = "untrix_ct",
        data_fn = "untrix_fn", // Careful here. HTML5 will take all capitals in the IDL name
                               // and convert to lowercase with a hyphen prefix. Not sure
                               // if the normalized name needs to be used in querySelector
                               // of whether the IDL name will suffice. For the time being
                               // I am steering clear of hyphens and uppercase.
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
        var m_panel, m_id_panel, m_bUserClosed = false;
        
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
            //panelClosed(g_loc);
            window.close();
        }

        function create(loc)
        {
            close();
            m_bUserClosed = false;
            var ctx = {
                it: new RecsIterator(MOD_DB.pRecsMap),
                it2: new RecsIterator(MOD_DB.tRecsMap),
                reload:MOD_PANEL.create, // this function
                onClosed:onClosed,
                saveRec: MOD_CS.saveRec,
                delRec: MOD_CS.delRec,
                delTempRec: MOD_CS.delTempRec,
                //autoFill: (MOD_FILL.info().autoFillable()?MOD_FILL.autoFill:undefined), 
                dbName:MOD_DB.dbName,
                dbPath:MOD_DB.dbPath,
                popup:true,
                loc:MOD_DB.loc
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
            userClosed: userClosed
        });
    }());
      
    MOD_CS = (function()
    {
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
                    BP_ERROR.loginfo("cbackShowPanel@bp_cs.js received DB-Records\n"/* + JSON.stringify(db)*/);
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
                    BP_ERROR.logdebug(resp.err);
                }
            }
            catch (err) 
            {
                BP_ERROR.logwarn(err);
            }

            //if ((!bConditional) || MOD_FILL.info().autoFillable() || MOD_DB.numUnsaved) {
            //if ((!bConditional) || MOD_DB.numUnsaved) {
                MOD_PANEL.create();
            //}
        }
        
        function showPanelAsync()
        {
            chrome.tabs.query({currentWindow:true, highlighted:true}, function(tabs)
            {
                var loc;
                if (tabs.length) 
                {
                    loc = BP_COMMON.parseURL(tabs[0].url) || {};
                    //BP_PLAT.bpClick(tabs[0]);
                    BP_ERROR.logdebug("popup.loc = " + JSON.stringify(loc));
                    //if (loc) {
                        getRecs(loc, cbackShowPanel);
                    // }
                    // else {
                        // cbackShowPanel();
                    // }
                }
            });
        }
        
        /**
         * Invoked by bp_cs_boot when it detects a possible signin/up form on the page.
         */
        function onDllLoad ()
        {
            document.body.style.margin = '2px';
            showPanelAsync();
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
            });
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
            }, false, toTemp);
        }

        function main()
        {
            //BP_DLL.onDllLoad = onDllLoad;
            onDllLoad();
        }

        return Object.freeze(
        {
            main: main,
            showPanelAsync: showPanelAsync,
            saveRec: function(a,b,c) {saveRec(a,b,c);},
            delRec: function(a,b,c) {delRec(a,b,c);},
            delTempRec: function(a,b,c) {delRec(a,b,c,true);},
        });
    }());
    
    MOD_CS.main();
    BP_ERROR.log("loaded CS");    
}());