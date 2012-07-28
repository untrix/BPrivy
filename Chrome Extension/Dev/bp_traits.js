/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Traits
 */
var BP_MOD_TRAITS = (function () 
{
    "use strict";
    //////////// HAVE DEPENDENCIES ON MOD_COMMON ONLY, NOTHING ELSE ///////////////////
    var m;
    /** @import-module-begin Common */
    m = IMPORT(BP_MOD_COMMON);
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS),
        newInherited=IMPORT(m.newInherited);
    /** @import-module-end **/    m = null;
    
    /** @globals-begin */
    /** 
     * @constant Used for multiple purposes. Therefore be careful of what chars
     * you use in the string.
     * 1. As a data-type (class) identifier within in-memory objects.
     * 2. As a component of filesystem directory/filenames of ADB. Therefore
     *    name should be short and lowercase. NTFS and FAT ignores case. Do not
     *    use any chars that are disallowed in any filesystem (NTFS, NFS, FAT,
     *    ext1,2,3&4, CIFS/SMB, WebDAV, GFS, any FS on which a customer may want to store
     *    their ADB).
     * 3. As a component of tag-names inside DNodes. Hence keep it short. Do not
     *    use any chars that are disallowed as Javascript properties.
     * 4. These values will get marshalled into JSON files, therefore make sure
     *    that they are all valid JSON property names (e.g. no backslash or quotes).
     * 5. To represent the data-type in general at other places in the code ...
     */
    var dt_eRecord = "e";  // Represents a E-Record (html-element record). Value is persisted.
    var dt_pRecord = "p";  // Represents a P-Record (password record). Value is persisted.
    var dt_etld    = "m",   // Represents a ETLD (Public Suffix) record. Value is persisted.
        dt_default = "DefaultDT";
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var fn_userid = "u";   // Represents field userid. Copy value from P_UI_TRAITS.
    /** @constant */
    var fn_pass = "p";       // Represents field password. Copy value from P_UI_TRAITS.

    var FT = Object.freeze({
        text: 1,
        pass: 2
    });
    var UI_TRAITS={};
    var EMPTY_OBJECT = Object.freeze({});
    /** @globals-end **/
    
    function DefaultUiTraits ()
    {
        Object.freeze( Object.defineProperties(this,
        {
            dt: { value:dt_default },
            key: { value:{uiName:'key', apiName:'key'} },
            fields: { value:[{uiName:'value', apiName:'value'}] },
            showRecs: { value:function(loc) {return true;} }
        }));
    }
    var DEFAULT_UI_TRAITS = new DefaultUiTraits();
    
    function PUiTraits()
    {
        return Object.freeze( Object.defineProperties(this,
        {
            constructor: PUiTraits,
            dt: {value: dt_pRecord},
            key: {value: {uiName:"Username", apiName:"u", ft:FT.text}},
            fields: {value: [{uiName:"Password", apiName:"p", ft:FT.pass}]},
            protocols: {value: ['http:', 'https:']},
            showRecs: {value: function(loc) {if (loc) {
                return this.protocols.indexOf(loc.protocol.toLowerCase())!==-1;}}}
        }));
    }
    PUiTraits.prototype = DEFAULT_UI_TRAITS;
    
    function EUiTraits () // constructor
    {    
        Object.freeze( Object.defineProperties(this,
        {
            dt: {value: dt_eRecord},
            key: {value: {uiName:'fieldName', apiName:'fieldName', ft:FT.text}},
            fields: {value: [{uiName:'tagName', apiName:'tagName', ft:FT.text},
                             {uiName:'id', apiName:'id', ft:FT.text},
                             {uiName:'name', apiName:'name', ft:FT.text},
                             {uiName:'type', apiName:'type', ft:FT.text}]}
        }));
    }
    EUiTraits.prototype = DEFAULT_UI_TRAITS;

    
    Object.defineProperty(UI_TRAITS, dt_eRecord, {value: new EUiTraits()});
    Object.defineProperty(UI_TRAITS, dt_pRecord, {value: new PUiTraits()});
    Object.defineProperty(UI_TRAITS, dt_default, {value: DEFAULT_UI_TRAITS});
    Object.defineProperty(UI_TRAITS, undefined,  {value: DEFAULT_UI_TRAITS});
    Object.defineProperties(UI_TRAITS,
    {
        getAllDT: {value: function() {return [dt_pRecord];}},
        getTraits: {
            value: function (dt) {
                var n = this[dt];
                if (!n) {
                    n = this[dt_default];
                }
                return n;
            }
        },
        imbue: {
            value: function (rec, dt) {
                Object.defineProperty(rec, "uiTraits", 
                {
                    value: this.getTraits(dt) // enumerable, writable, configurable=false.
                });
                return rec;
            }
        }
    });
    
    function RecsIterator (recsMap)
    {
        var k = recsMap ? Object.keys(recsMap).sort() : EMPTY_OBJECT;
        Object.defineProperties(this,
        {
            _o: {value: recsMap},
            _k: {value: k},
            _n: {value: k.length},
            _i: {value: 0, writable:true}
        });
        Object.seal(this);
    }
    RecsIterator.prototype.next = function ()
    {
        if (this._i < this._n) {
            return this._o[this._k[this._i++]];
        }
        else {
            return null;
        }
    };
    
    function DTIterator (dnode)
    {
        var a = [], dts = UI_TRAITS.getAllDT(), i, dt;
        
        for (i=dts.length-1; i>=0; i--)
        {
            dt = dts[i];
            if (dnode.data[dt]) {
                a.push(new RecsIterator(dnode.data[dt]));
            }
        }
        
        Object.defineProperties(this,
        {
            _a: {value: a},
            _n: {value: a.length},
            _i: {value:0, writable:true}
        });
        Object.seal(this);
    }
    DTIterator.prototype.next = function ()
    {
        if (this._i < this._n) {
            return this._a[this._i++];
        }
        else {
            return null;
        }
    };

    var iface = {};
    Object.defineProperties(iface,
    {
        UI_TRAITS: {value: UI_TRAITS},
        RecsIterator: {value: RecsIterator},
        DTIterator: {value: DTIterator},
        dt_eRecord: {value: dt_eRecord},
        dt_pRecord: {value: dt_pRecord},
        dt_etld: {value: dt_etld},
        dt_default: {value: dt_default},
        fn_userid: {value: fn_userid},
        fn_pass: {value: fn_pass}
    }); Object.freeze(iface);
    
    console.log("loaded traits");
    return iface;
}());
