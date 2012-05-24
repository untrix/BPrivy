/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $ document com_bprivy_GetModule_MainPlatform com_bprivy_GetModule_Connector com_bprivy_GetModule_Common */
/*jslint browser:true, devel:true, es5:true, vars:true */
/*properties console.info, console.log, console.warn */

"use strict";
(function Main(doc) 
{
    /** @import-module-begin MainPlatform */
    var m = com_bprivy_GetModule_MainPlatform();
    var registerMsgListener = m.registerMsgListener;
    var initScaffolding = m.init;
    /** @import-module-begin Connector */
    m = com_bprivy_GetModule_Connector();
    var dt_eRecord = m.dt_eRecord;
    var dt_pRecord = m.dt_pRecord;
    var cm_getRecs = m.cm_getRecs;
    var newUrla = m.newUrla;
    var recKey = m.recKey;
    var newActions = m.newActions; // Actions constructor
    var getRecTag = m.DNODE_TAG.getRecTag;
    var tag_eRecs = getRecTag(dt_eRecord);
    var tag_pRecs = getRecTag(dt_pRecord);
    /** @import-module-begin Common */
    m = com_bprivy_GetModule_Common();
    var bp_throw = m.bp_throw;
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    /** Two databases */
    var g_pd, g_kd;

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
    // this["{erec}"] =
    // {"ft_userid":{"dt":"E-Record","fieldType":"ft_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},"ft_pass":{"dt":"E-Record","fieldType":"ft_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
    // The payload itself is an object with multiple properties. Each of the
    // properties is a 'record' (i.e. e-rec in k-dict and p-rec in p-dict).
    // The property-name is the record-key and is carried within each record
    // as the property named 'key'. Giving a generic name to the key makes it
    // possible to write generic dictionary code regardless of the dictionary
    // or record type. For each dictionary, the record keys are chosen
    // differently.
    // For e.g. in the case of k-dict, the record keys are from a fixed set :
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
    // A g_pdb payload will look like:
    // this["{pdict}"] = {'username1':'password1', 'username2':'password2'};
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
            var recTag = getRecTag(rec.dt);
            var recs = this[recTag];
            if (!recs) {
                this[recTag] = (recs = {});
            }
            r = recs[ki=recKey(rec)];
            if (r) {
                r.insert(rec);
            }
            else {
                (recs[ki] = newActions()).insert(rec);
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
    DNode.prototype.findERecs = function (urli)
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
    DNode.prototype.findPRecs = function(urli) 
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
        delete rec.loc;
        
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
    function getRecs(urli)
    {
        var kdb, pdb, r;
        r = {};
        r[tag_eRecs] = g_kd.findERecs(urli);
        urli.rwnd();
        r[tag_pRecs] = g_pd.findPRecs(urli);

        return r;
    }

    function onRequest(rq, sender, funcSendResponse)
    {
        console.info("Mothership Received object of type " + rq.dt);
        switch (rq.dt) {
            case dt_eRecord:
                g_kd.insert(new DRecord(rq));
                funcSendResponse({
                    ack : true
                });
                break;
            case dt_pRecord:
                g_pd.insert(new DRecord(rq));
                funcSendResponse({
                    ack : true
                });
                break;
            case cm_getRecs:
                var urli = new Iterator(newUrla(rq.loc));
                var db = getRecs(urli);
                funcSendResponse(db);
                break;
        }
    }

    initScaffolding(doc);
    registerMsgListener(onRequest); 

})(document);