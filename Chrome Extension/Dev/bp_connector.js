/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT, BP_MOD_ERROR, BP_MOD_TRAITS */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */


/**
 * @ModuleBegin Connector
 */

var BP_MOD_CONNECT = (function ()
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    /** @import-module-begin CSPlatform **/
    var m = BP_MOD_CS_PLAT;
    var postMsgToMothership = IMPORT(m.postMsgToMothership);
    var rpcToMothership = IMPORT(m.rpcToMothership);
    /** @import-module-begin Traits **/
        m = BP_MOD_TRAITS;    
    var dt_eRecord = IMPORT(m.dt_eRecord);  // Represents a E-Record (html-element record). Value is persisted.
    var dt_pRecord = IMPORT(m.dt_pRecord);  // Represents a P-Record (password record). Value is persisted.
    var dt_etld    = IMPORT(m.dt_etld);   // Represents a ETLD (Public Suffix) record. Value is persisted.
    var fn_userid = IMPORT(m.fn_userid);   // Represents field userid. Copy value from P_UI_TRAITS.
    var fn_pass = IMPORT(m.fn_pass);       // Represents field password. Copy value from P_UI_TRAITS.
    /** @import-module-end **/    m = null;

    /** @constant */
    var cm_getRecs = "cm_getRecs",     // Represents a getDB command
        cm_loadDB = "cm_loadDB",
        cm_mergeInDB = "cm_mergeInDB",
        cm_createDB = "cm_createDB",
        cm_getDBPath = "cm_getDBPath",
        cm_importCSV = "cm_importCSV";

    var DICT_TRAITS={};
   
    /** generic traits */
    DICT_TRAITS[undefined] = Object.freeze(
    {
        url_host:true,
        url_path:true
    });
    
    DICT_TRAITS[dt_pRecord] = Object.freeze(
    {
        url_host:true,
        domain_only:true // Store records agains domain only - e.g. facebook.com
        // instead of apps.facebook.com.
    });

    DICT_TRAITS[dt_eRecord] = Object.freeze(
    {
        url_host:true,
        url_path:true,
    });

    DICT_TRAITS[dt_etld] = Object.freeze(
    {
        url_host:true        
    });
    
    function newL (loc, dt)
    {
        var out = {};
        if (loc.hostname) {
            out.H = loc.hostname;
        }
        if (DICT_TRAITS[dt].url_path && loc.pathname && loc.pathname !== "/") 
        {
            out.P = loc.pathname;
        }

        return out;
    }
    
    /** Pseudo Inheritance */
    function ARec(dt, loc, date)
    {
        // date is number of milliseconds since midnight Jan 1, 1970.
        if (date !== undefined && date !== null)
        {
            date = Number(date); 
        }
        
        Object.defineProperties(this,
        {
            // Date and timestamp of record creation. Should be a Date object.
            tm: {value: date, enumerable: true},
            // URL that this record pertains to. Determines where the record will sit within the URL-trie.
            // We're stripping extra data and shortening property names so as to conserve space in memory
            // as well as on disk and processing cycles as well. This becomes important when one has to
            // ingest thousands of records (ETLD has about 7K records)
            l: {value: newL(loc, dt), enumerable: true},
            /** USECASE TRAITS PROPERTIES (prefixed with 'ut') */
            // utNoTmUpdates: Set to true implies that if a record has the same key and value
            //               but has a newer timestamp from that already present in the DB,
            //               then it will be discarded by the MEM_STORE.
            //               If it had the same key+value but an older timestamp, it would be
            //               discarded anyway.
            utNoTmUpdates: {writable:true} // not enumerable so that it won't end-up in the db.
        });
    }
    
    function ERecord(loc, date, fieldName, tagName, id, name, type)
    {
        ARec.apply(this, [dt_eRecord, loc, date]);
        Object.defineProperties(this, 
        {
            f: {value: fieldName, enumerable: true},
            t: {value: tagName, enumerable: true},
            id: {value: id, enumerable: true},
            n: {value: name, enumerable: true},
            y: {value: type, enumerable: true}
        });
        Object.seal(this);
    }
    ERecord.prototype = Object.create(ARec.prototype,{});
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function newERecord(loc, date, fieldName, tagName, id, name, type) {
        return new ERecord(loc, date, fieldName, tagName, id, name, type);    
    }

    function PRecord(loc, date, userid, pass)
    {
        ARec.apply(this, [dt_pRecord, loc, date]);
        Object.defineProperties(this,
            {
                u: {value: userid, enumerable: true},
                p: {value: pass, enumerable: true}
            }
        );
        Object.seal(this);
    }
    PRecord.prototype = Object.create(ARec.prototype,{});
        
    function newPRecord(loc, date, userid, pass)
    {
        return new PRecord(loc, date, userid, pass);
    }
    
    function createDB (dbName, dbDir, callbackFunc)
    {
        rpcToMothership({cm: cm_createDB, dbName:dbName, dbDir:dbDir}, callbackFunc);
    }

    function loadDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: cm_loadDB, dbPath:dbPath}, callbackFunc);
    }

    function mergeInDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: cm_mergeInDB, dbPath:dbPath}, callbackFunc);
    }

    function importCSV (dbPath, obfuscated, callbackFunc) 
    {
        rpcToMothership({cm: cm_importCSV, dbPath:dbPath, obfuscated: obfuscated}, callbackFunc);
    }

    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        var saveRecord = function (rec, dt, callbackFunc)
        {
            var req = {};
            req.cm = dt;
            req.rec = rec;
            if (callbackFunc) {
                rpcToMothership(req, callbackFunc);
            }
            else {
                postMsgToMothership(req);
            }
        };
        
        var deleteRecord = function (erec, dt)
        {
            console.log('Deleting Record ' + JSON.stringify(erec));
        };
        
        var getRecs = function(loc, callback)
        {
            return rpcToMothership({cm:cm_getRecs, loc: loc}, callback);
        };
        
        var getDBPath = function (callback)
        {
            return rpcToMothership({cm:cm_getDBPath}, callback);
        };

        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            dt_eRecord: {value: dt_eRecord},
            dt_pRecord: {value: dt_pRecord},
            dt_etld:    {value: dt_etld},
            DICT_TRAITS: {value: DICT_TRAITS},
            newL: {value: newL},
            fn_userid: {value: fn_userid},
            fn_pass: {value: fn_pass},
            cm_getRecs: {value: cm_getRecs},
            cm_loadDB: {value: cm_loadDB},
            cm_mergeInDB: {value: cm_mergeInDB},
            cm_createDB: {value: cm_createDB},
            cm_getDBPath: {value: cm_getDBPath},
            cm_importCSV: {value: cm_importCSV},
            saveRecord: {value: saveRecord},
            deleteRecord: {value: deleteRecord},
            newERecord: {value: newERecord},
            newPRecord: {value: newPRecord},
            getRecs: {value: getRecs},
            loadDB: {value: loadDB},
            mergeInDB: {value: mergeInDB},
            createDB: {value: createDB},
            getDBPath: {value: getDBPath},
            importCSV: {value: importCSV}
        });
        Object.freeze(iface);

        return iface;
    }
    
    console.log("loaded connector");
    return getModuleInterface();

}());
/** @ModuleEnd */