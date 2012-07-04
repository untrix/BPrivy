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
    
    var BUTTON_TRAITS = {};
    Object.defineProperties(BUTTON_TRAITS,
    {
        html:
        {
            value: '<button type="button"></button>'
        }
    });
    
    var PANEL_TRAITS = {};
    Object.defineProperties(PANEL_TRAITS,
    {
        hasXButton: {value: false},
        html:
        {
            value:  '<div style="display:none">' + 
                        '<div id="com-bprivy-panelTitle">' +
                            '<div id="com-bprivy-TitleText"></div>'+
                        '</div>' +
                        '<div id="com-bprivy-panelList"></div>' +
                    '</div>'
        },
        eid: {value: "com-bprivy-panel"},
        title: 
        {
            value:
            {
                html: 
                
            }
        } 
    });
    Object.freeze(PANEL_TRAITS);
    
    function inherit(prototype)
    {
        function Inheritor(){}
        Inheritor.prototype = prototype;
        return new Inheritor();
    }
    
    var CS_PANEL_TRAITS = inherit(PANEL_TRAITS);
    Object.defineProperties(CS_PANEL_TRAITS,
    {
        hasXButton: {value: true}
    });
    
}());
