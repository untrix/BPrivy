/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, chrome, BP_MOD_TRAITS */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

var BP_MOD_MEMSTORE = (function () 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var m;
    /** @import-module-begin Error */
    var DIAGS = IMPORT(BP_MOD_ERROR);
    var BPError = IMPORT(DIAGS.BPError);
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS);
    /** @import-module-begin **/
    m = BP_MOD_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        dt_default = IMPORT(m.dt_default),
        dt_etld    = IMPORT(m.dt_etld);
    /** @import-module-begin Connector */
    m = IMPORT(BP_MOD_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs),
        newPRecord = IMPORT(m.newPRecord),
        newERecord = IMPORT(m.newERecord),
        newL = IMPORT(m.newL),
        DICT_TRAITS = IMPORT(m.DICT_TRAITS);
    /** @import-module-end **/    m = null;

    /** @globals-begin */

    /** 
     * @constant 
     * @enumerator return values of comparison function 
     */
    var EQUAL = Number(0),
        SUBSET = Number(-1),
        SUPERSET = Number(1),
        DIFFRNT = Number(2),
    /** Two in-mem Tries. Make sure this file is run only in one thread otherwise multiple
     * copies of the tries will get created.
     */
        g_pd, g_kd,
        COMMA = ",",
        DNODE_NEXT = 'N', 
        DNODE_TAG =  Object.freeze(
        {
            // These are DNode property prefixes. Each property shall have one and only one
            // of these prefixes, in order to identify the property type.
            // Individual DURL segments are prefixed based on their segment type in order
            // to ensure a one-to-one mapping between URL and its concatenated DURL
            // segments.
            NEXT:  DNODE_NEXT, // Prefix to all next-node-pointer properties - i.e. URL segments
            HOST:  DNODE_NEXT+'H', // Prefix for URL-hostname
            PATH:  DNODE_NEXT+'P', // Prefix for URL-path
            ETLD: 'E', // ETLD rule marker. 0=> regular ETLD rule, 1 implies an override 
                       // (e.g. !educ.ar). See publicsuffix.org for details.
            DATA: 'D', // Prefix for data - e.g. De for E-Rec, Dp for P-Rec etc.
            ITER: "I" // Property used by DNodeIterator to save notes
            //PORT: 'NO',
            //HTTP: 'NS',
            //HTTPS: 'NS'
            // SCHEME: 'NS',
            //QUERY: 'NQ',
            // getDataTag: {value: function (dt) {
                // if(dt) {
                    // return /*DNODE_TAG.DATA +*/ dt;
                // }
            // }},
        }),
        ETLD = {}, // in case loading the ETLD file fails
        ETLDProto =
        {
            // truncates supplied hostname array to its domain part - i.e. one more than ETLD.
            cullDomain: function (ha) // hostname array - reversed
            {
                var ETLD_TAG = DNODE_TAG.ETLD,
                    n = ha.length, i, j, curr, nx;

                // Match as many segments as possible.
                for (i=0, j=0, curr=ETLD; i<n; i++)
                {
                    if ((nx = curr[ha[i]]) || (nx = curr['*'])) {
                        curr = nx; j=i;
                    }
                    else {
                        break;
                    }
                }
                // We've matched as far as we could go - per algorithm prescribed by publicsuffix.org
                if (curr[ETLD_TAG]) {
                    if (curr[ETLD_TAG] === 1) { // value ===1 means an ETLD. Refer to build_tools.html
                        // We're at an etld. One more segment is allowable.
                        // Truncate ha and exit.
                        ha.length = (j+2)>n?n:(j+2);
                    }
                    else { // value === 2 means an override. Refer to build_tools.html
                        // We're at the domain. Truncate ha and exit.
                        ha.length = j+1;
                    }
                }                
            }
        };

    function isValidLocation(loc)
    {
        return (loc && 
                //(typeof loc.S=== "string") && (loc.S.length > 0) &&
                (typeof loc.H === "string") && (loc.H.length > 0)
                //(typeof loc.P === "string") && (loc.P.length > 0)
                );
    }

    function isValidARec(that)
    {
        if (that  && 
                //(typeof that.dt === "string") &&
                (typeof that.tm === "number") &&
                isValidLocation(that.l))
            { return true; }
        else {return false;}
    }

    /** @begin-static-class-defn DT_TRAITS */
    var DT_TRAITS = 
    {
        traits: {}, // Various traits objects defined & populated later/below.
        getTraits: function (dt) {
            var n = this.traits[dt];
            return n;
        },
        getDictTraits: function (dt) {
            return this.getTraits(dt).dict;
        }
    };
    
    // Most properties defined in DEFAULT_TRAITS are optional for urlMap type dictionaries.
    // Omitting second-level properties (e.g. dict.url_scheme) implies false for
    // boolean properties.
    var DEFAULT_TRAITS = Object.freeze(    {        // dict: Properties referenced by dictionary/trie/URLA.        // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.        dict: DICT_TRAITS[undefined],        // action: properties referenced by the Actions class.        actions: { // not needed by dt_etld            // history=true asserts we're interested in maintaining history.            // Will cause Actions class to keep history in memory            // A value of false asserts the opposite. Will            // cause Actions to only keep current value in memory.            history: 0        },
        file: {
            // An assert action is one that re-asserts the existing value. When a record
            // is received that has the same value as the most current value for its key,
            // but a different timestamp, then it is deemed as an assertion of an existing
            // value. 'save_asserts' dictates whether or not such records should be persisted
            // to storage. Persisting repeated values can significantly increase the storage
            // size for situations where the same values are repeatedly generated - e.g. E-Records.
            // Note that an assert with the same exact value and timestamp is a duplicate and will
            // always be ignored and discarded - the value of save_asserts traits will not
            // affect that behaviour.
            persist_asserts: false
        },        // Returns record key        getKey: function (rec) {return rec.k;},// not needed by dt_etld
        // return EQUAL or DIFFRNT. // not needed by dt_etld        compareVals: function(rec1, rec2)
        {
            if (rec1 && rec2)
            {
                if (rec1.v === rec2.v) { return EQUAL;}
                else {return DIFFRNT;}
            }
            else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                return EQUAL;
            }
            else { return DIFFRNT; }
        },
        // return true if the record is valid, false otherwise. Only needed for pRecords        isValidCSV: function(rec) {return Boolean(rec.k);}, // only needed for some types.
        // Returns value converted to a string suitable to be used as a property name
        valStr: function(rec) {return rec.v;},        csvHeader: function ()
        {
            return "key, value";
        },
        toCSV: function(rec)
        {
            return  (rec.k || "") + COMMA +
                    (rec.v || "");
        },
        toPersist: function (notes)
        {
            return (notes.isRecentUnique || (notes.isNewRepeat && this.persist_asserts));
        }
    });

    function PStoreTraits() 
    {
        Object.freeze(Object.defineProperties(this,
        {
            dict: {value:DICT_TRAITS[dt_pRecord]},
            actions: {value:{history:2}},
            file: {value:{persist_asserts: true}},
            getKey: {value:function(rec)
            {
                return rec.u;
            }},
            isValidCSV: {value:function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.u === "string") &&
                    (typeof rec.p === "string"));
            }},
            compareVals: {value:function(rec1, rec2)
            {
                if (rec1 && rec2)
                {
                    if (rec1.p === rec2.p) { return EQUAL;}
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT; }
            }},
            valStr: {value: function(rec)
            {
                return rec.p;
            }},
            csvHeader: {value: function ()
            {
                return "url,username,password";
            }},
            toCSV: {value: function(rec)
            {
                return  (rec.l.H + (rec.l.P || "")) + COMMA + 
                        (rec.u || "") + COMMA + 
                        (rec.p || "");
            }}
        }));   
    }
    PStoreTraits.prototype = DEFAULT_TRAITS;
    var PREC_TRAITS = DT_TRAITS.traits[dt_pRecord] = new PStoreTraits();

    function EStoreTraits()
    {
        Object.freeze(Object.defineProperties(this, 
        {
            dict: {value:DICT_TRAITS[dt_eRecord]},
            actions: {value:{history: 0}},
            file: {value:{persist_asserts: false}},
            getKey: {value:function(rec)
            {
                return rec.f;
            }},
            isValidCSV: {value:function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.f === "string") &&
                    (typeof rec.t === "string"));
            }},
            compareVals: {value:function(rec1, rec2) 
            {
                if (rec1 && rec2)
                {
                    if (rec1.t === rec2.t &&
                        rec1.id === rec2.id &&
                        rec1.n === rec2.n &&
                        rec1.y === rec2.y)
                        {
                            return EQUAL;
                        }
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT;}                
            }},
            valStr: {value: function(rec)
            {
                var str;
                if (rec.t) {
                    str += "T}" + rec.t;
                }
                if (rec.id) {
                    str += "I}" + rec.id;
                }
                if (rec.n) {
                    str += "N}" + rec.n;
                }
                if (rec.y) {
                    str += "Y}" + rec.y;
                }
                return str;
            }},
            csvHeader: {value: function ()
            {
                return "url,fieldName,tagName,id,name,type";
            }},
            toCSV: {value: function(rec)
            {
                return  (rec.l.H + (rec.l.P || "")) + COMMA + 
                        (rec.f || "") + COMMA +
                        (rec.t || "") + COMMA +
                        (rec.id|| "") + COMMA +
                        (rec.n|| "") + COMMA +
                        (rec.y|| "");
            }}
        }));
    }
    EStoreTraits.prototype = DEFAULT_TRAITS;
    var EREC_TRAITS = DT_TRAITS.traits[dt_eRecord] = new EStoreTraits();
    
    function SStoreTraits()
    {
        Object.freeze(Object.defineProperties(this, 
        {
            dict: {value:DICT_TRAITS[BP_MOD_TRAITS.dt_settings]},
            // everything else is same as DEFAULT_TRAITS            
        }));        
    }
    SStoreTraits.prototype = DEFAULT_TRAITS;
    DT_TRAITS.traits[BP_MOD_TRAITS.dt_settings] = new SStoreTraits();
    
    Object.freeze(DT_TRAITS);
    /** @end-static-class-defn DT_TRAITS **/    

    /** @globals-end **/

    /**
     * @begin-class-def Actions
     * Represents Actions on a given item/key. Figures out the latest value etc.
     * Inserted records should be Action Records with timestamps in them. If no timestamp
     * is found, the current timestamp will be inserted.
     */
    /** Constructor.
     * Acts as default constructor with no argument.
     * For an argument, it expects an Action Record or an Object object created from a
     * JSON serialized Action Record.
     */
    function Actions(dt, jo)
    {
        var tr = DT_TRAITS.getTraits(dt);
        if (jo)
        {
            Object.defineProperties(this,
                {
                    // Points to the most recent element of arecs
                    curr: {value: jo.curr, writable: true, enumerable: true},
                    // This is a collection of arecs. It is not just an array, it is
                    // also has valStr properties that point to the corresponding arec.
                    // In other words it is an array of arecs plus a value-index of arecs.
                    // The arecs are sorted in reverse chronological order - i.e. the newest
                    // one is at position 0. Consequently, this.curr === this.arecs[0]
                    arecs: {value: jo.arecs, enumerable:tr.actions.transfer_arecs}
                }
            );
        }
        else {
            Object.defineProperties(this,
                {
                    curr:{ writable:true, enumerable:true },
                    arecs:{ value:[], enumerable:tr.actions.transfer_arecs }
                }
            );
        }
        Object.seal(this);
    }
    
    /** Helper function invoked by insertNewVal only
    Actions.prototype.delHelper = function (dItem, i)
    {
        var valStr = dItem.traits.valStr(dItem);
        delete this[valStr];
    };*/
        
    
    /**
     * This is a helper function intended to be invoked by Actions.prototype.insert only.
     * 
     * Inserts a new value into the collection. Assumes that the value does not already
     * exist within the collection and that it has been verified to be recent enough
     * to be inserted either: 1) In the front or in the middle of the sorted list in which
     * case an item-overflow is possible. 2) Appended to the end of the sorted list in which case
     * an item-overflow is *not* possible otherwise we wouldn't have been invoked.
     * 
     * We optimize the algorithm for insertions from behind - i.e. older
     * items are visited first.
     * CAUTION: If the same value existed within the collection, then things
     * will go wrong. So ensure that the value is unique and also recent enough to be
     * inserted here.
     */
    Actions.prototype.insertNewVal = function (valStr, drec)
    {
        var dtt = drec.dtt,
            max = dtt.actions.history + 1,
            arec = drec.rec,
            arecs = this.arecs,
            len = arecs.length,
            res,
            memStats = MemStats.stats;
        
        if (len===0)        {            // This will happen the first time a key is created            arecs[0] = arec;            arecs[valStr] = arec;
            memStats.loaded++;        }        else if (arec.tm<=arecs[len-1].tm)        {            // In the case of loadDB, we load records in reverse chronological order. That            // allows us to simply push subsequent records to the end of the array.            arecs.push(arec);            arecs[valStr] = arec;
            memStats.loaded++;            // We don't need to check for item-overflow because that has already            // been checked before we were invoked.        }        // // Below clause may be useful in optimizing mergeDB use-case.        // // else if (arec.tm>=arecs[0])        // // {            // // arecs.unshift(arec);            // // arecs[valStr] = arec;            // // if (len>max)            // // delete the last item
            // // drec.notes.causedOverflow = true;
            // // memStats.fluff++;        // // }        else
        {
            // We will only get here in case of DB merges or if due to some reason
            // our record loading sequence was not strictly reverse-chronological - can't
            // guarantee that loading-order though have tried hard to.
            // Arecs are sorted in reverse chronological order here starting with the newest
            // at position 0
            
            res = this.arecs.some (function (item, i, items)
            {
                var dItm, l;
                if (arec.tm >= items[i].tm)
                {
                    // Insert one new item
                    items.splice(i, 0, arec);
                    memStats.loaded++;
                    // Update the value index
                    items[valStr] = arec;
                    // Delete upto one item
                    if ((l=items.length)>max)
                    {
                        dItm = items[l-1];
                        items.length = max; // remove item from array
                        delete items[dtt.valStr(dItm)]; // remove val-index
                        memStats.fluff++; memStats.loaded--;
                        drec.notes.causedOverflow = true;
                    }
                    return true;
                }
                else if (i===(len-1))
                {
                    // This is the last element in the iteration and our new record
                    // happens to be older than this one too. Therefore append it
                    // to the end of the list.
                    items.push(arec);
                    items[valStr] = arec;
                    memStats.loaded++;
                    // We don't need to check for item-overflow because that has already
                    // been checked before we were invoked.
                    return true;
                }
            }, this);
            if (!res) {
                DIAGS.logwarn(new BPError("Didn't insert arec", "NewRecordSkipped", "Arecs.Some===false"));
                memStats.fluff++;
            }
        }
        
        this.curr = arecs[0];
    };
    
    /**
     * Helper function to be invoked by Actions.prototype.insert only.
     * Is invoked when a new action is to be inserted with a value that already exists
     * in the collection.
     * Updates an existing arec with the provided timestamp. It also repositions the
     * record within arecs array, per its new timestamp. We don't know where in the sorted
     * array, the existing record lies, hence there is no particular preference regarding
     * list-visit order. Therefore we'll just visit from position 0 onwards because that
     * is convenient for coding.
     */
    Actions.prototype.updateTm = function (arec, tm)
    {
        var arecs = this.arecs, i;

        i = arecs.indexOf(arec);
        if (i !== -1)
        {
            arec.tm = tm;
            if (i>0)
            {
                // Remove item
                arecs.splice(i, 1);

                // Reposition item.
                for (i--; i>=0; i--)
                {
                    if (arec.tm<=arecs[i].tm) {
                        // insert one item
                        arecs.splice(i+1, 0, arec);
                        break;
                    }
                }
            }
            // else the item is already at the top. Can't be upgraded anymore than this
        }
        else {
            throw new BPError("Internal Error", "SkipRecord", "UpgradeItemNotFound");
        }
    };
    
    /** 
     *  Method. Insert a record into the Action Records collection 
     *  We're optimizing the file-loading use-case over new item insertions. This is so because
     *  thousands of items will be loaded at the time of file-load and the impact of performance
     *  will be obviously more visible there than when inserting one item (such as when adding
     *  a new password or knowledge record). File-loading will occur at startup and
     *  DB merging. With this approach, the items loaded from the DB are visited
     *  starting from the newest first, to the oldest last (we start at the end of
     *  the file and work our way towards the top. If there were multiple files to load,
     *  then we would start with the newest file first, and then work our way to the oldest file). 
     *  This will ensure that we'll have minimum data-structure insertions/deletions
     *  because the top traits.actions.history slots will fill up first and then the
     *  remaining ones will simply be discarded at first check (see insert code below). If
     *  we had visited the records in the opposite order, then we would've had to insert
     *  the older ones into the data-structure first, but those would quickly get deleted
     *  upon visitation of the newer records immediately afterwards. This would obviously
     *  be wasted effort.
     *  A consequence of the above strategy, is that records inserted
     *  at file-loading time will be older than those already present in the data-structure.
     *  Therefore we'll optimize the Actions.arecs datastructure insertions for the case
     *  where inserted records have older timestamps than those already present in the
     *  data-structure. That is, when linearly traversing the Actions.arecs array, we
     *  visit the older items first and then work our way to the newer ones.
     *  
     *  This approach is suboptimal for new record insertions which occur at runtime
     *  (such as inserting a new password or knowledge action) or at CSV import time.
     *  However, it optimizes the most used use-case - that of DB load at startup. It
     *  will incidentally also optimize DB merges (which is not expected to happen a lot 
     *  and therefore is not the reason for choosing this approach).
     *  As mentioned above, single-record insertions will be fast in terms of total time
     *  anyway, therefore optimizing bulk-loads is more important. That leaves the matter
     *  of CSV imports, which will stay unoptimized. Arguably, that's okay because CSV
     *  import will certainly have fewer records than corresponding action files and CSV
     *  import is supposed to be a rare activity only - the user is not expected to repeat
     *  that action again.
     */
    Actions.prototype.insert = function(drec)
    {
        var arec = drec.rec, dtt = drec.dtt,
            valStr = dtt.valStr(arec),
            max = dtt.actions.history + 1,
            oarec,
            memStats = MemStats.stats;
            
        if (this.arecs.length === max && arec.tm <= this.arecs[max-1].tm) 
        {
            // This record should not be inserted. Its date&time are older than the
            // oldest record we have and our collection is already full.
            drec.notes.isOverflow = true;
            memStats.fluff++;
            return;
        }
        
        // Now check if we already have this value.
        oarec = this.arecs[valStr];
        if (oarec) 
        {
            // This value already exists in the collection. Is this the same
            // record being replayed or an older record with same value?
            memStats.fluff++;
            if (arec.tm <= oarec.tm)
            {
                // Okay, same value, same timestamp. This is a repeated record.
                // Do nothing, just ignore it.
                drec.notes.isOldRepeat = true;
            }
            else if (arec.tm > oarec.tm)
            {
                // The same value being reused in a different
                // action. This could be the same value being set repeatedly multiple times -
                // or a re-use of an old value that had not been in use for sometime.
                // In terms of history we've decided to maintain the last N(3) unique
                // values rather than saving the last N actions. The latest timestamp
                // of each saved value will be saved as well. This strategy has the benefit
                // of automatically pruning all the fluff out of the system. That is,
                // continuously repeated/asserted values (as in user executing drag-n-drop
                // repeatedly and thereby generating spurious e-records). However,
                // it has the drawback of not faithfully maintaining the timeline. So,
                // if a user wanted to roll-back in time, we can't do that. Sure the user
                // won't loose any data, and we will be able to show her the older values
                // but we won't have the capability to one-click-go-back in time. The
                // utility of that use-case is very debatable especially since the user
                // will have access to her older passwords immediately after a sync/merge.
                // It does, however bring in a lot of complexity and fluff. Further more, this
                // use-case can easily be made possible by changing the code in this section
                // to not forget repeated values. Hence for now we'll go with the simpler
                // leaner arguably smarter but certainly novel approach.
                drec.notes.isNewRepeat = true;
                // In loadCSV case all record-timestamps are Date.now and therefore are
                // latest. Hence any value in the csv record will appear like a new value
                // or an upgrade. We don't want that to spoil the chronology of the DB
                // and hence we shall only import new values from CSV files. In that use-case
                // uct.noTmUpdates===true.
                // When loading DB files, we do want to honor the timestamp and hence
                // we do want to perform timestamp upgrades. In that case
                // uct.noTmUpdates===undefined
                if (!drec.uct || !drec.uct.noTmUpdates)
                {
                    // We'll save only the latest record. So, we need to remove the old record
                    // and insert the new one at the right location in the sorted list. This
                    // constitutes an upgrade of the old record with a newer timestamp.
                    this.updateTm(oarec, arec.tm);
                }
            }
        }
        else
        {
            // This is a unique value. However, we want to keep only the latest #traits.actions.history
            // values in the sorted list of values. This will make it to the list, but will bump out
            // an existing value if the list was full.
            this.insertNewVal(valStr, drec);
            drec.notes.isRecentUnique = true;
        }
    };
    Actions.prototype.newIt = function ()
    {
        return new TimeIterator(this);
    };
    function TimeIterator(acns)
    {
        Object.defineProperties(this,
        {
            i:      {value:acns.arecs.length, writable:true},
            arecs:  {value:acns.arecs}
        });
    }
    TimeIterator.prototype.next = function ()
    {
        // Return records in chronological order
        return this.arecs[--this.i]; // TODO: Should we floor 'this.i' at -1?
    };
    function newActions(dt, jo) {
        return new Actions(dt, jo);
    }
    /** @end-class-defn **/

    /** @begin-class-def DURL */
    /**
     * @constructor
     * @interface
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode. Discards URL-scheme, query and fragment
     * values as those are deemed irrelevant for our purpose.
     * NOTE: URLs are i18n and encoded in UTF8. International characters are
     * first-class citizens by virtue of Unicode. Nothing needs to be done towards
     * i18n and those characters do not need to be treated special.
     */
    function DURL (l, dt) // throws BPError
    {
        var ha, pa, pn, urla = [], i, s, //scm,
        dictTraits = DT_TRAITS.getDictTraits(dt);

        // Note: We need scheme and hostname at a minimum for a valid URL. We also need
        // pathname before we insert into TRIE, hence we'll append a "/" if path is missing.
        // But first ensure that this is indeed a URL.
        if (! (l && 
                (typeof l.H === "string") && (l.H.length > 0) ) )
            {throw new BPError(JSON.stringify(l), "BadURL");}
        
        //scm = (l.S?l.S.toLowerCase():null);

        if (dictTraits.url_host)
        {
            // Split hostname into an array of strings.       
            ha = l.H.split('.');
            ha.reverse();
            
            if (dictTraits.domain_only) 
            {
                ETLDProto.cullDomain(ha);
            }
        }
        
        if (dictTraits.url_path && l.P)
        {
            // At this point we're certain that l.P !== "/" hence no need to check.
            s = l.P;
            // Split pathname into path segments.
            // First remove leading slashes
            s = s.replace(/^\/+/,'');
            // Now split into an array of strings.
            pa = s.split('/');
        }

        // if (dictTraits.url_query && l.search)
        // {
            // qa = l.search.split('&');
        // }
        
        // if (l.O && dictTraits.url_port)        // {            // i = Number(l.O);            // switch(scm) {                // case PROTO_HTTP:                    // if(i !== 80) {pn = i;}                // break;                // case PROTO_HTTPS:                    // if(i !== 443) {pn = i;}                // break;                // default:                    // pn = i;            // }        // }
        
        // Construct the url segment array
        // if (dictTraits.url_scheme && scm) {            // switch(scm) {                // case PROTO_HTTP:                    // urla.push(DNODE_TAG.HTTP);                    // break;                // case PROTO_HTTPS:                    // urla.push(DNODE_TAG.HTTPS);                    // break;                // default:                    // urla.push(DNODE_TAG.SCHEME + scm);            // }        // }

        if (ha) 
        {
            for (i=0; i<ha.length; i++) 
            {
                // Host name
                urla.push(DNODE_TAG.HOST + ha[i].toLowerCase());
            }
        }
        //if (pn) {urla.push(DNODE_TAG.PORT + pn);} // Port Number
        if (pa) { // Path
            for (i=0; i<pa.length; i++) {
                if (pa[i] !== '') {
                    urla.push(DNODE_TAG.PATH + pa[i]);
                }
            }
        }
        
        // Object structure definition
        Object.defineProperties(this,
        {
            _a      : {value: urla, enumerable: true}, //writable=false, configurable=false
            _i      : {value: 0, writable: true, enumerable: true}, //configurable=false
        });
        Object.seal(this);
    }
    /** Returns current value and advances iterator if possible */
    DURL.prototype.incr = function() 
    {
        var i = this._i;
        if ((++this._i) > this._a.length) {this._i = i;}
        return this._a[i];
    };
    /** Returns current value and recedes iterator if possible */
    DURL.prototype.decr = function()
    {
        var i = this._i;
        if ((--this.i) < 0) { this.i = i; }
        return this._a[i];
    };
    DURL.prototype.count = function() 
    {
        return (this._a.length - this._i);
    };
    DURL.prototype.get = function(i) 
    {
        return this._a[i || this._i];
    };
    DURL.prototype.rwnd = function()
    {
        this._i = 0;
        return this._a[this._i];
    };
    DURL.prototype.pos = function() 
    {
        return this._i;
    };
    DURL.prototype.seek = function(i)
    {
        if(i) {
            this._i = i;
        }
    };
    DURL.prototype.isBelowTLD = function()
    {
        var s = this._a[this._i];
        return (s.search(/^\{[st]\}.+/) === (-1));
    };
    DURL.prototype.compare = function  (i2)
    {
        var i1 = this;
        while (i1.count() && i2.count())
        {
            if (i1.get() !== i2.get()) {
                return DIFFRNT;
            }
            else {
                i1.incr();
                i2.incr();
            }
        }
        
        if (i1.count() === i2.count() === 0) {return EQUAL;}
        else if (i1.count() < i2.count()) {return SUBSET;}
        else {return SUPERSET;}
    };
    /** @end-class-defn DURL **/
    
    /** @begin-class-def DNode */

    // Following properties will be added as needed
    // Payload objects. Theoretically a given node could contain payload from
    // multiple record-types - i.e.  K or P - however, here we've chosen to store
    // payload of only one type per dictionary/trie. Hence there is a separate
    // trie
    // per Rec type. Right now there are two - g_kd and g_pd. The payload's
    // property
    // value is constructed such that it won't clash with the properties for
    // the child-node pointers, which are URL-segments. Hence the key for the
    // payload is constructed such that it will never conflict with any URL
    // segment. At this writing the values chosen are {dt}e-rec and {dt}p-rec. Hence
    // a payload object of a DNode in the g_kdb dictionary will look like:
    // this["{dt}e-rec"] =
    // {"fn_userid":{"dt":"E-Record","fieldName":"fn_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},
    //  "fn_pass":{"dt":"E-Record","fieldName":"fn_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
    // The payload itself is an object with multiple properties. Each of the
    // properties is a 'record' (i.e. e-rec in k-dict and p-rec in p-dict).
    // The property-name is the record-key and is carried within each record
    // as the property named 'key'. Giving a generic name to the key makes it
    // possible to write generic dictionary code regardless of the dictionary
    // or record type. For each dictionary, the record keys are chosen
    // differently.
    // For e.g. in the case of e-dict, the record keys are from a fixed set :
    // 'fn_userid',
    // 'fn_password', 'dt_email' etc. etc. because that makes sense for that
    // domain. However,
    // for the p-dict the record keys can be anything because they are the
    // username.
    // If we wanted to store - say credit card numbers, then that would be a
    // completely separate dictionary with the card-number+type as the key but
    // no URL. Also, please note that for g-dict and p-dict, in the bigger
    // picture, URL is also part of the key. Now, if we were storing bookmarks,
    // then there would be no payload at all - only the URL key. We would need
    // to put markers in the URL-trie though, in order to mark which D-Nodes
    // represented an actual bookmark v/s which were merely on the path to an
    // actual bookmark. Because of the semantic and syntactic difference
    // between different data-types (or call it data-domains) I decided to create
    // a
    // separate trie per data-domain. Hence there is a separate trie/dictionary
    // for 'knowledge' records, a separate one for 'passwords' and for
    // 'bookmarks'
    // as well in the future.
    // A dt_pRecord payload will look like:
    // this["{dt}p-rec"] = {'username1':'password1', 'username2':'password2'};
    // References to child-nodes for walking down the url-trie. The key of the
    // child node
    // e.g. this['yahoo.'] = child-node;
    // e.g. this['google.'] = child-node;
    // e.g. this['/path1'] = child-node;
    // e.g. this['www'] = child-node;
    // e.g. this['www:8080'] = child-node;

    /** @constructor */
    function DNode ()
    {
        /* Contains
         * 1) DNODE_TAG properties whose value is one url segment (string) prefixed with the
         *    segment-type prefix - e.g. {p} for path. See DNODE_TAG.
         * 2) A 'data' property whose value is an object which contains one recMap for each
         *    data-type, keyed by its dt string (e.g. dt_pRecord and dt_eRecord).
         *    If there are no records stored in the DNode, then 'data' must be null and
         *    vice-versa. So, if you delete records from a DNode then be sure to delte the 'data'
         *    object as well.
         */
    }
    var DNProto = DNode.prototype;
    DNProto.getData = function(dt) {return this[DNODE_TAG.DATA+dt];};
    DNProto.putData = function(drec)
    {
        var r, ki,
            rec = drec.rec,
            dt = drec.dt,
            d = DNODE_TAG.DATA + dt;

        if (!this[d]) { // ensure that a data node has been allocated
            this[d] = {};
        }
        // var recsMap = this.d[dt];        // if (!recsMap) {            // this.d[dt] = (recsMap = {});        // }
        
        var recsMap = this[d];
        
        //r = recsMap[ki=DT_TRAITS.getKey(rec, dt)];
        r = recsMap[ki=drec.dtt.getKey(rec)];
        if (r) {
            r.insert(drec);
        }
        else {
            (recsMap[ki] = newActions(dt)).insert(drec);
        }
    };
    
    DNProto.putETLD = function(drec)
    {
        // Used for a simple map with URL as the key and record as value.
        // Simple struct for ETLD
        this[DNODE_TAG.ETLD] = drec.rec.val;
    };
    
    function newDNode () {return new DNode();}
    
    /** Helper function to DNProto.insert */
    DNProto.tryInsert = function (drec)
    {
        var rec = drec.rec,
            k = drec.urli.incr(),
            t = drec.dtt;
        if (!k) 
        {
            if (drec.dt === dt_etld) {
                DNProto.putETLD.apply(this, [drec]);
            }
            else {
                DNProto.putData.apply(this, [drec]);
            }
        }
        else 
        {   // continue walking down the trie
            var n = this[k];
            if (!n) {
                this[k] = (n = newDNode());
            }
            
            return n; // Non-recursive
            // n.insert(drec); Tail-recursive.
        }
    };
    /** Non-Recursive insert. Intended to be invoked at the root of a tree. */
    DNProto.insert = function (drec)
    {       
        var n = this;    
        do {
            n = DNProto.tryInsert.apply(n, [drec]);
        } while (n);
        
        return true;
    };
    DNProto.tryFind = function(urli) 
    {
        var k = urli.get(), n;
        if (!k) {
            return null; // exact URL match found!
        }
        else {
            n = this[k];
            if (!n) {
                return undefined; // exact URL match does not exist. We're a substring match.
            }
            else {
                urli.incr();
                return n; // Walk this way...
                //if (n instanceof DNode) {
                    //urli.incr();
                    //return n; // Not recursive.
                    // return n.findBest(urli); Tail recursive.
                //}
                /*else {//(instanceof KNode)
                    var urli2 = n.urli;
                    var c = compare(urli,urli2.rwnd());
                    switch (c) {
                        case DIFFRNT:
                        case SUBSET:
                            return this;
                        
                        case SUPERSET:
                        case EQUAL:
                            return n.next;
                    }
                }*/
            }
        }
    };
    /**
     * Non-recursive findBest match method. Invoked at the root node. Returns the
     * DNode that best matches {urli}
     * 
     * @param urli is an Iterator over url segments. The function will walk the url
     * segment array and navigate the dictionary by following nodes that match
     * the current url-segment. The walk will stop when/if a matching node isn't
     * found or if the url segment array is exhausted. Upon return, urli.count() 
     * indicates the number of unmatched url segments at the tail of the url array.
     * The segments before urli.count() matched. The matched node however, may not
     * have a value in it though. You will need to walk either up or down the tree
     * to find values depending on your use case.
    *
    DNProto.findBestNode = function (urli, dt) 
    {
        var n, r = this;
        // Walk down the dictionary tree.
        do {
            n = r;
            r = n.tryFind(urli);
        } while (r);
        
        return n;
    };
    */
    /**
     * Returns dt_eRecord records that best match urli.
     */
    DNProto.findERecsMapArray = function (l)
    {
        var n, r = this, stack = [], urli = new DURL(l, dt_eRecord);
        // Walk down the dictionary tree.
        do {
            // get all the e-recs encountered in the walk. They most
            // likely belong to the same website and therefore the knowledge may
            // apply across pages.
            if (DNProto.getData.apply(r, [dt_eRecord])) {
                stack.push(DNProto.getData.apply(r, [dt_eRecord]));
            }
            n = r;
            r = DNProto.tryFind.apply(n, [urli]);
        } while (r);
    
        //r = {};
        
        // In case of KDB records we need a full uri match.
        // Therfore we'll pick up the matched node's value
        // only if all of urli segments were matched - i.e.
        // if there were no remaining unmatched segments.
        // Note: Commenting out the below since I decided to
        // harvest ancestor nodes as well for heuristic matching (it is likely
        // that a website will reuse code for logins).
        // if (urli.count() === 0) {
            // r[dt_eRecord] = stack.pop();
        // }
        // Ancestor nodes are also harvested for heuristic
        // matching.
        return stack;
    };
    /**
     * Returns dt_pRecord records that best match urli.
     */
    DNProto.findPRecsMap = function(l) 
    {
        var n = this, n2, urli = new DURL(l, dt_pRecord);
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (DNProto.getData.apply(n, [dt_pRecord])) {n2 = n; /*idb = urli.pos();*/}
            n = DNProto.tryFind.apply(n, [urli]);
        } while (n);
        
        // in the case of PDB, the data is only useful if it is
        // below the top-level-domain. Hence we should check urli
        // to determine that.
        // Update: Since p-records are collected from actual websites,
        // the URLs should be correct. Therefore, am not verifying TLD anymore.
        if (n2) {
            //urli.seek(idb);
            //if (urli.isBelowTLD()) {
                return DNProto.getData.apply(n2, [dt_pRecord]);
            //}
        }
    };
    
    /**
     * Returns dt_eRecord and dt_pRecord records that best match urli.
     */
    function  getRecs (loc)
    {
        var kdb, pdb, r,
            l = newL(loc);
        r = {};
        r.eRecsMapArray = DNProto.findERecsMapArray.apply(DNode[dt_eRecord], [l]);
        r.pRecsMap = DNProto.findPRecsMap.apply(DNode[dt_pRecord],[l]);

        return r;
    }

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     * @param {Object} uct  Use-Case Traits. See function DRecord.UCT
     */
    function DRecord(rec, dt, uct)
    {
        // Construct url segment iterator.
        Object.freeze(Object.defineProperties(this,
        {
            urli: {value:new DURL(rec.l, dt)},
            rec:  {value:rec},
            dt:   {value:dt},
            dtt:  {value:DT_TRAITS.getTraits(dt)},
            uct:  {value:uct},
            notes:{value: {}}
        }));
    }
    
    function MemStats ()
    {
        Object.defineProperties(this,
        {
            loaded: {value:0, writable:true, enumerable:true},
            fluff:  {value: 0, writable:true, enumerable:true},
            bad:    {value:0, writable:true, enumerable:true}
        });
    }
    MemStats.prototype.clr = function ()
    {
        this.loaded = this.fluff = this.bad = 0;
    };
    MemStats.prototype.update = function (notes)
    {
        if (notes && notes.isRecentUnique) {
            if (notes.causedOverflow) {
                this.fluff++;
            }
            else {
                this.loaded++;
            }
        }
        else if (notes) { // if (rec.notes.isOldRepeat || rec.notes.isNewRepeat || rec.notes.isOverflow)
            this.fluff++;
        }
        else {
            this.bad++;
        }
    };
    /** @end-class-def DRecord **/

    // _dnode is optional and is only expected to be used at build-time by buildETLD.
    // At runtime, don't pass _dnode
    function insertRec (rec, dt, _dnode)
    {
        if (!_dnode) {_dnode = DNode[dt];}
        var dr = new DRecord(rec, dt);
        return DNProto.insert.apply(_dnode, [dr]) ? dr.notes : undefined;
    }
    function insertDrec (dr, _dnode)
    {
        if (!_dnode) {_dnode = DNode[dr.dt];}
        return DNProto.insert.apply(_dnode, [dr]) ? dr.notes : undefined;                
    }
    
    /** @end-class-def DNode **/

    function loadETLD ()
    {
        var xhr = new XMLHttpRequest();
        
        // xhr.onloadend = function (e)        // {             // ETLD = JSON.parse(e.target.response);        // };
        xhr.open("GET", BP_MOD_CS_PLAT.getURL('/data/etld.json'), false);
        xhr.send();
        var resp = xhr.response;        ETLD = JSON.parse(resp);
    }
        
    function clear ()
    {
        var i, dt,            dtList = Object.keys(DT_TRAITS.traits),            n = dtList.length;        for (i=0; i<n; i++)        {            dt = dtList[i];            DNode[dt] = newDNode();        }
        MemStats.stats = new MemStats();
    }
    
    function DNodeIterHelper(node, up, myKey)
    {
        return Object.defineProperties(this,
        {
            myKey:  {value:myKey},
            i:      {value:0, writable:true},
            keys:   {value:Object.keys(node)},
            up:     {value:up}
        });
    }
    DNodeIterHelper.prototype.nextKey = function ()
    {
        var key, found;
        for(key = this.keys[this.i++];
            key;
            key = this.keys[this.i++])
        {
            if (key.charAt(0) === DNODE_TAG.NEXT) // Only return next-node-pointer keys
            {
                found = true;
                break;
            }
        }
        
        return found? key : undefined;
    };

    /**
     * Iterate DNodes 
     * @param {String} dt - data-type
     */
    function DNodeIterator (root, dt)
    {
        if (!root) {throw new BPError("", "InternalError", "BadArgument");}
        Object.defineProperties(this,
        {
            node:   {value:root, writable:true},
            dt:     {value:dt}
        });
        this.visit(root, undefined); // specifying 'undefined' for self-documentation
    }
    /** Internal Private method */
    DNodeIterator.prototype.visit = function (node, up, key)
    {
        //node.initIterHelper(up);
        node[DNODE_TAG.ITER] = new DNodeIterHelper(node, up, key);
        this.node = node;
        return node;
    };
    DNodeIterator.prototype.next = function ()
    {
        var notes, key;
        
        // Walk back up the tree if dead-ended, until you get to a node which has at
        // least one unvisited child remaining, or if you get back to the top/root of
        // the tree.
        for (notes = this.node[DNODE_TAG.ITER], key = notes.nextKey();
             !key;
             notes = this.node[DNODE_TAG.ITER], key = notes.nextKey())
        {
            // No more children at this level. Go back up the tree.
            delete this.node[DNODE_TAG.ITER]; // clean-up this node.
            this.node = notes.up;
            if (!this.node) {
                break;
            }
        }
        
        // Step down below the node unless we're back at the top of the tree.
        if (key)
        {
            return this.visit(this.node[key], this.node, notes.myKey+key);// visit a child node
        }
        // else walk is over; return undefined.
    };
    /**
     * Walks the DNode tree and calls a callback for each action-record in the tree. It
     * visits all actions, both current as well as historical.
     * @param {Object} callback
     */
    DNodeIterator.prototype.walk = function (callback, ctx)
    {
        var dn, recs, rIt, acoll, aIt, arec;
        while ((dn=this.next()))
        {
            // Can't write dn.getData(dt) because dn maybe a JSON parsed object.
            if ((recs=DNProto.getData.apply(dn, [this.dt])))
            {
                rIt = new BP_MOD_TRAITS.RecsIterator(recs);
                while ((acoll=rIt.next()))
                {
                    aIt = new TimeIterator(acoll);
                    for (arec=aIt.next(); 
                         arec; 
                         arec=aIt.next())
                    {
                        callback(arec, ctx);
                    }
                }
            }
        }        
    };

    /**
     * Walks the DNode tree and calls a callback for each current-record in the tree. It
     * visits only current records of the Actions collections. Skips the historical records.
     * @param {Object} callback
     */
    DNodeIterator.prototype.walkCurr = function (callback, ctx)
    {
        var dn, recs, rIt, acoll, aIt, arec;
        while ((dn=this.next()))
        {
            // Can't write dn.getData(dt) because dn maybe a JSON parsed object.
            if ((recs=DNProto.getData.apply(dn, [this.dt])))
            {
                rIt = new BP_MOD_TRAITS.RecsIterator(recs);
                while ((acoll=rIt.next()))
                {
                    callback(acoll.curr, ctx);
                }
            }
        }        
    };
    function newDNodeIterator (dt)
    {
        return new DNodeIterator(DNode[dt], dt);
    }

    //Assemble the interface    
    var iface = Object.freeze(
    {
        insertRec:   insertRec,
        insertDrec:  insertDrec,
        getRecs:     getRecs,
        DT_TRAITS:   DT_TRAITS,
        PREC_TRAITS: PREC_TRAITS,
        EREC_TRAITS: EREC_TRAITS,
        clear:       clear,
        loadETLD:    loadETLD,
        newDNode:    newDNode, // used by build_tools
        DURL:        DURL, // used by build_tools
        DRecord:     DRecord,
        DNProto:     DNProto,
        DNODE_TAG:   DNODE_TAG,
        newDNodeIterator: newDNodeIterator,
        getDT:       function(dt){return DNode[dt];},
        getStats:    function(){return MemStats.stats;},
        putDB:       function(dNode, dt){DNode[dt] = dNode;},
        getDB:       function(dt){return DNode[dt];}
    });

    console.log("loaded memstore");
    return iface;
}());
