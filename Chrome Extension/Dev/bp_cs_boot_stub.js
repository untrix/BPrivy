/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/*global chrome, BP_DLL, BP_BOOT, WebKitMutationObserver, console */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
/*
 * This file is here only to trigger page scanning (normally done by boot loader) when
 * bp_cs_cat.js is directly loaded for debugging purposes (and the boot loader is not).
 * This file does not get loaded in production.
 */

chrome.extension.sendRequest({cm:'cm_bootLoaded', loc:document.location}, function(resp)
{ 'use strict';
    // if (resp.result && resp.cm && (resp.cm === 'cm_loadDll')) {
        // BP_DLL.onDllLoad();
    // }
});

//if (window.top === window.self) {
    window.addEventListener('unload', BP_BOOT.onUnload);
//}
if (document.hasFocus())  {BP_BOOT.onFocus();}window.addEventListener('focus', BP_BOOT.onFocus);

if (BP_BOOT.scan(document)) 
{
    BP_DLL.onDllLoad();
}
else 
{
    BP_BOOT.observe(document, function(_, observer)
    {   "use strict";
        if ((!BP_DLL.bLoaded) && BP_BOOT.scan(document)) {
            observer.disconnect();
            BP_DLL.onDllLoad();
            BP_DLL.bLoaded = true;
        }
    },{doBatch:true});
}
