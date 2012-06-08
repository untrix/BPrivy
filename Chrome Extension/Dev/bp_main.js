/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, document, BP_MOD_MAIN_PLAT, BP_MOD_CONNECT, BP_MOD_COMMON, IMPORT, localStorage,
  BP_MOD_MEMSTORE, BP_MOD_FILESTORE */
/*jslint browser:true, devel:true, es5:true, vars:true */


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
    /** @import-module-begin COMMON */
    m = BP_MOD_COMMON;
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin MemStore */
    var MEM_STORE = IMPORT(BP_MOD_MEMSTORE);
    var FILE_STORE = IMPORT(BP_MOD_FILESTORE);
    /** @import-module-end **/    m = null;

    function onRequest(rq, sender, funcSendResponse)
    {
        console.info("Mothership Received object of type " + rq.dt);
        switch (rq.dt) {
            case dt_eRecord:
            case dt_pRecord:
                funcSendResponse({
                    ack : MEM_STORE.insertRec(rq)
                });
                break;
            case cm_getRecs:
                var db = MEM_STORE.getRecs(rq.loc);
                funcSendResponse(db);
                break;
            case cm_loadDB:
                try {
                    FILE_STORE.loadDB(rq.dbName, rq.dbDir);
                    funcSendResponse(true);
                } catch (e) {
                    funcSendResponse(e);
                }
                break;
            case cm_createDB:
                try {
                    FILE_STORE.createDB(rq.dbName, rq.dbDir);
                    funcSendResponse(true);
                } catch (err) {
                    funcSendResponse(err);
                }
                break;
            default: // do nothing
        }
    }
    
    try 
    {
        initScaffolding(doc);
        registerMsgListener(onRequest);
        var dbDir = localStorage["Db.Dir"];
        var dbName = localStorage['Db.Name'];
        if (dbDir && dbName)
        {
            FILE_STORE.loadDB(dbDir, dbName);
            //FILE_STORE.createDB("C:/Users/sumeet/Documents/", "Keys");
            //FILE_STORE.importCSV("C:/Users/sumeet/Desktop/password-export-2012-05-18.csv");
        }
    } catch (e)
    {
        console.log(JSON.stringify(e));
    }

})(document);