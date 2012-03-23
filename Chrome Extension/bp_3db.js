/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document */
/*jslint browser:true, devel:true */

/**
 * @ModuleBegin 3db
 */
var bp_3db = (function () {

    // DB Keywords
    var n = {
        url : "url",
        dbType: "dbType",
        tagDB: "tagDB",
        dataType: "dataType",
        CT : {key: "bpContentType", userid: "ctUserid", pass: "ctPass"},
        tagName : "tagName",
        id : "attrId",
        name : "attrName",
        type : "attrType"
    };
    
    function toString(o) {
        var str = "", name;
        for (name in o) {
            if (o.hasOwnProperty(name)) {
                str += (name.toString() + ":" + o[name].toString() + ", ");
            }
        }
        
        return str;
    }
    
    function Record() {}
    Record.prototype.dbType = function () {
        if (this[n.dbType]) {
            return this[prop.DB.key];
        }
    };
    Record.prototype.toString = toString;
    function constructRecord() {
        var o = new Record();
        return o;    
    }
    
    /** ModuleInterfaceGetter 3db */
    function getModuleInterface(url) {
        var saveTagDescription = function (el)
        {
            console.info("Saving Tag " + toString(el));
        };
        
        //Assemble the interface    
        var iface = {};
        Object.defineProperty(iface, "prop", {value: prop, writable: false, enumerable: false, configurable: false});
        Object.defineProperty(iface, "saveTagDescription", {value: saveTagDescription, writable: false, enumerable: false, configurable: false});
        Object.defineProperty(iface, "constructRecord", {value: constructRecord, writable: false, enumerable: false, configurable: false});

        return iface;
    }
    
    var bp_3db = getModuleInterface();

return bp_3db;}());
/** @ModuleEnd */