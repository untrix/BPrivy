/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
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
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_win = g.g_win,
        g_doc = g_win.document;
    /** @import-module-begin **/
    var BP_COMMON = IMPORT(g.BP_COMMON);
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
        dict_t_pRecord = IMPORT(m.dict_t_pRecord),
        dt_etld    = IMPORT(m.dt_etld),   // Represents a ETLD (Public Suffix) record. Value is persisted.
        fn_userid = IMPORT(m.fn_userid),   // Represents field userid. Copy value from P_UI_TRAITS.
        fn_pass = IMPORT(m.fn_pass);       // Represents field password. Copy value from P_UI_TRAITS.
    /** @import-module-end **/    m = null;

    /** @constant */
    var cm_clickBP      = "cm_clickBP",  // Extension button clicked/activated
        cm_getFrameUrl  = "cm_getFrameUrl", //Called by panel.js to determine active frame.
        cm_autoFillable="cm_autoFillable", // get or put autoFillable Status
        cm_autoFill     = "cm_autoFill",
        cm_getRecs      = "cm_recs",     // Represents a getDB command
        cm_loadDB       = "cm_load",
        cm_unloadDB     = "cm_unload",
        cm_off          = "cm_off",
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
        cm_saveRec      = "cm_saveRec",
        cm_deleteDB		= "cm_deleteDB";

    var DICT_TRAITS={};

    /** Dictionaries
     *  Add a DICT_TRAIT entry here to instantiate a new dictionary. The DICT_TRAITS object
     *  could also be stored along with the data, thereby allowing runtime schema instantiation,
     *  and discovery but that's something for the future. For now all dictionaries are
     *  hard-coded here. The data-types and their behaviours, however are hard-coded as part of
     *  MEMSTORE.
     */
    /** list of dictionary traits properties */
    var TRAITS_PROPS = DICT_TRAITS[undefined] = Object.freeze(Object.create(Object.prototype,
    {
        url_scheme:{}, // currently unused by DURL
        url_host:{},
        domain_only:{},
        url_path:{},
        url_query:{}, // currently unused by DURL
        url_port:{}, // currently unused by DURL
        url_notags:{}, // Forces DURL to not pre-fix url-segments with DNODE_TAGs. Needed for etld.
        dt:{} // represents data_type held by this dictionary. Is usually same as the dict_type.
    }));

    DICT_TRAITS[dt_pRecord] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host: {value:true},
        url_path: {value:false},
        domain_only: {value:true}, // Store records against domain only - e.g. facebook.com
                                   // instead of apps.facebook.com.
        dt: {value:dt_pRecord}
    }));
    DICT_TRAITS[dict_t_pRecord] = DICT_TRAITS[dt_pRecord];

    DICT_TRAITS[dt_eRecord] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:true},
        url_path:{value:true},
        dt: {value:dt_eRecord}
    }));

    DICT_TRAITS[dt_etld] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:true},
        url_notags:{value:true}, // Forces DURL to not insert DNODE_TAGS into the url-segments.
        dt: {value:dt_etld}
    }));

    DICT_TRAITS[MOD_TRAITS.dt_settings] = Object.freeze(Object.create(TRAITS_PROPS,
    {
        url_host:{value:false},
        url_path:{value:false},
        dt: {value:MOD_TRAITS.dt_settings}
    }));

    function L(loc, dt)
    {
        Object.defineProperties(this,
        {
            H: {enumerable:true,
                value: (loc.hostname || undefined)},
            P: {enumerable:true,
                value: (DICT_TRAITS[dt].url_path && loc.pathname && (loc.pathname !== "/"))?loc.pathname:undefined}
            //_U: {enumerable:true, value: loc.href}
        });
        Object.seal(this);
    }
    L.prototype.equal = function(l2)
    {
        // scheme/protocol is left out on purpose
        return ((this.H===l2.H) && (this.P===l2.P));
    };
    /**
     * Returns a partial Location object suitable for passing as an argument to Action constructor.
     */
    L.prototype.toLoc = function ()
    {
        if (this._U) {
            return BP_COMMON.parseURL(this._U);
        }
        else {
            return {hostname:this.H, pathname:(this.P||"/")};
        }
    };
    //L.prototype.getURL = function () { return this._U; };
    L.prototype.toURL = function ()
    {
        var url;
        if (this._U) {return this._U;}

        url = "http://";
        if (this.H) {
            url += this.H;
        }
        if (this.P) {
            url += this.P;
        }

        return url;
    };

    function newL (loc, dt) {
        return (new L(loc,dt));
    }

    /** Pseudo Inheritance */
    function Action(dt, loc, date, type)
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
            // Type of action. Can have one of the following enumerated values:
            // 1. undefined: insert/assert action
            // 2. 'd': delete action
            // 3. 'pd': Permanent delete (empty recycle-bin) action.
            a: {value:type, enumerable: true}
        });
    }
    //Action.prototype.setDeleted = function () { this.a = 'd'; };
    Action.isDelete = function(actn) { return Boolean((actn.a==='d') || (actn.a==='pd')); }
    Action.isPermDelete = function (actn) { return Boolean(actn.a==='pd'); }

    // This should ideally be part of ItemHistory class, but that would require a dependency
    // on Memstore, which is not a good idea since this function is used by bp_cs.
    function itemDeleted(iHist){return Action.isDelete(iHist.curr);}
    function itemPermDeleted(iHist){return Action.isPermDelete(iHist.curr);}
    // function itemDeleted(iHist){return Boolean(iHist.curr.a);}
    // function itemPermDeleted(iHist){return Boolean(iHist.curr.a==='pd');}

    function EAction(loc, date, atype, fieldName, tagName, id, name, type, formId, formNm)
    {
        Action.apply(this, [dt_eRecord, loc, date, atype]);
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
    EAction.prototype = Object.create(Action.prototype,{});

    EAction.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    EAction.prototype.newDelActn = function ()
    {
        return new EAction(L.prototype.toLoc.apply(this.l), Date.now(), 'd', this.f);
    };
    function newEAction(loc, date, fieldName, tagName, id, name, type, formId, formNm) {
        return new EAction(loc, date, undefined, fieldName, tagName, id, name, type, formId, formNm);
    }

    function PAction(loc, date, type, userid, pass)
    {
        Action.apply(this, [dt_pRecord, loc, date, type]);
        Object.defineProperties(this,
            {
                u: {value: userid, enumerable: true}, // key
                p: {value: pass, enumerable: true}
            }
        );
        Object.seal(this);
    }
    PAction.prototype = Object.create(Action.prototype,{});
    PAction.prototype.newDelActn = function ()
    {
        return new PAction(L.prototype.toLoc.apply(this.l), Date.now(), 'd', this.u);
    };

    function getDTProto(dt)
    {
        switch (dt)
        {
            case dt_pRecord: return PAction.prototype;
            case dt_eRecord: return EAction.prototype;
        }
    }

    function ItemIterator (itemsMap, skipDeleted, sort)
    {
        var k = itemsMap ? (sort ? Object.keys(itemsMap).sort() : Object.keys(itemsMap)) : BP_COMMON.EMPTY_ARRAY;
        Object.defineProperties(this,
        {
            _o: {value: itemsMap},
            _k: {value: k},
            _n: {value: k.length},
            _i: {value: 0, writable:true},
            _sd: {value: skipDeleted}
        });
        Object.seal(this);
    }
    ItemIterator.prototype.next = function ()
    {
        var iHist = null, t;
        // Find the next item.
        while (this._i < this._n)
        {
            t = this._o[this._k[this._i++]];
            // Return this item  unless we're skipping
            // deletes and ths was a deleted item.
            if (!(this._sd && itemDeleted(t))) {
                iHist=t; break;
            }
        }

        return iHist;
    };
    ItemIterator.prototype.num = function ()
    {
        var i = 0,
            n = 0;
        while (i < this._n)
        {
            if ((!this._sd) || (!itemDeleted(this._o[this._k[i]]))) { n++; }
            ++i;
        }
        return n;
    };

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

        function newPAction(loc, date, userid, pass)
        {
            return new PAction(loc, date, undefined, userid, pass);
        }

        function panelClosed(loc)
        {
            postMsgToMothership({cm:cm_closed, loc:loc});
        }

        function putAutoFillable(rq)
        {
            rq.cm = cm_autoFillable;
            postMsgToMothership(rq);
        }

        function openPath(path, ops)
        {
            postMsgToMothership({cm:'cm_openPath', path:path, ops:ops});
        }

	    function unloadDB(clearCrypt, cback)
	    {
	        rpcToMothership({cm: cm_unloadDB}, cback);
	    }

        function off(cback)
        {
            rpcToMothership({cm: cm_off}, cback);
        }

        //Assemble the interface
        var iface = {};
        Object.defineProperties(iface,
        {
            // MOD_DT
            dt_eRecord: {value: dt_eRecord},
            dt_pRecord: {value: dt_pRecord},
            DICT_TRAITS: {value: DICT_TRAITS},
            newL: {value: newL},
            L: {value: L},
            lToLoc: {value: function(l){return L.prototype.toLoc.apply(l);}},
            getDTProto: {value:getDTProto},
            Action: {value: Action},
            newEAction: {value: newEAction},
            newPAction: {value: newPAction},
            itemDeleted:{value: itemDeleted},
            itemPermDeleted:    {value: itemPermDeleted},
            ItemIterator:{value: ItemIterator},
            fn_userid: {value: fn_userid},
            fn_pass: {value: fn_pass},
            // MOD_PROTO
            cm_clickBP: {value: cm_clickBP},
            cm_getFrameUrl:{value:cm_getFrameUrl},
            cm_autoFillable:{value:cm_autoFillable},
            cm_autoFill:{value:cm_autoFill},
            cm_getRecs: {value: cm_getRecs},
            cm_loadDB:  {value: cm_loadDB},
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
            cm_deleteDB:{value: cm_deleteDB},
            // MOD_CONNECT
            saveRecord: {value: saveRecord},
            saveTempRec: {value: saveTempRec},
            sendDelActn: {value: sendDelActn},
            getRecs: {value: getRecs},
            getDBPath: {value: getDBPath},
            panelClosed: {value: panelClosed},
            putAutoFillable: {value: putAutoFillable},
            openPath: {value: openPath},
            unloadDB: {value: unloadDB},
            off: {value: off}
        });
        Object.freeze(iface);

        return iface;
    }

    BP_ERROR.logdebug("constructed mod_connector");
    return getModuleInterface();

}
/** @ModuleEnd */