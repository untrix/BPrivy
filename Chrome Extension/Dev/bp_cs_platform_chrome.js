/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome Platform
 */
var BP_MOD_CS_PLAT = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
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
        },
        
        addEventListeners: function(select, ev, fn)
        {
            var j = $(select), i = j.length;
            for (--i; i>=0; --i) {
                var el = j[i];
                if (el) {module.addEventListener(el, ev, fn);}               
            }
        }
    };
    
    return module;
}());
