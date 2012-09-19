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
 
//////////// DO NOT HAVE DEPENDENCIES ON ANY BP MODULE ///////////////////
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
    /** @constants */
    var PROTO_HTTP = "http:",
        PROTO_HTTPS = "https:",
        EMPTY_OBJECT = Object.freeze({}),
        EMPTY_ARRAY  = Object.freeze([]);
    /** Global url regexpression used for all invocations of parseURL. Remember that lastIndex prop. and flags are shared ! */
    //var g_url_regexp = /^(?:([A-Za-z]+):)(\/\/)?([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#{}]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var g_url_regexp = /^(?:([A-Za-z]+):\/\/)(?:([0-9.\-A-Za-z]+)(?::(\d+))?)?(?:\/([^?#{}]*))?(?:\?([^#]*))?(?:#(.*))?$/;
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
    function parseURL(url)
    {
        var segs = g_url_regexp.exec(url);

        if (segs) 
        {
            var loc = {};
            //['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash']
            if (segs[1]) { loc.protocol = segs[1] + ":";} // ':' is appended in order to stay consistent with Google Chrome
            if (segs[2]) { loc.hostname = segs[2];}
            if (segs[3]) { loc.port = segs[3];}
            if (segs[4]) { loc.pathname = segs[4];}
            if (segs[5]) { loc.search = segs[5];}
            if (segs[6]) { loc.hash = segs[6];}
            
            if (loc.protocol && loc.hostname) {
                // Browsers tack-on a '/' in case it is missing so we need to be consistent for URL-comparison purposes.
                if (!loc.pathname) {loc.pathname = "/";}
                return loc;
            }
            else {return loc;} // Without protocol and hostname we deem this string a non-URL for our purposes.
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
    
    function getScheme(url)
    {
        return url.slice(0, url.indexOf("://")+1);
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
    
    function delProps(obj)
    {
        var keys = Object.getOwnPropertyNames(obj), n;
        for (n=keys.length-1; n >= 0; n--) {
            delete obj[keys[n]];
        }        
    }
    
    function copy2 (src, dst)
    {
        //clear(dst);
        var keys = Object.keys(src),
            n;
        for (n=keys.length-1; n>=0; n--) {
            dst[keys[n]] = src[keys[n]];
        }
    }

    // function curry (func, ctx)
    // {
        // // convert arguments into an array. Omit 'thisArg' and 'func' arguments though.
        // //var ctx = Array.prototype.slice.apply(arguments, [2]);
// 
        // return function ()
        // {
            // func.apply(null, Array.prototype.slice.apply(arguments).concat(ctx));
        // };
    // }
    
    /**
     * DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
     *                      Use IterObj instead
     * Iterates over keys of an object (as in Object.keys)
     * Calls func with the array-item as first argument
     * followed by all arguments passed to iterKeys.
     * 'this' is mapped to thisArg
     *
     * DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
     */
    function iterKeys (o, func, ctx, thisArg)
    {
        var keys = Object.keys(o),
            i = keys.length-1;
            // convert arguments into an array. Omit 'o', 'this' and 'func' arguments though.
            // ctx = Array.prototype.slice.apply(arguments, [3]);
        for (i; i>=0; i--)
        {
            func.apply(thisArg, [keys[i], o[keys[i]], ctx]);
        } 
    }


    // DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
    //                      Use IterArray2 instead
    // Similar to forEach, but not the same. This is here because forEach is supposed
    // to be slower than a for-loop ! Calls func with the array-item as first argument
    // followed by all arguments passed to iterArray.
    // 'this' is mapped to thisArg.
    //
    // DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
    function iterArray (a, func, ctx, thisArg)
    {
        var n = a.length,
            i;
            // convert arguments into an array. Omit 'o', 'this' and 'func' arguments.
            //ctx = Array.prototype.slice.apply(arguments, [3]);
        for (i=0; i<n; i++)
        {
            func.apply(thisArg, [a[i], ctx]);
        } 
    }    
    
    /**
     *                  Replaces IterKeys
     * 
     * Iterates over keys of an object (as in Object.keys)
     * Calls func with the array-item as first argument
     * followed by all arguments passed to iterKeys.
     * 'this' is mapped to thisArg
     */
    function iterObj (o, thisArg, func, ctx)
    {
        var keys = Object.keys(o),
            i = keys.length-1;
        for (i; i>=0; i--)
        {
            func.apply(thisArg, [keys[i], o[keys[i]], ctx]);
        } 
    }

    //                      Replaces IterArray
    // Similar to forEach, but not the same. This is here because forEach is said
    // to be slower than a for-loop ! Calls func with the array-item as first argument
    // followed by all arguments passed to iterArray.
    // 'this' is mapped to thisArg. A return value of true from func will break the
    // loop.
    //
    function iterArray2 (a, thisArg, func, ctx)
    {
        var n = a.length, i;
        for (i=0; i<n; i++)
        {
            if (func.apply(thisArg, [a[i], ctx]) === true) {
                break;
            }
        } 
    }
    
    function concatArray (dst, frag)
    {
        iterArray(frag, function (item, dst)
        {
            dst.push(item);
        }, dst);
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
        getScheme: {value: getScheme},
        stripQuotes: {value: stripQuotes},
        encrypt: {value: encrypt},
        decrypt: {value: decrypt},
        stopPropagation: {value: stopPropagation},
        preventDefault: {value: preventDefault},
        newInherited: {value: newInherited},
        copy2: {value: copy2},
        clear: {value: clear},
        delProps: {value: delProps},
        iterKeys: {value: iterKeys},
        iterArray: {value: iterArray},
        iterArray2:{value: iterArray2},
        iterObj:{value:iterObj},
        concatArray: {value: concatArray},
        EMPTY_OBJECT: {value: EMPTY_OBJECT},
        EMPTY_ARRAY: {value: EMPTY_ARRAY}
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


