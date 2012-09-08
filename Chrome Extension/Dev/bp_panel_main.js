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
 * @ModuleBegin PANEL_MAIN
 */
var PANEL_MAIN = (function ()
{
    "use strict";
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var MOD_COMMON = IMPORT(m);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs),
        deleteRecord = IMPORT(m.deleteRecord),
        saveRecord = IMPORT(m.saveRecord),
        newERecord = IMPORT(m.newERecord);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin */
    m = BP_MOD_WDL;
    var /*prop_value = IMPORT(m.prop_value),
        prop_fieldName = IMPORT(m.prop_fieldName),
        prop_peerID = IMPORT(m.prop_peerID),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS),*/
        cs_panel_wdt = IMPORT(m.cs_panel_wdt),
        MiniDB = IMPORT(m.MiniDB);    
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
        dt_eRecord = IMPORT(m.dt_eRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_pass = IMPORT(m.fn_pass);        // Represents data-type password
    /** @import-module-begin W$ */
        m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.w$exec),
        w$get = IMPORT(m.w$get),
        w$set = IMPORT(m.w$set);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
        /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_win = window,
        g_loc = IMPORT(g_win.location),
        g_doc = IMPORT(g_win.document),
        g_db =  new MiniDB(),
        g_panel,
        gid_panel; // id of created panel if any
    /** @globals-end **/

    function onReq (req) {}
    
    function getRecsAsync ()
    {
        getRecs(g_loc, cbackShowPanel);
    }

    /**
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function cbackShowPanel (resp)
    {
        if (resp.result === true)
        {
            var db = resp.db;
            console.info("bp_panel_main retrieved DB-Records\n"/* + JSON.stringify(db)*/);
            g_db.ingest(db);
        }
        else
        {
            g_db.clear();
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.logdebug("bp_panel_main.js@showPanel " + exc.toString());
        }

        var ctx = {
            it: new RecsIterator(g_db.pRecsMap), 
            reload:getRecsAsync, 
            autoFill:undefined, 
            dbName:resp.dbName, //g_db.dbName,
            dbPath:resp.dbPath //g_db.dbPath
            };
        var panel = w$exec(cs_panel_wdt, ctx);
        if (g_panel) {g_panel.destroy();}
        g_panel = panel;
        gid_panel = g_panel.id;
        MOD_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
    }

    // function getDBCback(resp)
    // {
        // if (resp.result === true) 
        // {
            // var db = resp.db;
            // console.info("bp_panel_main retrieved DB-Records\n" /*+ JSON.stringify(db)*/);
            // g_db.ingest(db);
                // var ctx = 
                    // {
                        // it: new RecsIterator(g_db.pRecsMap),
                        // reload:getRecsAsync, 
                        // autoFill:undefined,
                        // dbName:resp.dbName, //g_db.dbName,
                        // dbPath:resp.dbPath //g_db.dbPath
                    // },
                    // panel = w$exec(cs_panel_wdt, ctx);
                // gid_panel = panel.id;
                // MOD_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
        // }
        // else
        // {
            // var exc = new BPError(resp.err);
            // BP_MOD_ERROR.logdebug("bp_panel_main.js@init " + exc.toString() + "]");
        // }        
    // }
    
    getRecs(g_loc, cbackShowPanel);
    registerMsgListener(onReq);    
    
    // Module Interface (Exports)
    var exports = Object.freeze(
    {
        
    });
    return exports;
}());