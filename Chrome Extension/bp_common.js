/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document */

/** @remove Only used in debug builds */
"use strict";
Function.prototype.defineMethod = function (name, value)
{
	this.prototype[name] = value;
	return this;
};

var bp_common_clone = function ()
{
    if ((typeof this) !== "object") {
        return;
    }
    
    var o = {}, temp_name;
    for (temp_name in this) {
        if (this.hasOwnProperty(temp_name)) {
            o[temp_name] = this[temp_name];
        }
    }
    return o;
};

Object.defineProperty(Object.prototype, "bp_common_clone", {value: bp_common_clone, writable: false, enumerable: false, configurable: false});

