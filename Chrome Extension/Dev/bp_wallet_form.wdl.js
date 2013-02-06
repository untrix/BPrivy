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

    // TODO: This is better done via CSS
    function setValidity(w$ctrl, w$cg)
    {
        if ((!w$ctrl) || (!w$cg)) { return; }
        if (w$ctrl.el.validity.valid) {
            w$cg.removeClass('error');
        }
        else {
            w$cg.addClass('error');
        }
    }
    function checkValidity(w$ctrl, w$cg)
    {
        var valid = w$ctrl && w$ctrl.el.checkValidity();
        setValidity(w$ctrl, w$cg);
        return valid;
    }
    
    function chooseFolder(o)
    {
        if (!BP_PLUGIN.chooseFolder(o)) 
        {
            BP_ERROR.loginfo(o.err);
        }
        else {
            return o.path;
        }
    }
    
    function chooseWalletFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle = "Untrix Wallet: Select Wallet Folder";
        o.dbutton = "Select Wallet Folder";
        o.clrHist = true;

        return chooseFolder(o);
    }
    
    function chooseKeyFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle  = "Untrix Wallet: Select folder for storing Key File";
        o.dbutton = "Select Key File Folder";

        return chooseFolder(o);
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
        
        var spinner = new Spinner(opts).spin(el);
        //el.appendChild(spinner.el);
        return spinner;
    }
    /////////////////////// Stored DBNames /////////////////////////
    var SETTINGS = (function()
    {
        // The following is the structure of stored dbNames.
        // 1. A property in localStorage with key = dbNames. Its value is 
        // a JSON.stringify'd object whose keys are db names and values are the DB-Paths.
        // 2. Another propety in localStorage with key = dbKeys. Its value
        //    is a JSON.stringify'd object whose keys are db paths and values are
        //    the key-file paths (if the key-file was stored outside the DB).
        // 3. Another property in localStorage is called lastDBName that carries name of
        // the last loaded DB. This is the one to be loaded by default, the next time.

        var dbPaths, keyPaths;
        
        function construct(propPrefix)
        {
            var o = {},
                n = propPrefix.length;

            BP_COMMON.iterObj(localStorage, localStorage, function(key, value)
            {
                if (key.indexOf(propPrefix) === 0) {
                    o[key.slice(n)] = value;
                }
            });
            
            return o;
        }
        
        function eraseProps(propPrefix)
        {
            BP_COMMON.iterObj(localStorage, localStorage, function(key)
            {
                if (key.indexOf(propPrefix) === 0) {
                    delete localStorage[key];
                }
            });
        }
        
        function clearCache()
        {
            BP_COMMON.clear(dbPaths); dbPaths = null;
            BP_COMMON.clear(keyPaths); keyPaths = null;
        }
        
        function dontSaveLocation(val)
        {
            if (val === undefined) {
                // get
                return Boolean (localStorage.dontSaveDBLocation === 'true');
            }
            else {
                // set
                localStorage.dontSaveDBLocation = (val ? 'true' : 'false');
            }
        }

        var mod = {
            getDBPaths : function ()
            {
                if (!dbPaths) { dbPaths = construct('db.path.'); }
                return dbPaths;
            },
            hasDBPaths : function ()
            {
                return Boolean( Object.keys(mod.getDBPaths()).length > 0);
            },
            getDBPath : function (dbName)
            {
                return mod.getDBPaths()[dbName];
            },
            getKeyPaths : function ()
            {
                if (!keyPaths) { keyPaths = construct('db.key.'); }
                return keyPaths;
            },
            getKeyPath : function (dbPath)
            {
                return mod.getKeyPaths()[dbPath];
            },
            getDefaultDBName : function ()
            {
                return localStorage['db.name_default'];
            },
            getDefaultDBPath : function ()
            {
                return localStorage['db.path.' + mod.getDefaultDBName()];
            },
            setPaths : function (dbName, dbPath, keyPath)
            {
                if (dontSaveLocation() || (!dbPath)) { return; }
                
                if (!dbName) { dbName = BP_DBFS.cullDBName(dbPath);}

                localStorage['db.path.' + dbName] = dbPath;
                mod.getDBPaths()[dbName] = dbPath;
                
                if (keyPath) { 
                    localStorage['db.key.' + dbPath] = keyPath;
                    mod.getKeyPaths()[dbPath] = keyPath; 
                }
            },
            setDB :  function (dbName, dbPath, keyPath)
            {
                if (dontSaveLocation() || (!dbPath)) { return; }

                if (!dbName) { dbName = BP_DBFS.cullDBName(dbPath);}
                mod.setPaths(dbName, dbPath, keyPath);
                localStorage['db.name_default'] = dbName;
            },
            clear : function ()
            {
                clearCache();
                eraseProps('db.');
            },
            dontSaveLocation : dontSaveLocation
        };
        
        return Object.freeze(mod);
    }());


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
        }},
        checkValidity: {value: function(w$ctrl)
        {
            // Assumes that this element is surrounding w$ctrl and has class 'control-group'
            return checkValidity(w$ctrl, this);
        }}
    });
    
    //////////////// Widget: checkSaveDBLocation //////////////////
    function checkDontSaveLocation() {}
    checkDontSaveLocation.wdt = function(ctx)
    {
        return {
        tag:'form', addClass:'pull-left',
            children:[
            {tag:'label', _text:'  Remember Wallet Locations',
             css:{ 'text-align':'left' },
                children:[
                {tag:'input', attr:{ type:'radio', tabindex:-1, name:'dontSaveLocation' },
                 prop:{ checked:Boolean(!SETTINGS.dontSaveLocation()) },
                 save:['walletForm'],
                 on:{'change': function(e) {
                        SETTINGS.dontSaveLocation(!this.el.checked);
                        if (!this.el.checked) {
                            SETTINGS.clear();
                            this.walletForm.clearDBPaths(); 
                        }
                      }}
                },
                ]
            },
            {tag:'label', _text:'  Forget Wallet Locations',
             css:{ 'text-align':'left' },
                children:[
                {tag:'input', attr:{ type:'radio', tabindex:-1, name:'dontSaveLocation' },
                 prop:{ checked:Boolean(SETTINGS.dontSaveLocation()) },
                 save:['walletForm'],
                 on:{'change': function(e) {
                        SETTINGS.dontSaveLocation(this.el.checked);
                        if (this.el.checked) {
                            SETTINGS.clear();
                            this.walletForm.clearDBPaths(); 
                        }
                      }}
                },
                ]
            }
            ]
            
            // {tag:'label', css:{display:'block'},
            // attr:{ title:'If checked, saved wallet locations will be forgotten, otherwise '+
            // 'all opened/created wallet locations will be remembered. For privacy and security, '+
            // 'select this option if this is not your computer.'
            // },
                // children:[
                // {tag:'input', addClass:'pull-left',
                 // attr:{ type:'radio', name:'dontSaveLocation', tabindex:-1 },
                 // prop:{ checked:(SETTINGS.dontSaveLocation()) },
                 // ref:'checkDontSaveLocation',
                 // save:['walletForm'],
                 // on:{'change': function(e) {
                        // SETTINGS.dontSaveLocation(this.el.checked);
                        // if (this.el.checked) {
                            // SETTINGS.clear();
                            // this.walletForm.clearDBPaths(); 
                        // }
                      // }}
                // },
                // {tag:'span', text:"  Forget Wallet Locations", addClass:'pull-left' }
                // ]
            // },
            // {tag:'label', css:{display:'block'},
             // attr:{ title:'If checked, saved wallet locations will be remembered in the future.'
             // },
                // children:[
                // {tag:'input', addClass:'pull-left',
                 // attr:{ type:'radio', name:'dontSaveLocation', tabindex:-1 }
                // },
                // {tag:'span', text:"  Remember Wallet Locations", addClass:'pull-left'}
                // ]
            // }
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
        tag:'li', 
        cons:itemDBName,
        save:['fieldsetDBName'],
            children:[
            {tag:'a', attr:{href:'#'}, text:db_name,
             iface:{ 'dbName':db_name },
             on:{ 'click': function(e)
                    {
                        if (this.fieldsetDBName) {
                            this.fieldsetDBName.inputDBName.el.value = this.dbName;
                        }
                        CS_PLAT.customEvent(this.el, 'dbNameChosen', {dbName:this.dbName});
                    }}
            }
            ]
        };
    };
    itemDBName.prototype = w$defineProto(itemDBName, {});

    //////////////// Widget: menuDBSelect //////////////////
    function menuDBSelect() {}
    menuDBSelect.wdt = function(ctx)
    {
        var menuID, nIt;
            
        if (ctx.mode === 'create') { return w$undefined; }
        
        // return undefined if there are no options to select.
        if (!SETTINGS.hasDBPaths()) {return w$undefined; }        
        
        menuID = 'dbNameMenu' + g_counter++;
        nIt = new BP_COMMON.ArrayIterator(Object.keys(SETTINGS.getDBPaths()));
        
        return {
        tag:'div', ref:'menuDBSelect', cons:menuDBSelect, addClass:'dropdown',
        css:{display:'inline-block'},
            children:[
            {tag:'button', text:'Select ', attr:{type:'button'}, 
             addClass:'dropdown-toggle btn', ref:'button',
                children:[{tag:'span', addClass:'caret'}]
            },
            {tag:'ul', attr:{role:'menu', id:menuID}, addClass:'dropdown-menu',
             ref:'menuItems',
             iterate:{ it:nIt, wdi:itemDBName.wdi }
            }
            ],
        save:['fieldsetDBName'],
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
                     prop:{ required: true },
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
        val: {value: function(){ return this.inputDBName.el.value; }},
        
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
            save:['fieldsetChooseDB', 'dialog']
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
                    CS_PLAT.customEvent(this.fieldsetChooseDB.inputDBPath.el, 'dbChosen', 
                        {dbPath:path});
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
                     save:['fieldsetChooseDB'],
                     on:{'change':function(e)
                         {
                            if (this.fieldsetChooseDB.checkValidity(this)) {
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
            var path = SETTINGS.getDBPath(dbName);

            if (path) {
                this.inputDBPath.el.value = path;
                CS_PLAT.customEvent(this.inputDBPath.el, 'dbChosen', {dbPath:path});
            }
            this.enable();
        }}        
    }, formFieldProto);


    //////////////// Widget: fieldsetChooseKey //////////////////
    function fieldsetChooseKey() {}
    fieldsetChooseKey.wdt = function (ctx)
    {
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
            on:{ 'click':btnChooseKey.prototype.onClick },
            save:['fieldsetChooseKey']
            };
        };
        btnChooseKey.prototype = w$defineProto(btnChooseKey,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFile(o);
                    
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
        save:['walletForm'],
        _cull:['inputKeyPath', 'btnChooseKey', 'checkExistingKey', 'controlsKey'],
        _final:{ exec:function() { this.disable(); } },
            children:[
            {html:'<label class="control-label">Key File</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend', ref:'controlsKey',
                    children:[
                    btnChooseKey.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Key File Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     ref:'inputKeyPath',
                     save:['fieldsetChooseKey'],
                     on:{ 'change': function(e) {
                         if (this.fieldsetChooseKey.checkValidity(this)) {
                            CS_PLAT.customEvent(this.el, 'keyPathChosen', {keyPath:this.el.value});
                         } } 
                        }
                    }
                    ]
                },
                checkExistingKey.wdt
                ]
            }
            ]
        };
    };
    fieldsetChooseKey.prototype = w$defineProto(fieldsetChooseKey,
    {
        val: {value: function(){ return this.inputKeyPath.el.value; }},
        
        onDBChosen: {value: function(dbPath)
        {
            var keyPath;
            
            if (this.walletForm.mode === 'create') {
                //this.enable();
                //this.onUncheck();
                this.disable();
                return this;
            }
            
            keyPath = dbPath ? DB_FS.findCryptInfoFile2(dbPath) : undefined;

            if (keyPath) {
                this.inputKeyPath.el.value = null;
                this.disable();
                CS_PLAT.customEvent(this.inputKeyPath.el, 'keyPathChosen', {keyPath:keyPath});
            }
            else
            {
                this.enable();
                keyPath = SETTINGS.getKeyPath(dbPath);
                if (keyPath) {
                    this.inputKeyPath.el.value = keyPath;
                    CS_PLAT.customEvent(this.inputKeyPath.el, 'keyPathChosen', {keyPath:keyPath});
                }
                else {
                    this.btnChooseKey.el.focus();
                }
            }
            
            return this;
        }},
        
        onUncheck: {value: function()
        {
            this.inputKeyPath.el.value = null;
            this.inputKeyPath.el.disabled = true;
            this.btnChooseKey.el.disabled = true;
            this.checkExistingKey.el.disabled = false;
            this.controlsKey.hide();
        }},

        onCheck: {value: function()
        {
            this.inputKeyPath.el.value = null;
            this.inputKeyPath.el.disabled = false;
            this.btnChooseKey.el.disabled = false;
            this.checkExistingKey.el.disabled = false;
            this.controlsKey.show();
        }}
    }, formFieldProto);


    //////////////// Widget: fieldsetChooseKeyFolder //////////////////
    function fieldsetChooseKeyFolder() {}
    fieldsetChooseKeyFolder.wdt = function (ctx)
    {
        //////////////// Widget: checkExistingKey //////////////////
        function checkExistingKey() {}
        checkExistingKey.wdt = function(ctx)
        {
            if (ctx.mode !== 'create') { return w$undefined; }

            return {
            tag:'label',
            attr:{ 'title':'Check this if you want to use the same master-password across wallets' },
            addClass:'checkbox',
            _text:'Use an existing key',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false }, // default value
                 ref:'checkExistingKey',
                 save:['fieldsetChooseKeyFolder'],
                 
                 on:{'change': function(e)
                     {if (this.el.checked) {
                         //this.fieldsetChooseKey.onCheck();
                      } else {
                         //this.fieldsetChooseKey.onUncheck();
                      }
                     }
                 }
                }
                ]
            };
        };
        checkExistingKey.prototype = w$defineProto(checkExistingKey, {});

        //////////////// Widget: checkInternalKey //////////////////
        function checkInternalKey() {}
        checkInternalKey.wdt = function(ctx)
        {
            return {
            tag:'label',
            attr:{ title:'Uncheck to create a new key or to use an existing one ' +
                         '(required if you want a single master-password for multiple wallets). '+
                         'It is also recommended if you are saving your wallet in a cloud-drive.' },
             addClass:'checkbox',
             _text:'I do not want to use a key (not recommended for cloud-drives)',
                children:[
                {tag:'input',
                 attr:{ type:'checkbox' },
                 prop:{ checked:false },
                 ref:'checkInternalKey',
                 save:['fieldsetChooseKeyFolder'],
                 on:{ 'change':function(e)
                     {if (this.el.checked) {
                         this.fieldsetChooseKeyFolder.onCheck();
                      } else {
                         this.fieldsetChooseKeyFolder.onUncheck();
                      }
                     }}
                }
                ]
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
            on:{ 'click':btnChooseKeyFolder.prototype.onClick },
            save:['fieldsetChooseKeyFolder']
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
                    this.fieldsetChooseKeyFolder.inputKeyFolder.el.value = path;
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
        save:['walletForm'],
            children:[
            {html:'<label class="control-label">New Key Location</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                checkInternalKey.wdt,
                {tag:'div', addClass:'input-prepend', ref:'controlsKeyFolder',
                    children:[
                    btnChooseKeyFolder.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Key Folder Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     ref:'inputKeyFolder',
                     save:['fieldsetChooseKeyFolder'],
                     on:{ 'change': function(e) 
                          {
                              if (this.fieldsetChooseKeyFolder.checkValidity(this)) {
                                CS_PLAT.customEvent(this.el, 'keyFolderChosen',
                                                    {keyFolder:this.el.value});
                              }
                          }}
                    },
                    ]
                }
                ]
            }
            ],
        _cull:['inputKeyFolder','btnChooseKeyFolder','checkInternalKey', 'controlsKeyFolder'],
        _final:{ exec:function() { this.disable(); } }
        };
    };
    fieldsetChooseKeyFolder.prototype = w$defineProto(fieldsetChooseKeyFolder,
    {
        val: {value: function(){ return this.inputKeyFolder.el.value; }},
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
                this.controlsKeyFolder.hide();
                CS_PLAT.customEvent(this.inputKeyFolder.el, 'keyFolderChosen', 
                    {keyFolder:null});
            }
        }},

        onUncheck: {value: function()
        {
            if (!this.el.disabled) {
                this.inputKeyFolder.el.value = null;
                this.inputKeyFolder.el.disabled = false;
                this.btnChooseKeyFolder.el.disabled = false;
                this.controlsKeyFolder.show();
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
            prop:{ required:true },
            ref:'inputPassword',
            on:{ 'change':inputPassword.prototype.onChange},
            save:['walletForm', 'fieldsetPassword']
            };
        };
        inputPassword.prototype = w$defineProto(inputPassword,
        {
            onChange: {value: function(e)
             {
                 if (!this.fieldsetPassword.checkValidity(this)) { return; }

                 if (bPass2) {
                     if (this.el.value !== this.walletForm.fieldsetPassword.inputPassword.el.value) {
                         this.el.setCustomValidity('Passwords do not match');
                     }
                     else {
                         CS_PLAT.customEvent(this.el, 'passwordChosen');
                     }
                 }
                 else if (this.walletForm.mode !== 'create') {
                     CS_PLAT.customEvent(this.el, 'passwordChosen');
                 }
             }}
        });

        return {
        tag:'fieldset', cons: fieldsetPassword,
        ref: (bPass2 ? 'fieldsetPassword2' : 'fieldsetPassword'),
        iface:{ bPass2: bPass2 },
        prop:{ disabled:true },
        addClass:'control-group',
        save:['walletForm'],
            children:[
            {tag:'label', addClass:'control-label',
             text:bPass2?'Re-Enter Master Password':'Master Password'
            },
            {tag:'div', addClass:'controls',
                children:[inputPassword.wdt]
            }
            ],
        _cull:['inputPassword'],
        _final:{ exec:function() { if (bPass2) { this.disable(); }
                                   else { this.enable(); }
                 } 
               }
        };
    };
    fieldsetPassword.prototype = w$defineProto(fieldsetPassword,
    {
        val: {value: function(){ return this.inputPassword.el.value; }},
        onKeyPathChosen: {value: function(e)
        {
        	var o, dbPath;
            if (!this.bPass2) 
            {
            	dbPath = this.walletForm.fieldsetChooseDB.val();
            	o = {};
            	if (!BP_PLUGIN.dupeCryptCtx(e.detail.keyPath, dbPath, o)) {
            		BP_ERROR.alert(o.err);
            	}
            	else if (!o.dbPath) {
            		this.enable(); this.inputPassword.el.focus();
            	}
            	else {
            		// CryptContext is loaded, therefore do not
            		// query for password. But we need a dummy
            		// password to satisfy constraint validation
            		this.el.value = "abcABC123#*!";
            		CS_PLAT.customEvent(this.el, 'passwordChosen');
            	}
           	}
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
        save:['dialog', 'modalBody'],
        iface:{
            mode: ctx.mode,
            loadDB2: ctx.loadDB2,
            createDB2: ctx.createDB2,
            mergeDB2: ctx.mergeDB2,
            mergeInDB2: ctx.mergeInDB2,
            mergeOutDB2: ctx.mergeOutDB2,
            updateDash: ctx.updateDash,
            callbackHandleError: ctx.callbackHandleError,
            getDBPath: ctx.getDBPath
        },
        on:{ 'dbNameChosen':WalletFormWdl.prototype.onDBNameChosen,
             'dbChosen':WalletFormWdl.prototype.onDBChosen,
             'keyPathChosen':WalletFormWdl.prototype.onKeyPathChosen,
             'keyFolderChosen':WalletFormWdl.prototype.onKeyFolderChosen,
             'passwordChosen':WalletFormWdl.prototype.onPasswordChosen
        },
            children:[
            fieldsetDBName.wdt,
            fieldsetChooseDB.wdt,
            fieldsetChooseKey.wdt,
            fieldsetChooseKeyFolder.wdt,
            fieldsetPassword.wdt,
            fieldsetPassword2_wdt
            ],
        _cull:['fieldsetDBName',
               'fieldsetChooseDB',
               'fieldsetChooseKey',
               'fieldsetChooseKeyFolder',
               'fieldsetPassword',
               'fieldsetPassword2']
        };
    };
    WalletFormWdl.prototype = w$defineProto(WalletFormWdl,
    {
        setValiditys: {value: function()
        {
            if (this.fieldsetDBName) { 
                setValidity(this.fieldsetDBName.inputDBName, this.fieldsetDBName);
            }
            setValidity(this.fieldsetChooseDB.inputDBPath, this.fieldsetChooseDB);
            setValidity(this.fieldsetChooseKey.inputKeyPath, this.fieldsetChooseKey);
            setValidity(this.fieldsetChooseKeyFolder.inputKeyFolder, this.fieldsetChooseKeyFolder);
            setValidity(this.fieldsetPassword.inputPassword, this.fieldsetPassword);
            setValidity(this.fieldsetPassword2.inputPassword, this.fieldsetPassword2);            
        }},
        clearDBPaths: {value: function()
        {
            if (this.fieldsetChooseDB && this.fieldsetChooseDB.menuDBSelect) {
                this.fieldsetChooseDB.menuDBSelect.destroy();
            }
        }},
        onDBNameChosen: {value: function(e)
        {
            this.fieldsetChooseDB.onDBNameChosen(e.detail.dbName);
        }},
        onDBChosen: {value: function(e)
        {
            this.fieldsetChooseKey.onDBChosen(e.detail.dbPath);
            this.fieldsetChooseKeyFolder.onDBChosen();           
        }},
        onKeyPathChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyPathChosen(e);
            e.preventDefault();
            e.stopPropagation();
        }},
        onKeyFolderChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyFolderChosen(e);
            this.fieldsetPassword2.onKeyFolderChosen(e);
            e.preventDefault();
            e.stopPropagation();
        }},
        onPasswordChosen: {value: function(e)
        {
            this.onSubmit();
        }},
        onSubmit: {value: function()
        {
            if (!this.el.checkValidity()) {
                this.setValiditys();
                BP_ERROR.alert('There were some errors');
                return;
            }
            
            this.setValiditys();
            var self = this,
                spinner = newSpinner(self.modalBody.el);

            if (self.mode === 'open') {
                self.loadDB2(self.fieldsetChooseDB.val(),
                        self.fieldsetChooseKey.val(),
                        self.fieldsetPassword.val(), function (resp)
                {
                    spinner.stop();
                    if (resp.result === true) {
                        SETTINGS.setDB(null,
                                            resp.dbPath,
                                            self.fieldsetChooseKey.val());
                        self.updateDash(resp);
                        BP_ERROR.success('Opened password wallet at ' + resp.dbPath);
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (self.mode === 'create')
            {
                self.createDB2(self.fieldsetDBName.val(),
                               self.fieldsetChooseDB.val(),
                               self.fieldsetChooseKeyFolder.val(),
                               self.fieldsetPassword.val(), function (resp)
                {
                    spinner.stop();
                    if (resp.result === true) {
                        SETTINGS.setDB(self.fieldsetDBName.val(),
                                            resp.dbPath, 
                                            self.fieldsetChooseKey.val());
                        self.updateDash(resp);
                        BP_ERROR.success('Password store created at ' + resp.dbPath);
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (this.getDBPath() === self.fieldsetChooseDB.val()) {
                spinner.stop();
                BP_ERROR.warn('The chosen wallet is already open! Please choose another wallet.');
            }
            else if (self.mode === 'merge')
            {
                self.mergeDB2(self.fieldsetChooseDB.val(),
                        self.fieldsetChooseKey.val(),
                        self.fieldsetPassword.val(), function (resp)
                {
                    spinner.stop();
                    if (resp.result === true) {
                        SETTINGS.setPaths(null, 
                                               self.fieldsetChooseDB.val(),
                                               self.fieldsetChooseKey.val());
                        self.updateDash(resp);
                        BP_ERROR.success('Merged with password wallet at ' + self.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (self.mode === 'mergeIn')
            {
                self.mergeInDB2(self.fieldsetChooseDB.val(),
                        self.fieldsetChooseKey.val(),
                        self.fieldsetPassword.val(), function (resp)
                {
                    spinner.stop();
                    if (resp.result === true) {
                        SETTINGS.setPaths(null,
                                               self.fieldsetChooseDB.val(),
                                               self.fieldsetChooseKey.val());
                        self.updateDash(resp);
                        BP_ERROR.success('Merged In password wallet at ' + self.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
            else if (self.mode === 'mergeOut')
            {
                self.mergeOutDB2(self.fieldsetChooseDB.val(),
                        self.fieldsetChooseKey.val(),
                        self.fieldsetPassword.val(), function (resp)
                {
                    spinner.stop();
                    if (resp.result === true) {
                        SETTINGS.setPaths(null,
                                          self.fieldsetChooseDB.val(),
                                          self.fieldsetChooseKey.val());
                        //self.updateDash(resp);
                        BP_ERROR.success('Merged out to password wallet at ' + 
                                         self.fieldsetChooseDB.val());
                        modalDialog.destroy();
                    }
                    else {
                        self.callbackHandleError(resp);
                    }
                });
            }
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
        on:{ 'dbChosen':modalDialog.prototype.onDBChosen,
             'dbNameChosen':modalDialog.prototype.onDBNameChosen },
        _final:{ appendTo:ctx.appendTo, show:false },
        _cull:['walletForm', 'modalHeader', 'headerDBName'],
            children:[
            {tag:'div', addClass:'modal-header',
                children:[
                {tag:'button', addClass:'close',
                 text:'x',
                 save:['dialog'],
                 on:{ 'click': function(e){modalDialog.destroy();} }
                },
                { tag:'h4', ref:'modalHeader' },
                { tag:'h3', ref:'headerDBName', css:{ 'text-align':'center' } }
                ]
            },
            {tag:'div', addClass:'modal-body', ref:'modalBody',
                children:[WalletFormWdl.wdt]
            },
            {tag:'div', addClass:'modal-footer',
                children:[
                checkDontSaveLocation.wdt,
                {tag:'button', 
                addClass:'btn', 
                attr:{'data-dismiss':'modal', tabindex:-1},
                text:'Cancel',
                on:{ 'click': function(e){modalDialog.destroy();}}
                },
                {tag:'button', addClass:'btn btn-primary', text:'Submit',
                 attr:{ 'type':'button'},
                 save:['walletForm'],
                 on:{ 'click': function(e) {
                     this.walletForm.onSubmit(e);
                 } 
                 }
                }
                ]
            }
            ]
        };
    };
    modalDialog.prototype = w$defineProto(modalDialog,
    {
        onInsert: {value: function()
        {
            this.$().modal({show:false});
            this.$().on('shown', modalDialog.onShown);  // must use JQuery for Bootstrap events.
            this.$().on('hidden', modalDialog.onHidden);// must use JQuery fro Bootstrap events.
            
            switch (this.mode)
            {
                case 'merge':
                    this.modalHeader.$().text('Sync/Merge Wallet: ');
                    break;
                case 'mergeIn':
                    this.modalHeader.$().text('Import Wallet:');
                    break;
                case 'mergeOut':
                    this.modalHeader.$().text('Export to Wallet:');
                    break;
                case 'create':
                    this.modalHeader.$().text('Create Wallet:');
                    break;
                case 'open':
                default:
                    this.modalHeader.$().text('Open Wallet:');
            }
            
            return this;
        }},
        
        showModal: {value: function()
        {
            this.$().modal('show');
            return this;
        }},
        
        hideModal: {value: function()
        {
            this.walletForm.el.reset();
            this.$().modal('hide');
            return this;
        }},
        
        onDBChosen: {value: function(e)
        {
            this.headerDBName.$().text(BP_DBFS.cullDBName(e.detail.dbPath));
            e.preventDefault();
            e.stopPropagation();
        }},

        onDBNameChosen: {value: function(e)
        {
            this.headerDBName.$().text(e.detail.dbName);
            e.preventDefault();
            e.stopPropagation();            
        }}
    });
    modalDialog.onShown = function(e)
    {
        var dbPath,
            dialog = g_dialog; //BP_W$.w$get('#modalDialog');
        if (!dialog) { return; }
        
        switch (dialog.mode)
        {
            case 'create':
                dialog.walletForm.fieldsetDBName.focus();
                break;
            case 'merge':
            case 'mergeIn':
            case 'mergeOut':
                if (SETTINGS.getDefaultDBPath() && 
                        (dialog.walletForm.getDBPath() !== SETTINGS.getDefaultDBPath())) {
                    dialog.walletForm.fieldsetChooseDB.onDBNameChosen(SETTINGS.getDefaultDBName());
                }
                else {
                    dialog.walletForm.fieldsetChooseDB.focus();
                }
                break;
            case 'open':
            default:
                if (SETTINGS.getDefaultDBName()) {
                    dialog.walletForm.fieldsetChooseDB.onDBNameChosen(SETTINGS.getDefaultDBName());
                }
                else {
                    dialog.walletForm.fieldsetChooseDB.focus();
                }
        }
        
        $('#modalDialog *').tooltip(); // used to leak DOM nodes in version 2.0.4.
    };
    modalDialog.onHidden = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog');
        if (!dialog) { return; }
        dialog.destroy();
    };    
    modalDialog.create = function(ops)
    {
        var ctx, dialog, temp;

        if (g_dialog) {
            g_dialog.hide().destroy();
            g_dialog = null;
        }

        // Create the Widget.
        ctx = {};
        BP_COMMON.copy2(ops, ctx);
        ctx.appendTo = 'body';

        dialog = BP_W$.w$exec(modalDialog.wdt, ctx);
        
        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC
        
        g_dialog = dialog;
        
        if (dialog)
        {
            g_dialog.onInsert().showModal();
        }
        
        return g_dialog;
    };
    modalDialog.destroy = function()
    {
        var w$dialog;
        if (g_dialog) {
            w$dialog = g_dialog;
        }
        else {
            w$dialog = BP_W$.w$get('#modalDialog');
        }

        if (w$dialog) {
            w$dialog.hideModal();
        }
        
        g_dialog = null;
    };

    BP_ERROR.loginfo("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: modalDialog.create
    });
}