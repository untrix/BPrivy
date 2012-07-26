/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT, BP_MOD_ERROR */
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
    /** @import-module-end **/    m = null;
    
    /** 
     * @constant Used for multiple purposes. Therefore be careful of what chars
     * you use in the string.
     * 1. As a data-type (class) identifier within in-memory objects.
     * 2. As a component of filesystem directory/filenames of ADB. Therefore
     *    name should be short and lowercase. NTFS and FAT ignores case. Do not
     *    use any chars that are disallowed in any filesystem (NTFS, NFS, FAT,
     *    ext1,2,3&4, CIFS/SMB, WebDAV, GFS, any FS on which a customer may want to store
     *    their ADB).
     * 3. As a component of tag-names inside DNodes. Hence keep it short. Do not
     *    use any chars that are disallowed as Javascript properties.
     * 4. These values will get marshalled into JSON files, therefore make sure
     *    that they are all valid JSON property names (e.g. no backslash or quotes).
     * 5. To represent the data-type in general at other places in the code ...
     */
    var dt_eRecord = "e";  // Represents a E-Record (html-element record). Value is persisted.
    var dt_pRecord = "p";  // Represents a P-Record (password record). Value is persisted.
    var dt_etld    = "m";   // Represents a ETLD (Public Suffix) record. Value is persisted.

    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var fn_userid = "u";   // Represents field userid. Copy value from P_UI_TRAITS.
    /** @constant */
    var fn_pass = "p";       // Represents field password. Copy value from P_UI_TRAITS.
    /** @constant */
    var cm_getRecs = "cm_getRecs";     // Represents a getDB command
    var cm_loadDB = "cm_loadDB";
    var cm_createDB = "cm_createDB";
    var cm_getDBPath = "cm_getDBPath";
    var cm_importCSV = "cm_importCSV";

    var DICT_TRAITS={}, generic=undefined;
    DICT_TRAITS[generic] = Object.freeze(
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
    function imbueARec(that, dt, loc, date) // TODO: Make everything unwritable
    {
        // date is number of milliseconds since midnight Jan 1, 1970.
        if (date !== undefined && date !== null)
        {
            date = Number(date); 
        }
        
        Object.defineProperties(that,
        {
            // Record Type. Determines which dictionary this record belongs to and a bunch
            // of other logic based on DT_TRAITS
            //dt: {value: dt, enumerable: true},
            tm: {value: date, enumerable: true},
            // URL that this record pertains to. Determines where the record will sit within the URL-trie.
            // We're stripping extra data and shortening property names so as to conserve space in memory
            // as well as on disk and processing cycles as well. This becomes important when one has to
            // ingest thousands of records (ETLD has about 7K records)
            l: {value: newL(loc, dt), enumerable: true}
        });
    }
    
    function ERecord(loc, date, fieldName, tagName, id, name, type)
    {
        imbueARec(this, dt_eRecord, loc, date);
        Object.defineProperties(this, 
        {
            f: {value: fieldName, enumerable: true},
            t: {value: tagName, enumerable: true},
            id: {value: id, enumerable: true},
            n: {value: name, enumerable: true},
            y: {value: type, enumerable: true}
        });
    }
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function newERecord(loc, date, fieldName, tagName, id, name, type) {
        return new ERecord(loc, date, fieldName, tagName, id, name, type);    
    }

    function PRecord(loc, date, userid, pass)
    {
        imbueARec(this, dt_pRecord, loc, date);
        Object.defineProperties(this,
            {
                u: {value: userid, enumerable: true},
                p: {value: pass, enumerable: true}
            }
        );
    }
    
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

    function importCSV (dbPath, obfuscated, callbackFunc) 
    {
        rpcToMothership({cm: cm_importCSV, dbPath:dbPath, obfuscated: obfuscated}, callbackFunc);
    }

    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        var saveRecord = function (rec, dt, callbackFunc)
        {
            rec.cm = dt;
            if (callbackFunc) {
                rpcToMothership(rec, callbackFunc);
            }
            else {
                postMsgToMothership(rec);
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
            cm_createDB: {value: cm_createDB},
            cm_getDBPath: {value: cm_getDBPath},
            cm_importCSV: {value: cm_importCSV},
            saveRecord: {value: saveRecord},
            deleteRecord: {value: deleteRecord},
            newERecord: {value: newERecord},
            newPRecord: {value: newPRecord},
            getRecs: {value: getRecs},
            loadDB: {value: loadDB},
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