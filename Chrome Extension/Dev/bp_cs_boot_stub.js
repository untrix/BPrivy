/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/*global chrome, BP_DLL, BP_MOD_BOOT, WebKitMutationObserver, console */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
/*
 * This file is here only to trigger page scanning (normally done by boot loader) when
 * bp_cs_cat.js is directly loaded for debugging purposes (and the boot loader is not).
 * This file does not get loaded in production.
 */

if (BP_MOD_BOOT.scan(document)) 
{
    BP_DLL.onDllLoad();
}
else 
{
    BP_MOD_BOOT.observe(document, function(mutations,observer)
    {
        if ((!BP_DLL.bLoaded) && BP_MOD_BOOT.scan(document)) {
            observer.disconnect();
            BP_DLL.onDllLoad();
            BP_DLL.bLoaded = true;
        }
    });
}
