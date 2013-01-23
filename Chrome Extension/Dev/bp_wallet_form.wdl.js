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
        Widget = IMPORT(m.Widget),
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
    
    //////////////// Widget: fieldsetDBName //////////////////
    function fieldsetDBName() {}
    fieldsetDBName.wdt = function (ctx)
    {
        //////////////// Widget: itemDBName //////////////////
        function itemDBName() {}
        itemDBName.wdt = function(ctx)
        {
            return {
            tag:'li', cons:itemDBName,
            iface:{ dbName:ctx.dbName, dbPath:ctx.dbPath, 
             fieldsetDBName:ctx.fieldsetDBName
            },
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
            CS_PLAT.trigger(this.el, 'dbNameChosen', 'CustomEvent');
        };
        
        //////////////// Widget: menuDBName //////////////////
        function menuDBName() {}
        menuDBName.wdt = function(ctx)
        {
            var menuID = 'dbNameMenu' + g_counter++;
            
            return {
            tag:'div', ref:'menuDBName', cons:menuDBName, addClass:'dropdown',
            css:{display:'inline-block'},
                children:[
                {tag:'button', text:'Select ', attr:{type:'button'}, 
                 addClass:'dropdown-toggle btn', ref:'button',
                    children:[{tag:'span', addClass:'caret'}]
                },
                {tag:'ul', attr:{role:'menu', id:menuID}, addClass:'dropdown-menu',
                 ref:'container',
                    children:[
                    // {tag:'li', 
                        // children:[{tag:'a', attr:{href:'#'}, text:'Name1'}]
                    // },
                    // {tag:'li', 
                        // children:[{tag:'a', attr:{href:'#'}, text:'Name2'}]
                    // }
                    ]
                }
                ],
            copy:['fieldsetDBName'],
            _cull:['button', 'container']
            };    
        };
        menuDBName.prototype = w$defineProto(menuDBName,
        {
            init: {value: function(names)
            {
                this.container.empty();
                BP_COMMON.iterObj(names, this, function(name, path)
                {
                    var ctx = {
                                dbName:name, 
                                dbPath:path, 
                                fieldsetDBName:this.fieldsetDBName
                              },
                        wel = w$exec(itemDBName.wdt, ctx);
                    this.container.append(wel);
                });
                this.button.$().dropdown();
                return this;
            }}
        });

        //////////////// Widget: checkSaveDBLocation //////////////////
        function checkSaveDBLocation() {}
        checkSaveDBLocation.wdt = function(ctx)
        {
            return {
            tag:'label',
            addClass:'checkbox',
            attr:{ title:'If checked, the Wallet location will be saved on this computer and '+
            'automatically selected the next time. For privacy and security, uncheck it if this is not your computer.'
            },
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:true },
                 ref:'checkSaveDBLocation',
                 on:{'change': function(e){localStorage.dbDontSaveLocation=(!this.checked);}}
                }
                ],
            _text:'Remember'
            };
        };
        checkSaveDBLocation.prototype = w$defineProto(checkSaveDBLocation,
        {});

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
                     attr:{ type:'text', placeholder:"Type Wallet Name Here", pattern:".{1,}",
                     title:"Please enter a name for the new Wallet that you would like to create. "+
                           "Example: <i>Tony's Wallet</i>"
                     },
                     prop:{ required: (ctx.mode==='create') },
                     on:{ 'change': function(e) {
                                    CS_PLAT.trigger(this.el, 'dbNameChosen', 'CustomEvent');
                                    }}
                    },
                    menuDBName.wdt
                    ]
                },
                checkSaveDBLocation.wdt
                ]
            }
            ],
        _cull:['inputDBName', 'menuDBName', 'checkSaveDBLocation']
        };
    };
    fieldsetDBName.prototype = w$defineProto(fieldsetDBName,
    {
        val: {value: function()
        {
            return this.inputDBName.el.value;
        }},
        
        disable: {value: function()
        {
            this.inputDBName.$().val();
            this.el.disabled = true;
            return this;
        }},

        init: {value: function()
        {
            var names;
            
            if (localStorage.dbDontSaveLocation) {
                this.checkSaveDBLocation.el.checked = false;
                this.inputDBName.el.value = null;
            }
            else {
                this.checkSaveDBLocation.el.checked = true;
                names = localStorage.dbNames;
                if (names && (this.walletForm.mode !== 'create')) {
                    this.menuDBName.init(names).show();
                    this.inputDBName.el.placeholder = 'Select or Enter Wallet Name';
                }
                else {
                    this.menuDBName.hide();
                    this.inputDBName.el.placeholder = 'Enter Wallet Name';
                }
            }

            this.inputDBName.$().val();

            this.el.disabled = false;
            return this;
        }}
    });
        
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
                    CS_PLAT.trigger(this.fieldsetChooseDB.inputDBPath.el, 'dbChosen', 'CustomEvent');
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
                    btnChooseDB.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Wallet Folder Location" },
                     prop:{ required:true },
                     addClass:"input-large",
                     ref:'inputDBPath',
                     on:{'change':function(e)
                         {
                            if (this.el.checkValidity()) {
                                CS_PLAT.trigger(this.el, 'dbChosen', 'CustomEvent');
                            }
                         }
                     }
                    },
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBPath', 'btnChooseDB']
        };
    };
    fieldsetChooseDB.prototype = w$defineProto(fieldsetChooseDB,
    {
        init: {value: function()
        {
            this.enable();
        }},
        
        val: {value: function()
        {
            return this.inputDBPath.el.value;
        }},
        
        onDBNameChosen: {value: function(e) 
        {
            var names = localStorage.dbNames;
            if (names) {
                this.inputDBPath.el.value = names[this.walletForm.inputDBName];
            }
            this.enable();
        }},
        
        enable: {value: function() { this.el.disabled = false; this.show(); return this; }},
        disable: {value: function() { this.el.disabled = true; this.hide(); return this; }}
    });
    

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
            _text:'Key is saved within the Wallet (uncheck for more security).'
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
            ref:'btnChooseKey', //ctx:{ w$:{ btnChooseKey:'w$el' } },
            };
        };
        btnChooseKey.prototype = w$defineProto(btnChooseKey, {});

        return {
        tag:'fieldset',
        cons:fieldsetChooseKey,
        ref:'fieldsetChooseKey', //ctx:{ w$:{ fieldsetChooseKey:'w$el' } },
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
                },
                checkInternalKey.wdt
                ]
            }
            ],
        copy:['walletForm'],
        _cull:['inputKeyPath', 'btnChooseKey', 'checkInternalKey']
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
                CS_PLAT.trigger(this.el, 'keyPathChosen', 'CustomEvent');
            }
            else
            {
                this.enable();
                this.checkInternalKey.checked = false;
                this.onUncheck();
            }
            
            return this;
        }},
       
        enable: {value: function()
        {
            this.el.disabled = false;
            this.show();
            return this;
        }},
        
        disable: {value: function()
        {
            this.inputKeyPath.$().val();
            this.el.disabled = true;
            this.hide();
            return this;
        }},
        
        onCheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyPath.value = null;
                this.inputKeyPath.disabled = true;
                this.btnChooseKey.disabled = true;
            }
        }},

        onUncheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyPath.value = null;
                this.inputKeyPath.disabled = false;
                this.btnChooseKey.disabled = false;
            }
        }}
    });


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
                }
                ],
            _text:'Key is saved within the Wallet.'
            };
        };
        checkInternalKey.prototype = w$defineProto(checkInternalKey, 
        {
            disable: {value: function(){return this;}},
            init: {value: function(){return this;}}
        });
        
        //////////////// Widget: btnChooseKeyFolder //////////////////
        function btnChooseKeyFolder() {}
        btnChooseKeyFolder.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-primary',
            text:'Browse',
            ref:'btnChooseKeyFolder', //ctx:{ w$:{ btnChooseKeyFolder:'w$el' } },
            };
        };
        btnChooseKeyFolder.prototype = w$defineProto(btnChooseKeyFolder, {});

        return {
        tag:'fieldset',
        cons:fieldsetChooseKeyFolder,
        ref:'fieldsetChooseKeyFolder',
        addClass:'control-group',
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
                 ref:'inputKeyFolder', //ctx:{ w$:{ inputKeyFolder:'w$el' } }
                },
                checkInternalKey.wdt
                ]
            }
            ],
        _cull:['inputKeyFolder','btnChooseKeyFolder','checkInternalKey']
        };
    };
    fieldsetChooseKeyFolder.prototype = w$defineProto(fieldsetChooseKeyFolder,
    {
        disable: {value: function(){this.el.disabled = true; this.hide(); return this;}},
        init: {value: function(){this.el.disabled = false; this.show(); return this;}},
        onDBChosen: {value: function(dbPath)
        {
            var keyPath;
            
            if (this.walletForm.mode !== 'create') {
                this.disable();
            }
            else
            {
                this.enable();
                this.checkInternalKey.checked = true; // Default position
                this.onCheck();
            }
            
            return this;
        }},
    });

    //////////////// Widget: fieldsetPassword //////////////////
    function fieldsetPassword() {}
    fieldsetPassword.wdt = function(ctx)
    {
        var bConfirm = ctx.bConfirm;
        
        function inputPassword() {}
        inputPassword.wdt = function(ctx)
        {
            return {
            tag:'input',
            attr:{ type:'password', placeholder:bConfirm?"Re-Enter Master Password":"Enter Master Password",
                   title:'10 or more characters required', pattern:'.{10,}' },
            ref:'inputPassword', //ctx:{ w$:{ inputPassword:'w$el' } }
            };
        };
        inputPassword.prototype = w$defineProto(inputPassword, {});
        
        return {
        tag:'fieldset', cons: fieldsetPassword,
        ref: (bConfirm ? 'fieldsetPassword2' : 'fieldsetPassword'),
        //ctx:(bConfirm?{ w$:{ fieldsetPassword2:'w$el' } }:{ w$:{ fieldsetPassword:'w$el' } }),
        addClass:'control-group',
            children:[
            {tag:'label', addClass:'control-label',
             text:bConfirm?'Re-Enter Master Password':'Master Password'
            },
            {tag:'div', addClass:'controls',
                children:[inputPassword.wdt]
            }
            ],
        _cull:['inputPassword']
        //_iface:{ ctx:{ inputPassword:'inputPassword' } }
        };
    };
    fieldsetPassword.prototype = w$defineProto(fieldsetPassword,
    {
        disable: {value: function(){return this;}},
        init: {value: function(){return this;}}
    });

    function fieldsetPassword2_wdt(ctx)
    {
        var wdl,
            ctx2 = {bConfirm:true};
        BP_COMMON.copy2(ctx, ctx2);
        wdl = fieldsetPassword.wdt(ctx2);
        BP_COMMON.clear(ctx2);
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
    fieldsetSubmit.prototype = w$defineProto(fieldsetSubmit, {});
    
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
             'dbChosen':WalletFormWdl.prototype.onDBChosen
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
            this.fieldsetChooseDB.onDBNameChosen();
            e.preventDefault();
            e.stopPropagation();
        }},
        onDBChosen: {value: function(e)
        {
            this.fieldsetChooseKey.onDBChosen(this.fieldsetChooseDB.val());
            this.fieldsetChooseKeyFolder.onDBChosen(this.fieldsetChooseDB.val());
            e.preventDefault();
            e.stopPropagation();            
        }},
        onKeyPathChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyPathChosen();
            this.fieldsetPassword.onKeyPathChosen();
        }},
        configureOpen: {value: function()
        {
            var $form = this.$(),
                form = this.el;
            form.reset();
            form.dataset.action = "open";
            //this.fieldsetDBName.disable().hide();
            this.fieldsetDBName.init().show();
            this.fieldsetChooseDB.init();
            this.fieldsetPassword.disable().hide();
            this.fieldsetPassword2.disable().hide();
            this.fieldsetChooseKey.disable().hide();
            this.fieldsetChooseKeyFolder.disable().hide();
        }},
        
        configureMerge: {value: function()
        {
           this.configureOpen('merge', 'Details of Wallet to Merge');
        }},
        
        configureMergeIn: {value: function()
        {
           this.configureOpen('mergeIn', 'Details of Wallet to Import from'); 
        }},

        configureMergeOut: {value: function()
        {
           this.configureOpen('mergeOut', 'Details of Wallet to Export to'); 
        }},

        configureCreate: {value: function(e)
        {
            // var $form = this.$(),
                // form = this.el;
            // form.reset();
            // form.dataset.action = "create";
            // $('#formWalletLegend').text('Create A New Wallet');
            // $('#fieldsetDBName').prop('disabled',false).removeClass('error').show();
            // $('#fieldsetChooseDB').prop('disabled', false).removeClass('error').show();
            // $('#fieldsetPassword').prop('disabled', false).removeClass('error').show();
            // $('#fieldsetPassword2').prop('disabled', false).removeClass('error').show();
            // initFieldsetChooseKey(false);
            // initFieldsetChooseKeyFolder(true);
            // $form.show();
            // initCheckDBSaveLocation();
            // onInsert();
        }}
    });
    
    function modalDialog() {}
    modalDialog.wdt = function(ctx)
    {
        return {
        tag:'div', ref: 'dialog',
        cons:modalDialog,
        addClass:'modal',
        attr:{ id:'modalDialog', role:'dialog', 'aria-hidden':true },
        iface:{ mode:ctx.mode },
        _final:{ appendTo:ctx.appendTo, exec:modalDialog.prototype.configure },
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
                {tag:'button', 
                addClass:'btn', 
                attr:{'data-dismiss':'modal', 'aria-hidden':true}, 
                text:'Cancel',
                on:{ 'click': function(e){destroyDialog();} },
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
        configure: {value: function()
        {
            this.$().modal();
            switch (this.mode)
            {
                case 'merge':
                    return this.configureMerge();
                case 'mergeIn':
                    return this.configureMergeIn();
                case 'mergeOut':
                    return this.configureMergeOut();
                case 'create':
                    return this.configureCreate(); 
                case 'open':
                default:
                    return this.configureOpen();
            }
        }},
        
        configureOpen: {value: function(mode, text)
        {
            this.modalHeader.$().text('Open Wallet');
            this.walletForm.configureOpen();
            return this;
        }},
        
        configureMerge: {value: function()
        {
            this.modalHeader.$().text('Merge Wallets');
            this.walletForm.configureMerge();
            return this;
        }},

        configureMergeIn: {value: function()
        {
            this.modalHeader.$().text('Import Wallet');
            this.walletForm.configureMergeIn();
            return this;
        }},

        configureMergeOut: {value: function()
        {
            this.modalHeader.$().text('Export Wallet');
            this.walletForm.configureMergeOut();
            return this;
        }},

        configureCreate: {value: function(e)
        {
            this.modalHeader.$().text('Create Wallet');
            this.walletForm.configureCreate();
            return this;
        }},

        show: {value: function()
        {
            this.$().modal('show');
            return this;
        }},
        
        hide: {value: function()
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
        //dialog = BP_W$.w$exec(modalDialog.wdt, ctx);
        dialog = BP_W$.w$exec(wdl, ctx);
        
        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
        
        g_dialog = dialog;
        //$(g_dialog.el).appendTo('body');
        
        $(g_dialog.el).tooltip(); // used to leak DOM nodes in version 2.0.4.
        
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

        w$dialog.hide().destroy();
        g_dialog = null;
    }    

    BP_ERROR.loginfo("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: createDialog
    });
}