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

    function clear(obj) 
    {
        var keys = Object.keys(obj), n;
        for (n=keys.length-1; n >= 0; n--) {
            delete obj[keys[n]];
        }
    }
    
    function copy (src, dst)
    {
        clear(dst);
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
        copy: {value: copy},
        clear: {value: clear}
    });
    Object.freeze(iface);

    console.log("loaded common");
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


