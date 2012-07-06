/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR, BP_MOD_MEMSTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Traits
 */
var BP_MOD_TRAITS = (function () 
{
    "use strict";
    /** @globals-begin */

    /** @globals-end **/
    
    /** @begin-static-class-defn DEFAULT_TRAITS */
    // Top-Level properties defined in DEFAULT_TRAITS are mandatory for any TRAITS object.
    // Omitting second-level properties (e.g. dict.url_scheme) is okay - implies false for
    // boolean properties.
    Object.defineProperties(DEFAULT_TRAITS,
    {
        // dict: Properties referenced by dictionary/trie/URLA.
        // dict.url_xyz=true implies that xyz will be matched in insertions and lookups from dictionary.
        dict: {value: {url_scheme: false, url_host:true, url_port:true, url_path:true}},
        // action: properties referenced by the Actions class.
        actions: {
            value: {
                // history=true asserts we're interested in maintaining history.
                // Will cause Actions class to keep history in memory
                // A value of false asserts the opposite. Will
                // cause Actions to only keep current value in memory.
                history: 0,
                // An assert action is one that re-asserts the existing value. When a record
                // is received that has the same value as the most current value for its key,
                // but a different timestamp, then it is deemed as an assertion of an existing
                // value. 'save_asserts' dictates whether or not such records should be persisted
                // to storage. Persisting repeated values can significantly increase the storage
                // size for situations where the same values are repeatedly generated - e.g. E-Records.
                // Note that an assert with the same exact value and timestamp is a duplicate and will
                // always be ignored and discarded - the value of save_asserts traits will not
                // affect that behaviour.
                persist_asserts: false
            },
        },
        ui: {value: {fields: ["key", "value"]}},
        // Returns record key
        getKey: {value: function (rec) {return rec.key;}},
        isValid: {value: function (rec){return isValidARec(rec) && rec.key!==undefined && rec.key!==null && rec.key !== "";}},
        compareVals: {value: function(rec1, rec2) 
            {
              if (rec1 && rec2) {
                  if (rec1.value === rec2.value) {return EQUAL;}
                  else {return DIFFRNT;}
              }
              else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                  return EQUAL;
              }
              else { return DIFFRNT;}
            }}
    }); Object.freeze(DEFAULT_TRAITS);
    /** @end-static-class-defn DEFAULT_TRAITS **/
    /** @begin-static-class-defn PREC_TRAITS */
    Object.defineProperties(PREC_TRAITS,
    {
        dict: {value: {url_host:true, url_port:true}},
        actions: {value: {history:2, persist_asserts: true}},
        ui: {value: {fields: Object.keys(newPRecord())}},
        getKey: {value: function(rec)
            {
                return rec.userid;
            }},        
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.userid === "string") &&
                    (typeof rec.pass === "string"));
            }},
        compareVals: {value: function(rec1, rec2) 
            {
                if (rec1 && rec2)
                {
                    if (rec1.pass === rec2.pass) { return EQUAL;}
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT;}
            }}
    }); Object.freeze(PREC_TRAITS);
    /** @end-static-class-defn PREC_TRAITS **/
    /** @begin-static-class-defn EREC_TRAITS */
    Object.defineProperties(EREC_TRAITS,
    {
        dict: {value: {url_host:true, url_port:true, url_path:true}},
        actions: {value: {history: 0, persist_asserts:false}},
        ui: {value: {fields: Object.keys(newERecord())}},
        getKey: {value: function(rec)
            {
                return rec.fieldType;
            }},
        isValid: {value: function(rec)
            {
                return (isValidARec(rec) && 
                    (typeof rec.fieldType === "string") &&
                    (typeof rec.tagName === "string"));
            }},
        compareVals: {value: function(rec1, rec2) 
            {
                if (rec1 && rec2)
                {
                    if (rec1.tagName === rec2.tagName &&
                        rec1.id === rec2.id &&
                        rec1.name === rec2.name &&
                        rec1.type === rec2.type)
                        {
                            return EQUAL;
                        }
                    else {return DIFFRNT;}
                }
                else if ((rec1===undefined || rec1===null) && (rec2===undefined || rec2===null)) {
                    return EQUAL;
                }
                else { return DIFFRNT;}                
            }}
    }); Object.freeze(EREC_TRAITS);
    /** @end-static-class-defn EREC_TRAITS **/
    /** @begin-static-class-defn DT_TRAITS */
    Object.defineProperty(DT_TRAITS, dt_eRecord, {value: EREC_TRAITS});
    Object.defineProperty(DT_TRAITS, dt_pRecord, {value: PREC_TRAITS});
    Object.defineProperty(DT_TRAITS, dt_default, {value: DEFAULT_TRAITS});
    Object.defineProperties(DT_TRAITS,
    {
        getTraits: {
            value: function (dt) {
                var n = this[dt];
                if (!n) {
                    n = this[dt_default];
                }
                return n;
            }
        },
        getDictTraits: {
            value: function (dt) {
                return this.getTraits(dt).dict;
            }
        },
        getKey: {
            value: function (rec) {
                var n = this[rec.dt];
                if (n && n.getKey) {
                    return n.getKey(rec);
                }
            }
        },
        imbue: {
            value: function (rec) {
                Object.defineProperty(rec, "traits", 
                {
                    value: this.getTraits(rec.dt) // enumerable, writable, configurable=false.
                });
                return rec;
            }
        }
    });
    Object.freeze(DT_TRAITS);
    /** @end-static-class-defn DT_TRAITS **/    
}());
