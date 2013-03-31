/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global chrome, IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome
 */
function BP_GET_PLAT(gg)
{
    "use strict";
    function throwException()
    {
        throw "BP_MAIN_PLAT_STUB: This is a stub function - not intended to be ever invoked."
    }
    
    var module =
    {
        registerMsgListener: throwException,
        sendRequestToTab: throwException,
        init: throwException,
        bpClick: throwException,
        showPageAction: throwException,
        notifications: throwException,
        showBadge: throwException,
        removeBadge: throwException,
        sendMessage: throwException
    };
    
    Object.seal(module);
    console.log("constructed mod_main_plat_stub");
    return module;
}
