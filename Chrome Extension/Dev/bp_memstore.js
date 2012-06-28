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
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP);
    var PROTO_HTTPS = IMPORT(m.PROTO_HTTPS);
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var recKey = IMPORT(m.recKey);
    var newActions = IMPORT(m.newActions); // Actions constructor
    var DNODE_TAG = IMPORT(m.DNODE_TAG);
    var tag_eRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_eRecord));
    var tag_pRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_pRecord));
    /** @import-module-end **/    m = null;

    /** @globals-begin */

    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_EQUAL = Number(0);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_SUB = Number(-1);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_SUPER = Number(1);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_DIFF = Number(2);
    /** Two in-mem Tries. Make sure this file is run only in one thread otherwise multiple
     * copies of the tries will get created.
     */
    var g_pd, g_kd;

    /** @globals-end **/
    
    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode. Discards URL-scheme, query and fragment
     * values as those are deemed irrelevant for our purpose.
     */
    function newUrla (l) // throws BPError
    {
        var ha, pa, qa, pr, pn, urla = [], i, s;

        // Note: We need scheme and hostname at a minimum for a valid URL. We also need
        // pathname before we insert into TRIE, hence we'll append a "/" if path is missing.
        // But first ensure that this is indeed a URL.
        if (! (l && 
                (typeof l.protocol=== "string") && (l.protocol.length > 0) &&
                (typeof l.hostname === "string") && (l.hostname.length > 0) ) )
            {throw new BPError("Usupported Page (only http/https websites are supported): "+JSON.stringify(l));}
        
        pr = l.protocol.toLowerCase();

        // Split hostname into an array of strings.       
        ha = l.hostname.split('.');
        ha.reverse();
        
        if (!l.pathname) {s = "/";} // In practice, all code tacks-on a "/" if missing in a valid URL.
        else {s = l.pathname;}
        // Split pathname into path segments.
        // First remove leading slashes
        s = s.replace(/^\/+/,'');
        // Now split into an array of strings.
        pa = s.split('/');

        if (l.search) {
            qa = l.search.split('&');
        }

        if (l.port) {
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
                // if (pr) {
            // switch(pr) {
               // case PROTO_HTTP:
                    // urla.push('{s}http');
                    // break;
                // case PROTO_HTTPS:
                    // urla.push('{s}https');
                    // break;
                // default:
                    // urla.push('{s}' + pr);           
            // }
        // }

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
    /** @end-class-defn **/
      
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
            r = recsMap[ki=recKey(rec)];
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
    /** @end-class-def **/

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec)
    {
        // Construct url segment array iterator.
        var urla = newUrla(rec.loc);
        //delete rec.loc;
        
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
            urli = new Iterator(newUrla(loc));

        r = {};
        r.eRecsMapArray = g_kd.findERecsMapArray(urli);
        urli.rwnd();
        r.pRecsMap = g_pd.findPRecsMap(urli);

        return r;
    }

    function insertRec(rec)
    {
        var result = false;
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
