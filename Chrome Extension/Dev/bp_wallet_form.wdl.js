/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */

/*global $, IMPORT, BP_PLUGIN */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin WALLET_FORM
 */
function BP_GET_WALLET_FORM(g)
{
    "use strict";
    var window = null, document = null, console = null,
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
    var BP_W$ = m,
        w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        WidgetElement = IMPORT(m.WidgetElement),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin */
    var BP_DBFS = IMPORT(g.BP_DBFS);
    var DB_FS = IMPORT(BP_DBFS.DB_FS);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    var g_dialog,
        g_counter = 1;
    /** @globals-end **/

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
    
    //////////////// Common Prototype Functions  //////////////////
    var formFieldProto = Object.create(WidgetElement.prototype, 
    {
        disable: {value: function()
        {
            this.el.disabled = true;
            this.hide();
        }},
        enable: {value: function()
        {
            this.el.disabled = false;
            this.show();
        }}        
    });
    
    //////////////// Widget: checkSaveDBLocation //////////////////
    function checkDontSaveLocation() {}
    checkDontSaveLocation.wdt = function(ctx)
    {
        return {
        tag:'label',
        addClass:'checkbox',
        attr:{ title:'If checked, saved wallet locations will be forgotten, otherwise '+
        'all opened/created wallet locations will be remembered. For privacy and security, '+
        'select it if this is not your computer.'
        },
            children:[
            {tag:'input',
             attr:{ type:'checkbox', tabindex:-1 },
             addClass:'pull-left',
             prop:{ checked:(localStorage.dbDontSaveLocation==='y') },
             ref:'checkDontSaveLocation',
             on:{'change': function(e){
                    localStorage.dbDontSaveLocation= (this.el.checked ? 'y' : 'n');
                  }}
            }
            ],
        _text:'Forget Wallets'
        };
    };
    checkDontSaveLocation.prototype = w$defineProto(checkDontSaveLocation,
    {});

    //////////////// Widget: itemDBName //////////////////
    function itemDBName() {}
    itemDBName.wdi = function(w$ctx)
    {
        var db_name = w$ctx.w$rec;
        
        return {
        tag:'li', cons:itemDBName,
        iface:{ dbName:db_name },
        copy:['fieldsetDBName'],
            children:[
            {tag:'a', attr:{href:'#'}, text:'ctx.dbName',
             on:{ 'click':itemDBName.prototype.onClick }
            }
            ]
        };
    };
    itemDBName.prototype.onClick = function(e)
    {
        this.fieldsetDBName.inputDBName.el.value = this.dbName;
        CS_PLAT.customEvent(this.el, 'dbNameChosen', {dbName:this.dbName});
    };

    //////////////// Widget: menuDBSelect //////////////////
    function menuDBSelect() {}
    menuDBSelect.wdt = function(ctx)
    {
        var names, menuID, nIt;
            
        if (ctx.mode === 'create') { return w$undefined; }
        
        names = localStorage.dbNames;
        // return undefined if there are no options to select.
        if (!names) {return w$undefined; }        
        
        menuID = 'dbNameMenu' + g_counter++;
        nIt = BP_COMMON.ArrayIterator(Object.keys(names));
        
        return {
        tag:'div', ref:'menuDBSelect', cons:menuDBSelect, addClass:'dropdown',
        css:{display:'inline-block'},
            children:[
            {tag:'button', text:'Select ', attr:{type:'button'}, 
             addClass:'dropdown-toggle btn', ref:'button',
                children:[{tag:'span', addClass:'caret'}]
            },
            {tag:'ul', attr:{role:'menu', id:menuID}, addClass:'dropdown-menu',
             ref:'menuItems'
            }
            ],
        copy:['fieldsetDBName'],
            iterate:{ it:nIt, wdi:itemDBName.wdi },
        _cull:['button', 'menuItems'],
        _final:{ exec:menuDBSelect.prototype.init }
        };    
    };
    menuDBSelect.prototype = w$defineProto(menuDBSelect,
    {
        init: {value: function()
        {
            this.button.$().dropdown();
            return this;
        }},
        focus: {value: function()
        {
            this.button.el.focus();
        }}
    });

    //////////////// Widget: fieldsetDBName //////////////////
    function fieldsetDBName() {}
    fieldsetDBName.wdt = function (ctx)
    {
        if (ctx.mode !== 'create') { return w$undefined; }
        
        return {
        tag:'fieldset',
        cons:fieldsetDBName,
        ref:'fieldsetDBName',
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Name</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-append',
                    children:[
                    {tag:'input',
                     ref:'inputDBName', addClass:"input-medium",
                     attr:{ type:'text', placeholder:"Enter Wallet Name", pattern:".{1,}",
                     title:"Please enter a name for the new Wallet that you would like to create. "+
                           "Example: <i>Tony's Wallet</i>"
                     },
                     prop:{ required: (ctx.mode==='create') },
                     on:{ 'change': function(e) {
                                    CS_PLAT.customEvent(this.el, 'dbNameChosen', {dbName:this.el.value});
                                    }}
                    }
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBName']
        };
    };
    fieldsetDBName.prototype = w$defineProto(fieldsetDBName,
    {
        focus: {value: function()
        {
            this.inputDBName.el.focus();
            return this;
        }}
    }, formFieldProto);
        
    //////////////// Widget: fieldsetChooseDB //////////////////
    function fieldsetChooseDB() {}
    fieldsetChooseDB.wdt = function (ctx)
    {
        //////////////// Widget: btnChooseDB //////////////////
        function btnChooseDB() {}
        btnChooseDB.wdt = function (ctx)
        {
            return {
            tag:'button',
            cons:btnChooseDB,
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseDB',
            on:{ 'click':btnChooseDB.prototype.onClick },
            copy:['fieldsetChooseDB', 'dialog']
            };
        };
        btnChooseDB.prototype = w$defineProto(btnChooseDB, 
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseWalletFolder(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseDB.inputDBPath.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseDB.inputDBPath.el, 'dbChosen', {dbPath:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseDB,
        ref:'fieldsetChooseDB',
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Wallet Location</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend',
                    children:[
                    menuDBSelect.wdt,
                    btnChooseDB.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Wallet Folder Location" },
                     prop:{ required:true },
                     addClass:"input-large",
                     ref:'inputDBPath',
                     on:{'change':function(e)
                         {
                            if (this.el.checkValidity()) {
                                CS_PLAT.customEvent(this.el, 'dbChosen', {dbPath:this.el.value});
                            }
                         }
                     }
                    },
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBPath', 'btnChooseDB', 'menuDBSelect']
        };
    };
    fieldsetChooseDB.prototype = w$defineProto(fieldsetChooseDB,
    {
        focus: {value: function()
        {
            if (this.menuDBSelect) {
                this.menuDBSelect.focus();
            }
            else {
                this.btnChooseDB.el.focus();    
            }
            
            return this;
        }},

        val: {value: function()
        {
            return this.inputDBPath.el.value;
        }},
        
        onDBNameChosen: {value: function(dbName) 
        {
            var names = localStorage.dbNames;

            if (names && (this.walletForm.mode !== 'create')) {
                this.inputDBPath.el.placeholder = 'Select or Enter Wallet Name';
            }
            else {
                this.inputDBPath.el.placeholder = 'Enter Wallet Name';
            }

            if (names) {
                this.inputDBPath.el.value = names[dbName];
            }
            this.enable();
        }}        
    }, formFieldProto);
    

    //////////////// Widget: fieldsetChooseKey //////////////////
    function fieldsetChooseKey() {}
    fieldsetChooseKey.wdt = function (ctx)
    {
        //////////////// Widget: checkInternalKey //////////////////
        function checkInternalKey() {}
        checkInternalKey.wdt = function(ctx)
        {
            return {
            tag:'label',
            addClass:'checkbox',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false }, // default value
                 ref:'checkInternalKey',
                 on:{'change': function(e)
                     {if (this.el.checked) {
                         fieldsetChooseKey.prototype.onCheck();
                      } else {
                         fieldsetChooseKey.prototype.onUncheck();
                      }
                     }
                 }
                }
                ],
            _text:'Check if key is saved within the Wallet.'
            };
        };
        checkInternalKey.prototype = w$defineProto(checkInternalKey, {});
        
        //////////////// Widget: btnChooseKey //////////////////
        function btnChooseKey() {}
        btnChooseKey.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseKey',
            };
        };
        btnChooseKey.prototype = w$defineProto(btnChooseKey,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyPath(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseKey.inputKeyPath.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseKey.inputKeyPath.el, 'keyPathChosen', {keyPath:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseKey,
        ref:'fieldsetChooseKey',
        prop:{ disabled:true },
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Key File</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                btnChooseKey.wdt,
                {tag:'input',
                 attr:{ type:'text', placeholder:"Key File Path" },
                 prop:{ required:true },
                 addClass:"input-xlarge",
                 ref:'inputKeyPath',
                 on:{ 'change': function(e) {
                     if (this.el.checkValidity()) {
                        CS_PLAT.customEvent(this.el, 'keyPathChosen', {keyPath:this.el.value});
                     } } 
                    }
                }
                //checkInternalKey.wdt
                ]
            }
            ],
        copy:['walletForm'],
        _cull:['inputKeyPath', 'btnChooseKey', 'checkInternalKey'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetChooseKey.prototype = w$defineProto(fieldsetChooseKey,
    {
        onDBChosen: {value: function(dbPath)
        {
            var keyPath;
            
            if (this.walletForm.mode === 'create') { 
                this.disable();
                return this;
            }
            
            keyPath = dbPath ? DB_FS.findCryptInfoFile2(dbPath) : undefined;

            if (keyPath) {
                this.disable();
                CS_PLAT.customEvent(this.el, 'keyPathChosen', {keyPath:keyPath});
            }
            else
            {
                this.enable();
                this.checkInternalKey.checked = false;
                this.btnChooseKey.el.focus();
            }
            
            return this;
        }}
    }, formFieldProto);


    //////////////// Widget: fieldsetChooseKeyFolder //////////////////
    function fieldsetChooseKeyFolder() {}
    fieldsetChooseKeyFolder.wdt = function (ctx)
    {
        //////////////// Widget: checkInternalKey //////////////////
        function checkInternalKey() {}
        checkInternalKey.wdt = function(ctx)
        {
            return {
            tag:'label',
            addClass:'checkbox',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false },
                 ref:'checkInternalKey',
                 copy:['fieldsetChooseKeyFolder'],
                 on:{ 'change':function(e)
                     {if (this.el.checked) {
                         this.fieldsetChooseKeyFolder.onCheck();
                      } else {
                         this.fieldsetChooseKeyFolder.onUncheck();
                      }
                     }}
                }
                ],
            _text:'Key is saved within the Wallet (uncheck for more security).'
            };
        };
        checkInternalKey.prototype = w$defineProto(checkInternalKey, {});
        
        //////////////// Widget: btnChooseKeyFolder //////////////////
        function btnChooseKeyFolder() {}
        btnChooseKeyFolder.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseKeyFolder',
            };
        };
        btnChooseKeyFolder.prototype = w$defineProto(btnChooseKeyFolder,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFolder(o);
                    
                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.fieldsetChooseFolder.inputKeyFolder.el.value = path;
                    CS_PLAT.customEvent(this.fieldsetChooseKeyFolder.inputKeyFolder.el, 
                        'keyFolderChosen', {keyFolder:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseKeyFolder,
        ref:'fieldsetChooseKeyFolder',
        addClass:'control-group',
        prop:{ disabled:true },
        copy:['walletForm'],
            children:[
            {html:'<label class="control-label">Key Folder</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                btnChooseKeyFolder.wdt,
                {tag:'input',
                 attr:{ type:'text', placeholder:"Key Folder Path" },
                 prop:{ required:true },
                 addClass:"input-xlarge",
                 ref:'inputKeyFolder',
                 on:{ 'change': function(e) 
                      {
                          if (this.el.checkValidity()) {
                            CS_PLAT.customEvent(this.el, 'keyFolderChosen', {keyFolder:this.el.value});
                          }
                      }}
                },
                checkInternalKey.wdt
                ]
            }
            ],
        _cull:['inputKeyFolder','btnChooseKeyFolder','checkInternalKey'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetChooseKeyFolder.prototype = w$defineProto(fieldsetChooseKeyFolder,
    {
        onDBChosen: {value: function()
        {          
            if (this.walletForm.mode === 'create')
            {
                this.enable();
                this.checkInternalKey.el.checked = true; // Default position
                this.onCheck();
                this.btnChooseKeyFolder.el.focus();
            }

            return this;
        }},
        
        onCheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyFolder.el.value = null;
                this.inputKeyFolder.el.disabled = true;
                this.btnChooseKeyFolder.el.disabled = true;
                CS_PLAT.customEvent(this.inputKeyFolder.el, 'keyFolderChosen', {keyFolder:null});
            }
        }},

        onUncheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyFolder.el.value = null;
                this.inputKeyFolder.el.disabled = false;
                this.btnChooseKeyFolder.el.disabled = false;
            }
        }}
    }, formFieldProto);

    //////////////// Widget: fieldsetPassword //////////////////
    function fieldsetPassword() {}
    fieldsetPassword.wdt = function(ctx)
    {
        var bPass2 = ctx.bPass2;
        
        function inputPassword() {}
        inputPassword.wdt = function(ctx)
        {
            return {
            tag:'input',
            attr:{ type:'password', placeholder:bPass2?"Re-Enter Master Password":"Enter Master Password",
                   title:'10 or more characters required', pattern:'.{10,}' },
            ref:'inputPassword',
            on:{ 'change':inputPassword.prototype.onChange},
            copy:['walletForm']
            };
        };
        inputPassword.prototype = w$defineProto(inputPassword,
        {
            onChange: {value: function(e)
             {
                 if (!this.el.checkValidity()) { return; }

                 if (bPass2) {
                     if (this.el.value !== this.walletForm.fieldsetPassword.inputPassword.el.value) {
                         this.el.setCustomValidity('Passwords do not match');
                     }
                     else {
                         CS_PLAT.customEvent(this.inputPassword.el, 'passwordChosen');
                     }
                 }
                 else if (this.walletForm.mode !== 'create') {
                     CS_PLAT.customEvent(this.inputPassword.el, 'passwordChosen');
                 }
             }}
        });
        
        return {
        tag:'fieldset', cons: fieldsetPassword,
        ref: (bPass2 ? 'fieldsetPassword2' : 'fieldsetPassword'),
        iface:{ bPass2: bPass2 },
        prop:{ disabled:true },
        addClass:'control-group',
            children:[
            {tag:'label', addClass:'control-label',
             text:bPass2?'Re-Enter Master Password':'Master Password'
            },
            {tag:'div', addClass:'controls',
                children:[inputPassword.wdt]
            }
            ],
        _cull:['inputPassword'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetPassword.prototype = w$defineProto(fieldsetPassword,
    {
        onKeyPathChosen: {value: function(e)
        {
            if (!this.bPass2) { this.enable(); this.inputPassword.el.focus(); }
        }},
        
        onKeyFolderChosen: {value: function(e)
        {
            this.enable();
            if (!this.bPass2) {
                this.inputPassword.el.focus();
            }
        }}
    }, formFieldProto);

    function fieldsetPassword2_wdt(ctx)
    {
        var wdl;
        ctx.bPass2 = true;
        wdl = fieldsetPassword.wdt(ctx);
        delete ctx.bPass2;
        return wdl;
    }
    
    //////////////// Widget: fieldsetSubmit //////////////////
    function fieldsetSubmit() {}
    fieldsetSubmit.wdt = function(ctx)
    {
        return {
        tag:'fieldset', addClass:'control-group',
            children:[
            {tag:'div', addClass:'controls',
                children:[
                {tag:'button', ref:'btnWalletSubmit', attr:{type:'button'},
                 //prop:{ disabled:true },
                 addClass:'btn btn-small btn-primary', text:'Submit'
                },
                {tag:'button', ref:'btnWalletCancel', attr:{type:'button'},
                 addClass:'btn btn-small', text:'Cancel'
                }
                ]
            }
            ],
        _cull:['btnWalletSubmit', 'btnWalletCancel']
        };
    };
    fieldsetSubmit.prototype = w$defineProto(fieldsetSubmit, {}, formFieldProto);
    
    //////////////// Widget: WalletFormWdl //////////////////
    function WalletFormWdl() {}
    WalletFormWdl.wdt = function (ctx)
    {      
        return {
        tag:'form',
        cons: WalletFormWdl,
        ref:'walletForm',
        addClass:'form-horizontal',
        iface:{
            mode: ctx.mode,
            loadDB2: ctx.loadDB2,
            createDB2: ctx.createDB2,
            mergeDB2: ctx.mergeDB2,
            mergeInDB2: ctx.mergeInDB2,
            mergeOutDB2: ctx.mergeOutDB2,
            updateDash: ctx.updateDash,
            callbackHandleError: ctx.callbackHandleError,
            destroyWalletForm: ctx.destroyWalletForm
        },
        on:{ 'dbNameChosen':WalletFormWdl.prototype.onDBNameChosen,
             'dbChosen':WalletFormWdl.prototype.onDBChosen,
             'keyPathChosen':WalletFormWdl.prototype.onKeyPathChosen,
             'keyFolderChosen':WalletFormWdl.prototype.onKeyFolderChosen
        },
            children:[
            fieldsetDBName.wdt,
            fieldsetChooseDB.wdt,
            fieldsetChooseKey.wdt,
            fieldsetChooseKeyFolder.wdt,
            fieldsetPassword.wdt,
            fieldsetPassword2_wdt
            //fieldsetSubmit.wdt
            ],
        _cull:['formWalletLegend',
               'fieldsetDBName',
               'fieldsetChooseDB',
               'fieldsetChooseKey',
               'fieldsetChooseKeyFolder',
               'fieldsetPassword',
               'fieldsetPassword2']
               //'fieldsetSubmit']
        };
    };
    WalletFormWdl.prototype = w$defineProto(WalletFormWdl,
    {
        onDBNameChosen: {value: function(e)
        {
            this.fieldsetChooseDB.onDBNameChosen(e.detail.dbName);
            e.preventDefault();
            e.stopPropagation();
        }},
        onDBChosen: {value: function(e)
        {
            this.fieldsetChooseKey.onDBChosen(e.detail.dbPath);
            this.fieldsetChooseKeyFolder.onDBChosen();
            e.preventDefault();
            e.stopPropagation();            
        }},
        onKeyPathChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyPathChosen();
            e.preventDefault();
            e.stopPropagation();
        }},
        onKeyFolderChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyFolderChosen();
            this.fieldsetPassword2.onKeyFolderChosen();
            e.preventDefault();
            e.stopPropagation();
        }}
    });
    
    function modalDialog() {}
    modalDialog.wdt = function(ctx)
    {
        return {
        tag:'div', ref: 'dialog',
        cons:modalDialog,
        addClass:'modal',
        attr:{ id:'modalDialog', role:'dialog' },
        iface:{ mode:ctx.mode },
        on:{ 'shown':modalDialog.prototype.onShown,
             'hidden':modalDialog.prototype.onHidden },
        _final:{ appendTo:ctx.appendTo, show:false },
        _cull:['walletForm', 'modalHeader'],
            children:[
            {tag:'div', addClass:'modal-header',
                children:[
                {tag:'button', addClass:'close',
                 attr:{ "data-dismiss":'modal', 'aria-hidden':true },
                 text:'x',
                 copy:['dialog'],
                 on:{ 'click': function(e){destroyDialog();} }
                },
                {tag:'h3', ref:'modalHeader'}
                ]
            },
            {tag:'div', addClass:'modal-body',
                children:[WalletFormWdl.wdt]
            },
            {tag:'div', addClass:'modal-footer',
                children:[
                checkDontSaveLocation.wdt,
                {tag:'button', 
                addClass:'btn', 
                attr:{'data-dismiss':'modal', 'aria-hidden':true, tabindex:-1}, 
                text:'Cancel',
                on:{ 'click': function(e){destroyDialog();}},
                copy:['dialog']
                },
                {tag:'button', addClass:'btn btn-primary', text:'Submit'}
                ]
            }
            ]
        };
    };
    modalDialog.prototype = w$defineProto(modalDialog,
    {
        onInsert: {value: function()
        {
            this.$().modal();
            
            switch (this.mode)
            {
                case 'merge':
                    this.modalHeader.$().text('Sync/Merge Wallet');
                    break;
                case 'mergeIn':
                    this.modalHeader.$().text('Import Wallet');
                    break;
                case 'mergeOut':
                    this.modalHeader.$().text('Export to Wallet');
                    break;
                case 'create':
                    this.modalHeader.$().text('Create Wallet');
                    break;
                case 'open':
                default:
                    this.modalHeader.$().text('Open Wallet');
            }
            
            return this;
        }},

        onShown: {value: function(e) 
        {
            switch (this.mode)
            {
                case 'create':
                    this.walletForm.fieldsetDBName.focus();
                    break;
                default:
                    this.walletForm.fieldsetChooseDB.focus();
            }   
        }},
        
        onHidden: {value: function(e)
        {
            this.destroy();
        }},
        
        showModal: {value: function()
        {
            this.$().modal('show');
            return this;
        }},
        
        hideModal: {value: function()
        {
            this.$().modal('hide');
            this.walletForm.el.reset();
            return this;
        }}
    });
    
    function createDialog(ops)
    {
        var ctx, dialog, temp;

        if (g_dialog) {
            g_dialog.hide().destroy();
            g_dialog = null;
        }

        // Create the Widget.
        ctx = {
            mode: ops.mode,
            loadDB2: ops.loadDB2,
            createDB2: ops.createDB2,
            mergeDB2: ops.mergeDB2,
            mergeInDB2: ops.mergeInDB2,
            mergeOutDB2: ops.mergeOutDB2,
            updateDash: ops.updateDash,
            callbackHandleError: ops.callbackHandleError,
            appendTo: 'body'
        };
        var wdl = modalDialog.wdt(ctx);
        dialog = BP_W$.w$exec(wdl, ctx);
        
        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
        
        g_dialog = dialog;
        
        if (dialog)
        {
            $(g_dialog.el).tooltip(); // used to leak DOM nodes in version 2.0.4.
            g_dialog.onInsert().showModal().onShown();
        }
        
        return g_dialog;
    }
    
    function destroyDialog()
    {
        var w$dialog;
        if (g_dialog) {
            w$dialog = g_dialog;
        }
        else {
            w$dialog = BP_W$.w$get('#modalDialog');
        }

        if (w$dialog) {
            w$dialog.hideModal().destroy();
        }
        
        g_dialog = null;
    }    

    BP_ERROR.loginfo("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: createDialog
    });
}