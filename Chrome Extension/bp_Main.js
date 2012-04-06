/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $ window com_bprivy_GetModule_MainPlatform com_bprivy_GetModule_3db com_bprivy_GetModule_Common */
/*jslint browser:true, devel:true, es5:true, vars:true */
/*properties console.info, console.log, console.warn */

"use strict";
(function(win) 
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
    var eid_kDB = "com-bprivy-kDB";
    
    /** @globals-end **/
    
    
    initScaffolding(win);
    (function initDB() {
        kDB = win.document.getElementById(eid_kDB);
        if (!kDB) {
            kDB = win.document.createElement('div');
            $(kDB).attr({
               id: eid_kDB,
               'class': css_hidden,
               hidden: 'hidden' 
            }).appendTo(win.document.body);
        }
    })();
    
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
        if (eRec.location.protocol) {
            eRec.location.protocol = eRec.location.protocol.toLowerCase();
        }
        
        if (!eRec.location.port) {
            switch (eRec.location.protocol) {
                case "http:":
                    eRec.location.port = 80;
                    break;
                case "https:":
                    eRec.location.port = 443;
                    break;
            }
        }
        
        this.eRec = eRec;
    }
    KRecord.prototype.dt = dt_kRecord;
    // KRecord.prototype.toJson = function() {return JSON.stringify(this, null, 2);};
    // function constructKRecord() {
        // var o = new KRecord();
        // var descriptor = {value: undefined, writable: true, enumerable: true, configurable: false};
        // var descriptor2 = {value: {}, writable: true, enumerable: true, configurable: false};
//         
        // Object.defineProperties(o, 
        // {
            // url: descriptor,
            // location: descriptor2,
            // tagName: descriptor,
            // id: descriptor,
            // name: descriptor,
            // type: descriptor,
            // dataType: descriptor
        // });
        // Object.preventExtensions(o);
        // return o;    
    // }
  
    function saveERecord (kRec) {
        var el;

        switch (kRec.eRec.location.protocol)
        {
            case "http:":
            case "https:":
                el = win.document.getElementById(kRec.eRec.href);
                if (el) {
                    $(el).remove();
                }
                el = win.document.createElement('li');
                $(el).attr({
                    id: kRec.eRec.href,
                    'class': css_hidden,
                    hidden: 'hidden',
                    'data-tagName': kRec.eRec.tagName,
                    'data-id': kRec.eRec.id,
                    'data-name': kRec.eRec.name,
                    'data-type': kRec.eRec.type,
                    'data-dataType': kRec.eRec.dataType
                }).appendTo(kDB);
            
                break;
                
            default:
            // Discard it for now
        }
    }
        
    function foo (o) {}

    function onRequest (rq, sender, funcSendResponse) 
    {
        console.info("Mothership Received object of type " + rq.dt);
        switch (rq.dt)
        {
            case dt_eRecord:
                saveERecord(new KRecord(rq));
                break;
            case "foo":
                foo(rq);
        }
        funcSendResponse({ack: true});
    }
    registerMsgListener(onRequest);
})(window);