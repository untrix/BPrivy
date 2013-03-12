/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
//////////// DO NOT HAVE DEPENDENCIES ON ANY BP MODULE ///////////////////
function BP_GET_COMMON(g) 
{
    "use strict";
    
    /** @globals-begin */      
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_win = g.g_win,
        g_doc = g_win.document,
        BP_ERROR = g.BP_ERROR,
        CSS_HIDDEN = "com-bprivy-hidden";
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
        EMPTY_ARRAY  = Object.freeze([]),
        PROTO_SUPPORTED = ['http:', 'https:', 'ftp:'];
    /** Global url regexpression used for all invocations of parseURL. Remember that lastIndex prop. and flags are shared ! */
    //var g_url_regexp = /^(?:([A-Za-z]+):)(\/\/)?([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#{}]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    var g_url_regexp = /^(?:([A-Za-z\-]+):\/\/)(?:([0-9.\-A-Za-z]+)(?::(\d+))?)?(?:\/([^?#{}]*))?(?:\?([^#]*))?(?:#(.*))?$/;
    /** @globals-end **/
   
    function toJson(o)
    {
        return JSON.stringify(o, null, 2);
    }
    
    function isSupportedScheme(scheme)
    {
        return (PROTO_SUPPORTED.indexOf(scheme) !== -1);
    }
    
  // // URL decomposition IDL attributes
           // attribute DOMString protocol;
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
            var loc = {href:url};
            //['url', 'scheme', 'slash', 'host', 'port', 'path', 'query', 'hash']
            if (segs[1]) { loc.protocol = segs[1] + ":";} // ':' is appended in order to stay consistent with Google Chrome
            if (segs[2]) { loc.hostname = segs[2];}
            if (segs[3]) { loc.port = segs[3];}
            if (segs[4]) { loc.pathname = segs[4];}
            if (segs[5]) { loc.search = segs[5];}
            if (segs[6]) { loc.hash = segs[6];}
            
            if (loc.protocol && loc.hostname) {
                // Need to be consistent with browsers.
                if (!loc.pathname) {loc.pathname = "/";}
                else {loc.pathname = "/" + loc.pathname;}
                return loc;
            }
            else {return loc;} // Without protocol and hostname we deem this string a non-URL for our purposes.
        }
    }
    
    function locToURL(loc)
    {
        var url;
        if (loc.href) {return loc.href;}
        
        url = "";
        if (!loc) {return;}
        if (loc.protocol) {
            url += (loc.protocol + "//");
        }
        if (loc.hostname)  {
            url += loc.hostname;
        }
        if (loc.port) {
            url += (":" + loc.port);
        }
        if (loc.pathname) {
            url += (loc.pathname);
        }
        if (loc.search) {
            url += ("?" + loc.search);
        }
        if (loc.hash) {
            url += ("#" + loc.hash);
        }
        
        return url;
    }
    
    function parseURL2(url)
    {
        // Create an HTMLElement and make the browser parse the URL for us! Unfortunately
        // it creates its own scheme and hostname if one is missing. Not good ! Hence use
        // the regexp based implementation above until I can sort this out.
        var el = g_doc.createElement('a');
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
    
    function getQueryObj(loc)
    {
    	if (!loc.search) {return {};}
    	var o = {},
	    	query = loc.search.slice(1),
	    	vars = query.split("&"),
	    	i, 
	    	len = vars.length,
	    	pair;

	    for (i=0; i < len; i++) {
	      pair = vars[i].split("=");
	      o[pair[0]] = pair[1];
	    }

  		return o;
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
        BP_ERROR.log("pd invoked");
        ev.preventDefault();
        return false;
    }
    
    function stopPropagation(ev)
    {
        //BP_ERROR.loginfo("stopPropagation invoked");
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
        var keys, n;
        
        if (!obj) { return; }
        keys = Object.keys(obj);
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
        return dst;
    }

    /**
     * DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
     *                      Use IterObj instead
     * Iterates over keys of an object (as in Object.keys)
     * 'this' is mapped to thisArg
     *
     * DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED DEPRICATED
     */
    function iterKeys (o, func, ctx, thisArg)
    {
        var keys = Object.keys(o),
            rVal = false,
            i = keys.length-1;
            // convert arguments into an array. Omit 'o', 'this' and 'func' arguments though.
            // ctx = Array.prototype.slice.apply(arguments, [3]);
        for (i; i>=0; i--)
        {
            if (func.apply(thisArg, [keys[i], o[keys[i]], ctx]) === true) {
                rVal = true; break;
            }
        }
        return rVal;
    }
   
    /**
     *                  Replaces IterKeys
     * 
     * Iterates over keys of an object (as in Object.keys)
     * 'this' is mapped to thisArg
     */
    function iterObj (o, thisArg, func, ctx)
    {
        var keys = Object.keys(o),
            i = keys.length-1;
        for (i; i>=0; i--)
        {
            if (func.apply(thisArg, [keys[i], o[keys[i]], ctx]) === true) {
                break;
            }
        } 
    }

    function bindProto (obj, proto)
    {
        iterObj(proto, null, function(fName, fBody)
        {
            //enumerable,configurable,writable=false
            Object.defineProperty(obj, fName, {value:fBody});
        });
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
        var n = (a?a.length:0), i;
        for (i=0; i<n; i++)
        {
            if (func.apply(thisArg, [a[i], ctx]) === true) {
                break;
            }
        } 
    }
    
    function ArrayIterator (a)
    {
        Object.defineProperties(this,
        {
            _a: {value: a},
            _n: {value: a.length},
            _i: {value: 0, writable: true}
        });
    }
    ArrayIterator.prototype.next = function ()
    {
        if (this._i < this._n) { return this._a[this._i++]; }
    };
    
    function indexOf (a, item)
    {
        if (!a) {return -1;}
        return Array.prototype.indexOf.apply(a, [item]);
    }
    // function concatArray (dst, frag)
    // {
        // iterArray2(frag, null, function (item, dst)
        // {
            // dst.push(item);
        // }, dst);
    // }
    
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
        isSupportedScheme:{value:isSupportedScheme},
        parseURL: {value: parseURL},
        parseURL2: {value: parseURL2},
        locToURL: {value: locToURL},
        getScheme: {value: getScheme},
        getQueryObj: {value: getQueryObj},
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
        iterArray2: {value: iterArray2},
        ArrayIterator: {value: ArrayIterator},
        indexOf: {value: indexOf},
        iterObj: {value:iterObj},
        bindProto:{value:bindProto},
        //concatArray: {value: concatArray},
        EMPTY_OBJECT: {value: EMPTY_OBJECT},
        EMPTY_ARRAY: {value: EMPTY_ARRAY}
    });
    Object.freeze(iface);

    BP_ERROR.log("constructed mod_common");
    return iface;
        
}
