/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/*jslint browser : true, devel : true, es5 : true */

var BP_MOD_CSS = (function ()
{
    "use_ strict"; // TODO: remove from prod. version
    var iface = {
        style_li :  'border-radius: 2px;border-collapse:collapse;margin: 0px;padding: 0px;' +
                  'border: none;list-style-type: none;display: block;vertical-align: middle;',
        style_ioFields: 'display: inline-block;margin: 0px;padding: 0px;border: none;',
        style_field: 'display: inline-block;background-color: white;width: 125px;margin: 1px;' +
                    'padding: 1px;height: 16px;overflow: hidden;',
        style_userIn: 'text-align: justify;border: 2px inset;',
        style_userOut: 'text-align:justify;border: 2px outset;',
        style_passIn: 'text-align: center;border: 2px inset;',
        style_passOut: 'text-align: center; border: 2px outset;',
        style_tButton: 'display: inline-block;float: left;margin: 1px;height: 25px;'+
                       'width: 25px;padding: 1px;vertical-align: middle;text-align: center;' +
                       'min-width: 0px; min-height:0px;',
        style_hidden: 'display:none;',
        style: function (s) { return 'style=\"' + s + '\"';}
    };
    
    return iface;
})();
