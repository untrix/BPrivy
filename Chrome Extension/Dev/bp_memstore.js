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
    m = BP_MOD_CONNECT;
    var cm_getRecs = IMPORT(m.cm_getRecs);
    /** @import-module-end **/    m = null;

    /** @globals-begin */

    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_EQUAL = Number(0),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        D_SUB = Number(-1),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        D_SUPER = Number(1),
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
        D_DIFF = Number(2),
    /** Two in-mem Tries. Make sure this file is run only in one thread otherwise multiple
     * copies of the tries will get created.
     */
        g_pd, g_kd,
        DNODE_TAG = {};
    Object.defineProperties(DNODE_TAG,
        {
            DATA: {value:"{dt}"},// writable, enumerable and configurable=false by default.
            TLD: {value:"{t}"},
            HOST: {value:"{h}"},
            DOMAIN: {value:"{d}"},
            PORT: {value:"{o}"},
            PATH: {value:"{p}"},
            getDataTag: {value: function (dt) {
                // tag is a property name that should never clash withe a URL
                // segment. Hence the bracket
                // characters are being used because they are excluded in rfc
                // 3986.
                if(dt) {
                    return DNODE_TAG.DATA + dt;
                }
            }, writable:false, configurable:false}
        }
    );
    var tag_eRecs = DNODE_TAG.getDataTag(dt_eRecord),
        tag_pRecs = DNODE_TAG.getDataTag(dt_pRecord),
        PREC_NATURE ={}, EREC_NATURE={}, DEFAULT_NATURE={},
        DT_NATURE = {};
        
    function isValidLocation(loc) // TODO: Incorporate this into a URL class.
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

    // Top-Level properties defined in DEFAULT_NATURE are mandatory for any NATURE object.
    // Omitting second-level properties (e.g. dict.url_scheme) is okay - implies false for
    // boolean properties.
    Object.defineProperties(DEFAULT_NATURE,
    {
        // dict: Properties referenced by dictionary/trie/URLA.
        // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.
        dict: {value: {url_scheme: false, url_host:true, url_port:true, url_path:true}},
        // action: properties referenced by the Actions class.
        action: {
            value: {
                // history=true asserts we're interested in maintaining history.
                // Will cause Actions class to keep history in memory
                // A value of false asserts the opposite. Will
                // cause Actions to only keep current value in memory.
                history: false,
                // An assert action is one that re-asserts the existing value. When a record
                // is received that has the same value as the most current value for its key,
                // but a different timestamp, then it is deemed as an assertion of an existing
                // value. 'save_asserts' dictates whether or not such records should be persisted
                // to storage. Persisting repeated values can significantly increase the storage
                // size for situations where the same values are repeatedly generated - e.g. E-Records.
                // Note that an assert with the same exact value and timestamp is a duplicate and will
                // always be ignored and discarded - the value of save_asserts nature will not
                // affect that behaviour.
                persist_asserts: false
            },
        },
        // Returns record key
        getKey: {value: function (rec) {}}
    }); Object.freeze(DEFAULT_NATURE);
    
    Object.defineProperties(PREC_NATURE,
    {
        dict: {value: {url_host:true, url_port:true}},
        actions: {value: {history:true, persist_asserts: true}},
        getKey: {value: function(rec)
            {
                return rec.userid;
            }},        
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.userid === "string") &&
                    (typeof rec.pass === "string"));
            }}
    }); Object.freeze(PREC_NATURE);
    
    Object.defineProperties(EREC_NATURE,
    {
        dict: {value: {url_host:true, url_port:true, url_path:true}},
        actions: {value: {history: false, persist_asserts:false}},
        getKey: {value: function(rec)
            {
                return rec.fieldType;
            }},
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.fieldType === "string") &&
                    (typeof rec.tagName === "string"));
            }}
    }); Object.freeze(EREC_NATURE);
    
    Object.defineProperty(DT_NATURE, dt_eRecord, {value: EREC_NATURE});
    Object.defineProperty(DT_NATURE, dt_pRecord, {value: PREC_NATURE});
    Object.defineProperty(DT_NATURE, dt_default, {value: DEFAULT_NATURE});
    Object.defineProperties(DT_NATURE,
    {
        getNature: {
            value: function (dt)
            {
                var n = this[dt];
                if (!n) {
                    n = this[dt_default];
                }
                return n;
            }},
        getDictNature: {
            value: function (dt) {
                return this.getNature(dt).dict;
            }
        },
        getKey: {
            value: function (rec)
            {
                var n = this[rec.dt];
                if (n && n.getKey) {
                    return n.getKey(rec);
                }
            }}
    });
    Object.freeze(DT_NATURE);
  
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
    function Actions(jo)
    {
        if (jo)
        {
            Object.defineProperties(this,
                {
                    curr: {value: jo.curr, writable: true, enumerable: true},
                    arecs: {value: jo.arecs, enumerable: true}
                }
            );
        }
        else {
            Object.defineProperties(this,
                {
                    curr: {writable: true, enumerable: true},
                    arecs: {value: [], enumerable: true}
                }
            );
        }
        Object.seal(this);
    }
    /** Method. Insert a record into the Action Records collection */
    Actions.prototype.insert = function(arec)
    {//TODO: Check for exact duplicate records. That is, records with matching timestamp and values.
        if (this.curr) {
            if (this.curr.date <= arec.date) {
                // This is the latest value. Check if has same value as current.
                if (DT_NATURE.compare(this.curr, arec.dt) === D_EQUAL) { // TODO: Implement DT_NATURE.compare
                    // Same values. Now compare timestamps to check if they're the same record being
                    // resent (when merging DBs for e.g.)
                    if (this.curr.date !== arec.date) {
                        // Same value being re-asserted. Just update the timestamp of the current record.
                        this.curr.date = arec.date;
                        arec.notes.isAssert = true; // Tell filestore that this is an assert. 
                    } else {
                        //repeated record (e.g. imported a CSV file again, re-merged with a DB), discard it.
                        arec.notes.isRepeat = true; // Tell filestore that this is a repeat.
                    }
                }
            }
            else {
                // This is a historical value. Consult with DT_NATURE whether we want to keep it.
                arec.notes.isHistory = true;
                if (DT_NATURE.keepHistory(arec.dt)) { // TODO: implement keepHistory
                    this.arecs.push(arec);
                }
            }
        }
        else { // This is the first value.
            var n = this.arecs.push(arec);
            this.curr = this.arecs[n-1];    
        }        
    };
    
    function newActions(jo) {
        return new Actions(jo);
    }
    /** @end-class-defn **/

    /** @begin-class-def Iterator */
    /**
     * @constructor
     * @interface
     */
    function Iterator (urla)
    {
        this._a = urla;      
        this._i = 0;
        Object.seal(this);
    }
    /** Returns current value and advances iterator if possible */
    Iterator.prototype.incr = function() 
    {
        var i = this._i;
        if ((++this._i) > this._a.length) {this._i = i;}
        return this._a[i];
    };
    /** Returns current value and recedes iterator if possible */
    Iterator.prototype.decr = function()
    {
        var i = this._i;
        if ((--this.i) < 0) { this.i = i; }
        return this._a[i];
    };
    Iterator.prototype.count = function() 
    {
        return (this._a.length - this._i);
    };
    Iterator.prototype.get = function(i) 
    {
        return this._a[i || this._i];
    };
    Iterator.prototype.rwnd = function()
    {
        this._i = 0;
        return this._a[this._i];
    };
    Iterator.prototype.pos = function() 
    {
        return this._i;
    };
    Iterator.prototype.seek = function(i)
    {
        if(i) {
            this._i = i;
        }
    };
    Iterator.prototype.isBelowTLD = function()
    {
        var s = this._a[this._i];
        return (s.search(/^\{[st]\}.+/) === (-1));
    };
    function compare (i1, i2)
    {
        while (i1.count() && i2.count())
        {
            if (i1.get() !== i2.get()) {
                return D_DIFF;
            }
            else {
                i1.incr();
                i2.incr();
            }
        }
        
        if (i1.count() === i2.count() === 0) {return D_EQUAL;}
        else if (i1.count() < i2.count()) {return D_SUB;}
        else {return D_SUPER;}
    }
    /** @end-class-defn Iterator **/
      
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
    // segment. At this writing the values chosen are {erec} and {pdict}. Hence
    // a payload object of a DNode in the g_kdb dictionary will look like:
    // this["{dt}e-rec"] =
    // {"ft_userid":{"dt":"E-Record","fieldType":"ft_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},
    //  "ft_pass":{"dt":"E-Record","fieldType":"ft_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
    // The payload itself is an object with multiple properties. Each of the
    // properties is a 'record' (i.e. e-rec in k-dict and p-rec in p-dict).
    // The property-name is the record-key and is carried within each record
    // as the property named 'key'. Giving a generic name to the key makes it
    // possible to write generic dictionary code regardless of the dictionary
    // or record type. For each dictionary, the record keys are chosen
    // differently.
    // For e.g. in the case of e-dict, the record keys are from a fixed set :
    // 'ft_userid',
    // 'ft_password', 'dt_email' etc. etc. because that makes sense for that
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
    function DNode (){}
    function newDNode () {return new DNode();}
    
    /** Class DupeRecs Record Collection
     *  Manages duplicate records according to record-type rules.
     */
    //function DupeRecs

    /** Helper function to DNode.prototype.insert */
    DNode.prototype.tryInsert = function (drec)
    {
        var rec = drec.rec,
            k = drec.urli.incr(),
            r, t, ki;
        if (!k) 
        {
            var recTag = DNODE_TAG.getDataTag(rec.dt);
            var recsMap = this[recTag];
            if (!recsMap) {
                this[recTag] = (recsMap = {});
            }
            r = recsMap[ki=DT_NATURE.getKey(rec)];
            if (r) {
                r.insert(rec);
            }
            else {
                (recsMap[ki] = newActions()).insert(rec);
            }
        }
        else 
        {   // continue walking down the trie
            var n = this[k];
            if (!n) {
                this[k] = (n = newDNode());
            }
            
            return n; // Non-recursive
            // n.insert(rec); Tail-recursive.
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
                return undefined; // exact URL match does not exist
            }
            else {
                urli.incr();
                return n;
                //if (n instanceof DNode) {
                    //urli.incr();
                    //return n; // Not recursive.
                    // return n.findBest(urli); Tail recursive.
                //}
                /*else {//(instanceof KNode)
                    var urli2 = n.urli;
                    var c = compare(urli,urli2.rwnd());
                    switch (c) {
                        case D_DIFF:
                        case D_SUB:
                            return this;
                        
                        case D_SUPER:
                        case D_EQUAL:
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
    DNode.prototype.findERecsMapArray = function (urli)
    {
        var n, r = this, stack = [];
        // Walk down the dictionary tree.
        do {
            // save secondary level knowledge
            if (r[tag_eRecs]) {stack.push(r[tag_eRecs]);}
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
    DNode.prototype.findPRecsMap = function(urli) 
    {
        var n = this, n2;
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (n[tag_pRecs]) {n2 = n; /*idb = urli.pos();*/}
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
                return n2[tag_pRecs];
            //}
        }
    };
    
    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode. Discards URL-scheme, query and fragment
     * values as those are deemed irrelevant for our purpose.
     */
    function newUrla (l, dt) // throws BPError
    {
        var ha, pa, pr, pn, urla = [], i, s,
        dtNature = DT_NATURE.getDictNature(dt);

        // Note: We need scheme and hostname at a minimum for a valid URL. We also need
        // pathname before we insert into TRIE, hence we'll append a "/" if path is missing.
        // But first ensure that this is indeed a URL.
        if (! (l && 
                (typeof l.protocol=== "string") && (l.protocol.length > 0) &&
                (typeof l.hostname === "string") && (l.hostname.length > 0) ) )
            {throw new BPError("Usupported Page (only http/https websites are supported): "+JSON.stringify(l));}
        
        pr = l.protocol.toLowerCase();

        if (dtNature.url_host)
        {
            // Split hostname into an array of strings.       
            ha = l.hostname.split('.');
            ha.reverse();
        }
        
        if (dtNature.url_path)
        {
            if (!l.pathname) {s = "/";} // In practice, all code tacks-on a "/" if missing in a valid URL.
            else {s = l.pathname;}
            // Split pathname into path segments.
            // First remove leading slashes
            s = s.replace(/^\/+/,'');
            // Now split into an array of strings.
            pa = s.split('/');
        }

        // if (dtNature.url_query && l.search)
        // {
            // qa = l.search.split('&');
        // }
        
        if (l.port && dtNature.url_port)
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
        
        if (dtNature.url_scheme && pr) {
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
        
        return urla;
    }

    /** @end-class-def DNode **/

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec)
    {
        // Construct url segment array iterator.
        var urla = newUrla(rec.loc, rec.dt);
        
        this.urli = new Iterator(urla);
        this.rec = rec;
                
        Object.freeze(rec);
        Object.freeze(this);
    }
    /** @end-class-def **/

    g_kd = newDNode();
    g_pd = newDNode();
    
    /**
     * Returns dt_eRecord and dt_pRecord records that best match urli.
     */
    function getRecs(loc)
    {
        var kdb, pdb, r,
            urlk = new Iterator(newUrla(loc, dt_eRecord)),
            urlp = new Iterator(newUrla(loc, dt_pRecord));

        r = {};
        r.eRecsMapArray = g_kd.findERecsMapArray(urlk);
        r.pRecsMap = g_pd.findPRecsMap(urlp);

        return r;
    }

    function insertRec(rec)
    {
        var result = false;
        DT_NATURE.imbue(rec);
        switch (rec.dt) {
            case dt_eRecord:
                result = g_kd.insert(new DRecord(rec));
                break;
            case dt_pRecord:
                result = g_pd.insert(new DRecord(rec));
                break;
        }
        return result;
    }
    
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        insertRec: {value: insertRec},
        getRecs: {value: getRecs}
    });
    Object.freeze(iface);

    return iface;
}());
