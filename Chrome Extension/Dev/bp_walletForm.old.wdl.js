/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */

/*global $, IMPORT */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin WALLET_FORM
 */
function BP_GET_WALLET_FORM(g)
{
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m);
    /** @import-module-begin CSPlatform */
        m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT),
        rpcToMothership = IMPORT(CS_PLAT.rpcToMothership),
        addEventListeners = IMPORT(m.addEventListeners), // Compatibility function
        addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin W$ */
    m = IMPORT(g.BP_W$);
    var w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        Widget = IMPORT(m.Widget),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    var BP_PLUGIN, // initialized dynamically
        loadDB2,
        createDB2,
        mergeDB2,
        mergeInDB2,
        mergeOutDB2,
        updateDash,
        callbackHandleError,
        destroyWalletForm;
    /** @globals-end **/

    function initCheckDBSaveLocation()
    {
        if (localStorage.dbDontSaveLocation) {
            $('#dbSaveLocation')[0].checked = false;
        }
        else {
            $('#dbSaveLocation')[0].checked = true;
        }
    }

    function chooseWalletFolder(o)
    {
        BP_COMMON.clear(o);

        o.dtitle = "Untrix Wallet: Select Wallet Folder";
        o.dbutton = "Select Wallet Folder";
        o.clrHist = true;

        if (!BP_PLUGIN.chooseFolder(o))
        {
            BP_ERROR.loginfo(o.err);
        }
        else {
            return o.path;
        }
    }

    function chooseKeyFile(o)
    {
        BP_COMMON.clear(o);
        o.filter = ['Key File','*.3ak'];
        o.dtitle = "Untrix Wallet: Select Key File";
        o.dbutton = "Select";
        o.clrHist = true;

        if (!BP_PLUGIN.chooseFile(o)) {BP_ERROR.loginfo(o.err);}
        else {return o.path;}
    }

    function chooseKeyFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle  = "Untrix Wallet: Select folder for storing Key File";
        o.dbutton = "Select Key File Folder";

        if (!BP_PLUGIN.chooseFolder(o)) { BPError.loginfo(o.err); }
        else { return o.path; }
    }

    function initFieldsetChooseKey(enable)
    {
        if (enable) {
        $('#fieldsetChooseKey').prop('disabled', false).removeClass('error').show();
        $('#btnChooseKey').prop('disabled', false).show();
        $('#inputKeyPath').prop('disabled', false).show();
        $('#checkInternalKey').prop('checked', false);
        }
        else {
            $('#fieldsetChooseKey').prop('disabled', true).removeClass('error').hide();
        }
    }

    function initFieldsetChooseKeyFolder(enable)
    {
        if (enable) {
        $('#fieldsetChooseKeyFolder').prop('disabled', false).removeClass('error').show();
        $('#btnChooseKeyFolder').prop('disabled', false).show();
        $('#inputKeyFolder').prop('disabled', false).show();
        $('#checkInternalKey2').prop('checked', false);
        }
        else {
            $('#fieldsetChooseKeyFolder').prop('disabled', true).removeClass('error').hide();
        }
    }

    function onInsert()
    {
        addEventListeners('#dbSaveLocation', 'change', function (e)
        {
            if (this.checked) {
                localStorage["db.path"] = $('#dbPath').attr('data-path');
                localStorage.dbDontSaveLocation = '';
            }
            else {
                localStorage["db.path"] = '';
                localStorage.dbDontSaveLocation = 'true';
            }
        });

        addEventListeners('#btnWalletCancel', 'click', function(e)
        {
            destroyWalletForm();
        });

        addEventListeners('#btnWalletSubmit', 'click', function(e)
        {
            var $el,
                $form = $('#formWallet');
            if (!$form[0].checkValidity()) {
                $el = $('#dbName');
                $el[0].validity.valid || $('#fieldsetDBName').addClass('error');

                $el = $('#inputDBPath');
                $el[0].validity.valid || $('#fieldsetChooseDB').addClass('error');

                $el = $('#inputKeyPath');
                $el[0].validity.valid || $('#fieldsetChooseKey').addClass('error');

                $el = $('#inputKeyFolder');
                $el[0].validity.valid || $('#fieldsetChooseKeyFolder').addClass('error');

                $el = $('#inputPassword');
                $el[0].validity.valid || $('#fieldsetPassword').addClass('error');

                $el = $('#inputPassword2');
                $el[0].validity.valid || $('#fieldsetPassword2').addClass('error');
            }
            else if ($form[0].dataset.action === 'open') {
                loadDB2($('#inputDBPath').val(),
                        $('#inputKeyPath').val(),
                        $('#inputPassword').val(), function (resp)
                {
                    if (resp.result === true) {
                        updateDash(resp);
                        BP_ERROR.success('Loaded Keyring at ' + resp.dbPath);
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    destroyWalletForm();
                });
            }
            else if ($form[0].dataset.action === 'create') {
                if ($('#inputPassword').val() !== $('#inputPassword2').val()) {
                    $('#fieldsetPassword2').addClass('error');
                }
                else {
                    createDB2($('#dbName').val(),
                              $('#inputDBPath').val(),
                              $('#inputKeyFolder').val(),
                              $('#inputPassword').val(), function (resp)
                {
                    if (resp.result === true) {
                        updateDash(resp);
                        BP_ERROR.success('Password store created at ' + resp.dbPath);
                    }
                    else {
                        callbackHandleError(resp);
                    }

                    destroyWalletForm();
                });
                }
            }
            else if ($form[0].dataset.action === 'merge')
            {
                mergeDB2($('#inputDBPath').val(),
                        $('#inputKeyPath').val(),
                        $('#inputPassword').val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged with password wallet at ' + $('#inputDBPath').val());
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    destroyWalletForm();
                });
            }
            else if ($form[0].dataset.action === 'mergeIn')
            {
                mergeInDB2($('#inputDBPath').val(),
                        $('#inputKeyPath').val(),
                        $('#inputPassword').val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged In password wallet at ' + $('#inputDBPath').val());
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    destroyWalletForm();
                });
            }
            else if ($form[0].dataset.action === 'mergeOut')
            {
                mergeOutDB2($('#inputDBPath').val(),
                        $('#inputKeyPath').val(),
                        $('#inputPassword').val(), function (resp)
                {
                    if (resp.result === true) {
                        BP_ERROR.success('Merged out to password wallet at ' + $('#inputDBPath').val());
                    }
                    else {
                        callbackHandleError(resp);
                    }
                    destroyWalletForm();
                });
            }
        });

        addEventListeners('#checkInternalKey', 'change', function (e)
        {
            if (this.checked) {
                $('#btnChooseKey').prop('disabled', true).hide();
                $('#inputKeyPath').prop('disabled', true).hide();
            }
            else {
                $('#btnChooseKey').prop('disabled', false).show();
                $('#inputKeyPath').prop('disabled', false).show();
            }
        });

        addEventListeners('#checkInternalKey2', 'change', function (e)
        {
            if (this.checked) {
                $('#btnChooseKeyFolder').prop('disabled', true).hide();
                $('#inputKeyFolder').prop('disabled', true).hide();
            }
            else {
                $('#btnChooseKeyFolder').prop('disabled', false).show();
                $('#inputKeyFolder').prop('disabled', false).show();
            }
        });

        addEventListeners('#btnChooseDB', 'click', function(e)
        {
            var o = {},
                path = chooseWalletFolder(o);

            if (o.err) { BP_ERROR.alert(o.err); }
            else if (path) {
                $('#inputDBPath').val(path);
            }
        });

        addEventListeners('#btnChooseKey', 'click', function(e)
        {
            var o = {},
                path = chooseKeyFile(o);

            if (o.err) { BP_ERROR.alert(o.err); }
            else if (path) {
                $('#inputKeyPath').val(path);
            }
        });

        addEventListeners('#btnChooseKeyFolder', 'click', function(e)
        {
            var o = {},
                path = chooseKeyFolder(o);

            if (o.err) { BP_ERROR.alert(o.err); }
            else if (path) {
                $('#inputKeyFolder').val(path);
            }
        });
    }


    function WalletFormWdl() {}
    WalletFormWdl.html = '<form id="formWallet" class="well">'+
                  '<legend><strong id="formWalletLegend">Open Wallet</strong></legend>'+
                   '<fieldset id="fieldsetDBName" class="control-group">'+
                    '<label class="control-label">Name</label>'+
                    '<div class="controls">'+
                      '<input id="dbName"  type="text" placeholder="Type Wallet Name Here" class="input-medium" pattern=".{4,}" required'+
                        'title="Please enter a name for the new Wallet that you would like to create. Example: <i>Tonys Wallet</i>">'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset id="fieldsetChooseDB" class="control-group">'+
                    '<label class="control-label">Wallet Location</label>'+
                    '<div class="controls form-inline">'+
                      '<button id="btnChooseDB" type="button" class="btn btn-small btn-primary">'+
                      '<!--  <img style="display:none" id="dbLoadSpinner" src="icons/ajax-loader-white.gif" />'+
                            '<i class="icon-folder-open icon-white"></i>  -->'+
                         'Browse'+
                      '</button>'+
                      '<input id="inputDBPath"  type="text" placeholder="Wallet Folder Location" class="input-xlarge" required>'+
                      '<label class="checkbox" title="If checked, the Wallet location will be saved on this computer and '+
                        'automatically selected the next time. For privacy and security, uncheck it if this is not your computer.">'+
                        '<input id="dbSaveLocation" type="checkbox" checked="checked">'+
                        'Remember Me'+
                      '</label>'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset id="fieldsetChooseKey" class="control-group">'+
                    '<label class="control-label">Key File</label>'+
                    '<div class="controls form-inline">'+
                      '<button id="btnChooseKey" type="button" class="btn btn-small btn-primary">Browse</button>'+
                      '<input id="inputKeyPath"  type="text" placeholder="Key File Path" class="input-xlarge" required>'+
                      '<label class="checkbox">'+
                        '<input id="checkInternalKey" type="checkbox">'+
                        'Key is saved within the Wallet.'+
                      '</label>'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset id="fieldsetChooseKeyFolder" class="control-group">'+
                    '<label class="control-label">Key Folder</label>'+
                    '<div class="controls form-inline">'+
                      '<button id="btnChooseKeyFolder" type="button" class="btn btn-small btn-primary">Browse</button>'+
                      '<input id="inputKeyFolder"  type="text" placeholder="Key Folder Path" class="input-xlarge" required>'+
                      '<label class="checkbox">'+
                        '<input id="checkInternalKey2" type="checkbox">'+
                        'Key is saved within the Wallet.'+
                      '</label>'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset id="fieldsetPassword" class="control-group">'+
                    '<label class="control-label">Master Password</label>'+
                    '<div class="controls">'+
                      '<input id="inputPassword"  type="password" placeholder="Enter Master Password"'+
                        'title="10 characters or more" required pattern=".{10,}">'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset id="fieldsetPassword2" class="control-group">'+
                    '<label class="control-label">Re-Enter Master Password</label>'+
                    '<div class="controls">'+
                      '<input id="inputPassword2"  type="password" placeholder="Re-enter Master Password" required pattern=".{10,}">'+
                    '</div>'+
                  '</fieldset>'+
                  '<fieldset class="control-group">'+
                    '<div class="controls">'+
                      '<button id="btnWalletSubmit" type="button" class="btn btn-small btn-primary">Submit</button>'+
                      '<button id="btnWalletCancel" type="button" class="btn btn-small">Cancel</button>'+
                    '</div>'+
                  '</fieldset>'+
                '</form>';
    WalletFormWdl.wdt = function (ctx)
    {
        BP_PLUGIN = ctx.BP_PLUGIN;
        loadDB2 = ctx.loadDB2;
        createDB2 = ctx.createDB2;
        mergeDB2 = ctx.mergeDB2;
        mergeInDB2 = ctx.mergeInDB2;
        mergeOutDB2 = ctx.mergeOutDB2;
        updateDash = ctx.updateDash;
        callbackHandleError = ctx.callbackHandleError;
        destroyWalletForm = ctx.destroyWalletForm;

        return {
        cons: WalletFormWdl,
        html: WalletFormWdl.html
        };
    };
    WalletFormWdl.prototype = w$defineProto(WalletFormWdl,
    {
        initOpen: {value: function(mode, text)
        {
            var $form = $(this.el),
                form = this.el;
            form.reset();
            form.dataset.action = mode || "open";
            $('#formWalletLegend').text(text || 'Open A Wallet');
            $('#fieldsetDBName').prop('disabled',true).removeClass('error').hide();
            $('#fieldsetChooseDB').prop('disabled', false).removeClass('error').show();
            $('#fieldsetPassword').prop('disabled', false).removeClass('error').show();
            $('#fieldsetPassword2').prop('disabled', true).removeClass('error').hide();
            initFieldsetChooseKey(true);
            initFieldsetChooseKeyFolder(false);
            $form.show();
            initCheckDBSaveLocation();
            onInsert();
        }},

        initMerge: {value: function()
        {
           this.initOpen('merge', 'Details of Wallet to Merge');
        }},

        initMergeIn: {value: function()
        {
           this.initOpen('mergeIn', 'Details of Wallet to Import from');
        }},

        initMergeOut: {value: function()
        {
           this.initOpen('mergeOut', 'Details of Wallet to Export to');
        }},

        initCreate: {value: function(e)
        {
            var $form = $(this.el),
                form = this.el;
            form.reset();
            form.dataset.action = "create";
            $('#formWalletLegend').text('Create A New Wallet');
            $('#fieldsetDBName').prop('disabled',false).removeClass('error').show();
            $('#fieldsetChooseDB').prop('disabled', false).removeClass('error').show();
            $('#fieldsetPassword').prop('disabled', false).removeClass('error').show();
            $('#fieldsetPassword2').prop('disabled', false).removeClass('error').show();
            initFieldsetChooseKey(false);
            initFieldsetChooseKeyFolder(true);
            $form.show();
            initCheckDBSaveLocation();
            onInsert();
        }}
    });

    BP_ERROR.logdebug("constructed mod_wallet_form");
    return Object.freeze(
    {
        WalletFormWdl_wdt: WalletFormWdl.wdt
    });
}