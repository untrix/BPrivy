/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR,
  ls, BP_PLUGIN */
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
    var parseDBName = IMPORT(m.parseDBName);
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
    
    function onload()
    {               
        //$("#nav-list a[data-nav]").click(function (e)
        addEventListeners("#nav-list a[data-nav]", "click", function(e)
        {
            e.preventDefault();
            $(this).tab('show');
        });
        $("#nav-settings").tab('show');
        $('#settings-pane *').tooltip();
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
            if (BP_PLUGIN.chooseFile(o)) {
                console.log("ChooseFile returned:" + o.path);
                var obfuscated = $('#csvImportObfuscated')[0].checked;
                //var overrides = $('#csvImportOverrides')[0].checked;
                BP_MOD_CONNECT.importCSV(o.path, obfuscated, function (resp)
                {
                    if (resp.result === true) {
                        BP_MOD_ERROR.success('Imported passwords from ' + o.path);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                });
            }
            else {
                console.log("ChooseFile Failed");
            }
        });
        
        addEventListeners('#dbChooseLoad', 'click', function (e)
        {
            var o={dtitle:"BPrivy: Select Store Folder",
                   dbutton: "Select Existing Wallet"};
            if (BP_PLUGIN.chooseFolder(o)) {
                console.log("ChooseFolder returned:" + o.path);
                BP_MOD_CONNECT.loadDB(o.path, function (resp)
                {
                    if (resp.result === true) {
                        if ($('#dbSaveLocation:checked').length) {
                            localStorage['db.path'] = resp.dbPath;
                        }
                        $('#dbPath').text(parseDBName(resp.dbPath)).attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
                        BP_MOD_ERROR.success('Opened password wallet at ' + resp.dbPath);
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
                        if ($('#dbSaveLocation:checked').length) {
                            localStorage['db.path'] = resp.dbPath;
                        }
                        $('#dbPath').text(parseDBName(resp.dbPath)).attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
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
        
        if (localStorage['dbSaveLocation']) {
            $('#dbSaveLocation')[0].checked = true;
        }
        else {
            $('#dbSaveLocation')[0].checked = false;
        }

        BP_MOD_CONNECT.getDBPath(function(resp)
        {
            if (resp.result) {
                $('#dbPath').text(parseDBName(resp.dbPath)).attr('data-original-title', resp.dbPath).attr('data-path', resp.dbPath);
            }
            else {
                $('#dbPath').text(null).attr('data-original-title', '').attr('data-path', null);
            }
        });

    }
   
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        fillOptions: {value: fillOptions},
        onload: {value: onload}
    });
    Object.freeze(iface);

    return iface;    
}());