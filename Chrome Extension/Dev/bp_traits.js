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
    var m;
    /** @import-module-begin Common */
    m = IMPORT(BP_MOD_COMMON);
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        dt_default = "DefaultDT";
    /** @import-module-begin Connect */
    m = IMPORT(BP_MOD_CONNECT);        
    var newPRecord = IMPORT(m.newPRecord),
        newERecord = IMPORT(m.newERecord);

    /** @import-module-end **/    m = null;
    /** @globals-begin */
    var FT = Object.freeze({
        text: 1,
        pass: 2
    });
    var UI_TRAITS={}, P_UI_TRAITS={}, E_UI_TRAITS={}, DEFAULT_UI_TRAITS={};
    var EMPTY_OBJECT = {}; Object.freeze(EMPTY_OBJECT);
    /** @globals-end **/
   
    Object.freeze(
    Object.defineProperties(P_UI_TRAITS,
    {
        dt: {value: dt_pRecord},
        key: {value: {uiName:"Username", apiName:"userid", ft:FT.text}},
        fields: {value: [{uiName:"Password", apiName:"pass", ft:FT.pass}]}
    }));
    Object.freeze(
    Object.defineProperties(E_UI_TRAITS,
    {
        dt: {value: dt_eRecord},
        key: {value: {uiName:'fieldName', apiName:'fieldName', ft:FT.text}},
        fields: {value: [{uiName:'tagName', apiName:'tagName', ft:FT.text},
                         {uiName:'id', apiName:'id', ft:FT.text},
                         {uiName:'name', apiName:'name', ft:FT.text},
                         {uiName:'type', apiName:'type', ft:FT.text}]}
    }));
    Object.freeze(
    Object.defineProperties(DEFAULT_UI_TRAITS,
    {
        dt: {value: dt_default},
        key: {value: {uiName:'key', apiName:'key'} },
        fields: {value: [{uiName:'value', apiName:'value'}]}
    }));
    
    Object.defineProperty(UI_TRAITS, dt_eRecord, {value: E_UI_TRAITS});
    Object.defineProperty(UI_TRAITS, dt_pRecord, {value: P_UI_TRAITS});
    Object.defineProperty(UI_TRAITS, dt_default, {value: DEFAULT_UI_TRAITS});
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
            value: function (rec) {
                Object.defineProperty(rec, "uiTraits", 
                {
                    value: this.getTraits(rec.dt) // enumerable, writable, configurable=false.
                });
                return rec;
            }
        }
    });
    
    function RecsIterator (recsMap)
    {
        var k = recsMap? Object.keys(recsMap) : EMPTY_OBJECT;
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
        DTIterator: {value: DTIterator}
    }); Object.freeze(iface);
    return iface;
}());
