/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, chrome, window */
/*jslint browser : true, devel : true, es5 : true */
/*properties console.info, console.log, console.warn */

/**
 * @ModuleBegin GoogleChrome Platform
 */
var BP_MOD_CS_PLAT = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var module =
    {
        postMsgToMothership: function (o)
        {
            function rcvAck (rsp) 
            {
                if (!rsp) {if (chrome.extension.lastError) {
                       console.log(chrome.extension.lastError.message);
                    }
                }
            }
            chrome.extension.sendRequest(o, rcvAck);
        },
        
        rpcToMothership: function (req, respCallback)
        {
            chrome.extension.sendRequest(req, respCallback);
        },
        
        registerMsgListener: function(foo)
        {
            chrome.extension.onRequest.addListener(foo);
        },
        
        getURL: function(path)
        {
            return chrome.extension.getURL(path);
        },
        
        addEventListener: function(el, ev, fn)
        {
            el.addEventListener(ev, fn);
        }
    };
    
    return module;
})();
