/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document */

/** @remove Only used in debug builds */
"use strict";
function com_bprivy_GetModule_Common () {
    /** @globals-begin */      
    var CSS_HIDDEN = "com-bprivy-hidden";
    /** @constant */
    var dt_eRecord = "E-Rec";  // Represents a E-Record (html-element record)
    /** 
     * Tagname for dt_eRecords in the in-memory and file stores.
     * @constant
     * tag_eRecs is a property name that should never clash withe a URL segment. Hence the bracket
     * characters are being used because they are excluded in rfc 3986.
     */ 
    var tag_eRecs = "{E-REC}";
    /** @constant */
    var dt_pRecord = "P-Rec";  // Represents a P-Record (password record)
    /** 
     * Tagname for dt_pRecords in the in-memory and file stores.
     * @constant
     * tag_pRecs is a property name that should never clash withe a URL segment. Hence the bracket
     * characters are being used because they are excluded in rfc 3986.
     */
    var tag_pRecs = "{P-REC}";
    var uid_aliases = ['username', 'userid','user','signon','loginid', 'logonid'];
    var pass_aliases = ['password', 'passphrase', 'credentials'];
    var url_aliases = ['url', 'location', 'href', 'src'];
    
    /** @globals-end **/
    function bp_throw (str) {
        throw str;
    }
    
    function toJson(o)
    {
        return JSON.stringify(o, null, 2);
    }

    // interface HTMLAnchorElement : HTMLElement {
  // stringifier attribute DOMString href;
           // attribute DOMString target;
           // attribute DOMString rel;
  // readonly attribute DOMTokenList relList;
           // attribute DOMString media;
           // attribute DOMString hreflang;
           // attribute DOMString type;
// 
           // attribute DOMString text;
// 
  // // URL decomposition IDL attributes
           // attribute DOMString protocol;
           // attribute DOMString host;
           // attribute DOMString hostname;
           // attribute DOMString port;
           // attribute DOMString pathname;
           // attribute DOMString search;
           // attribute DOMString hash;
    // Parses URL into components as in the Location object.
    parseURL(url)
    {
        // Create an HTMLElement and make the browser parse the URL for us!
        el = document.createElement('a');
        el.href = url;
        var loc = {};
        loc.protocol = el.protocol;
        loc.host = el.host;
        loc.hostname = el.hostname;
        loc.port = el.port;
        loc.pathname = el.pathname;
        loc.search = el.search;
        loc.hash = el.hash;
        return loc;
    }
    
    var iface = {};
    Object.defineProperties(iface, 
    {
        CSS_HIDDEN: {value: CSS_HIDDEN},
        dt_eRecord: {value: dt_eRecord},
        dt_pRecord: {value: dt_pRecord},
        tag_eRecs: {value: tag_eRecs},
        tag_pRecs: {value: tag_pRecs},
        bp_throw: {value: bp_throw},
        toJson: {value: toJson},
        parseURL: {value: parseURL}
    });
    Object.freeze(iface);

    return iface;
    
    // Function.prototype.defineMethod = function (name, value)
    // {
        // this.prototype[name] = value;
        // return this;
    // };
//     
    // var bp_common_clone = function ()
    // {
        // if ((typeof this) !== "object") {
            // return;
        // }
//         
        // var o = {}, temp_name;
        // for (temp_name in this) {
            // if (this.hasOwnProperty(temp_name)) {
                // o[temp_name] = this[temp_name];
            // }
        // }
        // return o;
    // };
    
    //Object.defineProperty(Object.prototype, "bp_common_clone", {value: bp_common_clone, writable: false, enumerable: false, configurable: false});
}