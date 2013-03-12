/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, jQuery, chrome */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

var  BP_PLUGIN; // needed by wallet_form_wdl.js
var BP_DIALOG = (function ()
{
    "use strict";
    /** @globals-begin */
    var g = {g_win:window, g_console:console, g_chrome:chrome, $:$, jQuery:jQuery};
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    g.MAIN_PAGE = g.BP_CS_PLAT.getBackgroundPage();
    g.BP_MEMSTORE = g.MAIN_PAGE.BP_MAIN.g.BP_MEMSTORE;
    g.BP_ERROR = g.MAIN_PAGE.BP_GET_ERROR(g);
    g.BP_COMMON = g.MAIN_PAGE.BP_GET_COMMON(g);
    g.BP_TRAITS = g.MAIN_PAGE.BP_GET_TRAITS(g);
    g.BP_CONNECT = g.MAIN_PAGE.BP_GET_CONNECT(g);
    g.BP_W$ = g.MAIN_PAGE.BP_GET_W$(g);
    g.BP_DBFS = g.MAIN_PAGE.BP_GET_DBFS(g);
    //g.BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
    /** @globals-end */

    /** @import-module-begin */
    var BP_MAIN = g.MAIN_PAGE.BP_MAIN;
    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-begin CSPlatform */
    var m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT),
        rpcToMothership = IMPORT(CS_PLAT.rpcToMothership);
    var addEventListeners = IMPORT(m.addEventListeners); // Compatibility function
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin */
    var DBFS = IMPORT(g.BP_DBFS);
    var cullDBName = IMPORT(DBFS.cullDBName);
    /** @import-module-begin*/
    m = IMPORT(g.BP_TRAITS);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin */
    var MEMSTORE = IMPORT(g.BP_MEMSTORE);
    /** @import-module-begin */
    var BP_CONNECT = IMPORT(g.BP_CONNECT);
    /** @import-module-begin */
    m = IMPORT(g.BP_ERROR);
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;


    function createDB2 (dbName, dbDir, keyDirOrPath, k, option, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_createDB, dbName:dbName, dbDir:dbDir,
                         keyDirOrPath:keyDirOrPath, k:k, option:option },
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

    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_ERROR.alert(resp.err);
        }
    }

    function getWalletFormCallbacks()
    {
        return {
            loadDB2: loadDB2,
            createDB2: createDB2,
            mergeDB2: mergeDB2,
            mergeInDB2: mergeInDB2,
            mergeOutDB2: mergeOutDB2,
            updateDash: updateDash,
            callbackHandleError: callbackHandleError,
            getDBPath: BP_MAIN.getDBPath
        };
    }

    function launchOpen(o)
    {
        var ops = getWalletFormCallbacks(),
            BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
        ops.mode = 'open';
        BP_COMMON.copy2(o, ops);
        BP_WALLET_FORM.launch(ops);
    }

    function launchCreate(o)
    {
        var ops = getWalletFormCallbacks(),
            BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
        ops.mode = 'create';
        BP_COMMON.copy2(o, ops);
        BP_WALLET_FORM.launch(ops);
    }

    function launchMerge(o)
    {
        var ops = getWalletFormCallbacks(),
            BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
        ops.mode = 'merge';
        BP_COMMON.copy2(o, ops);
        BP_WALLET_FORM.launch(ops);
    }

    function launchMergeIn(o)
    {
        var ops = getWalletFormCallbacks(),
            BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
        ops.mode = 'mergeIn';
        BP_COMMON.copy2(o, ops);
        BP_WALLET_FORM.launch(ops);
    }

    function launchMergeOut()
    {
        var ops = getWalletFormCallbacks(),
            BP_WALLET_FORM = BP_GET_WALLET_FORM(g);
        ops.mode = 'mergeOut';
        BP_WALLET_FORM.launch(ops);
    }

    function updateDash(resp) {}

    function launchInstallPlugin(o)
    {
        var BP_PLUGIN_INSTALLER = BP_GET_PLUGIN_INSTALLER(g);
        o.mode = 'installPlugin';
        BP_PLUGIN_INSTALLER.launch(o);
    }

    function launchUpgradePlugin(o)
    {
        var BP_PLUGIN_INSTALLER = BP_GET_PLUGIN_INSTALLER(g);
        o.mode = 'upgradePlugin';
        BP_PLUGIN_INSTALLER.launch(o);
    }

    function onload()
    {
        switch (BP_COMMON.getQueryObj(g.g_win.location)['action'])
        {
            case 'open':
                launchOpen({closeWin:true});
                return;
            case 'close':
                closeDB();
                g.g_win.close();
                return;
            case 'merge':
                launchMerge({closeWin:true});
                return;
            case 'mergeIn':
                launchMergeIn({closeWin:true});
                return;
            case 'mergeOut':
                launchMergeOut({closeWin:true});
                return;
            case 'installPlugin':
                launchInstallPlugin({closeWin:true});
                return;
            case 'upgradePlugin':
                launchUpgradePlugin({closeWin:true});
                return;
            default:
        }
    }

    // Assemble the interface
    var iface = {};
    Object.defineProperties(iface,
    {
        onload: {value: onload},
        g: {value: g}
    });
    Object.freeze(iface);

    console.log("constructed mod_dialog");
    return iface;
})();

function bpPluginLoaded ()
{ "use strict";
  BP_PLUGIN = document.getElementById('com-untrix-bpplugin');
  console.log("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
}

// $(document).ready(function (e)
BP_DIALOG.g.BP_CS_PLAT.addEventListener(window, 'load', function(e)
{ "use strict";
  bpPluginLoaded();
  BP_DIALOG.g.BP_DBFS.init();
  BP_DIALOG.onload();
  BP_DIALOG.g.BP_ERROR.logdebug("inited mod_dialog");
});
