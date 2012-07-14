/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, document, BP_MOD_MAIN_PLAT, BP_MOD_CONNECT, BP_MOD_COMMON, IMPORT, localStorage,
  BP_MOD_MEMSTORE, BP_MOD_FILESTORE, BP_MOD_ERROR */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

(function Main(doc)
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    /** @import-module-begin MainPlatform */
    var m = BP_MOD_MAIN_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var initScaffolding = IMPORT(m.init);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var cm_loadDB = IMPORT(m.cm_loadDB);
    var cm_createDB = IMPORT(m.cm_createDB);
    var cm_getDBPath = IMPORT(m.cm_getDBPath);
    /** @import-module-begin COMMON */
    m = BP_MOD_COMMON;
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin MemStore */
    var MEM_STORE = IMPORT(BP_MOD_MEMSTORE);
    var FILE_STORE = IMPORT(BP_MOD_FILESTORE);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = BP_MOD_ERROR.BPError;
    var Activity = BP_MOD_ERROR.Activity;
    
    /** @import-module-end **/    m = null;

    function onRequest(rq, sender, funcSendResponse)
    {
        var result, recs, dbPath;
        console.info("Mothership Received object of type " + rq.dt);
        
        rq.atvt ? (BPError.atvt = new Activity(rq.atvt)) : (BPError.atvt = new Activity("BPMain::OnRequest"));
        
        try  {
            switch (rq.dt) {
                case dt_eRecord:
                    BPError.push("SaveERecord");
                    result = MEM_STORE.insertRec(rq) &&
                             FILE_STORE.insertRec(rq);
                    funcSendResponse({result:result});
                    break;
                case dt_pRecord:
                    BPError.push("SavePRecord");
                    result = MEM_STORE.insertRec(rq) &&
                             FILE_STORE.insertRec(rq);
                    funcSendResponse({result:result});
                    break;
                case cm_getRecs:
                    BPError.push("GetRecs");
                    recs = MEM_STORE.getRecs(rq.loc);
                    funcSendResponse({result:true, db:recs});
                    break;
                case cm_loadDB:
                    BPError.push("LoadDB");
                    dbPath = FILE_STORE.loadDB(rq.dbPath);
                    funcSendResponse({result:Boolean(dbPath), dbPath:dbPath});
                    break;
                case cm_createDB:
                    BPError.push("CreateDB");
                    dbPath = FILE_STORE.createDB(rq.dbName, rq.dbDir);
                    funcSendResponse({result:true, dbPath:dbPath});
                    break;
                case cm_getDBPath:
                    BPError.push("GetDBPath");
                    dbPath = BP_MOD_FILESTORE.getDBPath();
                    funcSendResponse({result:true, dbPath:dbPath});
                    break;
                case BP_MOD_CONNECT.cm_importCSV:
                    BPError.push("ImportCSV");
                    result = FILE_STORE.importCSV(rq.dbPath, rq.obfuscated);
                    funcSendResponse({result: result});
                    break;
                default: // do nothing
            }
        } 
        catch (err) {
            BPError.logwarn(err);
            funcSendResponse({result:false, err:err});
        }
    }
    
    try 
    {
        initScaffolding(doc);
        registerMsgListener(onRequest);
        var dbPath = localStorage["db.path"];
        if (dbPath)
        {
            dbPath = FILE_STORE.loadDB(dbPath);
            //FILE_STORE.createDB("C:/Users/sumeet/Documents/", "Keys");
            if (!dbPath) { // db-load failed, remove the stored dbPath value.
                delete localStorage['db.path'];
            }
        }
    } catch (e)
    {
        var exc = new BPError(e);
        BP_MOD_ERROR.logwarn("init@bp_main.js = " + exc.toString());
    }

}(document));