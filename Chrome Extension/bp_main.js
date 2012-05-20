/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $ document com_bprivy_GetModule_MainPlatform com_bprivy_GetModule_3db com_bprivy_GetModule_Common */
/*jslint browser:true, devel:true, es5:true, vars:true */
/*properties console.info, console.log, console.warn */

"use strict";
(function Main(doc) 
{
    /** @import-module-begin MainPlatform */
    var m = com_bprivy_GetModule_MainPlatform();
    var registerMsgListener = m.registerMsgListener;
    var initScaffolding = m.init;
    /** @import-module-begin 3db */
    m = com_bprivy_GetModule_3db();
    var dt_eRecord = m.dt_eRecord;
    var dt_pRecord = m.dt_pRecord;
    var cm_getDB = m.cm_getDB;
    var newUrla = m.newUrla;
    var K_DICT = m.K_DICT;
    //var K_DICT2 = m.K_DICT2;
    var P_DICT = m.P_DICT;
    var recKey = m.recKey;
    /** @import-module-begin Common */
    m = com_bprivy_GetModule_Common();
    var bp_throw = m.bp_throw;
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    /** Two databases */
    var g_pd, g_kd;

    /**
     * Name of property that holds a reference to the parent D-node.
     * @constant
     * Name of the property is selected such that it will never clash
     * with a legitimate URL segment. This is necessary because a
     * D-node has dynamically created property names from URL segments.
     */
    var P_PARENT = "{p}";
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
    /** @globals-end **/
    
    /** 
     * Gets the name of the DB where the supplied data-type belongs.
     * If nothing suitable, or if dt is null or undefined, returns null.
     */
    function getDbName(dt) 
    {
        switch (dt) {
            case dt_eRecord:
                return K_DICT;
            case dt_pRecord:
                return P_DICT;
            default:
                return null;
        }
    }

    /** @begin-class-def Iterator */
    /**
     * @constructor
     * @interface
     */
    function Iterator (a)
    {
        this._a = a;      
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
        return this._a[i? i : this._i];
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
    /** @constructor */
    function DNode ()
    {
        // Following properties will be added as needed 
        // Payload objects. Theoretically a given node could contain payload from
        // multiple 'DB's - i.e.  K or P - however, here we've chosen to store
        // payload of only one DB per dictionary. Hence there is a separate dictionary
        // per DB. Right now there are two - g_kdb and g_pdb. The payload's property
        // value is constructed such that it won't clash with the properties for
        // the child-node pointers, which are URL-segments. Hence the key for the
        // payload is constructed such that it will never conflict with any URL
        // segment. At this writing the values chosen are {kdict} and {pdict}. Hence
        // a payload object of a DNode in the g_kdb dictionary will look like:
        // this["{kdict}"] = {"dt_userid":{"dt":"E-Record","fieldType":"dt_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},"dt_pass":{"dt":"E-Record","fieldType":"dt_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
        // The payload itself is an object with multiple properties. Each of the
        // properties is a 'record' (i.e. e-rec in k-dict and p-rec in p-dict).
        // The property-name is the record-key and is carried within each record
        // as the property named 'key'. Giving a generic name to the key makes it
        // possible to write generic dictionary code regardless of the dictionary
        // or record type. For each dictionary, the record keys are chosen differently.
        // For e.g. in the case of k-dict, the record keys are from a fixed set : 'dt_userid',
        // 'dt_password', 'dt_email' etc. etc. because that makes sense for that domain. However,
        // for the p-dict the record keys can be anything because they are the username.
        // If we wanted to store - say credit card numbers, then that would be a
        // completely separate dictionary with the card-number+type as the key but
        // no URL. Also, please note that for g-dict and p-dict, in the bigger
        // picture, URL is also part of the key. Now, if we were storing bookmarks,
        // then there would be no payload at all - only the URL key. We would need
        // to put markers in the URL-trie though, in order to mark which D-Nodes
        // represented an actual bookmark v/s which were merely on the path to an
        // actual bookmark. Because of the semantic and syntactic difference
        // between different data-types (or call it data-domains) I decided to create a
        // separate trie per data-domain. Hence there is a separate trie/dictionary
        // for 'knowledge' records, a separate one for 'passwords' and for 'bookmarks'
        // as well in the future.
        // A g_pdb payload will look like:
        // this["{pdict}"] = {'username1':'password1', 'username2':'password2'};
        // References to child-nodes for walking down the url-trie. The key of the child node
        // e.g. this['yahoo.'] = child-node;
        // e.g. this['google.'] = child-node;
        // e.g. this['/path1'] = child-node;
        // e.g. this['www'] = child-node;
        // e.g. this['www:8080'] = child-node;
    }
    g_kd = new DNode();
    g_pd = new DNode();
    

    /** Helper function to DNode.prototype.insert */
    DNode.prototype.tryInsert = function (drec)
    {
        var rec = drec.rec;
        var k = drec.urli.incr();
        if (!k) 
        {
            var dbName = getDbName(rec.dt);
            var db = this[dbName];
            if (!db) {
                this[dbName] = (db = {});
            }
            db[recKey(rec)] = rec;
        }
        else 
        {   // continue walking down the trie
            var n = this[k];
            if (!n) {
                this[k] = (n = new DNode());
            }
            
            return n; // Non-recursive
            // n.insert(rec); Tail-recursive.
        }
    };
    /** Non-Recursive insert. Usually invoked at the root of a tree. */
    DNode.prototype.insert = function (drec)
    {       
        var n = this;    
        do {
            n = n.tryInsert(drec);
        } while (n);
    };
    DNode.prototype.tryFind = function(urli) 
    {
        var k = urli.get(), n;
        if (!k) {
            return null;
        }
        else {
            n = this[k];
            if (!n) {
                return null;
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
     * Returns K_DICT records that best match urli.
     */
    DNode.prototype.findKDB = function (urli)
    {
        var n, r = this, stack = [];
        // Walk down the dictionary tree.
        do {
            // save secondary level knowledge
            if (r[K_DICT]) {stack.push(r[K_DICT]);}
            n = r;
            r = n.tryFind(urli);
        } while (r);
    
        //r = {};
        
        // In case of KDB records we need a full uri match.
        // Therfore we'll pick up the matched node's value
        // only if all of urli segments were matched - i.e.
        // if there were no remaining unmatched segments.
        // if (urli.count() === 0) {
            // r[K_DICT] = stack.pop();
        // }
        // // Ancestor nodes are also harvested for heuristic
        // matching.
        return stack;
    };
    /**
     * Returns P_DICT records that best match urli.
     */
    DNode.prototype.findPDB = function(urli) 
    {
        var n = this, n2;
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (n[P_DICT]) {n2 = n; /*idb = urli.pos();*/}
            n = n.tryFind(urli);
        } while (n);
        
        // in the case of PDB, the data is only useful if it is
        // below the top-level-domain. Hence we should check urli
        // to determine that.
        if (n2) {
            //urli.seek(idb);
            //if (urli.isBelowTLD()) {
                return n2[P_DICT];
            //}
        }
    };
    /**
     * Returns K_DICT and P_DICT records that best match urli.
     */
    function getDB(urli) 
    {
        var kdb, pdb, r;
        r = {};
        r[K_DICT] = g_kd.findKDB(urli);
        urli.rwnd();
        r[P_DICT] = g_pd.findPDB(urli);

        // testing
        r[P_DICT] = {'sumeet@singhonline.info':'divya1'};
        return r;
    }
    /** @end-class-def **/




    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec)
    {
        // Construct url segment array iterator.
        var urla = newUrla(rec.loc);
        delete rec.loc;
        
        this.urli = new Iterator(urla);
        this.rec = rec;
                
        Object.freeze(rec);
        Object.freeze(this);
    }

    function onRequest (rq, sender, funcSendResponse)
    {
        console.info("Mothership Received object of type " + rq.dt);
        switch (rq.dt)
        {
            case dt_eRecord:
                g_kd.insert(new DRecord(rq));
                funcSendResponse({ack: true});
                break;
            case dt_pRecord:
                g_pd.insert(new DRecord(rq));
                funcSendResponse({ack: true});
                break;
            case cm_getDB:
                var urli = new Iterator(newUrla(rq.loc));
                var db = getDB(urli);
                funcSendResponse(db);
                break;
        }
    }
    
    initScaffolding(doc);
    registerMsgListener(onRequest);
})(document);