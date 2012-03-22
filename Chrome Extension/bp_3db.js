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
var bpModule3db = (function () {

    // DB Keywords
    var keywords = {
        ctPropName : "bpContentType",
        ctPropValUserid : "userid",
        ctPropValPass : "pass",
        tagPropName : "tag.tagName",
        tagidPropName : "tag.id",
        tagnamePropName : "tag.name",
        tagtypePropName : "tag.type"
    };
    
    /** ModuleInterfaceGetter 3db */
    function getModuleInterface(url) {
        // Fields of an event-record
        var fields = ['username', 'password', 'url', 'tag'], temp_name;
    
        var saveLink = function (l)
        {
            console.info("Saving link " + l.toString());
        };
        
        var iface = {
            "saveLink" : saveLink
        };
    
        for (temp_name in keywords) {
            if (keywords.hasOwnProperty(temp_name)) {
                iface[temp_name] = keywords[temp_name];
            }
        }

        return iface;
    }
    
    var bpModule3db = getModuleInterface();

return getModuleInterface();}());
/** @ModuleEnd */