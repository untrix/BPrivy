/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document */

/** @remove Only used in debug builds */
"use strict";
function com_bprivy_GetModule_Common () {
    /** @globals-begin */      
    var CSS_HIDDEN = "com-bprivy-hidden";
    /** @globals-end **/
   
    function bp_throw (str) {
        throw str;
    }
    
    function toJson(o)
    {
        return JSON.stringify(o, null, 2);
    }

    var iface = {};
    Object.defineProperties(iface, 
    {
        CSS_HIDDEN: {value: CSS_HIDDEN, writable: false, enumerable: false, configurable: false},
        bp_throw: {value: bp_throw, writable: false, enumerable: false, configurable: false},
        toJson: {value: toJson, writable: false, enumerable: false, configurable: false}
    });
    Object.preventExtensions(iface);

    return iface;
    
    // Function.prototype.defineMethod = function (name, value)
    // {
        // this.prototype[name] = value;
        // return this;
    // };
//     
    // var bp_common_clone = function ()
    // {
        // if ((typeof this) !== "object") {
            // return;
        // }
//         
        // var o = {}, temp_name;
        // for (temp_name in this) {
            // if (this.hasOwnProperty(temp_name)) {
                // o[temp_name] = this[temp_name];
            // }
        // }
        // return o;
    // };
    
    //Object.defineProperty(Object.prototype, "bp_common_clone", {value: bp_common_clone, writable: false, enumerable: false, configurable: false});
}