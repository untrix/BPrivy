/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global $, console, window, jQuery, chrome */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

(function ()
{
    "use strict";
    /** @globals-begin */
    var g = {g_win:window, g_console:console, g_chrome:chrome, $:$, jQuery:jQuery},
        g_doc = document;
    g.BP_CS_PLAT = BP_GET_CS_PLAT(g);
    // Reference existing mods
    g.MAIN_PAGE = g.BP_CS_PLAT.getBackgroundPage();
    g.BP_CONFIG = g.MAIN_PAGE.BP_CONFIG;
    g.BP_NTFN_CNTR= g.MAIN_PAGE.BP_MAIN.g.BP_NTFN_CNTR;
    // Instantiate mods
    g.BP_ERROR = g.MAIN_PAGE.BP_GET_ERROR(g);
    g.BP_COMMON = g.MAIN_PAGE.BP_GET_COMMON(g);
    g.BP_PLAT = g.MAIN_PAGE.BP_GET_PLAT(g);
    /** @globals-end */

    /** @import-module-begin */
    var BP_CONFIG = IMPORT(g.BP_CONFIG);
    /** @import-module-begin */
    var BP_MAIN = IMPORT(g.MAIN_PAGE.BP_MAIN);
    /** @import-module-begin */
    var BP_COMMON = IMPORT(g.BP_COMMON),
        addEventListeners = IMPORT(BP_COMMON.addEventListeners);
    /** @import-module-begin CSPlatform */
    var m = IMPORT(g.BP_CS_PLAT);
    var CS_PLAT = IMPORT(g.BP_CS_PLAT);
    /** @import-module-begin */
    m = IMPORT(g.BP_ERROR);
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    var BP_PLAT = IMPORT(g.BP_PLAT);
    /** @import-module-end **/ m = null;

    if (!BP_MAIN.eulaAccepted())
    {
        addEventListeners('#btnEulaAccept', 'click', function(e)
        {
            BP_MAIN.acceptEula();
            BP_PLAT.reload();
        });
        addEventListeners('#btnEulaDecline', 'click', function(e)
        {
            BP_PLAT.uninstall();
        });
    }
    else
    {
        $('#formLicense').remove();
        $('#btnEulaAccept').prop('disabled', true);
        $('#btnEulaDecline').prop('disabled', true);
    }

    BP_ERROR.logdebug("loaded bp_license");
})();
