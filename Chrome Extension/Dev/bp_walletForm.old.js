/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global $, console, window, BP_GET_CONNECT, BP_GET_CS_PLAT, IMPORT, BP_GET_COMMON, BP_GET_ERROR,
  ls, BP_PLUGIN, BP_GET_EDITOR, BP_GET_W$, BP_GET_TRAITS, chrome, BP_GET_DBFS,
  BP_GET_WALLET_FORM */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

var  BP_PLUGIN;
var BP_WALLET_FORM = (function ()
{
    "use strict";
    /** @globals-begin */
    var g = {g_win:window, g_console:console, g_chrome:chrome, $:$, jQuery:jQuery};
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    var BP_CS_PLAT = IMPORT(g.BP_CS_PLAT);
    g.BP_ERROR = BP_CS_PLAT.getBackgroundPage().BP_GET_ERROR(g);
    g.BP_COMMON = BP_CS_PLAT.getBackgroundPage().BP_GET_COMMON(g);
    g.BP_CONNECT = BP_CS_PLAT.getBackgroundPage().BP_GET_CONNECT(g);
    //
    g.BP_W$ = BP_GET_W$(g);
    g.BP_WALLET_FORM = BP_GET_WALLET_FORM(g);

    var g_walletForm;
    /** @globals-end */

    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-begin CSPlatform */
    var m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT),
        rpcToMothership = IMPORT(CS_PLAT.rpcToMothership),
        addEventListeners = IMPORT(m.addEventListeners), // Compatibility function
        addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin */
    var BP_CONNECT = IMPORT(g.BP_CONNECT);
    /** @import-module-begin */
    m = IMPORT(g.BP_ERROR);
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;

    function createDB2 (dbName, dbDir, keyDir, k, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_createDB, dbName:dbName, dbDir:dbDir,
                         keyDir:keyDir, k:k},
                        callbackFunc);
    }

    function loadDB2 (dbPath, keyPath, k, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_loadDB, dbPath:dbPath,  keyPath:keyPath, k:k},
            callbackFunc);
    }

    function mergeInDB2 (dbPath, keyPath, k, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_mergeInDB, dbPath:dbPath, keyPath:keyPath, k:k},
            callbackFunc);
    }

    function mergeDB2 (dbPath, keyPath, k, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_mergeDB, dbPath:dbPath, keyPath:keyPath, k:k},
            callbackFunc);
    }

    function mergeOutDB2 (dbPath, keyPath, k, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_mergeOutDB, dbPath:dbPath, keyPath:keyPath, k:k},
            callbackFunc);
    }

    function createWalletForm(options)
    {
        var ctx,
            walletForm,
            temp;

        if (!(options && options.containerID)) { return; }

        // Create the Widget.
        ctx = {
            BP_PLUGIN: BP_PLUGIN,
            loadDB2: loadDB2,
            createDB2: createDB2,
            mergeDB2: mergeDB2,
            mergeInDB2: mergeInDB2,
            mergeOutDB2: mergeOutDB2,
            updateDash: updateDash,
            callbackHandleError: callbackHandleError,
            destroyWalletForm: destroyWalletForm
        };
        walletForm = g.BP_W$.w$exec(g.BP_WALLET_FORM.WalletFormWdl_wdt, ctx);

        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC

        if (g_walletForm) {
            g_walletForm.destroy();
            g_walletForm = null;
        }

        g_walletForm = walletForm;
        $(g_walletForm.el).appendTo('#'+options.containerID);

        $('#'+options.containerID).tooltip(); // used to leak DOM nodes in version 2.0.4.

        return g_walletForm;
    }

    // Assemble the interface
    var iface = {};
    Object.defineProperties(iface,
    {
        onload: {value: onload},
        g: {value: g}
    });
    Object.freeze(iface);

    console.log("constructed mod_wallet_form");
    return iface;
}());