/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document com_bprivy_GetModule_CSPlatform*/
/*jslint browser:true, devel:true */
/** @remove Only used in debug builds */
"use strict";

/**
 * @ModuleBegin Connector
 */

function com_bprivy_GetModule_Connector() {
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var ft_userid = "ft_userid";   // Represents field-type userid
    /** @constant */
    var ft_pass = "ft_pass";       // Represents field-type password
    /** @constant */
    var cm_getRecs = "cm_getRecs";     // Represents a getDB command
    /** @constant */
    var PROTO_HTTP = "http:";
    /** @constant */
    var PROTO_HTTPS = "https:";

    /** @import-module-begin CSPlatform **/
    var m = com_bprivy_GetModule_CSPlatform();
    var postMsgToMothership = m.postMsgToMothership;
    var rpcToMothership = m.rpcToMothership;
    /** @import-module-begin Common **/
    var dt_eRecord = m.dt_eRecord;
    var dt_pRecord = m.dt_pRecord;
    var tag_eRecs = m.tag_eRecs;
    var tag_pRecs = m.tag_pRecs;
    /** @import-module-end **/    m = null;
   
    function ERecord() 
    {
        var descriptor = {writable: true, enumerable: true, configurable: true};
        var descriptor2 = {writable: true, enumerable: true, configurable: false};
        Object.defineProperties(this, 
        {
            //Record Type. Determines which dictionary this record belongs to.
            dt: {value: dt_eRecord, writable: false, enumerable: true, configurable: false},
            date: {value: Date.now(), writable: false, enumerable: true, configurable: false},
            loc: descriptor, // URL that this record pertains to. Determines where the record will sit within the URL-trie.
            fieldType: descriptor2,
            tagName: descriptor2,
            id: descriptor2,
            name: descriptor2,
            type: descriptor2
        });
        Object.preventExtensions(this);
    }
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function constructERecord() {
        return new ERecord();    
    }

    function PRecord() 
    {
        Object.defineProperties(this,
            {
                dt: {value: dt_pRecord, writable: false, enumerable: true, configurable: false},
                date: {value: Date.now(), writable: false, enumerable: true, configurable: false},
                loc: {writable: true, enumerable: true, configurable: true},
                userid: {writable: true, enumerable: true, configurable: false},
                pass: {writable: true, enumerable: true, configurable: false}
            }
        );
        Object.preventExtensions(this);
    }
    function constructPRecord()
    {
        return new PRecord();
    }
    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode. Discards URL-scheme, query and fragment
     * values as those are deemed irrelevant for our purpose.
     */
    function newUrla (l)
    {
        var ha, pa, qa, pr, pn, urla = [], i, s;

        // Split hostname into an array of strings.
        ha = l.hostname.split('.');
        ha.reverse();
        
        // Split pathname into path segments.
        // First remove leading slashes
        s = l.pathname.replace(/^\/+/,'');
        // Now split into an array of strings.
        pa = s.split('/');

        qa = l.search.split('&');
        if (l.protocol) {
            pr = l.protocol.toLowerCase();
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
                    urla.push('{t}' + ha[i].toLowerCase());
                }
                else if (i === (ha.length-1)) {
                    // Host name
                    urla.push('{h}' + ha[i].toLowerCase());
                }
                else {
                    // Second level domain
                    urla.push('{d}' + ha[i].toLowerCase());
                }
            }
        }
        if (pn) {urla.push('{o}' + pn);}
        if (pa) {
            for (i=0; i<pa.length; i++) {
                if (pa[i] !== '') {
                    urla.push('{p}' + pa[i]);
                }
            }
        }
        
        return urla;
    }

    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        var saveRecord = function (eRec)
        {
            postMsgToMothership(eRec);
        };
        
        var deleteRecord = function (erec)
        {
            console.warning('Deleting Record ' + JSON.stringify(erec));
        };
        
        var getRecs = function(loc, callback)
        {
            return rpcToMothership({dt:cm_getRecs, loc: loc}, callback);
        };

        var recKey = function(rec)
        {
            if (rec.dt === dt_eRecord) {
                return rec.fieldType;
            }
            else if (rec.dt === dt_pRecord) {
                return rec.userid;
            }
        };
        
        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            ft_userid: {value: ft_userid},
            ft_pass: {value: ft_pass},
            cm_getRecs: {value: cm_getRecs},
            tag_eRecs: {value: tag_eRecs},
            //tag_eRecs2: {value: tag_eRecs2},
            tag_pRecs: {value: tag_pRecs},
            saveRecord: {value: saveRecord},
            deleteRecord: {value: deleteRecord},
            constructERecord: {value: constructERecord},
            constructPRecord: {value: constructPRecord},
            getRecs: {value: getRecs},
            newUrla: {value: newUrla},
            recKey: {value: recKey}
        });
        Object.freeze(iface);

        return iface;
    }
    
    var bp_Connector = getModuleInterface();

return bp_Connector;}
/** @ModuleEnd */