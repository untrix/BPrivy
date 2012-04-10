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

"use strict";
/**
 * @ModuleBegin GoogleChrome
 */
function com_bprivy_GetModule_CSPlatform()
{
    var module =
    {
        postMsgToMothership: function (o)
        {
            function rcvAck (rsp) 
            {
                if (!rsp && chrome.extension.lastError)
                    console.log(chrome.extension.lastError.message);
            }
            chrome.extension.sendRequest(o, rcvAck);
        },
        
        registerMsgListener: function(foo)
        {
            chrome.extension.onRequest.addListener(foo);
        }
    };
    
    return module;
}
