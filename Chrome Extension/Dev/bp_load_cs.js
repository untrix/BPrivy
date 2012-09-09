BP_MOD_BOOTSTRAP = (function ()
{ "use strict";
    return {
        log: function () {console.log("In BP_MOD_BOOTSTRAP.log");},
        alert: function () {window.alert("In BP_MOD_BOOTSTRAP.log");}
    };
}());
console.log("bp_load_cs.js loaded");