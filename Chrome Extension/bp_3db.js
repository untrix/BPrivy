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
 * @ModuleBegin 3db
 */
function com_bprivy_GetModule_3db() {
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var dt_userid = "dt_userid";   // Represents data-type userid
    /** @constant */
    var dt_pass = "dt_pass";        // Represents data-type password
    /** @constant */
    var dt_eRecord = "E-Record";  // Represents a E-Record (html-element record)
    /** @constant */
    var dt_pRecord = "P-Record";  // Represents a P-Record (password record)
    /** @constant */
   var cm_getDB = "cm_getDB"; // Represents a getDB command
    /** @constant */
    var PROTO_HTTP = "http:";
    /** @constant */
    var PROTO_HTTPS = "https:";
    /** 
     * Holds knowledge records inside a D-Node.
     * @constant
     * K_DB is a property name that should never
     * clash withe a URL segment. Hence the bracket
     * characters are being used because they are
     * excluded in rfc 3986.
     */ 
    var K_DB = "{kdb}";
    /** 
     * Holds username/password records inside a D-Node.
     * @constant
     * P_DB is a property name that should never
     * clash withe a URL segment. Hence the bracket
     * characters are being used because they are
     * excluded in rfc 3986.
     */
    var P_DB = "{pdb}";
        
    var postMsgToMothership = com_bprivy_GetModule_CSPlatform().postMsgToMothership;
    var rpcToMothership = com_bprivy_GetModule_CSPlatform().rpcToMothership;
   
    function ERecord() {
        var descriptor = {writable: true, enumerable: true, configurable: true};
        Object.defineProperties(this, 
        {
            dt: {value: dt_eRecord, writable: false, enumerable: true, configurable: false},
            loc: descriptor,
            recKey: descriptor,
            tagName: descriptor,
            id: descriptor,
            name: descriptor,
            type: descriptor
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

    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode.
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

    /** ModuleInterfaceGetter 3db */
    function getModuleInterface(url)
    {
        var saveERecord = function (eRec)
        {
            postMsgToMothership(eRec);
        };
        
        var getDB = function(loc, callback)
        {
            return rpcToMothership({dt:cm_getDB, loc: loc}, callback);
        };

        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            dt_userid: {value: dt_userid},
            dt_pass: {value: dt_pass},
            dt_eRecord: {value: dt_eRecord},
            dt_pRecord: {value: dt_pRecord},
            cm_getDB: {value: cm_getDB},
            saveERecord: {value: saveERecord},
            constructERecord: {value: constructERecord},
            getDB: {value: getDB},
            newUrla: {value: newUrla},
            K_DB: {value: K_DB},
            P_DB: {value: P_DB}
        });
        Object.freeze(iface);

        return iface;
    }
    
    var bp_3db = getModuleInterface();

return bp_3db;}
/** @ModuleEnd */