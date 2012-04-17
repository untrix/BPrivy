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
    var K_DB = m.K_DB;
    var P_DB = m.P_DB;
    /** @import-module-begin Common */
    m = com_bprivy_GetModule_Common();
    var bp_throw = m.bp_throw;
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    /** Two databases */
    var g_pdb, g_kdb;

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
                return K_DB;
            case dt_pRecord:
                return P_DB;
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
        // An object containing values keyed by their data types
        // e.g. this["{pdb}"] = {'username1':'password1', 'username2':'password2'};
        // e.g. this["{kdb}"] = {"dt_userid":{"dt":"E-Record","recKey":"dt_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},"dt_pass":{"dt":"E-Record","recKey":"dt_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
        // Multiple child-node references indexed by their key segment.
        // e.g. this['yahoo.'] = child-node;
        // e.g. this['google.'] = child-node;
        // e.g. this['/path1'] = child-node;
        // e.g. this['www'] = child-node;
        // e.g. this['www:8080'] = child-node;
    }
    g_kdb = new DNode();
    g_pdb = new DNode();
    

    /** Helper function to DNode.prototype.insert */
    DNode.prototype.tryInsert = function (drec)
    {
        var rec = drec.rec;
        var k = drec.urli.incr();
        if (!k) {
            var dbName = getDbName(rec.dt);
            var db = this[dbName];
            if (!db) {
                this[dbName] = (db = {});
            }
            db[rec.recKey] = rec;
        }
        else {
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
     * Returns K_DB records that best match urli.
     */
    DNode.prototype.findKDB = function (urli)
    {
        var n , r = this;
        // Walk down the dictionary tree.
        do {
            n = r;
            r = n.tryFind(urli);
        } while (r);
    
        // In case of KDB records we need a full uri match.
        // Therfore we'll pick up the matched node's value
        // only if all of urli segments were matched - i.e.
        // if there were no remaining unmatched segments.
        if (urli.count() === 0) {
            return n[K_DB];
        }
    };
    /**
     * Returns P_DB records that best match urli.
     */
    DNode.prototype.findPDB = function(urli) 
    {
        var n = this, n2, idb;
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (n[P_DB]) {n2 = n; idb = urli.pos();}
            n = n.tryFind(urli);
        } while (n);
        
        // in the case of PDB, the data is only useful if it is
        // below the top-level-domain. Hence we should check urli
        // to determine that.
        if (n2) {
            urli.seek(idb);
            if (urli.isBelowTLD()) {
                return n2[P_DB];
            }
        }
    };
    /**
     * Returns K_DB and P_DB records that best match urli.
     */
    function getDB(urli) 
    {
        var kdb, pdb, r;
        r = {};
        r[K_DB] = g_kdb.findKDB(urli);
        urli.rwnd();
        r[P_DB] = g_pdb.findPDB(urli);

        // testing
        r[P_DB] = {'sumeet@singhonline.info':'divya1'};
        return r;
    }
    /** @end-class-def **/




    /**
     * @constructor
     * Sets up the supplied record for insertion into knowledge-db
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
        if (rq.dt === dt_eRecord)
        {
            g_kdb.insert(new DRecord(rq));
            funcSendResponse({ack: true});
        }
        else if (rq.dt === cm_getDB)
        {
            var urli = new Iterator(newUrla(rq.loc));
            var db = getDB(urli);
            funcSendResponse(db);
        }
    }
    
    initScaffolding(doc);
    registerMsgListener(onRequest);
})(document);