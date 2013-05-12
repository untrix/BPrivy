/**
 * @author Sumeet S Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */

/*global BP_PLUGIN */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin WALLET_FORM
 */
function BP_GET_WALLET_FORM(g)
{
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document,
        g_win = g.g_win;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m),
        addEventListeners = IMPORT(m.addEventListeners),
        addEventListener = IMPORT(m.addEventListener),
        customEvent = IMPORT(m.customEvent);
    /** @import-module-begin CSPlatform */
        m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT);
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
    var g_counter = 1,
        g_text =
	    {
	    	keyOptionsHelpText: 'For more security: Do not store the Master Key file on the same device as the Keyring. A thief will need three things to steal your data: 1) Keyring, 2) Master Key and 3) Master Password. '+
	    	'Therefore, store the Keyring and Master Key in separate locations. The Master Key could be stored on a memory-stick and carried with you always.'
	    };
    /** @globals-end **/

    // TODO: This is better done via CSS
    // function setValidity(w$ctrl, w$cg)
    // {
        // if ((!w$ctrl) || (!w$cg)) { return; }
        // if (w$ctrl.el.validity.valid) {
            // w$cg.removeClass('error');
        // }
        // else {
            // w$cg.addClass('error');
        // }
    // }
    // function checkValidity(w$ctrl, w$cg)
    // {
        // var valid = w$ctrl && w$ctrl.el.checkValidity();
        // setValidity(w$ctrl, w$cg);
        // return valid;
    // }

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
        o.dtitle = "K3YRING: Select Keyring Folder";
        o.dbutton = "Select Keyring Folder";
        o.clrHist = true;

        return chooseFolder(o);
    }

    function chooseKeyFolder(o)
    {
        BP_COMMON.clear(o);
        o.dtitle  = "K3YRING: Select folder for storing Master Key File";
        o.dbutton = "Select Master Key File Folder";

        return chooseFolder(o);
    }

    function chooseKeyFile(o)
    {
        BP_COMMON.clear(o);
        o.filter = ['Master Key File', '*' + DB_FS.ext_Key];
        o.dtitle = "K3YRING: Select Master Key File";
        o.dbutton = "Select";
        o.clrHist = true;

        if (!BP_PLUGIN.chooseFile(o)) {
        	o.err && BP_ERROR.loginfo(o.err);
        }
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

        var spinner = new g_win.Spinner(opts).spin(el);
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
            // NOTE: getDBPaths has been copied to bp_settings as well.
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
                if (!keyPaths) { keyPaths = construct('db.masterkey.'); }
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
                    localStorage['db.masterkey.' + dbPath] = keyPath;
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
    var fieldsetProto = Object.create(WidgetElement.prototype,
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
        // ,checkValidity: {value: function(w$ctrl)
        // {
            // // Assumes that this element is surrounding w$ctrl and has class 'control-group'
            // return checkValidity(w$ctrl, this);
        // }}
    });
    var fieldProto = Object.create(fieldsetProto,
    {
    	disable: {value: function()
    	{
    		this.el.value = null;
    		fieldsetProto.disable.apply(this);
    	}},
    	enable: {value: function()
    	{
    		this.el.value = null;
    		fieldsetProto.enable.apply(this);
    	}},
    	reset: {value: function()
    	{
    		this.el.value = null;
    	}},
    	val: {value: function()
    	{
    		return this.el.value;
    	}}
    });

    //////////////// Widget: checkSaveDBLocation //////////////////
    function checkDontSaveLocation() {}
    checkDontSaveLocation.wdt = function(ctx)
    {
        return {
        tag:'form', addClass:'pull-left',
            children:[
            {tag:'label', _text:'  Remember Keyring Locations',
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
                        customEvent(this.el, 'dbNameChosen', {dbName:this.dbName});
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
                     attr:{ type:'text', placeholder:"Enter Keyring Name", pattern:".{1,}",
                     title:"Please enter a name for the new Keyring that you would like to create. "+
                           "Example: <i>Work Keyring</i>"
                     },
                     prop:{ required: true },
                     on:{ 'change': function(e) {
                                    customEvent(this.el, 'dbNameChosen', {dbName:this.el.value});
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
    }, fieldsetProto);

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
            addClass:'btn btn-small btn-info',
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
                    customEvent(this.fieldsetChooseDB.inputDBPath.el, 'dbChosen',
                        {dbPath:path});
                }
            }}
        });

        return {
        tag:'fieldset',
        cons:fieldsetChooseDB,
        ref:'fieldsetChooseDB',
        addClass:'control-group',
        save:['walletForm'],
            children:[
            {html:'<label class="control-label">Keyring Location</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend',
                    children:[
                    menuDBSelect.wdt,
                    btnChooseDB.wdt,
                    {tag:'input',
                     ref:'inputDBPath',
                     attr:{ type:'text', placeholder:"Keyring Folder Location" },
                     prop:{ required:true },
                     addClass:"input-large",
                     save:['fieldsetChooseDB'],
                     on:{'change':function(e)
                         {
                            //if (this.fieldsetChooseDB.checkValidity(this)) {
                                customEvent(this.el, 'dbChosen', {dbPath:this.el.value});
                            //}
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
        	var path;
        	if (this.walletForm.mode !== 'create') {
	            path = SETTINGS.getDBPath(dbName);
	            if (path) {
	                this.inputDBPath.el.value = path;
	                customEvent(this.inputDBPath.el, 'dbChosen', {dbPath:path});
	            }
           	}

            this.enable();
        }}
    }, fieldsetProto);


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
            addClass:'btn btn-small btn-info',
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
                    customEvent(this.fieldsetChooseKey.inputKeyPath.el, 'keyPathChosen', {keyPath:path});
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
        _cull:['inputKeyPath', 'btnChooseKey'],
        _final:{ exec:function() { this.disable(); } },
            children:[
            {html:'<label class="control-label">Master Key File</label>'},
            {tag:'div', addClass:'controls form-inline',
                children:[
                {tag:'div', addClass:'input-prepend', ref:'controlsKey',
                    children:[
                    btnChooseKey.wdt,
                    {tag:'input',
                     attr:{ type:'text', placeholder:"Master Key File Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     ref:'inputKeyPath',
                     save:['fieldsetChooseKey'],
                     on:{ 'change': function(e) {
                         //if (this.fieldsetChooseKey.checkValidity(this)) {
                            customEvent(this.el, 'keyPathChosen', {keyPath:this.el.value});
                         //}
                         }
                        }
                    }
                    ]
                }
                ]
            }
            ]
        };
    };
    fieldsetChooseKey.prototype = w$defineProto(fieldsetChooseKey,
    {
        val: {value: function(){
        	return this.inputKeyPath.el.value;
        }},

        onDBChosen: {value: function(dbPath)
        {
            var keyPath;

            if (this.walletForm.mode === 'create') {
                this.disable();
                return this;
            }

            keyPath = dbPath ? DB_FS.findCryptInfoFile2(dbPath) : undefined;

            if (keyPath) {
                this.inputKeyPath.el.value = null;
                this.disable();
                customEvent(this.inputKeyPath.el, 'keyPathChosen', {keyPath:keyPath});
            }
            else
            {
                this.enable();
                keyPath = SETTINGS.getKeyPath(dbPath);
                if (keyPath) {
                    this.inputKeyPath.el.value = keyPath;
                    customEvent(this.inputKeyPath.el, 'keyPathChosen', {keyPath:keyPath});
                }
                else {
                	this.enable();
                	this.inputKeyPath.el.value = null;
                    this.btnChooseKey.el.focus();
                }
            }

            return this;
        }}
    }, fieldsetProto);


    //////////////// Widget: fieldsetKeyDirOrPath //////////////////
    function fieldsetKeyDirOrPath() {}
    fieldsetKeyDirOrPath.wdt = function (ctx)
    {
        //////////////// Widget: radioKeyOptions //////////////////
        function radioKeyOptions() {}
        radioKeyOptions.wdt = function(ctx)
        {
        	return {
        	tag:'fieldset',
        	ref:'radioKeyOptions',
        	cons:radioKeyOptions,
        	_cull:['optionNoKey', 'optionHaveKey', 'optionNewKey'],
        		children:[
	        	{tag:'label',
	        	_text:'  Do not use a Master Key (Least Secure Option)',
	        	 attr:{ title: 'Not recommended for cloud-drives - use one of the other options for cloud-drives. '+
	        	 			   'If you create multiple Keyrings with this option then you\'ll have to separately change '+
	        	 			   'the master-password for each. If you want the convenience of a single master-password '+
	        	 			   'for multiple Keyrings then use a Master Key (following options).' },
	             css:{ 'text-align':'left' },
	                children:[
	                {tag:'input',
	                 ref:'optionNoKey',
	                 save: ['radioKeyOptions'],
	                 attr:{ type:'radio', tabindex:-1, name:'keyOptions' },
	                 prop:{ checked:false },
	                 on:{'change': function(e) {
	                 		if (this.el.checked) { this.radioKeyOptions.onChoose('optionNoKey');}
	                    }}
	                },
	                ]
	            },
	            {tag:'label',
	             _text:'  I already have a Master Key',
	             attr:{ title:'Use an existing Master Key to encrypt/decrypt this Keyring. '+
	             			   g_text.keyOptionsHelpText},
	             css:{ 'text-align':'left' },
	                children:[
	                {tag:'input',
	                 ref:'optionHaveKey',
	                 save: ['radioKeyOptions'],
	                 attr:{ type:'radio', tabindex:-1, name:'keyOptions' },
	                 prop:{ checked:false },
	                 on:{'change': function(e) {
	                 		if (this.el.checked) { this.radioKeyOptions.onChoose('optionHaveKey');}
	                    }}
	                },
	                ]
	            },
	            {tag:'label',
	             _text:'  I do not have a Master Key - create one.',
	        	 attr:{ title: 'Create an encryption Key (Master Key) to encrypt this Keyring. This Master Key may also be used for Keyrings created later. ' +
	        	 			   'For more security advanced users may choose to create a new Master Key per Keyring, but while doing so be aware that a '+
	        	 			   'new Master Key file implies a separate master-password to remember (and to change periodically). If you have too many '+
	        	 			   'Master Key files, then keeping track of individual master-passwords can get difficult.'+
	        	 			   g_text.keyOptionsHelpText },
	             css:{ 'text-align':'left' },
	                children:[
	                {tag:'input',
	                 ref:'optionNewKey',
	                 save: ['radioKeyOptions'],
	                 attr:{ type:'radio', tabindex:-1, name:'keyOptions' },
	                 prop:{ checked:false },
	                 on:{'change': function(e) {
	                 		if (this.el.checked) { this.radioKeyOptions.onChoose('optionNewKey');}
	                    }}
	                },
	                ]
	            }
	            ]
        	};
        };
        w$defineProto(radioKeyOptions,
        {
        	onChoose: {value: function(option)
        	{
        		customEvent(this.el, 'keyOptionChosen', {option:option});
        	}},

        	reset: {value: function()
        	{
        		this.optionHaveKey.el.checked = true;
        		this.onChoose('optionHaveKey');
        	}},

        	val: {value: function()
        	{
        		if (this.optionNoKey.el.checked) {
        			return 'optionNoKey'; }
        		else if (this.optionHaveKey.el.checked) {
        			return 'optionHaveKey';
        		}
        		else if (this.optionNewKey.el.checked) {
        			return 'optionNewKey';
        		}
        	}}
        }, fieldsetProto);

        //////////////// Widget: btnChooseKeyFile //////////////////
        function btnChooseKeyFile() {}
        btnChooseKeyFile.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-info',
            text:'Browse',
            ref:'btnChooseKeyFile',
            on:{ 'click':btnChooseKeyFile.prototype.onClick },
            save:['controlsKeyFile']
            };
        };
        w$defineProto(btnChooseKeyFile,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFile(o);

                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path) {
                    this.controlsKeyFile.inputKeyFile.el.value = path;
                    customEvent(this.controlsKeyFile.inputKeyFile.el, 'keyPathChosen', {keyPath:path});
                }
            }}
        }, fieldsetProto);

        //////////////// Widget: btnChooseKeyFolder //////////////////
        function btnChooseKeyFolder() {}
        btnChooseKeyFolder.wdt = function (ctx)
        {
            return {
            tag:'button',
            attr:{ type:'button' },
            addClass:'btn btn-small btn-info',
            text:'Browse',
            ref:'btnChooseKeyFolder',
            on:{ 'click':btnChooseKeyFolder.prototype.onClick },
            save:['controlsKeyFolder','fieldsetKeyDirOrPath']
            };
        };
        w$defineProto(btnChooseKeyFolder,
        {
            onClick: {value: function(e)
            {
                var o = {},
                    path = chooseKeyFolder(o);

                if (o.err) { BP_ERROR.alert(o.err); }
                else if (path && this.fieldsetKeyDirOrPath.validateKeyFolder(path))
                {
                    this.controlsKeyFolder.inputKeyFolder.el.value = path;
                    customEvent(this.controlsKeyFolder.inputKeyFolder.el,
                        'keyFolderChosen', {keyFolder:path});
                }
            }}
        }, fieldsetProto);

        return {
        tag:'fieldset',
        cons:fieldsetKeyDirOrPath,
        ref:'fieldsetKeyDirOrPath',
        addClass:'control-group',
        prop:{ disabled:true },
        save:['walletForm'],
        on:{ 'keyOptionChosen':fieldsetKeyDirOrPath.prototype.onOptionChosen },
        _cull:['radioKeyOptions', 'controlsKeyFolder', 'controlsKeyFile'],
        _final:{ exec:function() { this.disable(); } },
            children:[
            {html:'<label class="control-label">Master Key</label>'},
            {tag:'div', addClass:'controls',
                children:[
                radioKeyOptions.wdt,
                {tag:'fieldset',
                 proto:fieldsetProto,
                 addClass:'input-prepend',
                 ref:'controlsKeyFolder',
                 iface:{
	         		 disable:function(){
	                 	this.inputKeyFolder.el.value = null;
	        			this.inputKeyFolder.el.disabled = true;
	        			this.btnChooseKeyFolder.disabled = true;
						this.hide();
	                 },
	         		 enable:function(){
	         		 	this.inputKeyFolder.el.value = null;
	        			this.inputKeyFolder.el.disabled = false;
	        			this.btnChooseKeyFolder.disabled = false;
	         		 	this.show();
	         		 },
	         		 val:function(){ return this.inputKeyFolder.el.value; }
                 },
                 _cull:['inputKeyFolder', 'btnChooseKeyFolder'],
                    children:[
                    btnChooseKeyFolder.wdt,
                    {tag:'input',
                     ref:'inputKeyFolder',
                     attr:{ type:'text', placeholder:"Master Key Folder Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     save:['fieldsetKeyDirOrPath'],
                     on:{ 'change': function(e)
                          {
                              if (this.fieldsetKeyDirOrPath.validateKeyFolder(this.el.value)) {
                                customEvent(this.el, 'keyFolderChosen',
                                                    {keyFolder:this.el.value});
                              }
                          }}
                    },
                    ]
                },
                {tag:'fieldset',
                 proto:fieldsetProto,
                 addClass:'input-prepend',
                 ref:'controlsKeyFile',
                 iface:{
	         		 disable:function(){
	                 	this.inputKeyFile.el.value = null;
	        			this.inputKeyFile.el.disabled = true;
	        			this.btnChooseKeyFile.disabled = true;
						this.hide();
	                 },
	         		 enable:function(){
	         		 	this.inputKeyFile.el.value = null;
	        			this.inputKeyFile.el.disabled = false;
	        			this.btnChooseKeyFile.disabled = false;
	         		 	this.show();
	         		 },
	         		 val:function(){ return this.inputKeyFile.el.value; }
                 },
                 _cull:['inputKeyFile', 'btnChooseKeyFile'],
                    children:[
                    btnChooseKeyFile.wdt,
                    {tag:'input',
                     ref:'inputKeyFile',
                     attr:{ type:'text', placeholder:"Master Key File Path" },
                     prop:{ required:true },
                     addClass:"input-xlarge",
                     save:['fieldsetKeyDirOrPath'],
                     on:{ 'change': function(e)
                          {
                              //if (this.fieldsetKeyDirOrPath.checkValidity(this)) {
                                customEvent(this.el, 'keyPathChosen',
                                                    {keyFile:this.el.value});
                              //}
                          }}
                    },
                    ]
                }
                ]
            }
            ]
        };
    };
    fieldsetKeyDirOrPath.prototype = w$defineProto(fieldsetKeyDirOrPath,
    {
    	validateKeyFolder: {value: function(path)
    	{
    		var fName = this.walletForm.fieldsetDBName.val() + DB_FS.ext_Key,
    			keyPath = path + DB_FS.getPathSep() + fName;
    		if (BP_PLUGIN.exists(keyPath, {})) {
    			this.controlsKeyFolder.inputKeyFolder.el.setCustomValidity('A Master Key file called ' + fName + ' already exists at this location');
    			this.controlsKeyFolder.inputKeyFolder.el.checkValidity();
    			BP_ERROR.warn('A Master Key file called ' + fName + ' already exists at this location. Choose a different folder or a different Keyring name.');
    			return false;
    		}
    		else {
    			this.controlsKeyFolder.inputKeyFolder.el.setCustomValidity('');
    			this.controlsKeyFolder.inputKeyFolder.el.checkValidity();
    			return true;
    		}
    	}},

        val: {value: function()
        {
        	return this.controlsKeyFolder.val() || this.controlsKeyFile.val();
        }},
        onDBChosen: {value: function()
        {
            if (this.walletForm.mode === 'create')
            {
                this.enable();
                this.radioKeyOptions.reset(); // Default
            }

            return this;
        }},

        onOptionChosen: {value: function(e)
        {
        	switch(e.detail.option)
        	{
        		case 'optionHaveKey':
        			this.controlsKeyFolder.disable();
        			this.controlsKeyFile.enable();
        			break;
        		case 'optionNewKey':
        			this.controlsKeyFolder.enable();
        			this.controlsKeyFile.disable();
        			break;
        		case 'optionNoKey':
        		default:
        			this.controlsKeyFolder.disable();
        			this.controlsKeyFile.disable();
        			customEvent(this.el, 'keyFolderChosen', {keyFolder:null});
        			break;
        	}
        }}
    }, fieldsetProto);

    //////////////// Widget: fieldsetPassword //////////////////
    function fieldsetPassword() {}
    fieldsetPassword.wdt = function(ctx)
    {
        var bPass2 = ctx.bPass2;

        function inputPassword() {}
        inputPassword.wdt = function(ctx)
        {
            return {
            tag:'input', cons: inputPassword,
            attr:{ type:'password', placeholder:"10 characters or more",
                   pattern:'.{10,}' },
            iface:{ 'bPass2':bPass2 },
            prop:{ required:true },
            ref:'inputPassword',
            on:{ 'change':inputPassword.prototype.onChange },
            save:['walletForm']
            };
        };
        w$defineProto(inputPassword,
        {
            onChange: {value: function()
             {
                 //if (!this.fieldsetPassword.checkValidity(this)) { return; }

                 if (this.bPass2) {
                     if (this.el.value !== this.walletForm.fieldsetPassword.inputPassword.el.value) {
                         this.el.setCustomValidity('Passwords do not match');
                     }
                     else {
                     	 this.el.setCustomValidity('');
                         customEvent(this.el, 'passwordChosen');
                     }
                 }
                 else {
	                 //if (this.walletForm.mode !== 'create') {
	                 if (this.walletForm.fieldsetPassword2.inputPassword.el.disabled) {
	                     customEvent(this.el, 'passwordChosen');
	                 }
	                 else if (this.el.value === this.walletForm.fieldsetPassword2.inputPassword.el.value) {
	                 	this.walletForm.fieldsetPassword2.inputPassword.el.setCustomValidity('');
	                 }
                 }
             }}
        }, fieldProto);

        return {
        tag:'fieldset',
        cons: fieldsetPassword,
        ref: (bPass2 ? 'fieldsetPassword2' : 'fieldsetPassword'),
        iface:{ bPass2: bPass2 },
        prop:{ disabled:true },
        addClass:'control-group',
        save:['walletForm'],
            children:[
            {tag:'label', addClass:'control-label',
             text:bPass2?'Re-Enter Master Password ':'Master Password ',
                children:[
                {tag:'i', addClass:'icon-question-sign', attr:{title:'10 or more characters required'}}
                ]
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
    w$defineProto(fieldsetPassword,
    {
        val: {value: function(){ return this.inputPassword.el.value; }},
        onKeyPathChosen: {value: function(e)
        {
        	var o, dbPath;
            if (!this.bPass2)
            {
            	dbPath = this.walletForm.fieldsetChooseDB.val();
            	o = {};
            	if (!BP_PLUGIN.cryptKeyLoaded(e.detail.keyPath, o)) {
            		BP_ERROR.alert(o.err);
            	}
            	else if (!o.cryptKeyPath) {
            		this.enable();
            		this.inputPassword.el.focus();
            	}
            	else {
            		// CryptContext is loaded, therefore do not
            		// ask for password.
            		this.disable();
            		customEvent(this.el, 'passwordChosen');
            	}
           	}
           	else {
           		this.inputPassword.reset();
           		this.disable();
           	}
        }},

        onKeyFolderChosen: {value: function(e)
        {
            this.enable();
            if (!this.bPass2) {
                this.inputPassword.el.focus();
            }
        }}
    }, fieldsetProto);

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
                 addClass:'btn btn-small btn-info', text:'Submit'
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
    fieldsetSubmit.prototype = w$defineProto(fieldsetSubmit, {}, fieldsetProto);

    //////////////// Widget: WalletFormWdl //////////////////
    function WalletFormWdl() {}
    WalletFormWdl.wdt = function (ctx)
    {
        return {
        tag:'form',
        cons: WalletFormWdl,
        ref:'walletForm',
        attr:{ id:'walletForm' },
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
             'submit': WalletFormWdl.prototype.onSubmit
        },
            children:[
            fieldsetDBName.wdt,
            fieldsetChooseDB.wdt,
            fieldsetChooseKey.wdt,
            fieldsetKeyDirOrPath.wdt,
            fieldsetPassword.wdt,
            fieldsetPassword2_wdt
            ],
        _cull:['fieldsetDBName',
               'fieldsetChooseDB',
               'fieldsetChooseKey',
               'fieldsetKeyDirOrPath',
               'fieldsetPassword',
               'fieldsetPassword2']
        };
    };
    WalletFormWdl.prototype = w$defineProto(WalletFormWdl,
    {
        // setValiditys: {value: function()
        // {
            // if (this.fieldsetDBName) {
                // setValidity(this.fieldsetDBName.inputDBName, this.fieldsetDBName);
            // }
            // setValidity(this.fieldsetChooseDB.inputDBPath, this.fieldsetChooseDB);
            // setValidity(this.fieldsetChooseKey.inputKeyPath, this.fieldsetChooseKey);
            // setValidity(this.fieldsetChooseKeyFolder.inputKeyFolder, this.fieldsetChooseKeyFolder);
            // setValidity(this.fieldsetPassword.inputPassword, this.fieldsetPassword);
            // setValidity(this.fieldsetPassword2.inputPassword, this.fieldsetPassword2);
        // }},
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
            this.fieldsetKeyDirOrPath.onDBChosen();
        }},
        onKeyPathChosen: {value: function(e)
        {
            this.fieldsetPassword.onKeyPathChosen(e);
            this.fieldsetPassword2.onKeyPathChosen(e);
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
        onSubmit: {value: function(e)
        {
        	e.preventDefault();

            if (!this.el.checkValidity()) {
            	//this.setValiditys();
                BP_ERROR.alert('Please fix the errors and retry');
                return;
            }

            //this.setValiditys();

            if ((!this.fieldsetPassword2.el.disabled) &&
            	(this.fieldsetPassword.inputPassword.el.value !==
            	 this.fieldsetPassword2.inputPassword.el.value)) {
            	 this.fieldsetPassword2.inputPassword.el.setCustomValidity('Passwords do not match');
            	return;
            }

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
                        BP_ERROR.success('Loaded Keyring at ' + resp.dbPath);
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
                               self.fieldsetKeyDirOrPath.val(),
                               self.fieldsetPassword.val(),
                               self.fieldsetKeyDirOrPath.radioKeyOptions.val(),
                               function (resp)
                {
                    var option, keyFolderOrPath, keyPath;
                    spinner.stop();

                    if (resp.result === true)
                    {
                    	option = self.fieldsetKeyDirOrPath.radioKeyOptions.val();
                    	keyFolderOrPath = self.fieldsetKeyDirOrPath.val();

						if (option === 'optionHaveKey') {
							keyPath = keyFolderOrPath;
						}
                    	else if (option === 'optionNewKey'){
                    		keyPath = DB_FS.makeCryptInfoPath(undefined, self.fieldsetDBName.val(), keyFolderOrPath);
                    	}

                        SETTINGS.setDB(self.fieldsetDBName.val(), resp.dbPath, keyPath);
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
                BP_ERROR.warn('The chosen Keyring is already open! Please choose another Keyring.');
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
                        BP_ERROR.success('Merged with Keyring at ' + self.fieldsetChooseDB.val());
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
                        BP_ERROR.success('Merged In Keyring at ' + self.fieldsetChooseDB.val());
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
                        BP_ERROR.success('Merged out to Keyring at ' +
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
        tag:'div',
        ref: 'dialog',
        cons: modalDialog,
        addClass:'modal',
        attr:{ id:'modalDialog', role:'dialog' },
        iface:{ mode:ctx.mode, closeWin:ctx.closeWin },
        on:{ 'dbChosen':modalDialog.prototype.onDBChosen,
             'dbNameChosen':modalDialog.prototype.onDBNameChosen,
             'passwordChosen':modalDialog.prototype.onPasswordChosen },
        _final:{ appendTo:ctx.appendTo, show:false },
        _cull:['walletForm', 'modalHeader', 'headerDBName', 'btnSubmit'],
            children:[
            {tag:'div', addClass:'modal-header',
                children:[
                {tag:'button', addClass:'close',
                 text:'x',
                 save:['dialog'],
                 on:{ 'click': function(e){modalDialog.destroy();} }
                },
                { tag:'h3',
                 css:{ 'text-align':'center' },
                    children:[
                    { tag:'i', ref:'modalHeader'},
                    { tag:'h3', ref:'headerDBName'}
                    ]
                }
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
                {tag:'button', addClass:'btn btn-info', text:'Submit',
                 ref:'btnSubmit',
                 attr:{ 'type':'submit', form:'walletForm' },
                 save:['walletForm']
                 // on:{ 'click': function(e) {
                     // this.walletForm.onSubmit();
                 // }
                 // }
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
            this.$().modal({show:false, backdrop:'static'});
            this.$().on('shown', modalDialog.onShown);  // must use JQuery for Bootstrap events.
            this.$().on('hidden', modalDialog.onHidden);// must use JQuery fro Bootstrap events.

            switch (this.mode)
            {
                case 'merge':
                    this.modalHeader.$().text('Sync/Merge Keyring: ');
                    break;
                case 'mergeIn':
                    this.modalHeader.$().text('Import Keyring:');
                    break;
                case 'mergeOut':
                    this.modalHeader.$().text('Export to Keyring:');
                    break;
                case 'create':
                    this.modalHeader.$().text('Create Keyring:');
                    break;
                case 'open':
                default:
                    this.modalHeader.$().text('Load Keyring:');
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
        }},

        onPasswordChosen: {value: function(e)
        {
        	this.btnSubmit.el.focus();
        }}
    });
    modalDialog.onShown = function(e)
    {
        var dbPath,
            dialog = BP_W$.w$get('#modalDialog');
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

        $('#modalDialog *').tooltip({container:'body'}); // used to leak DOM nodes in version 2.0.4.
    };
    modalDialog.onHidden = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog'),
            closeWin;
        if (dialog) {
            closeWin = dialog.closeWin;// do this before dialog destroy
            dialog.destroy();
            if (closeWin) {
                g_win.close();
            }
        }
    };
    modalDialog.create = function(ops)
    {
        var ctx, temp,
            dialog = BP_W$.w$get('#modalDialog');

        if (dialog) {
            dialog.hide().destroy();
            dialog = null;
        }

        // Create the Widget.
        ctx = {};
        BP_COMMON.copy2(ops, ctx);
        ctx.appendTo = 'body';

        dialog = BP_W$.w$exec(modalDialog.wdt, ctx);

        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC

        if (dialog)
        {
            dialog.onInsert().showModal();
        }

        return dialog;
    };
    modalDialog.destroy = function()
    {
        var w$dialog = BP_W$.w$get('#modalDialog');

        if (w$dialog) {
            w$dialog.hideModal();
        }
    };

    BP_ERROR.logdebug("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: modalDialog.create
    });
}