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
(function(doc) 
{
    /** @import-module-begin MainPlatform */
    var m = com_bprivy_GetModule_MainPlatform();
    var registerMsgListener = m.registerMsgListener;
    var initScaffolding = m.init;
    /** @import-module-begin 3db */
    m = com_bprivy_GetModule_3db();
    var dt_eRecord = m.dt_eRecord;
    var dt_kRecord = m.dt_kRecord;
    /** @import-module-begin Common */
    m = com_bprivy_GetModule_Common();
    var css_hidden = m.css_hidden;    
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    var kDB;
    /** @constant */
    var HTTP_PROTO = "http:";
    var HTTPS_PROTO = "https:";
    // VALUES is a property name that should never
    // clash withe a URL segment. Hence the bracket
    // characters are being used because they are
    // excluded in rfc 2396 
    /** @constant */
    var VALUES = "{v}";
    /** @constant */
    var PARENT = "{p}";
    /** @constant return value of comparison function */
    var EQUAL = Number(0);
    /** @constant return value of comparison function */
    var SUB = Number(1);
    /** @constant return value of comparison function */
    var SUPER = Number(2);
    /** @constant return value of comparison function */
    var DIFF = Number(3);
    /** @globals-end **/
    
    
    initScaffolding(doc);
    
    function compareKeys (k1, k2) {
        var i, t, f = Boolean(k1.length > k2.length);
        if (f) {t = k1; k1 = k2; k2 = t;}
        for (i=0; i<k1.length; i++) {
            if (k1[i] !== k2[i]) {return DIFF;}
        }
        
        if (k1.length === k2.length) {return EQUAL;}
        else if (!f) {return SUB;}
        else {return SUPER;}
    }
    
    /** @begin-class-def DNode */
        function DNode ()
        {
            // Following properties will be added as needed
            // An object containing values keyed by their data types
            // e.g. this[VALUES] = {'username1':'password1', 'username2':'password2'};
            // Multiple child-node references indexed by their key segment.
            // e.g. this['yahoo.'] = child-node;
            // e.g. this['google.'] = child-node;
            // e.g. this['/path1'] = child-node;
            // e.g. this['www'] = child-node;
            // e.g. this['www:8080'] = child-node;
        }
        kDB = new DNode();
        
        // Non-Recursive insert. Usually invoked at the root of a tree.
        // 
        DNode.prototype.insert = function (rec) 
        {
            var n = this;
            do {
                n = n.tryInsert(rec);
            } while (n);
        };
        
        DNode.prototype.tryInsert = function(rec)
        {
            var k = rec.keys.pop();
            if (!k) {
                var v = rec.value, va = this[VALUES];
                if (!va) {
                    this[VALUES] = (va = {});
                }
                va[v.key] = v;
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
        
        // Non-recursive findBest match method. Usually invoked at the root node.
        // keys is an array of key segments in reverse order. Upon return, if keys
        // still has some values remaining then it indicates a partial match. The
        // remaining key-segments did not match. Only the removed (pop'd) segments
        // matched at the node that was returned. The node may not have a value
        // in it though. You can traverse up the tree using reverse links to find
        // one with a value. Depending on the use-case you may find the entire
        // sub-tree rooted at the returned node useful as well.
        DNode.prototype.findBestMatch = function (keys) 
        {
            // usually (this === root-node)
            var r = this, n;
            do {
                n = r;
                r = n.tryFind(keys);
            } while (r !== n);
            
            return n;
        };
        
        DNode.prototype.tryFind = function(keys) 
        {
            var k = keys.incr(), n;
            if (!k) {
                return this;
            }
            else {
                n =  this[k];
                if (!n) {
                    keys.decr();
                    return this;
                }
                else {
                    if (n instanceof DNode) {
                        return n; // Not recursive.
                        // return n.findBest(keys); Tail recursive.
                    }
                    else {//(instanceof KNode)
                        var keys2 = n.keys;
                        var c = compareKeys(keys,keys2);
                        switch (c) {
                            case DIFF:
                            case SUB:
                                return this;
                            
                            case SUPER:
                            case EQUAL:
                                return n.next;
                        }
                    }
                }
            }
        };
    /** @begin-class-def **/

    //Knowledge Record
    function KRecord(eRec) {
        // Make sure to deep-copy all values into kRec instead of
        // storing references. The content-script holds
        // reference to the eRec and we don't want modifications
        // to the eRec (made by the content-script) to reflect
        // into the kRec.
        // kRec.tagName = eRec.tagName;
        // kRec.id = eRec.id;
        // kRec.name = eRec.name;
        // kRec.type = eRec.type;
        // kRec.dataType = eRec.dataType;
        // kRec.location.protocol = eRec.location.protocol;
        // kRec.location.host = eRec.location.host;
        // kRec.location.hostname = eRec.location.hostname;
        // if (eRec.location.port)
        // {
            // kRec.location.port = eRec.location.port;
        // }
        // kRec.location.pathname = eRec.location.pathname;
        // kRec.location.hash = eRec.location.hash;
        // kRec.location.search = eRec.location.search;
        // kRec.url = eRec.location.href;
        var l = eRec.location;
        var t = l.protocol;
        if (t) {
            l.protocol = t.toLowerCase();
        }
        
        if (!l.port) {
            switch (l.protocol) {
                case HTTP_PROTO:
                    l.port = 80;
                    break;
                case HTTPS_PROTO:
                    l.port = 443;
                    break;
            }
        }
        
        this.eRec = eRec;
        this.key = l.href;
        this.parentKey = l.hostname + l.port;
    }
    KRecord.prototype.dt = dt_kRecord;
    KRecord.prototype.saveKRecord = function (kDB){kDB.insert(this);};

        
    function foo (o) {}

    function onRequest (rq, sender, funcSendResponse) 
    {
        console.info("Mothership Received object of type " + rq.dt);
        switch (rq.dt)
        {
            case dt_eRecord:
                (new KRecord(rq)).saveKRecord(kDB);
                break;
            case "foo":
                foo(rq);
        }
        funcSendResponse({ack: true});
    }
    registerMsgListener(onRequest);
})(document);