/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, chrome */
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
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS);
    /** @import-module-begin Connector */
    m = IMPORT(BP_MOD_CONNECT);
    var cm_getRecs = IMPORT(m.cm_getRecs),
        newPRecord = IMPORT(m.newPRecord),
        newERecord = IMPORT(m.newERecord),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        dt_default = "DefaultDT",
        dt_etld    = IMPORT(m.dt_etld),
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
        DNODE_TAG =  Object.freeze(
        {
            // tag is a property name that should never clash withe a URL
            // segment. Hence the bracket
            // characters are being used because they are excluded in rfc 3986.
            HOST: 'H', // Prefix for hostname
            PATH: 'P', // Prefix for path
            ETLD: 'E', // ETLD rule marker. 0=> regular ETLD rule, 1 implies an override 
                       // (e.g. !educ.ar). See publicsuffix.org for details.
            DATA: 'D', // Prefix for data - e.g. De for E-Rec, Dp for P-Rec etc.
            //PORT: 'O',
            //HTTP: 'Shttp',
            //HTTPS: 'Shttps'
            // SCHEME: 'S',
            //QUERY: 'Q',
            // getDataTag: {value: function (dt) {
                // if(dt) {
                    // return /*DNODE_TAG.DATA +*/ dt;
                // }
            // }},
        }),
        ETLD,
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
                (typeof loc.S=== "string") && (loc.S.length > 0) &&
                (typeof loc.H === "string") && (loc.H.length > 0) &&
                (typeof loc.P === "string") && (loc.P.length > 0));
    }

    function isValidARec(that)
    {
        if (that  && 
                (typeof that.dt === "string") &&
                (typeof that.tm === "number") &&
                isValidLocation(that.l))
            { return true;}
        else {return false;}
    }

    /** @begin-static-class-defn DT_TRAITS */
    var DT_TRAITS = 
    {
        traits: {}, // Various traits objects defined below.
        getTraits: function (dt) {
            var n = this.traits[dt];
            if (!n) {
                n = this.traits[dt_default];
            }
            return n;
        },
        getDictTraits: function (dt) {
            return this.getTraits(dt).dict;
        },
        imbue: function (rec, dt) {
            Object.defineProperty(rec, "traits",
            {
                value: this.getTraits(dt) // enumerable, writable, configurable=false.
                                          // Won't get saved to file or transferred in a
                                          // postMessage.
            });
            return rec;
        }
    };
    
    // Most properties defined in DEFAULT_TRAITS are optional for urlMap type dictionaries.
    // Omitting second-level properties (e.g. dict.url_scheme) implies false for
    // boolean properties.
    // var EXAMPLE_TRAITS = Object.freeze(    // {        // // dict: Properties referenced by dictionary/trie/URLA.        // // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.        // dict: {url_scheme: false, url_host:true, url_port:true,                 // url_path:true},        // // action: properties referenced by the Actions class.        // actions: { // not needed by dt_etld            // // history=true asserts we're interested in maintaining history.            // // Will cause Actions class to keep history in memory            // // A value of false asserts the opposite. Will            // // cause Actions to only keep current value in memory.            // history: 0,            // // An assert action is one that re-asserts the existing value. When a record            // // is received that has the same value as the most current value for its key,            // // but a different timestamp, then it is deemed as an assertion of an existing            // // value. 'save_asserts' dictates whether or not such records should be persisted            // // to storage. Persisting repeated values can significantly increase the storage            // // size for situations where the same values are repeatedly generated - e.g. E-Records.            // // Note that an assert with the same exact value and timestamp is a duplicate and will            // // always be ignored and discarded - the value of save_asserts traits will not            // // affect that behaviour.            // persist_asserts: false        // },        // // ui: {fields: ["key", "value"]},        // // Returns record key        // getKey: function (rec) {},// not needed by dt_etld        // compareVals: function(rec1, rec2) // not needed by dt_etld        // {},        // isValid: function(rec) {} // only needed for some types.    // });

    var PREC_TRAITS = DT_TRAITS.traits[dt_pRecord] = Object.freeze(
    {
        dict: DICT_TRAITS[dt_pRecord],
        actions: {history:2, persist_asserts: true},
        //ui: {fields: Object.keys(newPRecord())},
        getKey: function(rec)
        {
            return rec.u;
        },        
        isValid: function(rec)
        {
            return (isValidARec(rec) && 
                (typeof rec.u === "string") &&
                (typeof rec.p === "string"));
        },
        compareVals: function(rec1, rec2) 
        {
            if (rec1 && rec2)
            {
                if (rec1.p === rec2.p) { return EQUAL;}
                else {return DIFFRNT;}
            }
            else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                return EQUAL;
            }
            else { return DIFFRNT;}
        }
    });

    var EREC_TRAITS = DT_TRAITS.traits[dt_eRecord] = Object.freeze(
    {
        dict: DICT_TRAITS[dt_eRecord],
        actions: {history: 0, persist_asserts:false},
        //ui: {fields: Object.keys(newERecord())},
        getKey: function(rec)
        {
            return rec.f;
        },
        isValid: function(rec)
        {
            return (isValidARec(rec) && 
                (typeof rec.f === "string") &&
                (typeof rec.t === "string"));
        },
        compareVals: function(rec1, rec2) 
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
            if (this.curr.tm <= arec.tm) {
                // This is the latest value. Check if it has the same value as this.curr
                if (traits.compareVals(this.curr, arec) === EQUAL) {
                    // Same values. Now compare timestamps to check if they're the same record being
                    // resent (when merging DBs for e.g.)
                    if (this.curr.tm !== arec.tm) {
                        // Same value being re-asserted. Just update the timestamp of the current record.
                        this.curr.tm = arec.tm;
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
    DNProto.hasData = function() {return this.d;};
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
        r = recsMap[ki=rec.traits.getKey(rec)];
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
            t = rec.traits;
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
    };

    // _dnode is optional and is only expected to be used at build-time by buildETLD.
    // At runtime, don't pass _dnode
    function insertRec (rec, dt, _dnode)
    {
        if (!_dnode) {_dnode = DNode[dt];}
        return DNProto.insert.apply(_dnode, [new DRecord(rec, dt)]);
    };
    
    /** @end-class-def DNode **/

    function DNodeIterator (root) // Walks dictionary and returns DNodes that have data.
    {
        
    }

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec, dt)
    {
        // Construct url segment iterator.
        this.urli = new DURL(rec.l, dt);
        this.rec = rec;
        this.dt = dt;
        DT_TRAITS.imbue(rec, dt);
        Object.defineProperty(this, "notes", {value: {}});//By default, writable, enumerable, configurable = false
                
        Object.freeze(this);
    }
    /** @end-class-def DRecord **/

    function loadETLD () 
    {
        var xhr = new XMLHttpRequest();
        
        // xhr.onloadend = function (e)        // {            // ETLD = JSON.parse(e.target.response);        // };
        xhr.open("GET", chrome.extension.getURL('/data/etld.json'), false);
        xhr.send();
        var resp = xhr.response;        ETLD = JSON.parse(resp);
    }
        
    function clear ()
    {
        var i, dt,            dtList = Object.keys(DT_TRAITS.traits),            n = dtList.length;        for (i=0; i<n; i++)        {            dt = dtList[i];            DNode[dt] = newDNode();        }
    }
    
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        insertRec: {value: insertRec},
        getRecs: {value: getRecs},
        DT_TRAITS: {value: DT_TRAITS},
        PREC_TRAITS: {value: PREC_TRAITS},
        EREC_TRAITS: {value: EREC_TRAITS},
        clear: {value: clear},
        loadETLD: {value: loadETLD},
        newDNode: {value: newDNode}, // used by build_tools
        DURL: {value: DURL} // used by build_tools
    });
    Object.freeze(iface);

    console.log("loaded memstore");
    return iface;
}());
