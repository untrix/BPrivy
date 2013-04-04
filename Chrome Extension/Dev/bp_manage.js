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
var BP_MANAGE = (function ()
{
    "use strict";
    /** @globals-begin */
    var g = {g_win:window, g_console:console, g_chrome:chrome, $:$, jQuery:jQuery},
        g_doc = document,
        g_win = window;
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    g.MAIN_PAGE = g.BP_CS_PLAT.getBackgroundPage();
    g.BP_CONFIG = g.MAIN_PAGE.BP_CONFIG;
    //var BP_CS_PLAT = IMPORT(g.BP_CS_PLAT);
    g.BP_MEMSTORE = g.MAIN_PAGE.BP_MAIN.g.BP_MEMSTORE;
    g.BP_ERROR = g.MAIN_PAGE.BP_GET_ERROR(g);
    g.BP_COMMON = g.MAIN_PAGE.BP_GET_COMMON(g);
    g.BP_PLAT = g.MAIN_PAGE.BP_GET_PLAT(g);
    g.BP_TRAITS = g.MAIN_PAGE.BP_GET_TRAITS(g);
    g.BP_CONNECT = g.MAIN_PAGE.BP_GET_CONNECT(g);
    g.BP_W$ = g.MAIN_PAGE.BP_GET_W$(g);
    g.BP_DBFS = g.MAIN_PAGE.BP_GET_DBFS(g);
    g.BP_EDITOR = g.MAIN_PAGE.BP_GET_EDITOR(g);
    g.BP_WALLET_FORM = g.MAIN_PAGE.BP_GET_WALLET_FORM(g);
    /** @globals-end */

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

    /** @globals-begin */
    var g_editor, g_dbName, g_dbPath;
    /** @globals-end **/

    function newSpinner(el)
    {
        var opts = {
          lines: 13, // The number of lines to draw
          length: 15, // The length of each line
          width: 4, // The line thickness
          radius: 20, // The radius of the inner circle
          corners: 1, // Corner roundness (0..1)
          rotate: 0, // The rotation offset
          color: '#000', // #rgb or #rrggbb
          speed: 2, // Rounds per second
          trail: 60, // Afterglow percentage
          shadow: false, // Whether to render a shadow
          hwaccel: true, // Whether to use hardware acceleration
          className: 'spinner', // The CSS class to assign to the spinner
          zIndex: 2e9, // The z-index (defaults to 2000000000)
          top: 'auto', // Top position relative to parent in px
          left: 'auto' // Left position relative to parent in px
        };

        var spinner = new g_win.Spinner(opts).spin(el);
        //el.appendChild(spinner.el);
        return spinner;
    }

    function chooseFolder(o)
    {
        if (!BP_PLUGIN.chooseFolder(o))
        {
            o.err && BP_ERROR.loginfo(o.err);
        }
        else {
            return o.path;
        }
    }

    function chooseWalletFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle = "K3YRING: Select keyring Folder";
        o.dbutton = "Select keyring Folder";
        o.clrHist = true;

        return chooseFolder(o);
    }

    function deleteDB()
    {
    	var o = {},
    		db = chooseWalletFolder(o);

    	if (!db) {
    		if (o.err) {
    			BP_ERROR.warn(o.err);
    		}
    		return;
    	}

    	rpcToMothership({cm:BP_CONNECT.cm_deleteDB, dbPath:db}, function(resp)
    	{
    		if (resp.result === true) {
    			BP_ERROR.success('Deleted keyring at: ' + db);
    		}
    		else {
    			BP_ERROR.warn(resp.err || 'Some problems were encountered. The keyring may not have been completely removed. Please try again.');
    		}
    	});
    }

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

    function compactDB (callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_compactDB}, callbackFunc);
    }

    function cleanDB (callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_cleanDB}, callbackFunc);
    }

    function importCSV (dbPath, obfuscated, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_importCSV, dbPath:dbPath, obfuscated: obfuscated}, callbackFunc);
    }

    function exportCSV (dirPath, obfuscated, callbackFunc)
    {
        rpcToMothership({cm: BP_CONNECT.cm_exportCSV, dirPath:dirPath, obfuscated: obfuscated}, callbackFunc);
    }

    function unloadDB(clearCrypt, cback)
    {
        rpcToMothership({cm: BP_CONNECT.cm_unloadDB}, cback);
    }

    function getDB(dt, cback)
    {
        //rpcToMothership({cm: BP_CONNECT.cm_getDB, dt:dt}, cback);
    }

    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_ERROR.alert(resp.err);
        }

        updateDash(resp);
    }

    function updateDash (resp)
    {
        var fluff, gbg, loaded;
        if (resp && resp.result)
        {
            resp.dbPath = resp.dbPath || "";
            if ($('#dbSaveLocation:checked').length)
            {
                if (localStorage['db.path'] !== resp.dbPath) {
                    localStorage['db.path'] = resp.dbPath;
                }
            }

            g_dbName = cullDBName(resp.dbPath);
            g_dbPath = resp.dbPath;
            //if (g_dbPath !== resp.dbPath) {clearEditor();}
            if ($('#editor-pane').hasClass('active')) {
                reloadEditor();
            }
            else {
                clearEditor();
            }

            $('[data-dbName]').text(g_dbName||"No Keyring Opened").attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
            $('[data-db-path]').text(resp.dbPath||"No Keyring Opened").attr('data-path', resp.dbPath);

            if (resp.memStats && resp.dbPath)
            {
                fluff = resp.memStats.bad + resp.memStats.fluff;
                loaded = resp.memStats.loaded;

                gbg = loaded ? Math.round((fluff)*100/loaded) : 0;
                $('#stats').val( (gbg!==undefined) ? "bloat: "+gbg+"%" : "");
                // if (gbg<=0) {
                    // $('#dbCompact').removeClass('btn-warning').removeClass('btn-primary').prop('disabled', true);
                // }
                // else
                if (gbg <50) {
                    $('#dbCompact').removeClass('btn-primary').addClass('btn-warning').prop('disabled', false);
                }
                else if (gbg){
                    $('#dbCompact').removeClass('btn-warning').addClass('btn-primary').prop('disabled', false);
                }
            }
            else
            {
                $('#stats').val('');
                $('#dbCompact').removeClass('btn-warning').removeClass('btn-primary').prop('disabled', true);
            }

            if (resp.dbStats)
            {
                resp.dbStats = DBFS.newDBMap(null, resp.dbStats);
                gbg = resp.dbStats.calcDupes();

                if (gbg) {
                    $('#qclean-stats').val("dirt index: "+gbg);
                    $('#dbClean').addClass('btn-primary').prop('disabled', false);
                }
                else {
                    if (resp.dbStats.dbPath) {
                        $('#qclean-stats').val("sparkling clean!");
                    }
                    else {
                        $('#qclean-stats').val("");
                    }
                    $('#dbClean').removeClass('btn-primary').prop('disabled', false);
                }
            }
            else {
                $('#qclean-stats').val("");
                $('#dbClean').removeClass('btn-primary').prop('disabled', true);
            }

            // if (resp.dbPath) {
            	// $('#btnChngPass').prop('disabled',false);
            // }
        }
        else
        {
            g_dbName = resp ? cullDBName(resp.dbPath) : null;
            g_dbPath = resp ? resp.dbPath : null;
            $('[data-dbName]').text("No Keyring Opened").attr('data-original-title', '').attr('data-path', null);
            $('[data-db-path]').text(null).attr('data-original-title', '').attr('data-path', null);
            $('#stats').val('');
            $('#dbCompact').removeClass('btn-warning').removeClass('btn-primary').prop('disabled', true);
            $('#qclean-stats').val("");
            $('#dbClean').removeClass('btn-primary').prop('disabled', true);
            clearEditor();
            $('#btnChngPass').prop('disabled', true);
        }
    }

    function clearEditor()
    {
        //MEMSTORE.clear([dt_pRecord]);
        if (g_editor) {
            g_editor.destroy();
            g_editor = null;
        }
    }

    function reloadEditor()
    {
        //$('#refreshEditor').button('loading');
        var spinner = newSpinner($('#editItems')[0]),
            ctx = {dnIt:MEMSTORE.newDNodeIterator(dt_pRecord), dt:dt_pRecord},
            editor = g.BP_W$.w$exec(g.BP_EDITOR.EditorWdl_wdt, ctx),
            temp;

        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
        if (g_editor) {
            g_editor.replaceWith(editor);
            temp = g_editor;
            temp.clearRefs();
            g_editor = editor;
            //g_editor.$el.appendTo($('#editItems'));
        }
        else {
            g_editor = editor;
            $(g_editor.el).appendTo($('#editItems'));
        }

        //$('#refreshEditor').button('reset');
        spinner.stop();
        $('#editItems *').tooltip(); // seemed to leak DOM nodes in 2.0.4 :(. I wonder what else in bootstrap leaks.
    }

    function getCallbacks()
    {
        return {
            loadDB2: loadDB2,
            createDB2: createDB2,
            mergeDB2: mergeDB2,
            mergeInDB2: mergeInDB2,
            mergeOutDB2: mergeOutDB2,
            updateDash: updateDash,
            callbackHandleError: callbackHandleError,
            getDBPath: function() { return g_dbPath; }
        };
    }

    function onload()
    {
        var actionOpt = BP_COMMON.getQueryObj(g.g_win.location)['action'];

        BP_CONNECT.getDBPath(function(resp)
        {
            updateDash(resp);
        });

        switch (actionOpt)
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
            default:
        }

        // Enable button toggling effects
        $('.nav-tabs').button();
        //$("#nav-list a[data-nav]").click(function (e)
        addEventListeners("#nav-list a[data-nav]", "click", function(e)
        {
            e.preventDefault();
            $(this).tab('show');
        });

        addEventListeners('#csvImport', 'click', function (e)
        {
            var o={filter:['CSV File','*.csv'],
                   dtitle: "BPrivy: Import CSV File",
                   dbutton: "Import"};
            $('#csvImportSpinner').show();
            if (BP_PLUGIN.chooseFile(o)) {
                BP_ERROR.loginfo("ChooseFile returned:" + o.path);
                var obfuscated = false; //$('#csvImportObfuscated')[0].checked;
                //var overrides = $('#csvImportOverrides')[0].checked;
                importCSV(o.path, obfuscated, function (resp)
                {
                    if (resp.result === true)
                    {
                        BP_ERROR.success('Imported passwords from ' + o.path);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    $('#csvImportSpinner').hide();
                });
            }
            else {
                $('#csvImportSpinner').hide();
                console.log("ChooseFile Failed");
            }
        });

        addEventListeners('#csvExport', 'click', function (e)
        {
            var o={dtitle:"BPrivy: CSV Export",
                   dbutton: "Select Folder",
                   clrHist: true};
            $('#csvExportSpinner').show();
            if (BP_PLUGIN.chooseFolder(o)) {
                console.log("ChooseFolder returned:" + o.path);
                exportCSV(o.path, false, function (resp)
                {
                    var msg;
                    if (resp.result === true)
                    {
                        BP_ERROR.success('Exported to files ' + resp.fnames.join(","));
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    $('#csvExportSpinner').hide();
                });
            }
            else {
                $('#csvExportSpinner').hide();
                console.log("ChooseFolder returned false");
            }
        });

        addEventListeners('#dbCompact', 'click', function (e)
        {
            $('#dbCompact').button('loading');
            compactDB(function (resp)
            {
                if (resp.result === true)
                {
                    updateDash(resp);
                    BP_ERROR.success('keyring has been compacted: ' + resp.dbPath);
                }
                else {
                    callbackHandleError(resp);
                }
                $('#dbCompact').button('reset');
            });
        });

        addEventListeners('#dbClean', 'click', function (e)
        {
            $('#dbClean').button('loading');
            cleanDB(function (resp)
            {
                if (resp.result === true)
                {
                    updateDash(resp);
                    BP_ERROR.success('keyring has been cleaned: ' + resp.dbPath);
                }
                else {
                    callbackHandleError(resp);
                }
                $('#dbClean').button('reset');
            });
        });
        function closeDB(e)
        {
            //capture the id in the closure for using from callback
            var id = e ? e.currentTarget.getAttribute('id') : undefined;

            unloadDB(true, function (resp)
            {
                if (resp.result === true)
                {
                    updateDash(resp);
                    if (id === 'dbClose2') {
                        clearEditor();
                    }
                    BP_ERROR.success('keyring has been closed');
                }
                else
                {
                    callbackHandleError(resp);
                }
            });
        }
        addEventListeners('#dbClose, #dbClose2', 'click', closeDB);

        // addEventListeners('#editB', 'click', function (e)
        // {
            // if (!g_editor) { reloadEditor(); }
        // });

        $('#editB').on('shown', function ()
        {
            if (!g_editor) { reloadEditor(); }
        });

        //addEventListeners('#refreshEditor', 'click', reloadEditor);

        addEventListeners('#newDNode', 'click',
        function(e)
        {
            var site, show, loc;
            e.preventDefault();
            e.stopPropagation();
            if (g_dbName) {
                site = $('#dnSearch').val();
                if (!site) {
                    BP_ERROR.alert("Please enter a web-site (e.g. google.com)");
                }
                else
                {
                    loc = BP_COMMON.parseURL2(site);
                    if (!loc) {
                       BP_ERROR.alert("Please enter a website (e.g. google.com)");
                    }
                    else {
                        // Normalize the site per DT_TRAITS
                        site = MEMSTORE.getSite(loc, dt_pRecord);

                        show=g_editor.filter(site);
                         if (!show.length) {
                            g_editor.newDNode(site);
                        }
                        else {
                            show.focus();
                        }
                    }
                }
            }
            else {
                BP_ERROR.alert("Please open a keyring first");
            }
        });

        addEventListeners('#dnSearch', 'input', function(e)
        {
            //console.log("#dnSearch: oninput invoked");
            if (g_editor) {
                g_editor.filter(this.value);
            }
            e.stopPropagation();
            e.preventDefault();
        });

        function launchOpen(o)
        {
            var ops = getCallbacks();
            ops.mode = 'open';
            BP_COMMON.copy2(o, ops);
            g.BP_WALLET_FORM.launch(ops);
        }

        function launchCreate(o)
        {
            var ops = getCallbacks();
            ops.mode = 'create';
            BP_COMMON.copy2(o, ops);
            g.BP_WALLET_FORM.launch(ops);
        }

        function launchMerge(o)
        {
            var ops = getCallbacks();
            ops.mode = 'merge';
            BP_COMMON.copy2(o, ops);
            g.BP_WALLET_FORM.launch(ops);
        }

        function launchMergeIn(o)
        {
            var ops = getCallbacks();
            ops.mode = 'mergeIn';
            BP_COMMON.copy2(o, ops);
            g.BP_WALLET_FORM.launch(ops);
        }

        function launchMergeOut()
        {
            var ops = getCallbacks();
            ops.mode = 'mergeOut';
            g.BP_WALLET_FORM.launch(ops);
        }

        addEventListeners('#btnWalletOpen, #btnWalletOpen2', 'click', launchOpen);
        addEventListeners('#btnWalletCreate', 'click', launchCreate);
        addEventListeners('#btnWalletClose, #btnWalletClose2', 'click', closeDB);
        addEventListeners('#btnMerge', 'click', launchMerge);
        addEventListeners('#btnMergeIn', 'click', launchMergeIn);
        addEventListeners('#btnMergeOut', 'click', launchMergeOut);

		addEventListeners('#dbDelete', 'click', deleteDB);

        $('#content *').tooltip();
        switch (actionOpt)
        {
            case 'edit':
                $("#editB").tab('show');
                break;
            default:
                $("#nav-settings").tab('show');
        }

    }

    function loadPlugin ()
    {
        var BP_CONFIG = g.MAIN_PAGE.BP_CONFIG,
            BP_MAIN = g.MAIN_PAGE.BP_MAIN;

        function launchInstallPlugin(o)
        {
            var BP_PLUGIN_INSTALLER = g.MAIN_PAGE.BP_GET_PLUGIN_INSTALLER(g);
            o = o || {closeWin:true};
            o.mode = 'installPlugin';
            BP_PLUGIN_INSTALLER.launch(o);
        }

        function launchUpgradePlugin(o)
        {
            var BP_PLUGIN_INSTALLER = g.MAIN_PAGE.BP_GET_PLUGIN_INSTALLER(g);
            o = o || {closeWin:true};
            o.mode = 'upgradePlugin';
            BP_PLUGIN_INSTALLER.launch(o);
        }

        BP_PLUGIN = g_doc.getElementById('com-untrix-bpplugin');
        if (!BP_PLUGIN.getpid) {
            launchInstallPlugin();
            throw new BPError("Plugin Not Loaded");
        }
        else {
            if (BP_MAIN.cmpVersion(BP_PLUGIN.version, BP_CONFIG.pluginVer) < 0) {
                launchUpgradePlugin();
                throw new BPError("Plugin Needs Upgrade");
            }
            else {
                BP_ERROR.logdebug("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
            }
        }
    }

    // Assemble the interface
    var iface = {};
    Object.defineProperties(iface,
    {
        onload: {value: onload},
        g: {value: g},
        loadPlugin: {value: loadPlugin}
    });
    Object.freeze(iface);

    console.log("constructed mod_manage");
    return iface;
}());


// function loadPlugin2 ()
// { "use strict";
  // BP_PLUGIN = document.getElementById('com-untrix-bpplugin');
  // console.log("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
//
// }

// $(document).ready(function (e)
BP_MANAGE.g.BP_CS_PLAT.addEventListener(window, 'load', function(e)
{ "use strict";
  BP_MANAGE.loadPlugin();
  BP_MANAGE.onload();
  console.log("inited mod_manage");
});
