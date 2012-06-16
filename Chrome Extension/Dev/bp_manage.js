/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR,
  ls, BP_PLUGIN */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
var BP_MOD_MANAGE = (function () 
{
    "use strict"; //TODO: Remove this from prod. build
    /** @import-module-begin CSPlatform */
    var m = BP_MOD_CS_PLAT;
    var addEventListeners = IMPORT(m.addEventListeners); // Compatibility function
    var DIR_SEP = IMPORT(m.DIR_SEP);
    /** @import-module-end **/ m = null;
           
    function fillOptions(eid, dir)
    {
        var o={}, d, i=0, n=0;
        eid = '#' + eid;
        $(eid).empty(); // Empty the selector list anyway.
        if (BP_PLUGIN.ls(dir, o) && (o.lsd) && (d=JSON.parse(o.lsd)) && d.d) {
            var keys = Object.keys(d.d);
            if ((n = keys.length) > 0) {
                $(eid).append($(document.createElement('option')).text('Browse Files'));
                for (i=0; i<n; ++i) {
                    $(eid).append($(document.createElement('option')).val(keys[i]).text(keys[i]));
                }
            }
        }
    }

    function onload()
    {
        //$("#nav-list a[data-nav]").click(function (e)
        addEventListeners("#nav-list a[data-nav]", "click", function(e)
        {
            e.preventDefault();
            $(this).tab('show');
        });
        $("#nav-settings").tab('show');
        $('#settings-pane *').tooltip();
        //$("#csvPathSubmit").click(function (e)
        //addEventListeners("#csvPathSubmit", "click", function(e)
        addEventListeners("[data-path-submit]", "click", function(e)
        {
            var path = $("#csvPath").val();
            console.log("Import CSV File:" + path);
            e.preventDefault();
        });
        
        //$('#csvPathReset').click(function()
        addEventListeners('[data-path-reset]', 'click', function(e)
        {
            fillOptions("csvPathSelect", "");
        });
        
        addEventListeners('[data-path-select]', 'change', function (e) 
        {
            var inp = $('[data-path]', this.form)[0];
            inp.value = inp.value + this.value + DIR_SEP;
            fillOptions(this.id, inp.value);
            //$(this).trigger('click');
            this.focus();
        });
    }
   
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        fillOptions: {value: fillOptions},
        onload: {value: onload}
    });
    Object.freeze(iface);

    return iface;    
}());