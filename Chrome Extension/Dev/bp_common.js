/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document, IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
var BP_MOD_COMMON = (function() 
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    /** @globals-begin */      
    var CSS_HIDDEN = "com-bprivy-hidden";
    /** 
     * @constant Used for multiple purposes. Therefore be careful of what chars
     * you use in the string.
     * 1. As a data-type (class) identifier within in-memory objects.
     * 2. As a component of filesystem directory/filenames of ADB. Therefore
     *    name should be short and lowercase. NTFS and FAT ignores case. Do not
     *    use any chars that are disallowed in any filesystem (NTFS, NFS, FAT,
     *    ext1,2,3&4, CIFS/SMB, WebDAV, GFS, any FS on which a customer may want to store
     *    their ADB).
     * 3. As a component of tag-names inside DNodes. Hence keep it short. Do not
     *    use any chars that are disallowed as Javascript properties.
     * 4. These values will get marshalled into JSON files, therefore make sure
     *    that they are all valid JSON property names (e.g. no backslash or quotes).
     * 5. To represent the data-type in general at other places in the code ...
     */
    var dt_eRecord = "E-Rec";  // Represents a E-Record (html-element record). Value is persisted.
    var dt_pRecord = "P-Rec";  // Represents a P-Record (password record). Value is persisted.
    var dt_etld    = "ETLD";   // Represents a ETLD (Public Suffix) record. Value is persisted.
    /** 
     * Tagname for dt_eRecords in the in-memory and file stores.
     * @constant
     * tag_eRecs is a property name that should never clash withe a URL segment. Hence the bracket
     * characters are being used because they are excluded in rfc 3986.
     */ 
    //var tag_eRecs = "{E-REC}";
    /** 
     * Tagname for dt_pRecords in the in-memory and file stores.
     * @constant
     * tag_pRecs is a property name that should never clash withe a URL segment. Hence the bracket
     * characters are being used because they are excluded in rfc 3986.
     */
    //var tag_pRecs = "{P-REC}";
    var uid_aliases = ['username', 'userid','user', 'id', 'signon','loginid', 'logonid'];
    var pass_aliases = ['password', 'passphrase', 'credentials'];
    var url_aliases = ['url', 'location', 'href', 'src', 'formSubmitURL'];
    /** @constant */
    var PROTO_HTTP = "http:";
    /** @constant */
    var PROTO_HTTPS = "https:";
    /** Global url regexpression used for all invocations of parseURL. Remember that lastIndex prop. and flags are shared ! */
    var g_url_regexp = /^(?:([A-Za-z]+):)(\/\/)?([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#{}]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    /** @globals-end **/
   
   
    function toJson(o)
    {
        return JSON.stringify(o, null, 2);
    }
    
  // // URL decomposition IDL attributes
           // attribute DOMString protocol;
           // attribute DOMString host;
           // attribute DOMString hostname;
           // attribute DOMString port;
           // attribute DOMString pathname;
           // attribute DOMString search;
           // attribute DOMString hash;
    // Parses URL into components as in the Location object.
    function parseURL(url) // TODO: Incorporate this into URL class
    {
        var segs = g_url_regexp.exec(url);

        if (segs) 
        {
            var loc = {};
            //['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash']
            if (segs[1]) { loc.protocol = segs[1] + ":";} // ':' is appended in order to stay consistent with Google Chrome
            if (segs[3]) { loc.hostname = segs[3];}
            if (segs[4]) { loc.port = segs[4];}
            if (segs[5]) { loc.pathname = segs[5];}
            if (segs[6]) { loc.search = segs[6];}
            if (segs[7]) { loc.hash = segs[7];}
            
            if (loc.protocol && loc.hostname) {
                // Browsers tack-on a '/' in case it is missing so we need to be consistent for URL-comparison purposes.
                if (!loc.pathname) {loc.pathname = "/";}
                return loc;
            }
            else {return;} // Without protocol, hostname and pathname we deem this string a non-URL for our purposes.
        }
    }
    
    function parseURL2(url)
    {
        // Create an HTMLElement and make the browser parse the URL for us! Unfortunately
        // it creates its own scheme and hostname if one is missing. Not good ! Hence use
        // the regexp based implementation above until I can sort this out.
        var el = document.createElement('a');
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
    
    function stripQuotes(s)
    {
        var a = s.match(/^[\s\"\']*([^\s\"\']*)[\s\"\']*$/);
        if (a) {return a[1];}
    }
       
    /** Placeholder password decryptor */
    function decrypt(str) {return str;}
    /** Placeholder password encryptor */
    function encrypt(str) {return str;}

    function preventDefault (ev)
    {
        console.log("pd invoked");
        ev.preventDefault();
        return false;
    }
    
    function stopPropagation(ev)
    {
        //console.info("stopPropagation invoked");
        ev.stopPropagation();
    }
    
    // Returns a newly created object inherited from the supplied object or constructor
    // argument. If the argument is a constructor, then the o.prototype is set to a new
    // object created using that constructor. Otherwise o.prototype=argument
    function newInherited(arg)
    {
        function Inheritor(){}
        if (typeof arg === 'object') {
            Inheritor.prototype = arg;
        }
        else if (typeof arg === 'function') {
            Inheritor.prototype = new arg();
        }
        return new Inheritor();
    }

    function copy (src, dst)
    {
        var keys = Object.keys(src),
            n;
        for (n=keys.length-1; n>=0; n--) {
            dst[keys[n]] = src[keys[n]];
        }
    }
    
    var iface = {};
    Object.defineProperties(iface, 
    {
        CSS_HIDDEN: {value: CSS_HIDDEN},
        dt_eRecord: {value: dt_eRecord},
        dt_pRecord: {value: dt_pRecord},
        dt_etld:    {value: dt_etld},
        PROTO_HTTP: {value: PROTO_HTTP},
        PROTO_HTTPS: {value: PROTO_HTTPS},
        uid_aliases: {value: uid_aliases},
        pass_aliases: {value: pass_aliases},
        url_aliases: {value: url_aliases},
        toJson: {value: toJson},
        parseURL: {value: parseURL},
        stripQuotes: {value: stripQuotes},
        encrypt: {value: encrypt},
        decrypt: {value: decrypt},
        stopPropagation: {value: stopPropagation},
        preventDefault: {value: preventDefault},
        newInherited: {value: newInherited},
        copy: {value: copy}
    });
    Object.freeze(iface);

    return iface;
        
}());

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

    // function isDocVisible(document) {
        // /*properties is */
        // return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
    // }
// 
    // function isFrameVisible(frame)
    // {
        // var retval = true;
        // console.info("Entered IsFrameVisible");
        // if (frame.hidden) {
            // retval = false;
        // }
        // else if (!frame.style) {
            // retval = true;
        // }
        // else// frame.style exists
        // {
            // if(frame.style.visibility && frame.style.visibility === 'hidden') {
                // retval = false;
            // }
            // else if(frame.style.display && frame.style.display === 'none') {
                // retval = false;
            // }
        // }
// 
        // console.info("Exiting IsFrameVisible");
        // return retval;
    // }


