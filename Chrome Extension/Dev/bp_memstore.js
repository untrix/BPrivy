/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

var BP_MOD_MEMSTORE = (function () 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var m;
    /** @import-module-begin Error */
    m = IMPORT(BP_MOD_ERROR);
    var BPError = IMPORT(m.BPError);
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        dt_default = "DefaultDT";
    /** @import-module-begin Connector */
    m = IMPORT(BP_MOD_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs),
        newPRecord = IMPORT(m.newPRecord),
        newERecord = IMPORT(m.newERecord);
    /** @import-module-end **/    m = null;

    /** @globals-begin */

    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var EQUAL = Number(0),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        SUBSET = Number(-1),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        SUPERSET = Number(1),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        DIFFRNT = Number(2),
    /** Two in-mem Tries. Make sure this file is run only in one thread otherwise multiple
     * copies of the tries will get created.
     */
        g_pd, g_kd,
        DNODE_TAG = {};
    Object.defineProperties(DNODE_TAG,
        {
            //DATA: {value: 'data' /*"{dt}"*/},// writable, enumerable and configurable=false by default.
            // tag is a property name that should never clash withe a URL
            // segment. Hence the bracket
            // characters are being used because they are excluded in rfc
            // 3986.
            TLD: {value:"{t}"},
            HOST: {value:"{h}"},
            DOMAIN: {value:"{d}"},
            PORT: {value:"{o}"},
            PATH: {value:"{p}"},
            // getDataTag: {value: function (dt) {
                // if(dt) {
                    // return /*DNODE_TAG.DATA +*/ dt;
                // }
            // }},
        }
    );    

    function isValidLocation(loc)
    {
        return (loc && 
                (typeof loc.protocol=== "string") && (loc.protocol.length > 0) &&
                (typeof loc.hostname === "string") && (loc.hostname.length > 0) &&
                (typeof loc.pathname === "string") && (loc.pathname.length > 0));
    }

    function isValidARec(that)
    {
        if (that  && 
                (typeof that.dt === "string") &&
                (typeof that.date === "number") &&
                isValidLocation(that.loc))
            { return true;}
        else {return false;}
    }

    var PREC_TRAITS ={}, EREC_TRAITS={}, DEFAULT_TRAITS={},
        DT_TRAITS = {};
        
    /** @begin-static-class-defn DEFAULT_TRAITS */
    // Top-Level properties defined in DEFAULT_TRAITS are mandatory for any TRAITS object.
    // Omitting second-level properties (e.g. dict.url_scheme) is okay - implies false for
    // boolean properties.
    Object.defineProperties(DEFAULT_TRAITS,
    {
        // dict: Properties referenced by dictionary/trie/URLA.
        // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.
        dict: {value: {url_scheme: false, url_host:true, url_port:true, url_path:true}},
        // action: properties referenced by the Actions class.
        actions: {
            value: {
                // history=true asserts we're interested in maintaining history.
                // Will cause Actions class to keep history in memory
                // A value of false asserts the opposite. Will
                // cause Actions to only keep current value in memory.
                history: 0,
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
            },
        },
        ui: {value: {fields: ["key", "value"]}},
        // Returns record key
        getKey: {value: function (rec) {return rec.key;}},
        isValid: {value: function (rec){return isValidARec(rec) && rec.key!==undefined && rec.key!==null && rec.key !== "";}},
        compareVals: {value: function(rec1, rec2) 
            {
              if (rec1 && rec2) {
                  if (rec1.value === rec2.value) {return EQUAL;}
                  else {return DIFFRNT;}
              }
              else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                  return EQUAL;
              }
              else { return DIFFRNT;}
            }}
    }); Object.freeze(DEFAULT_TRAITS);
    /** @end-static-class-defn DEFAULT_TRAITS **/
    /** @begin-static-class-defn PREC_TRAITS */
    Object.defineProperties(PREC_TRAITS,
    {
        dict: {value: {url_host:true, url_port:true}},
        actions: {value: {history:2, persist_asserts: true}},
        ui: {value: {fields: Object.keys(newPRecord())}},
        getKey: {value: function(rec)
            {
                return rec.userid;
            }},        
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.userid === "string") &&
                    (typeof rec.pass === "string"));
            }},
        compareVals: {value: function(rec1, rec2) 
            {
                if (rec1 && rec2)
                {
                    if (rec1.pass === rec2.pass) { return EQUAL;}
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT;}
            }}
    }); Object.freeze(PREC_TRAITS);
    /** @end-static-class-defn PREC_TRAITS **/
    /** @begin-static-class-defn EREC_TRAITS */
    Object.defineProperties(EREC_TRAITS,
    {
        dict: {value: {url_host:true, url_port:true, url_path:true}},
        actions: {value: {history: 0, persist_asserts:false}},
        ui: {value: {fields: Object.keys(newERecord())}},
        getKey: {value: function(rec)
            {
                return rec.fieldName;
            }},
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.fieldName === "string") &&
                    (typeof rec.tagName === "string"));
            }},
        compareVals: {value: function(rec1, rec2) 
            {
                if (rec1 && rec2)
                {
                    if (rec1.tagName === rec2.tagName &&
                        rec1.id === rec2.id &&
                        rec1.name === rec2.name &&
                        rec1.type === rec2.type)
                        {
                            return EQUAL;
                        }
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT;}                
            }}
    }); Object.freeze(EREC_TRAITS);
    /** @end-static-class-defn EREC_TRAITS **/
    /** @begin-static-class-defn DT_TRAITS */
    Object.defineProperty(DT_TRAITS, dt_eRecord, {value: EREC_TRAITS});
    Object.defineProperty(DT_TRAITS, dt_pRecord, {value: PREC_TRAITS});
    Object.defineProperty(DT_TRAITS, dt_default, {value: DEFAULT_TRAITS});
    Object.defineProperties(DT_TRAITS,
    {
        dtList: {
            value: [
                dt_eRecord, 
                dt_pRecord
            ]
        },
        getTraits: {
            value: function (dt) {
                var n = this[dt];
                if (!n) {
                    n = this[dt_default];
                }
                return n;
            }
        },
        getDictTraits: {
            value: function (dt) {
                return this.getTraits(dt).dict;
            }
        },
        getKey: {
            value: function (rec) {
                var n = this[rec.dt];
                if (n && n.getKey) {
                    return n.getKey(rec);
                }
            }
        },
        imbue: {
            value: function (rec) {
                Object.defineProperty(rec, "traits", 
                {
                    value: this.getTraits(rec.dt) // enumerable, writable, configurable=false.
                });
                return rec;
            }
        }
    });
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
                    curr: {value: jo.curr, writable: true, enumerable: true},
                    arecs: {value: jo.arecs, enumerable:tr.actions.transfer_arecs}
                }
            );
        }
        else {
            Object.defineProperties(this,
                {
                    curr: {writable: true, enumerable: true},
                    arecs: {value: [], enumerable:tr.actions.transfer_arecs}
                }
            );
        }
        Object.seal(this);
    }
    /** Method. Insert a record into the Action Records collection */
    Actions.prototype.insert = function(drec)
    {
        var arec = drec.rec, traits = arec.traits;
        if (this.curr) {
            if (this.curr.date <= arec.date) {
                // This is the latest value. Check if it has the same value as this.curr
                if (traits.compareVals(this.curr, arec) === EQUAL) {
                    // Same values. Now compare timestamps to check if they're the same record being
                    // resent (when merging DBs for e.g.)
                    if (this.curr.date !== arec.date) {
                        // Same value being re-asserted. Just update the timestamp of the current record.
                        this.curr.date = arec.date;
                        drec.notes.isAssert = true; // Notate that this is an assert. Someone (filestore) will use this info. 
                    } else {
                        //repeated record (e.g. imported a CSV file again, re-merged with a DB), discard it.
                        drec.notes.isRepeat = true; // Tell filestore that this is a repeat.
                    }
                }
                else {
                    // This is a more current value than this.curr
                    this.curr = arec;
                    if (traits.actions.history > 0) {
                        this.arecs.push(arec);
                    }
                    else {
                        this.arecs[0] = arec;
                    }
                }
            }
            else 
            {
                // This is a historical value. Consult with DT_TRAITS whether we want to keep it.
                drec.notes.isHistory = true;
                if (traits.actions.history > 0) {
                    // TODO: Need to prune out extra history.
                    this.arecs.push(arec);
                }
            }
        }
        else { // This is the first value.
            var n = this.arecs.push(arec);
            this.curr = this.arecs[n-1];    
        }        
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
     */
    function DURL (l, dt) // throws BPError
    {
        // TODO: Need to support I18N domainnames / IDN / punycode. We probably already do, but make sure.
        // TODO: Also, ensure that internationalized TLDs are included in TLD list.
        var ha, pa, pr, pn, urla = [], i, s,
        dictTraits = DT_TRAITS.getDictTraits(dt);

        // Note: We need scheme and hostname at a minimum for a valid URL. We also need
        // pathname before we insert into TRIE, hence we'll append a "/" if path is missing.
        // But first ensure that this is indeed a URL.
        if (! (l && 
                (typeof l.protocol=== "string") && (l.protocol.length > 0) &&
                (typeof l.hostname === "string") && (l.hostname.length > 0) ) )
            {throw new BPError("Unsupported Page (only http/https websites are supported): "+ JSON.stringify(l));}
        
        pr = l.protocol.toLowerCase();

        if (dictTraits.url_host)
        {
            // Split hostname into an array of strings.       
            ha = l.hostname.split('.');
            ha.reverse();
        }
        
        if (dictTraits.url_path)
        {
            if (!l.pathname) {s = "/";} // In practice, all code tacks-on a "/" if missing in a valid URL.
            else {s = l.pathname;}
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
        
        if (l.port && dictTraits.url_port)
        {
            i = Number(l.port);
            switch(pr) {
                case PROTO_HTTP:
                    if(i !== 80) {pn = i;}
                break;
                case PROTO_HTTPS:
                    if(i !== 443) {pn = i;}
                break;
                default:
                    pn = i;
            }
        }
        
        // Construct the url segment array
        
        if (dictTraits.url_scheme && pr) {
            switch(pr) {
                case PROTO_HTTP:
                    urla.push('{s}http');
                    break;
                case PROTO_HTTPS:
                    urla.push('{s}https');
                    break;
                default:
                    urla.push('{s}' + pr);
            }
        }

        if (ha) {
            for (i=0; i<ha.length; i++) {
                if (i===0) {
                    // Top-Level Domain. Doesn't account for TLDs like 'co.in' though.
                    urla.push(DNODE_TAG.TLD + ha[i].toLowerCase());
                }
                else if (i === (ha.length-1)) {
                    // Host name
                    urla.push(DNODE_TAG.HOST + ha[i].toLowerCase());
                }
                else {
                    // Second level domain
                    urla.push(DNODE_TAG.DOMAIN + ha[i].toLowerCase());
                }
            }
        }
        if (pn) {urla.push(DNODE_TAG.PORT + pn);} // Port Number
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
            traits  : {value: DT_TRAITS.getTraits(dt), enumerable: true}, //writable=false, configurable=false
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
    DNode.prototype.hasData = function() {return this.data;};
    DNode.prototype.getData = function(dt) {return this.data? this.data[dt] : null;};
    DNode.prototype.putData = function(drec)
    {
        var r, ki, 
            rec = drec.rec, 
            dt = rec.dt;
            
        if (!this.data) { // ensure that a data node has been allocated
            this.data = {};
        }
        var recsMap = this.data[dt];
        if (!recsMap) {
            this.data[dt] = (recsMap = {});
        }
        r = recsMap[ki=DT_TRAITS.getKey(rec)];
        if (r) {
            r.insert(drec);
        }
        else {
            (recsMap[ki] = newActions(dt)).insert(drec);
        }
                
    };
    
    function newDNode () {return new DNode();}
    
    /** Helper function to DNode.prototype.insert */
    DNode.prototype.tryInsert = function (drec)
    {
        var rec = drec.rec,
            k = drec.urli.incr(),
            r, t, ki;
        if (!k) 
        {
            this.putData(drec);
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
    DNode.prototype.insert = function (drec)
    {       
        var n = this;    
        do {
            n = n.tryInsert(drec);
        } while (n);
        
        return true;
    };
    DNode.prototype.tryFind = function(urli) 
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
    */
    DNode.prototype.findBestNode = function (urli, dt) 
    {
        var n, r = this;
        // Walk down the dictionary tree.
        do {
            n = r;
            r = n.tryFind(urli);
        } while (r);
        
        return n;
    };
    /**
     * Returns dt_eRecord records that best match urli.
     */
    DNode.prototype.findERecsMapArray = function (loc)
    {
        var n, r = this, stack = [], urli = new DURL(loc, dt_eRecord);
        // Walk down the dictionary tree.
        do {
            // get all the e-recs encountered in the walk. They most
            // likely belong to the same website and therefore the knowledge may
            // apply across pages.
            if (r.getData(dt_eRecord)) {stack.push(r.getData(dt_eRecord));}
            n = r;
            r = n.tryFind(urli);
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
    DNode.prototype.findPRecsMap = function(loc) 
    {
        var n = this, n2, urli = new DURL(loc, dt_pRecord);
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (n.getData(dt_pRecord)) {n2 = n; /*idb = urli.pos();*/}
            n = n.tryFind(urli);
        } while (n);
        
        // in the case of PDB, the data is only useful if it is
        // below the top-level-domain. Hence we should check urli
        // to determine that.
        // Update: Since p-records are collected from actual websites,
        // the URLs should be correct. Therefore, am not verifying TLD anymore.
        if (n2) {
            //urli.seek(idb);
            //if (urli.isBelowTLD()) {
                return n2.getData(dt_pRecord);
            //}
        }
    };
    
    /**
     * Returns dt_eRecord and dt_pRecord records that best match urli.
     */
    DNode.getRecs = function  (loc)
    {
        var kdb, pdb, r;

        r = {};
        r.eRecsMapArray = DNode[dt_eRecord].findERecsMapArray(loc);
        r.pRecsMap = DNode[dt_pRecord].findPRecsMap(loc);

        return r;
    };

    DNode.insertRec = function (rec)
    {
        return DNode[rec.dt].insert(new DRecord(rec));
    };
    
    var i;
    for (i=0; i<DT_TRAITS.dtList.length; i++)
    {
        DNode[DT_TRAITS.dtList[i]] = newDNode();
    }
    
    /** @end-class-def DNode **/

    function DNodeIterator (root) // Walks dictionary and returns DNodes that have data.
    {
        
    }

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec)
    {
        // Construct url segment iterator.
        this.urli = new DURL(rec.loc, rec.dt);
        this.rec = rec;
        DT_TRAITS.imbue(rec);
        Object.defineProperty(this, "notes", {value: {}});//By default, writable, enumerable, configurable = false
                
        Object.freeze(this);
    }

    /** @end-class-def DRecord **/
    
    function clear ()
    {
        var i, dt, n = DT_TRAITS.dtList.length;
        for (i=0; i<n; i++)
        {
            dt = DT_TRAITS.dtList[i];
            DNode[dt] = newDNode();
        }
    }
    clear();
    
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        insertRec: {value: DNode.insertRec},
        getRecs: {value: DNode.getRecs},
        DT_TRAITS: {value: DT_TRAITS},
        PREC_TRAITS: {value: PREC_TRAITS},
        EREC_TRAITS: {value: EREC_TRAITS},
        clear: {value: clear}
    });
    Object.freeze(iface);

    return iface;
}());
