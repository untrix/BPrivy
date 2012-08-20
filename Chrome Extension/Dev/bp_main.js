/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, document, BP_MOD_PLAT, BP_MOD_CONNECT, BP_MOD_COMMON, IMPORT, localStorage,
  BP_MOD_MEMSTORE, BP_MOD_FILESTORE, BP_MOD_ERROR, BP_MOD_TRAITS */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

(function Main(doc)
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    /** @import-module-begin MainPlatform */
    var m = BP_MOD_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var initScaffolding = IMPORT(m.init);
    /** @import-module-begin **/
    m = BP_MOD_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var MOD_CONNECT = IMPORT(BP_MOD_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var cm_loadDB = IMPORT(m.cm_loadDB);
    var cm_mergeInDB = IMPORT(m.cm_mergeInDB);
    var cm_createDB = IMPORT(m.cm_createDB);
    var cm_getDBPath = IMPORT(m.cm_getDBPath);
    /** @import-module-begin MemStore */
    var MEM_STORE = IMPORT(BP_MOD_MEMSTORE);
    var FILE_STORE = IMPORT(BP_MOD_FILESTORE);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = BP_MOD_ERROR.BPError;
    var Activity = BP_MOD_ERROR.Activity;
    
    /** @import-module-end **/    m = null;

    /**
     * Invoked when a new record - eRec or pRec - is generated by the user. This is not
     * invoked for bulk-loads like loadDB, importCSV or mergeDB.
     * @param {Object} rq Request received from mod_connect
     */
    function insertNewRec(rec, dt)
    {
        var res, notes;
        switch (dt)
        {
            case dt_eRecord:
            case dt_pRecord:
                notes = MEM_STORE.insertRec(rec, dt);
                if (notes) 
                {
                    res = true;
                    if (MEM_STORE.DT_TRAITS.getTraits(dt).toPersist(notes) &&
                        FILE_STORE.UC_TRAITS.insertNewRec.toPersist(notes))
                    {
                        res = FILE_STORE.insertRec(rec, dt);
                    }
                }
                break;
            default: // do nothing
        }
        
        return res;
    }
    
    function makeDashResp(result)
    {
        return {
            result: result,
            dbName:FILE_STORE.getDBName(),
            dbPath:FILE_STORE.getDBPath(),
            dbStats:FILE_STORE.getDBStats(),
            memStats:MEM_STORE.getStats()
        };
    }
    
    function onRequest(rq, sender, funcSendResponse)
    {
        var result, recs, dbPath, dbStats, resp,
            cm = rq.cm,
            bSaveRec;
        delete rq.cm; // we don't want this to get saved to store in case of eRec and pRec.
        console.info("Mothership Received object of type " + cm);
        
        rq.atvt ? (BPError.atvt = new Activity(rq.atvt)) : (BPError.atvt = new Activity("BPMain::OnRequest"));
        
        try  {
            switch (cm) {
                case dt_eRecord:
                    BPError.push("SaveERecord");
                    bSaveRec = true;
                    funcSendResponse({result:insertNewRec(rq.rec, dt_eRecord)});
                    break;
                case dt_pRecord:
                    BPError.push("SavePRecord");
                    bSaveRec = true;
                    funcSendResponse({result:insertNewRec(rq.rec, dt_pRecord)});
                    break;
                case cm_getRecs:
                    BPError.push("GetRecs");
                    recs = MEM_STORE.getRecs(rq.loc);
                    recs.dbName = FILE_STORE.getDBName();
                    recs.dbPath = FILE_STORE.getDBPath();
                    resp = makeDashResp(true);
                    resp.db = recs;
                    funcSendResponse(resp);
                    break;
                case cm_loadDB:
                    BPError.push("LoadDB");
                    dbPath = FILE_STORE.loadDB(rq.dbPath);
                    funcSendResponse(makeDashResp(Boolean(dbPath))); 
                    break;
                case MOD_CONNECT.cm_unloadDB:
                    BPError.push("UnloadDB");
                    dbPath = FILE_STORE.unloadDB(rq.dbPath);
                    funcSendResponse(makeDashResp(true));
                    break;
                case MOD_CONNECT.cm_mergeInDB:
                    BPError.push("MergeInDB");
                    result = FILE_STORE.mergeInDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case MOD_CONNECT.cm_mergeOutDB:
                    BPError.push("MergeOutDB");
                    result = FILE_STORE.mergeOutDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case MOD_CONNECT.cm_mergeDB:
                    BPError.push("MergeDB");
                    result = FILE_STORE.mergeDB(rq.dbPath);
                    funcSendResponse(makeDashResp(result));
                    break;
                case MOD_CONNECT.cm_compactDB:
                    BPError.push("CompactDB");
                    dbPath = FILE_STORE.compactDB();
                    funcSendResponse(makeDashResp(Boolean(dbPath)));
                    break;
                case MOD_CONNECT.cm_cleanDB:
                    BPError.push("CleanDB");
                    dbStats = FILE_STORE.cleanLoadDB();
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_createDB:
                    BPError.push("CreateDB");
                    dbPath = FILE_STORE.createDB(rq.dbName, rq.dbDir);
                    funcSendResponse(makeDashResp(true));
                    break;
                case cm_getDBPath:
                    BPError.push("GetDBPath");
                    dbPath = BP_MOD_FILESTORE.getDBPath();
                    funcSendResponse(makeDashResp(true));
                    break;
                case MOD_CONNECT.cm_importCSV:
                    BPError.push("ImportCSV");
                    result = FILE_STORE.importCSV(rq.dbPath, rq.obfuscated);
                    funcSendResponse(makeDashResp(result));                        
                    break;
                case MOD_CONNECT.cm_exportCSV:
                    BPError.push("ExportCSV");
                    result = FILE_STORE.exportCSV(rq.dirPath, rq.obfuscated);
                    funcSendResponse({result: result});
                    break;
                case MOD_CONNECT.cm_getDB:
                    BPError.push("GetDB");
                    funcSendResponse({result:true, dB:MEM_STORE.getDB(rq.dt)});
                    break;
                default: // do nothing
            }
        } 
        catch (err) 
        {
            BP_MOD_ERROR.logwarn(err);
            if (bSaveRec) {FILE_STORE.unloadDB();} // Seems that we lost DB-connection
            var resp = makeDashResp(false);
            resp.err = new BPError(err);
            funcSendResponse(resp);
        }
    }

    try
    {
        var dbPath = localStorage["db.path"];
        initScaffolding(doc);
        registerMsgListener(onRequest);
        FILE_STORE.init();
        MEM_STORE.loadETLD();
        MEM_STORE.clear();
        if (dbPath)
        {
            BPError.atvt = new Activity('LoadDBAtInit');
            dbPath = FILE_STORE.loadDB(dbPath);

            if (!dbPath) { // db-load failed
                throw new BPError("DB Load Failed");
            }
        }
            
        // chrome.tabs.onSelectionChanged.addListener(function(tabId) 
        // {
            // chrome.pageAction.show(tabId);
        // });

    } catch (e)
    {
        
        delete localStorage['db.path'];
        MEM_STORE.clear();
        BP_MOD_ERROR.logwarn(e);
    }
    console.log("loaded main");
}(document));