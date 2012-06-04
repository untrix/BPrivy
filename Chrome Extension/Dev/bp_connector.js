/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document BP_MOD_CS_PLAT BP_MOD_COMMON IMPORT*/
/*jslint browser:true, devel:true */
//*members */
/** @remove Only used in debug builds */

/**
 * @ModuleBegin Connector
 */

var BP_MOD_CONNECT = (function ()
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    /** @import-module-begin CSPlatform **/
    var m = BP_MOD_CS_PLAT;
    var postMsgToMothership = IMPORT(m.postMsgToMothership);
    var rpcToMothership = IMPORT(m.rpcToMothership);
    /** @import-module-begin Common **/
    m = BP_MOD_COMMON; 
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    var isValidLocation = IMPORT(m.isValidLocation);
    /** @import-module-end **/    m = null;
    
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var ft_userid = "ft_userid";   // Represents field-type userid
    /** @constant */
    var ft_pass = "ft_pass";       // Represents field-type password
    /** @constant */
    var cm_getRecs = "cm_getRecs";     // Represents a getDB command
    var cm_loadDB = "cm_loadDB";
    var cm_createDB = "cm_createDB";
    var DNODE_TAG = {};
    Object.defineProperties(DNODE_TAG,
        {
            DATA: {value:"{dt}", writable:false, configurable:false},
            TLD: {value:"{t}", writable:false, configurable:false},
            HOST: {value:"{h}", writable:false, configurable:false},
            DOMAIN: {value:"{d}", writable:false, configurable:false},
            PORT: {value:"{o}", writable:false, configurable:false},
            PATH: {value:"{p}", writable:false, configurable:false},
            getDataTag: {value: function (dt) {
                // tag is a property name that should never clash withe a URL
                // segment. Hence the bracket
                // characters are being used because they are excluded in rfc
                // 3986.
                if(dt) {
                    return DNODE_TAG.DATA + dt;
                }
            }, writable:false, configurable:false}
        }
    );
    
    /** Pseudo Inheritance */
    function inheritARec(that, type, loc, date)
    {
        Object.defineProperties(that,
        {
            //Record Type. Determines which dictionary this record belongs to.
            dt: {value: type, writable: false, enumerable: true, configurable: false},
            date: {value: date?date:Date.now(), writable: false, enumerable: true, configurable: false},
            // URL that this record pertains to. Determines where the record will sit within the URL-trie.
            loc: {writable: true, enumerable: true, configurable: false}
        });
    }
    
    function isValidARec(that)
    {
        if (that  && 
                (typeof that.dt === "string") &&
                (typeof that.date === "number") &&
                isValidLocation(that.loc))
            { return true;}
        else {return false;}
    }
    function ERecord()
    {
        inheritARec(this, dt_eRecord);
        var descriptor2 = {writable: true, enumerable: true, configurable: false};
        Object.defineProperties(this, 
        {
            fieldType: descriptor2,
            tagName: descriptor2,
            id: descriptor2,
            name: descriptor2,
            type: descriptor2
        });
        Object.seal(this);
    }
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function newERecord() {
        return new ERecord();    
    }

    function PRecord()
    {
        inheritARec(this, dt_pRecord);
        Object.defineProperties(this,
            {
                userid: {writable: true, enumerable: true, configurable: false},
                pass: {writable: true, enumerable: true, configurable: false}
            }
        );
        Object.seal(this);
    }
    PRecord.prototype.isValid = function()
    {
        return (isValidARec(this) && 
                (typeof this.userid === "string") &&
                (typeof this.pass === "string"));
    };
    
    function newPRecord()
    {
        return new PRecord();
    }
    
    /**
     * @begin-class-def Actions
     * Represents Actions on a given item/key. Figures out the latest value etc.
     * Inserted records should be Action Records with timestamps in them. If no timestamp
     * is found, the current timestamp will be inserted.
     */
    /** Constructor.
     * Acts as default constructor with no argument.
     * For an argument, it expects an Action Record or an Object object created from a
     * JSON serialized Action Record.
     * In that case it behaves as a Move Constructor. That is, it adopts the
     * properties of the argument and deletes them from the argument.
     */
    function Actions(jo)
    {
        if (jo)
        {
            Object.defineProperties(this,
                {
                    curr: {value: jo.curr, writable: true},
                    arecs: {value: jo.arecs}
                }
            );
        }
        else {
            Object.defineProperties(this,
                {
                    curr: {value: undefined, writable: true},
                    arecs: {value: []}
                }
            );
        }
        Object.seal(this);
    }
    /** Method. Insert a record into the Action Records collection */
    Actions.prototype.insert = function(arec)
    {//TODO: Check for exact duplicate records. That is, records with matching timestamp and values.
        if (!arec.date) { arec.date = Date.now();}
        var n = this.arecs.push(arec);
        if ((!this.curr) || (this.curr.date < arec.date)) {
            this.curr = this.arecs[n-1];
        }
    };
    
    function newActions(jo) {
        return new Actions(jo);
    }
    /** @end-class-defn **/

    /** ModuleInterfaceGetter Connector */
    function getModuleInterface(url)
    {
        var saveRecord = function (eRec)
        {
            postMsgToMothership(eRec);
        };
        
        var deleteRecord = function (erec)
        {
            console.log('Deleting Record ' + JSON.stringify(erec));
        };
        
        var getRecs = function(loc, callback)
        {
            return rpcToMothership({dt:cm_getRecs, loc: loc}, callback);
        };

        var recKey = function(rec)
        {
            if (rec.dt === dt_eRecord) {
                return rec.fieldType;
            }
            else if (rec.dt === dt_pRecord) {
                return rec.userid;
            }
        };
        
        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            ft_userid: {value: ft_userid},
            ft_pass: {value: ft_pass},
            cm_getRecs: {value: cm_getRecs},
            cm_loadDB: {value: cm_loadDB},
            cm_createDB: {value: cm_createDB},
            DNODE_TAG: {value: DNODE_TAG},
            saveRecord: {value: saveRecord},
            deleteRecord: {value: deleteRecord},
            newERecord: {value: newERecord},
            newPRecord: {value: newPRecord},
            newActions: {value: newActions},
            getRecs: {value: getRecs},
            recKey: {value: recKey}
        });
        Object.freeze(iface);

        return iface;
    }
    
    return getModuleInterface();

})();
/** @ModuleEnd */