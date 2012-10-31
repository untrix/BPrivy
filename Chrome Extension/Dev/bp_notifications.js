/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */
/*global IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin NOTIFICATIONS
 */
function BP_GET_NOTIFICATION_WDL(g)
{   'use strict';
    var window = null, document = null, console = null;

    /** @import-module-begin */
    var BP_ERROR    = IMPORT(g.BP_ERROR),
        BPError     = IMPORT(BP_ERROR.BPError);
    var BP_COMMON   = IMPORT(g.BP_COMMON);
    var MEMSTORE    = IMPORT(g.BP_MEMSTORE);
    var BP_LISTENER = IMPORT(g.BP_LISTENER);
    var BP_CONNECT  = IMPORT(g.BP_CONNECT),
        dt_pRecord  = IMPORT(BP_CONNECT.dt_pRecord);
    var BP_PLAT     = IMPORT(g.BP_PLAT);
    var BP_W$       = IMPORT(g.BP_W$),
        w$defineProto=IMPORT(BP_W$.w$defineProto);
    var BP_TRAITS   = IMPORT(g.BP_TRAITS),
        eid_pfx     = IMPORT(BP_TRAITS.eid_pfx);
    /** @import-module-end **/

    /** @globals-begin */
    var g_notification;

    /** @globals-end **/

    function RecList () {}
    RecList.wdt = function (ctx)
    {
        var it = ctx.it;
            
        return {
        cons: RecList,
        tag:'div',
        ctx:{ w$:{ itemList:'w$el' } },
            iterate:{ it:it, wdi:IoItem.wdi }
        };
    };
    RecList.prototype = w$defineProto(RecList,
    {
        reload: {value:function()
        {
            
        }}
    });
    
    return Object.freeze(
    {
        recListWdt: RecList.wdt
    });
}
