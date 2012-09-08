/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome, BP_MOD_ERROR, BP_MOD_COMMON, $ */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome Platform
 */
var BP_MOD_CS_PLAT = (function() 
{
    "use strict";
    
    function isTopLevel(win) 
    {
        return (win.top === win.self);
    }

    var g_frameUrl = isTopLevel(window) ? null : window.location.href;
        
    var module =
    {
        DIR_SEP: "\\", // TODO: This needs to be dynamically determined based on OS
                       // Right now this will only work for Windows, but so is the plugin.
        postMsgToMothership: function (o)
        {
            function rcvAck (rsp) 
            {
                if (!rsp) {if (chrome.extension.lastError) {
                       console.log(chrome.extension.lastError.message);
                    }
                }
                else if (rsp.result===false) {
                    BP_MOD_ERROR.warn(rsp.err);
                }
            }
            chrome.extension.sendRequest(o, rcvAck);
        },
        
        rpcToMothership: function (req, respCallback)
        {
            chrome.extension.sendRequest(req, function (resp)
            {
                if (resp && resp.result===false && resp.err) {
                    var exp = resp.err;
                    resp.err = new BP_MOD_ERROR.BPError(exp);
                }
                respCallback(resp); // respCallback exists in function closure
            });
        },
        
        registerMsgListener: function(foo)
        {
            chrome.extension.onMessage.addListener(function(req, sender, callback)
            {
                if (req.frameUrl)
                { 
                    if (g_frameUrl === req.frameUrl) 
                    {
                        console.log("MsgListener@bp_cs_platform_chrome: Directing received message to frame: " + g_frameUrl);
                        foo(req, sender, callback);
                    }
                    // else if (!g_frameUrl)
                    // {
                        // // We're the top-level frame
                        // var found = Array.prototype.some.apply(window, [function(win)
                        // {
                            // if (win && (win.location.href === req.frameUrl)) {
                                // console.log("Found Frame");
                                // return true; // exit the loop
                            // }
                        // }]);
                        // if (!found) {
                            // console.log("Frame not Found :(");
                        // }
                    // }
                }
                else if (!g_frameUrl)
                {
                    console.log("MsgListener@bp_cs_platform_chrome: Directing received message to top-level frame");
                    foo(req, sender, callback);
                }
                else
                {
                    console.log("MsgListener@bp_cs_platform_chrome: Dropping received message");
                }
            });
        },
        
        getURL: function(path)
        {
            var url = chrome.extension.getURL(path);
            return url;
        },
        
        getAbsPath: function(path)
        {
            // get url and then remove the leading file:///
            return chrome.extension.getURL(path).slice(8);
        },
        
        addEventListener: function(el, ev, fn)
        {
            el.addEventListener(ev, fn);
        },
        
        addEventListeners: function(selector, ev, fn)
        {
            var j = $(selector), i = j.length;
            for (--i; i>=0; --i) {
                var el = j[i];
                if (el) {el.addEventListener(ev, fn);}               
            }
        },
        
        addHandlers: function (el, on) 
        {
            if (!el || !on || (typeof on !== 'object')) {return;}
            
            var ks = Object.keys(on), k, i, n;
            for (i=0, n=ks.length, k=ks[0]; i<n ; k=ks[++i])
            {
                el.addEventListener(k, on[k]);
            }
        },
        
        trigger: function (el, eventType, eventInterface)
        {
            var ev = document.createEvent(eventInterface || 'HTMLEvents');
            ev.initEvent(eventType, true, true);
            el.dispatchEvent(ev);
        }
    };
    
    console.log("loaded cs_plat");    
    return module;
}());
