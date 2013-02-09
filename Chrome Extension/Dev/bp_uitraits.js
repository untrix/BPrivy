/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Traits
 */
function BP_GET_TRAITS(g)
{
    "use strict";
    var window = null, document = null, console = null;
    //////////// HAVE DEPENDENCIES ON MOD_COMMON ONLY, NOTHING ELSE ///////////////////
    var m;
    /** @import-module-begin Common */
    m = IMPORT(g.BP_COMMON);
    var MOD_COMMON = m,
        PROTO_HTTP = IMPORT(m.PROTO_HTTP),
        PROTO_HTTPS = IMPORT(m.PROTO_HTTPS),
        newInherited=IMPORT(m.newInherited);
    /** @import-module-begin Common */
    var BP_ERROR = IMPORT(g.BP_ERROR);
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
    var dt_eRecord = "e",  // Represents a E-Record (html-element record). Value is persisted.
        dt_pRecord = "p",  // Represents a P-Record (password record). Value is persisted.
        dt_settings= "s",
        dt_etld    = "m",  // Represents a ETLD (Public Suffix) record. Value is persisted.
        dt_default = "d";
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var fn_userid = "u", // Represents field userid. Copy value from P_UI_TRAITS.
        fn_userid2= "u2",// userid field of signup/register forms for auto-capture but not autofill.
        fn_pass = "p",   // Represents field password. Copy value from P_UI_TRAITS.
        fn_pass2= "p2",  // password field of signup/register forms for auto-capture but not autofill
        fn_btn = "b",    // submit button for both signin and signup. Currently not saved in eRecs.
                         // usage limited to bp_cs, but included here to ensure no name-clash.
        fn_site = "s";   // Field used to display site (hostname/path) in UI
        
    var eid_pfx = "com-untrix-";

    var CT_TEXT_PLAIN = 'text/plain',
        CT_BP_PREFIX = 'application/x-untrix-',
        CT_BP_FN = CT_BP_PREFIX + 'fn',
        CT_BP_PASS = CT_BP_PREFIX + fn_pass,
        CT_BP_USERID = CT_BP_PREFIX + fn_userid;
        
    var dom_topLevelTags = ['body', 'html', 'head', 'frameset'];

    var FT = Object.freeze({
        text: 1,
        pass: 2
    });
    var UI_TRAITS={};
    /** @globals-end **/
    
    function DefaultUiTraits ()
    {
        Object.freeze( Object.defineProperties(this,
        {
            dt: { value:dt_default },
            key: { value:{uiName:'key', apiName:'key'} },
            fields: { value:[{uiName:'value', apiName:'value'}] },
            showRecs: { value:function(loc) {return false;} }
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
            protocols: {value: ['http:', 'https:', 'ftp:', 'chrome-extension:']},
            showRecs:  {value: function(loc) {
                //BP_ERROR.logdebug('PUiTraits.showRecs: loc = ' + JSON.stringify(loc));
                //if (loc && loc.protocol) {return this.protocols.indexOf(loc.protocol.toLowerCase())!==-1;}
                return (loc && loc.protocol && loc.hostname);
                }}
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

    // function SUiTraits ()    // {        // Object.freeze( Object.defineProperties(this,        // {            // dt: {value: dt_settings}        // }));    // }    // SUiTraits.prototype = DEFAULT_UI_TRAITS;
    
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
    
    var iface = {};
    Object.defineProperties(iface,
    {
        UI_TRAITS: {value: UI_TRAITS},
        dt_eRecord: {value: dt_eRecord},
        dt_pRecord: {value: dt_pRecord},
        dt_etld: {value: dt_etld},
        dt_settings:{value: dt_settings},
        dt_default: {value: dt_default},
        fn_userid: {value: fn_userid},
        fn_userid2:{value: fn_userid2},
        fn_pass: {value: fn_pass},
        fn_pass2:{value: fn_pass2},
        fn_btn: {value: fn_btn},
        fn_site:{value: fn_site},
        eid_pfx: {value: eid_pfx},
        CT_BP_FN: {value: CT_BP_FN},
        CT_TEXT_PLAIN: {value: CT_TEXT_PLAIN},
        CT_BP_PREFIX: {value: CT_BP_PREFIX},
        CT_BP_USERID: {value: CT_BP_USERID},
        CT_BP_PASS: {value: CT_BP_PASS},
        dom_topLevelTags: {value: dom_topLevelTags},
        isTopLevelTag: {value: function(elName) {return (dom_topLevelTags.indexOf(elName) !== -1);} }
    }); Object.freeze(iface);
    
    BP_ERROR.log("constructed mod_traits");
    return iface;
}
