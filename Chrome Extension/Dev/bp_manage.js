/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR,
  ls, BP_PLUGIN, BP_MOD_FILESTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
var BP_MOD_MANAGE = (function () 
{
    "use strict"; //TODO: Remove this from prod. build
    /** @import-module-begin BP_PLUGIN */
    /** @import-module-begin CSPlatform */
    var m = BP_MOD_CS_PLAT;
    var addEventListeners = IMPORT(m.addEventListeners); // Compatibility function
    var DIR_SEP = IMPORT(m.DIR_SEP);
    /** @import-module-begin Common */
    m = BP_MOD_FILESTORE;
    var FILESTORE = IMPORT(m);
    var cullDBName = IMPORT(m.cullDBName);
    /** @import-module-end **/ m = null;

    function fillOptions(eid, dir)
    {
        var o={hide:true}, d, i=0, n=0;
        eid = '#' + eid;
        $(eid).empty(); // Empty the selector list anyway.
        if (BP_PLUGIN.ls(dir, o) && (o.lsd) && (d=(o.lsd)) && d.d) {
            var keys = Object.keys(d.d);
            if ((n = keys.length) > 0) {
                $(eid).append($(document.createElement('option')).text('Browse Files'));
                for (i=0; i<n; ++i) {
                    $(eid).append($(document.createElement('option')).val(keys[i]).text(keys[i]));
                }
            }
        }
    }

    function callbackHandleError (resp)
    {
        if (resp.result===false) {
            BP_MOD_ERROR.alert(resp.err);
        }
    }
    
    function updateDash (resp)
    {
        //$('#dbPath').text(cullDBName(resp.dbPath)).attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
        var fluff, gbg, loaded;
        if (resp.result) 
        {
            resp.dbPath = resp.dbPath || "";
            if ($('#dbSaveLocation:checked').length) {
                localStorage['db.path'] = resp.dbPath;
            }
            $('[data-dbPath]').text(cullDBName(resp.dbPath)||"").attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);

            if (resp.memStats)
            {
                fluff = resp.memStats.bad + resp.memStats.fluff;
                loaded = resp.memStats.loaded;
            
                gbg = loaded? Math.round((fluff)*100/loaded) : undefined;
                $('#stats').val( (gbg!==undefined) ? "bloat: "+gbg+"%" : "");
                if (gbg<=0) {
                    $('#dbCompact').removeClass('btn-warning').removeClass('btn-primary').prop('disabled', true);
                }
                else if (gbg <50) {
                    $('#dbCompact').removeClass('btn-primary').addClass('btn-warning').prop('disabled', false);
                }
                else if (gbg>0){
                    $('#dbCompact').removeClass('btn-warning').addClass('btn-primary').prop('disabled', false);
                }
            }
            
            if (resp.dbStats)
            {
                resp.dbStats = FILESTORE.newDBStats(null, resp.dbStats);
                gbg = resp.dbStats.calcDupes();
                
                if (gbg) {
                    $('#qclean-stats').val("dirt index: "+gbg);
                    $('#dbClean').addClass('btn-primary').prop('disabled', false);
                }
                else {
                    $('#qclean-stats').val("sparkling clean!");
                    $('#dbClean').removeClass('btn-primary').prop('disabled', true);
                }
            }
        }
        else 
        {
            $('#dbPath').text(null).attr('data-original-title', '').attr('data-path', null);
            $('#stats').val('');
        }
    }

    function onload()
    {               
        if (localStorage['dbSaveLocation']) {
            $('#dbSaveLocation')[0].checked = true;
        }
        else {
            $('#dbSaveLocation')[0].checked = false;
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
                var obfuscated = $('#csvImportObfuscated')[0].checked;
                //var overrides = $('#csvImportOverrides')[0].checked;
                BP_MOD_CONNECT.importCSV(o.path, obfuscated, function (resp)
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
                   dbutton: "Select Folder"};
            $('#csvExportSpinner').show();
            if (BP_PLUGIN.chooseFolder(o)) {
                console.log("ChooseFolder returned:" + o.path);
                BP_MOD_CONNECT.exportCSV(o.path, false, function (resp)
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
            BP_MOD_CONNECT.compactDB(function (resp)
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
            BP_MOD_CONNECT.cleanDB(function (resp)
            {
                if (resp.result === true) 
                {
                    updateDash(resp);
                    BP_MOD_ERROR.success('UWallet has been compacted: ' + resp.dbPath);
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
                   dbutton: "Select Other Wallet"};
            if (BP_PLUGIN.chooseFolder(o)) 
            {
                console.log("ChooseFolder returned:" + o.path);
                BP_MOD_CONNECT.mergeInDB(o.path, function (resp)
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
        
        addEventListeners('#dbChooseLoad', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Wallet Folder",
                   dbutton: "Select Wallet Folder"};
            $('#dbChooseLoad').button('loading');
            if (BP_PLUGIN.chooseFolder(o)) 
            {
                BP_MOD_CONNECT.loadDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        updateDash(resp);
                        BP_MOD_ERROR.success('Opened password wallet at ' + resp.dbPath);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    $('#dbChooseLoad').button('reset');
                });
            }
            else {
                $('#dbChooseLoad').button('reset');
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
                   dbutton: "Select Folder"};
            if (BP_PLUGIN.chooseFolder(o)) {
                console.log("ChooseFolder returned:" + o.path);
                BP_MOD_CONNECT.createDB(dbName, o.path, function (resp)
                {
                    if (resp.result === true) {
                        // if ($('#dbSaveLocation:checked').length) {                            // localStorage['db.path'] = resp.dbPath;                        // }
                        updateDash(resp);
                        //$('#dbPath').text(cullDBName(resp.dbPath)).attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
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
        
        addEventListeners('[data-path-select]', 'change', function (e) 
        {
            var inp = $('[data-path]', this.form)[0];
            inp.value = inp.value + this.value + DIR_SEP;
            fillOptions(this.id, inp.value);
            //$(this).trigger('click');
            this.focus();
        });
        
        addEventListeners('#dbSaveLocation', 'change', function (e)
        {
            if (this.checked) {
                localStorage["db.path"] = $('#dbPath').attr('data-path');
                localStorage['dbSaveLocation'] = 'true';
            }
            else {
                localStorage["db.path"] = '';
                localStorage['dbSaveLocation'] = '';
            }
        });

        addEventListeners('#dbClose', 'click', function (e)
        {
            BP_MOD_CONNECT.unloadDB(function (resp)
            {
                if (resp.result === true) 
                {
                    updateDash(resp);
                    BP_MOD_ERROR.success('UWallet has been closed');
                }
                else 
                {
                    callbackHandleError(resp);
                }
            });
        });
               
        BP_MOD_CONNECT.getDBPath(function(resp)
        {
            updateDash(resp);
        });
        $('#content *').tooltip();
    }
   
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        fillOptions: {value: fillOptions},
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
        {
          BP_PLUGIN = document.getElementById('com-untrix-bpplugin'); 
          console.log("BP Plugin loaded. PID = " + BP_PLUGIN.getpid());
        }        

        $(document).ready(function (e)
        {
          bpPluginLoaded();
          BP_MOD_FILESTORE.init();
          BP_MOD_MANAGE.onload();
        });
