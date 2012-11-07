/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, IMPORT*/
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

function BP_GET_MEMSTORE(g)
{
    "use strict";
    var window = null, document = null, console = null,
        g_doc = g.g_win.document;
    
    /** @import-module-begin Error */
    var m = g.BP_ERROR,
        BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m),
        PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS);
    /** @import-module-begin **/
    m = g.BP_TRAITS;
    var BP_TRAITS = IMPORT(m),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        dt_default = IMPORT(m.dt_default),
        dt_etld    = IMPORT(m.dt_etld);
    /** @import-module-begin Connector */
    m = IMPORT(g.BP_CONNECT);
    var BP_CONNECT = IMPORT(m),
        newL = IMPORT(m.newL),
        DICT_TRAITS = IMPORT(m.DICT_TRAITS);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
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
            HOST:  'NH', // Prefix for URL-hostname
            PATH:  'NP', // Prefix for URL-path
            ETLD:  'E', // ETLD rule marker. 0=> regular ETLD rule, 1 implies an override 
                       // (e.g. !educ.ar). See publicsuffix.org for details.
            DATA:  'D', // Prefix for data - e.g. De for E-Rec, Dp for P-Rec etc.
            ITER:  "I", // Property used by DNodeIterator to save notes
            URL:   "U", // 'Site': Concatenation of URL segments leading upto the DNode.
            LISTENERS: 'L', // Event Listeners for a given dnode or entire tree (in case of root node only)
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
        MOD_ETLD =
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
                // We've matched as far as we could go - per algorithm prescribed by
                // publicsuffix.org
                if (curr[ETLD_TAG]) {
                    if (curr[ETLD_TAG] === 1) { // value ===1 means an ETLD. Refer to build_tools.html
                        // We're at an etld. One more segment is allowable.
                        // Truncate ha and exit.
                        ha.length = (j+2)>n?n:(j+2);
                        return true;
                    }
                    else { // value === 2 means an override. Refer to build_tools.html
                        // We're at the domain. Truncate ha and exit.
                        ha.length = j+1;
                        return true;
                    }
                }                
            },
            getDomain: function (loc)
            {
                // Split hostname into an array of strings.       
                var ha = loc.hostname.split('.');
                ha.reverse();
                if (MOD_ETLD.cullDomain(ha)) {
                    return ha.reverse().join('.');
                }
                else {
                    return null;
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

    function isValidAction(that)
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
    var DEFAULT_TRAITS = Object.freeze(    {        // dict: Properties referenced by dictionary/trie/URLA.        // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.        dict: DICT_TRAITS[undefined],        // action: properties referenced by the ItemHistory class.        iHistory: { // not needed by dt_etld            // history=true asserts we're interested in maintaining history.            // Will cause ItemHistory class to keep history in memory            // A value of false asserts the opposite. Will            // cause ItemHistory to only keep current value in memory.            history: 0        },
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
        },        // Returns record key        getKey: function (actn) {return actn.k;},// not needed by dt_etld
        // return true if the record is valid, false otherwise. Only needed for pRecords        isValidCSV: function(actn) {return Boolean(actn.k);}, // only needed for some types.
        // Returns value converted to a string suitable to be used as a property name
        valStr: function(actn)
        {
            if (actn.a) { // delete action
                return this.DELETE_ACTION_VAL;
            }
            else {return "V}" + actn.v;}
        },
        csvHeader: function ()
        {
            return "key, value";
        },
        toCSV: function(actn)
        {
            return  (actn.k || "") + COMMA +
                    (actn.v || "");
        },
        toPersist: function (notes)
        {
            return (notes.isRecentUnique || (notes.isRecentRepeat && ((notes.causedCurrChange) || this.persist_asserts)));
        },
        DELETE_ACTION_VAL: "D}" // to be used as part of prototype
    });

    function PStoreTraits() 
    {
        Object.freeze(Object.defineProperties(this,
        {
            dict: {value:DICT_TRAITS[dt_pRecord]},
            iHistory: {value:{history:2}},
            file: {value:{persist_asserts: true}},
            getKey: {value:function(actn)
            {
                return actn.u;
            }},
            isValidCSV: {value:function(actn)
            {
                return (isValidAction(actn) && 
                    (typeof actn.u === "string") &&
                    (typeof actn.p === "string"));
            }},
            valStr: {value: function(actn)
            {
                if (actn.a) { // Implies a delete action
                    return this.DELETE_ACTION_VAL;
                }
                else { // insert action
                    return "P}" + actn.p;
                }
            }},
            csvHeader: {value: function ()
            {
                return "url,username,password";
            }},
            toCSV: {value: function(actn)
            {
                return  (actn.l.H + (actn.l.P || "")) + COMMA + 
                        (actn.u || "") + COMMA + 
                        (actn.p || "");
            }}
        }));   
    }
    PStoreTraits.prototype = DEFAULT_TRAITS; // Inherit the rest from DEFAULT_TRAITS
    var PREC_TRAITS = DT_TRAITS.traits[dt_pRecord] = new PStoreTraits();

    function EStoreTraits()
    {
        Object.freeze(Object.defineProperties(this, 
        {
            dict: {value:DICT_TRAITS[dt_eRecord]},
            iHistory: {value:{history: 0}},
            file: {value:{persist_asserts: false}},
            getKey: {value:function(actn)
            {
                return actn.f;
            }},
            isValidCSV: {value:function(actn)
            {
                return (isValidAction(actn) && 
                    (typeof actn.f === "string") &&
                    (typeof actn.t === "string"));
            }},
            valStr: {value: function(actn)
            {
                if (actn.a) { // Implies a delete action
                    return this.DELETE_ACTION_VAL;
                }

                var str = "";
                if (actn.t) {
                    str += "T}" + actn.t;
                }
                if (actn.id) {
                    str += "I}" + actn.id;
                }
                if (actn.n) {
                    str += "N}" + actn.n;
                }
                if (actn.y) {
                    str += "Y}" + actn.y;
                }
                if (actn.fid) { // since 0.5.19
                    str += "F}" + actn.fid;
                }
                if (actn.fnm) { // since 0.5.19
                    str += "G}" + actn.fnm;
                }
                return str;
            }},
            csvHeader: {value: function ()
            {
                return "url,fieldName,tagName,id,name,type,formId,formName";
            }},
            toCSV: {value: function(actn)
            {
                return  (actn.l.H + (actn.l.P || "")) + COMMA + 
                        (actn.f  || "") + COMMA +
                        (actn.t  || "") + COMMA +
                        (actn.id || "") + COMMA +
                        (actn.n  || "") + COMMA +
                        (actn.y  || "") + COMMA +
                        (actn.fid|| "") + COMMA + // since 0.5.19
                        (actn.fnm|| ""); // since 0.5.19
            }}
        }));
    }
    EStoreTraits.prototype = DEFAULT_TRAITS;// Inherit the rest from DEFAULT_TRAITS
    var EREC_TRAITS = DT_TRAITS.traits[dt_eRecord] = new EStoreTraits();
    
    function SStoreTraits()
    {
        Object.freeze(Object.defineProperties(this, 
        {
            dict: {value:DICT_TRAITS[BP_TRAITS.dt_settings]},
            // everything else is inherited from DEFAULT_TRAITS            
        }));        
    }
    SStoreTraits.prototype = DEFAULT_TRAITS;// Inherit the rest from DEFAULT_TRAITS
    DT_TRAITS.traits[BP_TRAITS.dt_settings] = new SStoreTraits();
    
    Object.freeze(DT_TRAITS);
    /** @end-static-class-defn DT_TRAITS **/    

    /** @globals-end **/

    /**
     * @begin-class-def ItemHistory
     * Represents ItemHistory on a given item/key. Figures out the latest value etc.
     * Inserted records should be Action Records with timestamps in them. If no timestamp
     * is found, the current timestamp will be inserted.
     */
    /** Constructor.
     * Acts as default constructor with no argument.
     * For an argument, it expects an Action Record or an Object object created from a
     * JSON serialized Action Record.
     */
    function ItemHistory(dt, jo)
    {
        var tr = DT_TRAITS.getTraits(dt);
        if (jo)
        {
            Object.defineProperties(this,
                {
                    // Points to the most recent element of actions
                    curr: {value: jo.curr, writable: true, enumerable: true},
                    // This is a collection of actions. It is not just an array, it is
                    // also has valStr properties that point to the corresponding action.
                    // In other words it is an array of actions plus a value-index of actions.
                    // The actions are sorted in reverse chronological order - i.e. the newest
                    // one is at position 0. Consequently, this.curr === this.actions[0]
                    actions: {value: jo.actions, enumerable:tr.iHistory.transfer_actions}
                }
            );
        }
        else {
            Object.defineProperties(this,
                {
                    curr:{ writable:true, enumerable:true },
                    actions:{ value:[], enumerable:tr.iHistory.transfer_actions }
                }
            );
        }
        Object.seal(this);
    }
    
    /** Helper function invoked by insertNewVal only
    ItemHistory.prototype.delHelper = function (dItem, i)
    {
        var valStr = dItem.traits.valStr(dItem);
        delete this[valStr];
    };*/
        
    
    /**
     * This is a helper function intended to be invoked by ItemHistory.prototype.insert only.
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
    ItemHistory.prototype.insertNewVal = function (valStr, drec)
    {
        var dtt = drec.dtt,
            max = dtt.iHistory.history + 1,
            actn = drec.actn,
            actions = this.actions,
            len = actions.length,
            res, ins, fluff,
            memStats = MemStats.stats;
        
        if (len===0)        {            // This will happen the first time a key is created            actions[0] = actn;            actions[valStr] = actn;
            memStats.loaded++;        }        else if (actn.tm<=actions[len-1].tm)        {            // In the case of loadDB, we load records in reverse chronological order. That            // allows us to simply push subsequent records to the end of the array.            actions.push(actn);            actions[valStr] = actn;
            memStats.loaded++;            // We don't need to check for item-overflow because that has already            // been checked before we were invoked.        }        // // Below clause is useful in optimizing mergeDB use-case, and new records
        // // inserted by autocapture or manual entry.        // // else if (actn.tm>=actions[0])        // // {            // // actions.unshift(actn);            // // actions[valStr] = actn;            // // if (len>max)            // // delete the last item
            // // drec.notes.causedOverflow = true;
            // // memStats.fluff++;        // // }        else
        {
            // We will only get here in case of DB merges or if due to some reason
            // our record loading sequence was not strictly reverse-chronological - can't
            // guarantee that loading-order though have tried hard to.
            // Arecs are sorted in reverse chronological order here starting with the newest
            // at position 0
            
            res = this.actions.some (function (_actn, i, _actions)
            {   // NOTE: Ensure that 'this' is bound to enclosing ItemHistory object
                var dItm, l;
                if (actn.tm >= _actions[i].tm)
                {
                    // Insert one new item
                    _actions.splice(i, 0, actn);
                    memStats.loaded++;
                    // Update the value index
                    _actions[valStr] = actn;
                    if (actn.a==='pd')
                    {
                        // Delete all actions to the rhs of this one.
                        ItemHistory.prototype.GC.apply(this,[i, drec]);
                    }
                    // Delete upto one item
                    else if ((l=_actions.length)>max)
                    {
                        dItm = _actions[l-1];
                        _actions.length = max; // remove item from array
                        delete _actions[dtt.valStr(dItm)]; // remove val-index
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
                    _actions.push(actn);
                    _actions[valStr] = actn;
                    memStats.loaded++;
                    // We don't need to check for item-overflow because that has already
                    // been checked before we were invoked.
                    return true;
                }
            }, this);
            if (!res) {
                BP_ERROR.logwarn(new BPError("Didn't insert action", "NewActionSkipped", "Actions.Some===false"));
                memStats.fluff++;
            }
        }
        
        this.curr = actions[0];
        if (this.curr === actn) {
            drec.notes.causedCurrChange = true;
        }
    };
    
    /**
     * Helper function to be invoked by ItemHistory.prototype.insert only.
     * Is invoked when a new action is to be inserted with a value that already exists
     * in the collection.
     * Replaces an existing action with the one with the newer timestamp. It also repositions the
     * record within actions array, per its new timestamp. We don't know where in the sorted
     * array, the existing record lies, hence there is no particular preference regarding
     * list-visit order. Therefore we'll just visit from position 0 onwards because that
     * is convenient for coding.
     */
    ItemHistory.prototype.updateTm = function (oActn, drec, valStr)
    {
        var actions = this.actions, 
            nActn = drec.actn,
            notes = drec.notes,
            tm = nActn.tm,
            ins=-1,
            i, bDone, fluff;

        i = actions.indexOf(oActn);
        if (i !== -1)
        {
            //actn.tm = tm;
            // Remove item
            actions.splice(i, 1);
            delete actions[valStr];
            if (i>0)
            {
                // Insert new item.
                for (bDone=false,--i; i>=0; --i)
                {
                    if (nActn.tm<=actions[i].tm) {
                        // insert one item
                        actions.splice(i+1, 0, nActn);
                        actions[valStr] = nActn;
                        ins = i+1;
                        bDone = true;
                        break;
                    }
                }
                if (!bDone) {
                    // insert item at the beginning.
                    actions.splice(0, 0, nActn);//TODO: use unshift here
                    actions[valStr] = nActn;
                    ins = 0;
                    this.curr = actions[0];
                    notes.causedCurrChange = true;
                }
            }
            else {
                // else the item was already at the top. Replace it with the new item.
                actions.splice(0, 0, nActn);//TODO: use unshift here
                actions[valStr] = nActn;
                ins = 0;
                this.curr = actions[0];
            }
            
            if ((nActn.a==='pd')) {
                // Delete actions to the right hand side of GC-point.
                ItemHistory.prototype.GC.apply(this,[ins, drec]);
            }
        }
        else {
            throw new BPError("Internal Error", "SkipRecord", "UpgradeItemNotFound");
        }
    };
    /**
     * Garbage Collects all actions to the right of position i. Call this method only
     * if action at position i is of type 'pd' (permanent delete).
     */
    ItemHistory.prototype.GC = function(i, drec)
    {   // ASSERT: this.actions[i].a === 'pd'
        var fluff, dItm, j,
            len = this.actions.length,
            memStats = MemStats.stats;
        if (i<0) {return;}
        for (j = i+1; j < len; j++)
        {
            dItm = this.actions[j];                     // action to be removed
            delete this.actions[drec.dtt.valStr(dItm)]; // remove from val-index
        }
        fluff = (j-i-1);
        this.actions.splice(i+1, fluff);
        memStats.fluff += fluff;
        memStats.loaded -= fluff;
        memStats.gcd += fluff;
        drec.notes.causedGC = true;
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
     *  because the top traits.iHistory.history slots will fill up first and then the
     *  remaining ones will simply be discarded at first check (see insert code below). If
     *  we had visited the records in the opposite order, then we would've had to insert
     *  the older ones into the data-structure first, but those would quickly get deleted
     *  upon visitation of the newer records immediately afterwards. This would obviously
     *  be wasted effort.
     *  A consequence of the above strategy, is that records inserted
     *  at file-loading time will be older than those already present in the data-structure.
     *  Therefore we'll optimize the ItemHistory.actions datastructure insertions for the case
     *  where inserted records have older timestamps than those already present in the
     *  data-structure. That is, when linearly traversing the ItemHistory.actions array, we
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
    ItemHistory.prototype.insert = function(drec)
    {   // TODO: Make changes to account for GC records
        var actn = drec.actn,
            dtt = drec.dtt,
            valStr = dtt.valStr(actn),
            max = dtt.iHistory.history + 1,
            oActn,
            memStats = MemStats.stats,
            len = this.actions.length;
            
        Object.freeze(actn);
        
        if (len && (actn.tm <= this.actions[len-1].tm))
        {
            if (len >= max)
            {
                // This record should not be inserted. Its date&time are older than the
                // oldest record we have and our collection is already full or
                drec.notes.isOverflow = true;
                memStats.fluff++;
                return;
            }
            else if (this.actions[len-1].a==='pd')
            {
                // This record is older than the PermDelete point.
                drec.notes.isGCd = true;
                memStats.fluff++;
                return;
            }
        }

        
        // Now check if we already have this value.
        oActn = this.actions[valStr];
        if (oActn) 
        {
            // This value already exists in the collection. Is this the same
            // record being replayed or an older record with same value?
            memStats.fluff++;
            if (actn.tm <= oActn.tm)
            {
                // Okay, same value, same timestamp. This is a repeated record.
                // Do nothing, just ignore it.
                drec.notes.isOldRepeat = true;
                // return;
            }
            else if (actn.tm > oActn.tm)
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
                // usefulness of that feature however, is debatable especially since the user
                // will have access to her older passwords immediately after a sync/merge.
                // It does, however bring in a lot of complexity and fluff. Further more, this
                // use-case can easily be made possible by changing the code in this section
                // to not forget repeated values. Hence for now we'll go with the simpler
                // leaner arguably smarter but certainly novel approach.

                drec.notes.isRecentRepeat = true; // NOTE: May or may not causeCurrChange...

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
                    this.updateTm(oActn, drec, valStr);
                }
            }
        }
        else
        {
            // This is a unique value. However, we want to keep only the latest #traits.iHistory.history
            // values in the sorted list of values. This will make it to the list, but will bump out
            // an existing value if the list was full.
            this.insertNewVal(valStr, drec);
            drec.notes.isRecentUnique = true;
        }
    };
    ItemHistory.prototype.newIt = function ()
    {
        return new ActionIterator(this);
    };
    ItemHistory.prototype.makePDAction = function()
    {
        // ASSERT: itemDeleted(iHist)===true
        if (this.curr.a === 'pd') {return this.curr;}
        // ASSERT: this.cur.a === 'd'. That is, the record
        // has no value in it (has key though). Hence we don't need to worry
        // about removing the value from the record.
        var gcActn = BP_COMMON.copy2(this.curr, {});
        gcActn.a = 'pd';
        gcActn.tm = Date.now();
        return gcActn;
    };
    
    function ActionIterator(iHist)
    {
        Object.defineProperties(this,
        {
            i:      {value:iHist.actions.length, writable:true},
            actions:{value:iHist.actions}
        });
    }
    ActionIterator.prototype.next = function ()
    {
        // Return records in chronological order
        return this.actions[--this.i]; // TODO: Should we floor 'this.i' at -1?
    };
    function newItemHistory(dt, jo) {
        return new ItemHistory(dt, jo);
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
        if (!l) {
            l = {};
            //throw new BPError(JSON.stringify(l), "BadURL");
        }
        
        //scm = (l.S?l.S.toLowerCase():null);

        if (dictTraits.url_host && l.H)
        {
            // Split hostname into an array of strings.       
            ha = l.H.split('.');
            ha.reverse();
            
            if (dictTraits.domain_only) 
            {
                MOD_ETLD.cullDomain(ha); // removes non-domain segments
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
            ha      : {value: ha},
            pa      : {value: pa}
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
    DURL.prototype.getSite = function ()
    {
        var site = "";
        if (this.ha) {
            site += this.ha.reverse().join('.');
        }
        if (this.pa) {
            site += '/';
            site += this.pa.join('/');
        }
        return site;
    };
    
    function getSite(loc, dt)
    {
        var l = BP_CONNECT.newL(loc, dt),
            urli = new DURL(l, dt);
        return urli.getSite();
    }
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
    function DNode (_url)
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
        Object.defineProperty(this, DNODE_TAG.URL, {value:_url, enumerable:true});
    }
    /** Makes url of child node by extracting its url-segment from its key and 
     * appending that to this[DNODE_TAG.URL] */
    function makeURL(baseURL, childKey)
    {
        var tag = childKey.slice(0,2),
            url;
        switch (tag)
        {
            case DNODE_TAG.HOST:
                url = childKey.slice(2) + (baseURL ? ("." + baseURL) : "") ;
                break;
            case DNODE_TAG.PATH:
                url = baseURL + "/" + childKey.slice(2);
                break;
        }
        
        return url;
    }    
    var DNProto = DNode.prototype;
    DNProto.getData = function(dt) {return this[DNODE_TAG.DATA+dt];};
    DNProto.putData = function(drec)
    {
        var r, ki,
            actn = drec.actn,
            dt = drec.dt,
            d = DNODE_TAG.DATA + dt;

        if (!this[d]) { // ensure that a data node has been allocated
            this[d] = {};
            drec.notes.firstKey = true;
        }
        // var recsMap = this.d[dt];        // if (!recsMap) {            // this.d[dt] = (recsMap = {});        // }
        
        var recsMap = this[d];
        
        //r = recsMap[ki=DT_TRAITS.getKey(actn, dt)];
        r = recsMap[ki=drec.dtt.getKey(actn)];
        if (r) {
            r.insert(drec);
        }
        else {
            (recsMap[ki] = newItemHistory(dt)).insert(drec);
            //drec.notes.newKey = true;
        }
    };
    DNProto.makeRecsMap = function (dt)
    {
        var d = DNODE_TAG.DATA + dt;
        if (!this[d]) { // ensure that a data node has been allocated
            this[d] = {};
        }
    };
    DNProto.putETLD = function(drec)
    {
        // Used for a simple map with URL as the key and record as value.
        // Simple struct for ETLD
        this[DNODE_TAG.ETLD] = drec.actn.val;
    };
    
    function newDNode (url) {return new DNode(url);}
    
    /** Helper function to DNProto.insert */
    DNProto.tryInsert = function (drec)
    {
        var actn = drec.actn,
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
            drec.dnode = this;
        }
        else 
        {   // continue walking down the trie
            var n = this[k];
            if (!n) {
                this[k] = (n = newDNode(makeURL(this[DNODE_TAG.URL], k)));
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
                return undefined; // exact URL match does not exist. We're a prefix match.
            }
            else {
                urli.incr();
                return n; // Next node to visit ...
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
    DNProto.findPRecsMap = function(l, out) 
    {
        var n = this, n2, urli = new DURL(l, dt_pRecord);
        // Walk down the dictionary tree.
        do {
            //if (DNProto.getData.apply(n, [dt_pRecord])) {n2 = n; /*idb = urli.pos();*/}
            n2 = n; // we need an exact DURL match hence replacing above line with this one.
            n = DNProto.tryFind.apply(n, [urli]);
        } while (n);

        // While constructing DURL during insert we've already ensured that
        // inserts will be below TLD level - and just one level below TLD.
        // Therefore we need an exact DURL-match, not a substring match here.
        if (n2) 
        {
            if (out) {out.dNode = n2;}
            return DNProto.getData.apply(n2, [dt_pRecord]);
        }
    };
    
    /**
     * Returns DNode with exact DURL match 
     */
    DNProto.getDNode = function (l, dt)
    {
        var urli = new DURL(l, dt), 
            n = this, n2;
        do
        {
            n2 = n;
            n = DNProto.tryFind.apply(n, [urli]);
        } while (n);
        
        if (n===null) {
            return n2;
        }
    };
    DNProto.dispatch = function(eventType, drec)
    {
        var listeners = this[DNODE_TAG.LISTENERS];
        if (listeners) {
            listeners.dispatch(eventType, {drec:drec});
        }
    };
    /** @end-class-def DNode **/

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     * @param {Object} uct  Use-Case Traits. See function DRecord.UCT
     */
    function DRecord(actn, dt, uct, dict)
    {
        // Construct url segment iterator.
        Object.defineProperties(this,
        {
            urli: {value:new DURL(actn.l, dt), enumerable:false},
            actn: {value:actn},
            dt:   {value:dt},
            notes:{value: {}},
            dict: {value:dict || dt},
            dtt:  {value:DT_TRAITS.getTraits(dt), enumerable:false},
            uct:  {value:uct, enumerable:false},
            dnode:{writable:true, enumerable:false},
            root: {writable:true, enumerable:false}
        });
    }

    /** @end-class-def DRecord **/

    function MemStats ()
    {
        Object.defineProperties(this,
        {
            loaded: {value:0, writable:true, enumerable:true},
            fluff:  {value: 0, writable:true, enumerable:true},
            bad:    {value:0, writable:true, enumerable:true},
            gcd:    {value:0, writable:true, enumerable:true} // gc'd actions.
        });
    }
    MemStats.prototype.clr = function ()
    {
        this.loaded = this.fluff = this.bad = 0;
    };
/*    MemStats.prototype.update = function (notes)
    {
        if (notes && notes.isRecentUnique) {
            if (notes.causedOverflow) {
                this.fluff++;
            }
            else {
                this.loaded++;
            }
        }
        else if (notes) { // if (actn.notes.isOldRepeat || actn.notes.isRecentRepeat || actn.notes.isOverflow)
            this.fluff++;
        }
        else {
            this.bad++;
        }
    };*/

    function getDTRecs (loc, dt, out)
    {
        var recs;
        switch (dt)
        {
            case dt_pRecord:
                recs = DNProto.findPRecsMap.apply(DNode[dt_pRecord],[newL(loc,dt_pRecord), out]);
                break;
            case dt_eRecord:
                recs = DNProto.findERecsMapArray.apply(DNode[dt_eRecord], [newL(loc,dt_eRecord)]);
                break;
        }
        return recs; 
    }
    
    function getTRecs (loc, out)
    {
        return DNProto.findPRecsMap.apply(DNode['temp_'+dt_pRecord],[newL(loc,dt_pRecord), out]);
    }

    function numTRecs (loc, skipDeleted)
    {
        return (new BP_CONNECT.ItemIterator(getTRecs(loc), skipDeleted)).num();
    }
    /**
     * Returns dt_eRecord and dt_pRecord matching loc as per the respective dt traits
     */
    function  getRecs (loc)
    {
        var kdb, pdb, r, out = {};
        r = {};
        r.eRecsMapArray = getDTRecs(loc, dt_eRecord);
        r.pRecsMap = getDTRecs(loc, dt_pRecord, out);
        r.tRecsMap = getTRecs(loc);
        if (out.dNode) {
            // Site that pertains to the pRecords. Should be same as DURL(l, dt_pRecord)
            // concatenated back into a URL. 
            r.site = out.dNode[DNODE_TAG.URL];
        }
        return r;
    }

    function getDNode (l, dt, dict)
    {
        dict = dict || dt;
        if (DNode[dict]) {
            return DNProto.getDNode.apply(DNode[dict], [l, dt]);
        }
    }

    function getRootDNode (dt, dict)
    {
        return DNode[dict || dt];
    }

    // _dnode is optional and is only expected to be used at build-time by buildETLD.
    // At runtime, don't pass _dnode
    function insertRec (actn, dt, _dnode)
    {
        if (!_dnode) {_dnode = DNode[dt];}
        var dr = new DRecord(actn, dt, null, dt);
        dr.root = _dnode;
        return DNProto.insert.apply(_dnode, [dr]) ? dr : undefined;
    }
    function insertDrec (dr, _dnode)
    {
        if (!_dnode) {_dnode = DNode[dr.dt];}
        dr.root = _dnode;
        return DNProto.insert.apply(_dnode, [dr]) ? dr : undefined;
    }
    function insertTempRec(actn, dt)
    {
        if (dt !== dt_pRecord) {return;}
        
        var dr, pRecsMap, u1, notes,
            dict = 'temp_' + dt,
            dnode = DNode[dict];
        
        if (!actn.u)
        {
            pRecsMap = DNProto.findPRecsMap.apply(dnode, [actn.l]);
            if (pRecsMap) {
                BP_COMMON.iterKeys(pRecsMap, function(u, iHist)
                {
                    if (!iHist.curr.p) {
                        u1 = u;
                        return true; // break the loop
                    }
                });
            }
            if (u1) {
               actn.u = u1;
            }
            else {
                actn.u = "unknown";
            }
        }

        dr = new DRecord(actn, dt, null, dict);
        dr.root = dnode;
        notes = DNProto.insert.apply(dnode, [dr]) ? dr.notes : undefined;
        if (notes)
        {
            BP_ERROR.logdebug("Saved temp pRecord: " + JSON.stringify(actn));
        }
        else {
            BP_ERROR.logwarn("Could not save temp pRecord: " + JSON.stringify(actn));
        }

        return dr;
    }

    function loadETLD ()
    {
        var xhr = new XMLHttpRequest();
        
        // xhr.onloadend = function (e)        // {             // ETLD = JSON.parse(e.target.response);        // };
        xhr.open("GET", g.BP_CS_PLAT.getURL('/data/etld.json'), false);
        xhr.send();
        var resp = xhr.response;        ETLD = JSON.parse(resp);
    }

    function clear (dtl)
    {
        var i, dt,            dtList = dtl || Object.keys(DT_TRAITS.traits),            n = dtList.length;        for (i=0; i<n; i++)        {            dt = dtList[i];            DNode[dt] = newDNode();        }
        DNode['temp_'+dt_pRecord] = newDNode();
        MemStats.stats = new MemStats();
    }

    function listen (eventType, scope, cbackInfo)
    {
        var dnode;
        if (!eventType || !scope || !cbackInfo) {return;}
        
        dnode = getDNode(scope.l, scope.dt, scope.dict);
        if (dnode)
        {
            if (!dnode[DNODE_TAG.LISTENERS])  {
                dnode[DNODE_TAG.LISTENERS] = BP_LISTENER.newListeners(scope);
            }
            dnode[DNODE_TAG.LISTENERS].add(eventType, cbackInfo);
        }
    }

    DRecord.prototype.dispatch = function()
    {
        if (this.notes.causedCurrChange) 
        {
            this.root.dispatch('bp_change', this);
            this.dnode.dispatch('bp_change', this);
        }
    };
    
    function dispatch (dr)
    {
        var root, dnode;
        if (dr.notes.causedCurrChange) 
        {
            root = dr.root  || getRootDNode(dr.dt, dr.dict);
            dnode= dr.dnode || getDNode(dr.actn.l, dr.dt, dr.dict);

            root.dispatch('bp_change', dr);
            dnode.dispatch('bp_change', dr);
        }
    }
    
    function DNodeIterHelper(node, up, myURL)
    {
        return Object.defineProperties(this,
        {
            myURL:  {value:myURL},
            i:      {value:0, writable:true},
            keys:   {value:Object.keys(node).sort()},
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
            if (key.charAt(0) === DNODE_NEXT) // Only return next-node-pointer keys
            {
                found = true;
                break;
            }
        }
        
        return found? key : undefined;
    };
    /** Makes url of child node by extracting its url-segment from its key and 
     * appending that to this.myURL */
    DNodeIterHelper.prototype.childURL = function (childKey)
    {
        var tag = childKey.slice(0,2),
            url;
        switch (tag)
        {
            case DNODE_TAG.HOST:
                url = childKey.slice(2) + (this.myURL ? ("." + this.myURL) : "") ;
                break;
            case DNODE_TAG.PATH:
                url = this.myURL + "/" + childKey.slice(2);
                break;
        }
        
        return url;
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
    DNodeIterator.prototype.visit = function (node, up, url)
    {
        node[DNODE_TAG.ITER] = new DNodeIterHelper(node, up, url);
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
            return this.visit(this.node[key], this.node, notes.childURL(key));// visit a child node
        }
        // else walk is over; return undefined.
    };
    /**
     * Walks the DNode tree and calls a callback for each action-record in the tree. It
     * visits all actions, both current as well as historical.
     * @param {Object} callback
     */
    DNodeIterator.prototype.walk = function (callback, ctx, args)
    {
        var dn, iMap, iIt, iHist, aIt, actn,
            doGC = args.doGC,  // convert deletes to permanent deletes as you go
            skipDeleted = args.skipDeleted; // skip deleted items
        while ((dn=this.next()))
        {
            // Can't code dn.getData(dt) because dn maybe a JSON parsed object.
            if ((iMap=DNProto.getData.apply(dn, [this.dt])))
            {
                iIt = new BP_CONNECT.ItemIterator(iMap);
                while ((iHist=iIt.next()))
                {
                    if (BP_CONNECT.itemPermDeleted(iHist))
                    {
                        callback(iHist.curr, ctx);
                    }
                    else if (doGC && (BP_CONNECT.itemDeleted(iHist)) )
                    {
                        callback(ItemHistory.prototype.makePDAction.apply(iHist), ctx);
                    }
                    else
                    {
                        aIt = new ActionIterator(iHist);
                        for (actn=aIt.next(); actn; actn=aIt.next())
                        {
                            callback(actn, ctx);
                        }
                    }
                }
            }
        }        
    };

    /**
     * Walks the DNode tree and calls a callback for each current-record in the tree. It
     * visits only current actions of the ItemHistory collections. That is, it skips the 
     * historical actions. It also entirely skips deleted or gc'd items. The idea is to
     * provide a snapshot of the un-deleted items.
     * @param {Object} callback
     */
    DNodeIterator.prototype.walkCurr = function (callback, ctx)
    {
        var dn, iMap, iIt, iHist, aIt, actn;
        while ((dn=this.next()))
        {
            // Can't write dn.getData(dt) because dn maybe a JSON parsed object.
            if ((iMap=DNProto.getData.apply(dn, [this.dt])))
            {
                iIt = new BP_CONNECT.ItemIterator(iMap, true);
                while ((iHist=iIt.next()))
                {
                    callback(iHist.curr, ctx);
                }
            }
        }        
    };
    function newDNodeIterator (dt, dict)
    {
        return new DNodeIterator(getRootDNode(dt, dict), dt);
    }

    /**
     * Proxy of DNodeIterator.prototype.walkCurr. Meant for use by w$exec.
     * @param {Object} dt:   Data Type of items to walk.
     * @param {Object} dict: Optional, dict to walk. (e.g. dt_pRecord or 'temp_'+dt_pRecord)
     */
    function DataWalker(dt, dict)
    {
        Object.defineProperties(this,
        {
            dnIt: {value: newDNodeIterator(dt, dict)}
        });
    }
    DataWalker.prototype.walk = function (callback, ctx)
    {
        this.dnIt.walkCurr(callback, ctx);
    };
    
    //Assemble the interface    
    var iface = Object.freeze(
    {
        insertRec:   insertRec,
        insertDrec:  insertDrec,
        insertTempRec:insertTempRec,
        getRecs:     getRecs,
        getDTRecs:   getDTRecs,
        getTRecs:    getTRecs,
        numTRecs:    numTRecs,
        DT_TRAITS:   DT_TRAITS,
        PREC_TRAITS: PREC_TRAITS,
        EREC_TRAITS: EREC_TRAITS,
        clear:       clear,
        loadETLD:    loadETLD,
        newDNode:    newDNode, // used by build_tools
        DURL:        DURL, // used by build_tools
        getSite:     getSite,
        DRecord:     DRecord,
        DNProto:     DNProto,
        DNODE_TAG:   DNODE_TAG,
        newDNodeIterator: newDNodeIterator,
        DataWalker:  DataWalker,
        getDT:       function(dt){return DNode[dt];},
        getStats:    function(){return MemStats.stats;},
        putDB:       function(dNode, dt){DNode[dt] = dNode;},
        getDB:       function(dt){return DNode[dt];},
        getDNode:    getDNode,
        getRootDNode:getRootDNode,
        MOD_ETLD:    MOD_ETLD,
        Event: {
            listen:  listen,
            dispatch:dispatch
        }
    });

    BP_ERROR.log("constructed mod_memstore");
    return iface;
}
