/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome, $, BP_BOOT, CustomEvent */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

//////////////// MAKE SURE THERE IS NO DEPENDENCY ON ANY OTHER MODULE ////////////////////
/**
 * @ModuleBegin GoogleChrome Platform
 */
function BP_GET_CS_PLAT(g)
{ 
    "use strict";
    function throwException()
    {
        throw "BP_CS_PLAT_STUB: This is a stub function - not intended to be ever invoked."
    }
    
    var module =
    {
        postMsgToMothership: throwException,
        
        rpcToMothership: throwException,
        
        registerMsgListener: throwException,
        
        getURL: throwException,
        
        /*getAbsPath: function(path)
        {
            // get url and then remove the leading file:///
            return chrome.extension.getURL(path).slice(8);
        },*/
        
        getBackgroundPage: throwException,

        addEventListener: throwException,
        
        addEventListeners: throwException,
        
        addHandlers: throwException,
        
        trigger: throwException,
        
        customEvent: throwException
    };
    
    console.log("constructed mod_cs_plat_stub");    
    return module;
}
