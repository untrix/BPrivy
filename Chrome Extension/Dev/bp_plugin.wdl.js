/**
 * @preserve
 * @author Sumeet S Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Untrix Soft
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
    // var CS_PLAT = IMPORT(g.BP_CS_PLAT),
        // rpcToMothership = IMPORT(CS_PLAT.rpcToMothership),
        // addEventListeners = IMPORT(m.addEventListeners), // Compatibility function
        // addEventListener = IMPORT(m.addEventListener); // Compatibility function
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
    // var BP_DBFS = IMPORT(g.BP_DBFS);
    // var DB_FS = IMPORT(BP_DBFS.DB_FS);
    /** @import-module-end **/    m = null;
    
}