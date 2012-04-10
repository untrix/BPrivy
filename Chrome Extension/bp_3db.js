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
    var dt_userid = "userid";   // Represents data-type userid
    var dt_pass = "pass";        // Represents data-type password
    var dt_kRecord = "K-Record";  // Represents a K-Record
    var dt_eRecord = "E-Record";  // Represents a E-Record
    
    var postMsgToMothership = com_bprivy_GetModule_CSPlatform().postMsgToMothership;

    function Url (location) // constructor of URLs
    {
        var desc_o = {value: undefined, writable: true, enumerable: true, configurable: false};//Object descriptor
        var desc_a = {value: [], writable: true, enumerable: true, configurable: false};  //Array descriptor
        var desc_n = {value: undefined, writable: true, enumerable: true, configurable: false};//Number descriptor
        var desc_s = {value: undefined, writable: true, enumerable: true, configurable: false};//String descriptor

        Object.defineProperties(this,
        {
            protocol: desc_o,
            hostname_segments: desc_a,
            port: desc_n,
            path_segments: desc_a,
            query_segments: desc_a,
            hash: desc_s
        });
        Object.preventExtensions(this);
        
        // The following keys will be used for dictionary lookup.
        this.hostname_segments = location.hostname.split('.');
        this.hostname_segments.reverse();
        
        // Split pathname into path segments.
        // First remove leading slashes
        location.pathname = location.pathname.replace(/^\/+/,'');
        this.path_segments = location.pathname.split('/');

        // The following properties are not being used for dictionary lookup.
        this.query_segments = location.search.split('&');
        this.protocol = location.protocol;
        this.port = location.port;
        this.hash = location.hash;
    }
    
    Url.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
        // var LF = '\n';
        // var str = "protocol = " + this.protocol + LF;
        // var i, p_s = this.path_segments, h_s = this.hostname_segments;
        // for (i=0, str+="Reverse Hostname Segments = " + h_s.length + LF; i<h_s.length; ++i)
        // {
            // str += (h_s[i] + LF);
        // }
// 
        // for (i=0, str+="Path Segments = " + p_s.length + LF; i<p_s.length; ++i)
        // {
            // str += (p_s[i] + LF);
        // }
//         
        // return str;
    };
    
    function ToJson ()
    {
        return JSON.stringify(this, null, 2);
    }
    
    function ERecord() {this.dt = dt_eRecord;}
    ERecord.prototype.toJson = ToJson;
    function constructERecord() {
        var o = new ERecord();
        var descriptor = {value: undefined, writable: true, enumerable: true, configurable: false};
        Object.defineProperties(o, 
        {
            location: descriptor,
            tagName: descriptor,
            id: descriptor,
            name: descriptor,
            type: descriptor,
            dataType: descriptor
        });
        Object.preventExtensions(o);
        return o;    
    }



    /** ModuleInterfaceGetter 3db */
    function getModuleInterface(url) {
        var saveERecord = function (eRec)
        {
            postMsgToMothership(eRec);
            
            //var url = new Url(kRec.location);
            //console.info("Parsed URL = " + url.toJson());
        };

        var getElements = function (location)
        {
            
        };
        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            dt_userid: {value: dt_userid, writable: false, enumerable: false, configurable: false},
            dt_pass: {value: dt_pass, writable: false, enumerable: false, configurable: false},
            dt_eRecord: {value: dt_eRecord, writable: false, enumerable: false, configurable: false},
            saveERecord: {value: saveERecord, writable: false, enumerable: false, configurable: false},
            constructERecord: {value: constructERecord, writable: false, enumerable: false, configurable: false}
        });
        Object.seal(iface);

        return iface;
    }
    
    var bp_3db = getModuleInterface();

return bp_3db;}
/** @ModuleEnd */