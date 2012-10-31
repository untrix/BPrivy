/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Connector
 */

function BP_GET_CONNECT(g)
{
    "use strict";
    var window = null, document = null, console = null,
        g_win = g.g_win,
        g_doc = g_win.document;
    /** @import-module-begin CSPlatform **/
    var m = IMPORT(g.BP_CS_PLAT),
        postMsgToMothership = IMPORT(m.postMsgToMothership),
        rpcToMothership = IMPORT(m.rpcToMothership);
    /** @import-module-begin **/
    var BP_ERROR = IMPORT(g.BP_ERROR);
    /** @import-module-begin Traits **/
    m = g.BP_TRAITS;
    var MOD_TRAITS = IMPORT(m),
        dt_eRecord = IMPORT(m.dt_eRecord),  // Represents a E-Record (html-element record). Value is persisted.
        dt_pRecord = IMPORT(m.dt_pRecord),  // Represents a P-Record (password record). Value is persisted.
        dt_etld    = IMPORT(m.dt_etld),   // Represents a ETLD (Public Suffix) record. Value is persisted.
        fn_userid = IMPORT(m.fn_userid),   // Represents field userid. Copy value from P_UI_TRAITS.
        fn_pass = IMPORT(m.fn_pass);       // Represents field password. Copy value from P_UI_TRAITS.
    /** @import-module-end **/    m = null;

    /** @constant */
    var cm_getRecs      = "cm_recs",     // Represents a getDB command
        cm_loadDB       = "cm_load",
        cm_unloadDB     = "cm_unload",
        cm_mergeDB      = "cm_mrgDb",
        cm_mergeInDB    = "cm_mrgIn",
        cm_mergeOutDB   = "cm_mrgOut",
        cm_createDB     = "cm_crDB",
        cm_getDBPath    = "cm_dbPth",
        cm_importCSV    = "cm_imCSV",
        cm_exportCSV    = "cm_exCSV",
        cm_compactDB    = "cm_cmDB",
        cm_cleanDB      = "cm_clnDB",
        cm_getDB        = "cm_getDB",
        cm_getDN        = "cm_getDN",
        cm_getDomn      = "cm_getDomn",
        cm_closed       = "cm_closed",
        cm_tempRec      = "cm_tempRec",
        cm_saveRec      = "cm_saveRec";

    var DICT_TRAITS={};
   
    /** list of traits properties */
    var TRAITS_PROPS = DICT_TRAITS[undefined] = Object.freeze(Object.create(Object.prototype,
    {
        url_scheme:{}, // currently unused by DURL
        url_host:{},
        domain_only:{},
        url_path:{},
        url_query:{}, // currently unused by DURL
        url_port:{} // currently unused by DURL
    }));
    
    DICT_TRAITS[dt_pRecord] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host: {value:true},
        url_path: {value:false},
        domain_only: {value:true} // Store records agains domain only - e.g. facebook.com
        // instead of apps.facebook.com.
    }));

    DICT_TRAITS[dt_eRecord] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:true},
        url_path:{value:true}
    }));

    DICT_TRAITS[dt_etld] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:true}
    }));
    
    DICT_TRAITS[MOD_TRAITS.dt_settings] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:false},
        url_path:{value:false}
    }));
    
    function L(loc, dt)
    {
        Object.defineProperties(this,
        {
            H: {enumerable:true,
                value: (loc.hostname || undefined)},
            P: {enumerable:true,
                value: (DICT_TRAITS[dt].url_path && loc.pathname && (loc.pathname !== "/"))?loc.pathname:undefined}
            //U = loc.href; Was introduced for CSV exports. Removed later for performance.
        });
        Object.seal(this);
    }
    L.prototype.equal = function(l2)
    {
        return ((this.H===l2.H) && (this.P===l2.P));
    };
    /**
     * Returns a partial Location object suitable for passing as an argument to Action constructor.
     */
    L.prototype.toLoc = function ()
    {
        return {hostname:this.H, pathname:(this.P||"/")};
    };

    function newL (loc, dt) { 
        return (new L(loc,dt));
    }

    /** Pseudo Inheritance */
    function Action(dt, loc, date, actn)
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
            // The action being performed. An undefined value means an insert action. The
            // only other legal value is 'd', meaning delete.
            a: {value:actn, enumerable: true}
        });
    }
    //Action.prototype.setDeleted = function () { this.a = 'd'; };
    
    function ERecord(loc, date, actn, fieldName, tagName, id, name, type, formId, formNm)
    {
        Action.apply(this, [dt_eRecord, loc, date, actn]);
        Object.defineProperties(this, 
        {
            f: {value: fieldName, enumerable: true}, // key
            t: {value: tagName, enumerable: true},
            id: {value: id, enumerable: true},
            n: {value: name, enumerable: true},
            y: {value: type, enumerable: true},
            fid:{value: formId, enumerable: true}, // introduced in 0.5.19
            fnm:{value: formNm, enumerable: true}  // introduced in 0.5.19
        });
        Object.seal(this);
    }
    ERecord.prototype = Object.create(Action.prototype,{});

    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    ERecord.prototype.newDelActn = function ()
    {
        return new ERecord(L.prototype.toLoc.apply(this.l), Date.now(), 'd', this.f);
    };
    function newERecord(loc, date, fieldName, tagName, id, name, type, formId, formNm) {
        return new ERecord(loc, date, undefined, fieldName, tagName, id, name, type, formId, formNm);    
    }

    function PRecord(loc, date, actn, userid, pass)
    {
        Action.apply(this, [dt_pRecord, loc, date, actn]);
        Object.defineProperties(this,
            {
                u: {value: userid, enumerable: true}, // key
                p: {value: pass, enumerable: true}
            }
        );
        Object.seal(this);
    }
    PRecord.prototype = Object.create(Action.prototype,{});
    PRecord.prototype.newDelActn = function ()
    {
        return new PRecord(L.prototype.toLoc.apply(this.l), Date.now(), 'd', this.u);
    };    
    
    function getDTProto(dt)
    {
        switch (dt)
        {
            case dt_pRecord: return PRecord.prototype;
            case dt_eRecord: return ERecord.prototype;
        }
    }    
    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        function saveRecord(rec, dt, callbackFunc, dontGet)
        {
            var req = {cm:cm_saveRec, dt:dt, rec:rec, dontGet:dontGet};
            if (callbackFunc && (!dontGet)) {
                req.loc = L.prototype.toLoc.apply(rec.l); // argument to getRecs
            }
            BP_ERROR.logdebug('Producing Insert Action' + JSON.stringify(rec));
            if (callbackFunc) {
                rpcToMothership(req, callbackFunc);
            }
            else {
                postMsgToMothership(req);
            }
        }
        function saveTempRec(rec, dt, callbackFunc, dontGet)
        {
            var req = {cm:cm_tempRec, dt:dt, rec:rec, dontGet:dontGet };
            if (callbackFunc && (!dontGet)) {
                req.loc = L.prototype.toLoc.apply(rec.l); // argument to getRecs
            }
            BP_ERROR.logdebug('Producing Insert Action to temp: ' + JSON.stringify(rec));
            if (callbackFunc) {
                rpcToMothership(req, callbackFunc);
            }
            else {
                postMsgToMothership(req);
            }
        }

        function sendDelActn(_rec, dt, callback, dontGet, toTemp)
        {
            var del = getDTProto(dt).newDelActn.apply(_rec);
            //BP_ERROR.logdebug('Producing Delete Action' + (toTemp?' to temp: ':': ') + JSON.stringify(del));
            if (toTemp) {
                saveTempRec(del, dt, callback, dontGet);
            }
            else {
                saveRecord(del, dt, callback, dontGet);                
            }
        }
        
        var getRecs = function(loc, callback)
        {
            return rpcToMothership({cm:cm_getRecs, loc: loc}, callback);
        };
        
        var getDBPath = function (callback)
        {
            return rpcToMothership({cm:cm_getDBPath}, callback);
        };

        function newPRecord(loc, date, userid, pass)
        {
            return new PRecord(loc, date, undefined, userid, pass);
        }
        
        function panelClosed(loc)
        {
            postMsgToMothership({cm:cm_closed, loc:loc});   
        }
        
        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            // MOD_DD
            dt_eRecord: {value: dt_eRecord},
            dt_pRecord: {value: dt_pRecord},
            dt_etld:    {value: dt_etld},
            DICT_TRAITS: {value: DICT_TRAITS},
            newL: {value: newL},
            lToLoc: {value: function(l){return L.prototype.toLoc.apply(l);}},
            getDTProto: {value:getDTProto},
            newERecord: {value: newERecord},
            newPRecord: {value: newPRecord},
            fn_userid: {value: fn_userid},
            fn_pass: {value: fn_pass},
            // MOD_PROTO
            cm_getRecs: {value: cm_getRecs},
            cm_loadDB: {value: cm_loadDB},
            cm_unloadDB: {value: cm_unloadDB},
            cm_mergeInDB: {value: cm_mergeInDB},
            cm_mergeOutDB: {value: cm_mergeOutDB},
            cm_mergeDB: {value: cm_mergeDB},
            cm_createDB: {value: cm_createDB},
            cm_getDBPath: {value: cm_getDBPath},
            cm_importCSV: {value: cm_importCSV},
            cm_exportCSV: {value: cm_exportCSV},
            cm_compactDB: {value: cm_compactDB},
            cm_cleanDB: {value: cm_cleanDB},
            cm_getDB:   {value: cm_getDB},
            cm_getDN:   {value: cm_getDN},
            cm_getDomn: {value: cm_getDomn},
            cm_closed:  {value: cm_closed},
            cm_tempRec: {value: cm_tempRec},
            cm_saveRec: {value: cm_saveRec},
            // MOD_CONNECT
            saveRecord: {value: saveRecord},
            saveTempRec: {value: saveTempRec},
            sendDelActn: {value: sendDelActn},
            getRecs: {value: getRecs},
            getDBPath: {value: getDBPath},
            panelClosed: {value: panelClosed}
        });
        Object.freeze(iface);

        return iface;
    }
    
    BP_ERROR.log("constructed mod_connector");
    return getModuleInterface();

}
/** @ModuleEnd */