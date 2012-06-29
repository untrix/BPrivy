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
    /** @import-module-begin Common **/
    m = BP_MOD_COMMON; 
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-end **/    m = null;
    
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var ft_userid = "ft_userid";   // Represents field-type userid
    /** @constant */
    var ft_pass = "ft_pass";       // Represents field-type password
    /** @constant */
    var cm_getRecs = "cm_getRecs";     // Represents a getDB command
    var cm_loadDB = "cm_loadDB";
    var cm_createDB = "cm_createDB";
    var cm_getDBPath = "cm_getDBPath";
    var cm_importCSV = "cm_importCSV";
    
    /** Pseudo Inheritance */
    function imbueARec(that, type, loc, date)
    {
        Object.defineProperties(that,
        {
            // Record Type. Determines which dictionary this record belongs to and a bunch
            // of other logic based on DT_NATURES
            dt: {value: type, writable: false, enumerable: true, configurable: false},
            date: {value: date || Date.now(), writable: false, enumerable: true, configurable: false},
            // URL that this record pertains to. Determines where the record will sit within the URL-trie.
            loc: {value: loc, writable: true, enumerable: true, configurable: false}
        });
    }
    
    function ERecord()
    {
        imbueARec(this, dt_eRecord);
        var descriptor2 = {writable: true, enumerable: true, configurable: false};
        Object.defineProperties(this, 
        {
            fieldType: descriptor2,
            tagName: descriptor2,
            id: descriptor2,
            name: descriptor2,
            type: descriptor2
        });
        Object.seal(this);
    }
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function newERecord() {
        return new ERecord();    
    }

    function PRecord(loc, userid, pass)
    {
        imbueARec(this, dt_pRecord, loc);
        Object.defineProperties(this,
            {
                userid: {value: userid, writable: true, enumerable: true, configurable: false},
                pass: {value: pass, writable: true, enumerable: true, configurable: false}
            }
        );
        Object.seal(this);
    }
    
    function newPRecord(loc, userid, pass)
    {
        return new PRecord(loc, userid, pass);
    }
    
    function createDB (dbName, dbDir, callbackFunc) 
    {
        rpcToMothership({dt: cm_createDB, dbName:dbName, dbDir:dbDir}, callbackFunc);
    }

    function loadDB (dbPath, callbackFunc) 
    {
        rpcToMothership({dt: cm_loadDB, dbPath:dbPath}, callbackFunc);
    }

    function importCSV (dbPath, callbackFunc) 
    {
        rpcToMothership({dt: cm_importCSV, dbPath:dbPath}, callbackFunc);
    }

    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        var saveRecord = function (eRec)
        {
            postMsgToMothership(eRec);
        };
        
        var deleteRecord = function (erec)
        {
            console.log('Deleting Record ' + JSON.stringify(erec));
        };
        
        var getRecs = function(loc, callback)
        {
            return rpcToMothership({dt:cm_getRecs, loc: loc}, callback);
        };
        
        var getDBPath = function (callback)
        {
            return rpcToMothership({dt:cm_getDBPath}, callback);
        };

        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            ft_userid: {value: ft_userid},
            ft_pass: {value: ft_pass},
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
    
    return getModuleInterface();

}());
/** @ModuleEnd */