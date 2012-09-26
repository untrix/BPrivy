var BP_DLL = {};
var BP_MOD_BOOT = (function()
{   "use strict";

    // function hasPass(form)
    // {
        // return Array.prototype.some.apply(form.elements,[function(el)
        // {
            // return ((el.tagName.toLowerCase() === 'input') && (el.type === "password"));
        // }]);
    // }
    
    function scan(doc)
    {
        // var bNumForms = 0;
//         
        // Array.prototype.forEach.apply(doc.forms, [function (form, i, forms)
        // {
            // if (hasPass(form))
            // {
                // ++bNumForms;
            // }
        // }]);
//         
        // return bNumForms;
        var el = doc.querySelector('input[type=password]');        return Boolean(el);
    }
    
    return Object.freeze(
        {
            scan: scan
        });
}());
