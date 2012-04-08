/**
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
    var C_HTTP_PROTO = "http:";
    var C_HTTPS_PROTO = "https:";
    // C_VALUES is a property name that should never
    // clash withe a URL segment. Hence the bracket
    // characters are being used because they are
    // excluded in rfc 2396 
    var C_VALUES = "{v}";
    var C_PARENT = "{p}";
    /** @globals-end **/
    
    
    initScaffolding(doc);
    
    /** @begin-class-def DNode */
        function DNode ()
        {
            // Following properties will be added as needed
            // An object containing values keyed by their data types
            // e.g. this[C_VALUES] = {'username1':'password1', 'username2':'password2'};
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
                var v = rec.value, va = this[C_VALUES];
                if (!va) {
                    this[C_VALUES] = (va = {});
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
            var k = keys.increment(), n;
            if (!k) {
                return this;
            }
            else {
                n =  this[k];
                if (!n) {
                    keys.decrement();
                    return this;
                }
                else {
                    return n; // Not recursive.
                    // return n.findBest(keys); Tail recursive.
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
                case C_HTTP_PROTO:
                    l.port = 80;
                    break;
                case C_HTTPS_PROTO:
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