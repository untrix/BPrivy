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
    var DB_FS = IMPORT(g.BP_DBFS);
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
                {tag:'ul', attr:{role:'menu', id:menuID}, addClass:'dropdown-menu', ref:'container',
                    children:[
                    {tag:'li', 
                        children:[{tag:'a', attr:{href:'#'}, text:'Name1'}]
                    },
                    {tag:'li', 
                        children:[{tag:'a', attr:{href:'#'}, text:'Name2'}]
                    }
                    ]
                }
                ],
            _cull:['button', 'container']
            };    
        };
        menuDBName.prototype = w$defineProto(menuDBName,{});
        
        return {
        tag:'fieldset',
        cons:fieldsetDBName,
        ref:'fieldsetDBName',
        //ctx:{ w$:{ fieldsetDBName:'w$el' } },
        addClass:'control-group',
            children:[
            {html:'<label class="control-label">Name</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-append',
                    children:[
                    {tag:'input',
                     ref:'inputDBName', addClass:"input-medium",
                     attr:{ type:'text', placeholder:"Type Wallet Name Here", pattern:".{4,}",
                     title:"Please enter a name for the new Wallet that you would like to create. "+
                           "Example: <i>Tony's Wallet</i>"
                     },
                     prop:{ required:true }
                    },
                    menuDBName.wdt
                    ]
                }
                ]
            }
            ],
        _cull:['inputDBName', 'menuDBName']
        };
    };
    fieldsetDBName.prototype = w$defineProto(fieldsetDBName,
    {
        disable: {value: function()
        {
            this.inputDBName.$().val();
            this.el.disabled = true;
            return this;
        }},
        
        init: {value: function()
        {
            this.inputDBName.$().val();
            this.menuDBName.button.$().dropdown();
            this.el.disabled = false;
            return this;
        }}
    });
        
    //////////////// Widget: fieldsetChooseDB //////////////////
    function fieldsetChooseDB() {}
    fieldsetChooseDB.wdt = function (ctx)
    {
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
        checkSaveDBLocation.prototype = w$defineProto(checkSaveDBLocation, {});
        
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
                    this.fieldsetChooseDB.inputPath.el.value = path;
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
                },
                checkSaveDBLocation.wdt
                ]
            }
            ],
        _cull:['inputDBPath', 'btnChooseDB', 'checkSaveDBLocation']
        };
    };
    fieldsetChooseDB.prototype = w$defineProto(fieldsetChooseDB,
    {
        init: {value: function()
        {
            if (localStorage.dbDontSaveLocation) {
                this.checkSaveDBLocation.el.checked = false;
                this.inputDBPath.el.value = null;
            }
            else {
                this.checkSaveDBLocation.el.checked = true;
                this.inputDBPath.el.value = localStorage['db.path'];
            }
            this.el.disabled = false;
        }}
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
        _cull:['inputKeyPath', 'btnChooseKey', 'checkInternalKey']
        };
    };
    fieldsetChooseKey.prototype = w$defineProto(fieldsetChooseKey,
    {
        onDBChosen: {value: function(dbPath)
        {
            var keyPath = dbPath ? DB_FS.findCryptInfoFile2(dbPath) : undefined;

            if (keyPath) {
                this.disable();
            }
            else
            {
                this.enable();
                this.checkInternalKey.checked = true;
                this.onCheck();
            }
        }},
        
        init: {value: function()
        {
            this.onDBChosen();
            return this;
        }},
        
        enable: {value: function()
        {
            this.el.disabled = false;
            return this;
        }},
        
        disable: {value: function()
        {
            this.inputKeyPath.$().val();
            this.el.disabled = true;
            return this;
        }},
        
        onCheck: {value: function()
        {
            this.inputKeyPath.value = null;
            this.inputKeyPath.disabled = true;
            this.btnChooseKey.disabled = true;
            //this.el.disabled = false;
        }},

        onUncheck: {value: function()
        {
            this.inputKeyPath.value = null;
            this.inputKeyPath.disabled = false;
            this.btnChooseKey.disabled = false;
            //this.el.disabled = false;            
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
        ref:'fieldsetChooseKeyFolder', //ctx:{ w$:{ fieldsetChooseKeyFolder:'w$el' } },
        addClass:'control-group',
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
        _cull:['inputKeyFolder','btnChooseKeyFolder','btnChooseKeyFolder','checkInternalKey']
        // _iface:{ ctx:{ inputKeyFolder:'inputKeyFolder',
                 // btnChooseKeyFolder:'btnChooseKeyFolder',
                 // checkInternalKey:'checkInternalKey'
                 // } }
        };
    };
    fieldsetChooseKeyFolder.prototype = w$defineProto(fieldsetChooseKeyFolder,
    {
        disable: {value: function(){return this;}},
        init: {value: function(){return this;}}
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
            loadDB2: ctx.loadDB2,
            createDB2: ctx.createDB2,
            mergeDB2: ctx.mergeDB2,
            mergeInDB2: ctx.mergeInDB2,
            mergeOutDB2: ctx.mergeOutDB2,
            updateDash: ctx.updateDash,
            callbackHandleError: ctx.callbackHandleError,
            destroyWalletForm: ctx.destroyWalletForm
        },
            children:[
            // {tag:'legend',
                // children:[
                // {tag:'strong',
                 // ref:'formWalletLegend',
                // }]
            // },
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