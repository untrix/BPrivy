/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR,
  ls, BP_PLUGIN, BP_MOD_FILESTORE, BP_MOD_EDITOR, BP_MOD_W$, BP_MOD_TRAITS, BP_MOD_MEMSTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
var BP_MOD_MANAGE = (function () 
{
    "use strict"; //TODO: Remove this from prod. build
    /** @import-module-begin */
    var MOD_COMMON = IMPORT(BP_MOD_COMMON);
    /** @import-module-begin CSPlatform */
    var m = IMPORT(BP_MOD_CS_PLAT);
    var addEventListeners = IMPORT(m.addEventListeners); // Compatibility function
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    var DIR_SEP = IMPORT(m.DIR_SEP);
    /** @import-module-begin Common */
    m = IMPORT(BP_MOD_FILESTORE);
    var FILESTORE = IMPORT(m);
    var cullDBName = IMPORT(m.cullDBName);
    /** @import-module-begin*/
    m = IMPORT(BP_MOD_TRAITS);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin */
    var MEMSTORE = IMPORT(BP_MOD_MEMSTORE);
    var CS_PLAT = IMPORT(BP_MOD_CS_PLAT),
        rpcToMothership = IMPORT(CS_PLAT.rpcToMothership);
    /** @import-module-begin */
    var MOD_CONNECT = IMPORT(BP_MOD_CONNECT);
    /** @import-module-begin */
    m = IMPORT(BP_MOD_ERROR);
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_editor, g_dbName, g_dbPath;
    /** @globals-end **/ 
    
    function createDB (dbName, dbDir, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_createDB, dbName:dbName, dbDir:dbDir}, callbackFunc);
    }

    function loadDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_loadDB, dbPath:dbPath}, callbackFunc);
    }

    function mergeInDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_mergeInDB, dbPath:dbPath}, callbackFunc);
    }

    function mergeDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_mergeDB, dbPath:dbPath}, callbackFunc);
    }

    function mergeOutDB (dbPath, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_mergeOutDB, dbPath:dbPath}, callbackFunc);
    }

    function compactDB (callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_compactDB}, callbackFunc);
    }

    function cleanDB (callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_cleanDB}, callbackFunc);
    }

    function importCSV (dbPath, obfuscated, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_importCSV, dbPath:dbPath, obfuscated: obfuscated}, callbackFunc);
    }

    function exportCSV (dirPath, obfuscated, callbackFunc)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_exportCSV, dirPath:dirPath, obfuscated: obfuscated}, callbackFunc);
    }
    
    function unloadDB(cback) 
    {
        rpcToMothership({cm: MOD_CONNECT.cm_unloadDB}, cback);
    }
    
    function getDB(dt, cback)
    {
        rpcToMothership({cm: MOD_CONNECT.cm_getDB, dt:dt}, cback);
    }
    
    // function fillOptions(eid, dir)
    // {
        // var o={hide:true}, d, i=0, n=0;
        // eid = '#' + eid;
        // $(eid).empty(); // Empty the selector list anyway.
        // if (BP_PLUGIN.ls(dir, o) && (o.lsd) && (d=(o.lsd)) && d.d) {
            // var keys = Object.keys(d.d);
            // if ((n = keys.length) > 0) {
                // $(eid).append($(document.createElement('option')).text('Browse Files'));
                // for (i=0; i<n; ++i) {
                    // $(eid).append($(document.createElement('option')).val(keys[i]).text(keys[i]));
                // }
            // }
        // }
    // }
    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_MOD_ERROR.alert(resp.err);
        }
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
            if (g_dbPath !== resp.dbPath) {clearEditor();}
            
            $('[data-dbName]').text(g_dbName||"No Open Wallet").attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
            $('[data-db-path]').val(resp.dbPath||"No Open Wallet").attr('data-path', resp.dbPath);

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
                resp.dbStats = FILESTORE.newDBMap(null, resp.dbStats);
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
        }
        else 
        {
            $('[data-db-path]').text(null).attr('data-original-title', '').attr('data-path', null);
            $('#stats').val('');
            $('#dbCompact').removeClass('btn-warning').removeClass('btn-primary').prop('disabled', true);
            $('#qclean-stats').val("");
            $('#dbClean').removeClass('btn-primary').prop('disabled', true);
        }
    }

    function clearEditor()
    {
        MEMSTORE.clear([dt_pRecord]);
        if (g_editor) {
            g_editor.destroy();
            g_editor = null;
        }
    }
    function reloadEditor()
    {
        $('#refreshEditor').button('loading');
        getDB(dt_pRecord, function (resp)
        {
            if (!resp) {
                callbackHandleError(resp);
                // fall-through
            }

            var dB = resp.dB;
            MEMSTORE.putDB(dB, dt_pRecord);
            
            var ctx = {dnIt:MEMSTORE.newDNodeIterator(dt_pRecord), dt:dt_pRecord},
                editor = BP_MOD_W$.w$exec(BP_MOD_EDITOR.EditorWdl_wdt, ctx),
                temp;
            
            MOD_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
            if (g_editor) {
                g_editor.replaceWith(editor);
                temp = g_editor;    
                temp.clearRefs();
                g_editor = editor;
                //g_editor.$el.appendTo($('#editorPane'));
            }
            else {
                g_editor = editor;
                $(g_editor.el).appendTo($('#editorPane'));
            }
            
            $('#refreshEditor').button('reset');
            //$('#editorPane *').tooltip(); // leaks DOM nodes :(. I wonder what else in bootstrap leaks.
        });
    }
    
    function onload()
    {              
        MOD_CONNECT.getDBPath(function(resp)
        {
            updateDash(resp);
        });

        if (localStorage.dbDontSaveLocation) {
            $('#dbSaveLocation')[0].checked = false;
        }
        else {
            $('#dbSaveLocation')[0].checked = true;
        }
        // Enable button toggling effects
        $('.nav-tabs').button();
        //$("#nav-list a[data-nav]").click(function (e)
        addEventListeners("#nav-list a[data-nav]", "click", function(e)
        {
            e.preventDefault();
            $(this).tab('show');
        });
        $("#nav-settings").tab('show');
        //$("#csvPathSubmit").click(function (e)
        //addEventListeners("#csvPathSubmit", "click", function(e)
        addEventListeners("[data-path-submit]", "click", function(e)
        {
            var path = $("#csvPath").val();
            console.log("Import CSV File:" + path);
            e.preventDefault();
        });
        
        //$('#csvPathReset').click(function()
        addEventListeners('[data-path-reset]', 'click', function(e)
        {
            fillOptions("csvPathSelect", "");
        });
        
        addEventListeners('#csvImport', 'click', function (e)
        {
            var o={filter:['CSV','*.csv'],
                   dtitle: "BPrivy: Import CSV File",
                   dbutton: "Import"};
            $('#csvImportSpinner').show();
            if (BP_PLUGIN.chooseFile(o)) {
                console.log("ChooseFile returned:" + o.path);
                var obfuscated = false; //$('#csvImportObfuscated')[0].checked;
                //var overrides = $('#csvImportOverrides')[0].checked;
                importCSV(o.path, obfuscated, function (resp)
                {
                    if (resp.result === true) 
                    {
                        BP_MOD_ERROR.success('Imported passwords from ' + o.path);
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
                        BP_MOD_ERROR.success('Exported to files ' + resp.fnames.join(","));
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
                    BP_MOD_ERROR.success('UWallet has been compacted: ' + resp.dbPath);
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
                    BP_MOD_ERROR.success('UWallet has been cleaned: ' + resp.dbPath);
                }
                else {
                    callbackHandleError(resp);
                }                
                $('#dbClean').button('reset');
            });
        });
        
        addEventListeners('#dbMergeIn', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Other Wallet",
                   dbutton: "Select Other Wallet",
                   clrHist: true};
            if (BP_PLUGIN.chooseFolder(o)) 
            {
                console.log("ChooseFolder returned:" + o.path);
                mergeInDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        BP_MOD_ERROR.success('Merged In password wallet at ' + o.path);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                });
            }
            else {
                console.log("ChooseFolder returned false");
            }
        });
        
        addEventListeners('#dbMerge', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Other Wallet",
                   dbutton: "Select Other Wallet",
                   clrHist: true};
            if (BP_PLUGIN.chooseFolder(o)) 
            {
                console.log("ChooseFolder returned:" + o.path);
                mergeDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        BP_MOD_ERROR.success('Merged with password wallet at ' + o.path);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                });
            }
            else {
                console.log("ChooseFolder returned false");
            }
        });
        
        addEventListeners('#dbMergeOut', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Other Wallet",
                   dbutton: "Select Other Wallet",
                   clrHist: true};
            if (BP_PLUGIN.chooseFolder(o)) 
            {
                console.log("ChooseFolder returned:" + o.path);
                mergeOutDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        BP_MOD_ERROR.success('Merged out to password wallet at ' + o.path);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                });
            }
            else {
                console.log("ChooseFolder returned false");
            }
        });
        
        addEventListeners('#dbChooseLoad, #dbChooseLoad2', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Wallet Folder",
                   dbutton: "Select Wallet Folder",
                   clrHist: true},
                   //capture the id in the closure for using from callback
                   id = e.currentTarget.id;
            $('#dbChooseLoad, #dbChooseLoad2').button('loading');

            if (BP_PLUGIN.chooseFolder(o)) 
            {
                loadDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        updateDash(resp);
                        if (id === 'dbChooseLoad2') {
                            reloadEditor();
                        }
                        BP_MOD_ERROR.success('Opened password wallet at ' + resp.dbPath);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    $('#dbChooseLoad, #dbChooseLoad2').button('reset');
                });
            }
            else {
                $('#dbChooseLoad, #dbChooseLoad2').button('reset');
                console.log("ChooseFolder returned false");
            }
        });
        
        addEventListeners('#dbChooseCreate', 'click', function (e)
        {
            var dbName = $('#dbName').val();
            if (!dbName) {
                BP_MOD_ERROR.alert("Please first enter a name for the new Wallet");
                return;
            }
            var o={dtitle:"BPrivy: Select a Folder to contain the Wallet",
                   dbutton: "Select Folder",
                   clrHist: true};
            if (BP_PLUGIN.chooseFolder(o)) {
                console.log("ChooseFolder returned:" + o.path);
                createDB(dbName, o.path, function (resp)
                {
                    if (resp.result === true) {
                        updateDash(resp);
                        BP_MOD_ERROR.success('Password store created at ' + resp.dbPath);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                });
            }
            else {
                console.log("ChooseFolder returned false");
            }
        });
        
        // addEventListeners('[data-path-select]', 'change', function (e) 
        // {
            // var inp = $('[data-path]', this.form)[0];
            // inp.value = inp.value + this.value + DIR_SEP;
            // fillOptions(this.id, inp.value);
            // //$(this).trigger('click');
            // this.focus();
        // });
        addEventListeners('#dbSaveLocation', 'change', function (e)
        {
            if (this.checked) {
                localStorage["db.path"] = $('#dbPath').attr('data-path');
                localStorage['dbDontSaveLocation'] = '';
            }
            else {
                localStorage["db.path"] = '';
                localStorage['dbDontSaveLocation'] = 'true';
            }
        });

        addEventListeners('#dbClose, #dbClose2', 'click', function (e)
        {
            //capture the id in the closure for using from callback
            var id = e.currentTarget.id;
            
            unloadDB(function (resp)
            {
                if (resp.result === true) 
                {
                    updateDash(resp);
                    if (id === 'dbClose2') {
                        clearEditor();
                    }
                    BP_MOD_ERROR.success('UWallet has been closed');
                }
                else 
                {
                    callbackHandleError(resp);
                }
            });
        });

        addEventListeners('#editB', 'click',
        function initEditor(e)
        {
            if (!g_editor) {reloadEditor();}
        });
        
        addEventListeners('#refreshEditor', 'click', reloadEditor);
        
        addEventListeners('#newDNode', 'click', 
        function(e)
        {
            var site, show;
            e.preventDefault();
            e.stopPropagation();
            if (g_dbName) {
                site = $('#dnSearch').val();
                if (!site){
                    BP_MOD_ERROR.alert("Please enter a web-site first");
                }
                else 
                {
                    show=g_editor.filter(site);
                     if (!show.length) {
                        g_editor.newRecord(site);
                    }
                    else {
                        show.focus();
                    }
                }
            }
            else {
                BP_MOD_ERROR.alert("Please open a wallet first");
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
        //$('#content *').tooltip();
    }
   
    // Assemble the interface
    var iface = {};
    Object.defineProperties(iface, 
    {
//        fillOptions: {value: fillOptions},
        onload: {value: onload}
    });
    Object.freeze(iface);

    console.log("loaded manage");
    return iface;
}());

/** @globals-begin */
var BP_PLUGIN;
/** @globals-end */

function bpPluginLoaded ()
{ "use strict";
  BP_PLUGIN = document.getElementById('com-untrix-bpplugin'); 
  console.log("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
}        

// $(document).ready(function (e)BP_MOD_CS_PLAT.addEventListener(window, 'load', function(e)
{ "use strict";
  bpPluginLoaded();
  BP_MOD_FILESTORE.init();
  BP_MOD_MANAGE.onload();
});
