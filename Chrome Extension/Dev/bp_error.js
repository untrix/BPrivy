/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
 
function IMPORT(sym)
{
    'use strict';
    if(sym===undefined || sym===null) {
        throw new ReferenceError("Linker:Symbol Not Found");
    }
    else {
        return sym;
    }
}

var BP_MOD_ERROR = (function()
{
    'use strict';

   /** @begin-class-def BPError
    o: {//Object returned by the plugin
        path: // sanitizes and echo's back path parameter
        path2: // The second path-parameter if any.
        err: {
           acode: "Actionable (BP) Code",
           gcode: "BP Code (More Specific than A-Code)",
           scode: "System Specific Code",
           gmsg: "BP Message (G stands for Generic - obsolte)",
           smsg: "System Message",
           path: "Path 1",
           path2: "Path 2"
        },
    }

    // Error properties (names) returned to javascript. These represent an interface
    // with javascript and therefore are unchangeable.
    const std::string PROP_ERROR                ("err");
    const std::string PROP_SYSTEM_MESSAGE       ("smsg");
    const std::string PROP_GENERIC_MESSAGE      ("gmsg");
    const std::string PROP_SYSTEM_CODE          ("scode");
    const std::string PROP_GENERIC_CODE         ("gcode");
    const std::string PROP_A_CODE               ("acode");
    const std::string PROP_PATH                 ("path");
    const std::string PROP_PATH2                ("path2");

    const std::string PROP_INFO                 ("inf");
    const std::string PROP_LSDIR                ("lsd");
    const std::string PROP_FILESTAT             ("lsf");
    const std::string PROP_READFILE             ("rdf");
    const std::string PROP_FILENAME             ("fnm");
    const std::string PROP_FILEEXT              ("ext");
    const std::string PROP_FILESTEM             ("stm");
    const std::string PROP_FILESIZE             ("siz");
    const std::string PROP_DATA                 ("dat");

    // NOTE: ACODE maps to actionable-code (a-code)
    // User Actionable. User should resolve the situation
    // and retry.
    extern const std::string ACODE_ACCESS_DENIED;
    // User Actionable. Please retry after some
    // time.
    extern const std::string ACODE_RESOURCE_LOCKED;
    // User Actionable. Please supply correct path or retry
    // after situation is resolved. Bad path for read or
    // write.
    extern const std::string ACODE_BAD_PATH_ARGUMENT;
    // User Or Client Error: Bad pathname syntax for creates or moves
    // Depending on situation either prompt client to provide a
    // correct pathname or auto-correct.
    extern const std::string ACODE_INVALID_PATHNAME;
    // This is a system/environment problem that can be
    // observed and are in the user's control. Things
    // like network drive not available, or disk-full. User
    // should resolve the situation and retry the operation.
    extern const std::string ACODE_RESOURCE_UNAVAILABLE;
    // The situation is not fatal. It occurred owing to
    // client/system error. Look at the specific code,
    // autofix and auto-retry without prompting the user.
    extern const std::string ACODE_AUTORETRY;
    // This situation cannot be resolved either through user
    // intervention or by auto-fix. We don't have an automatic
    // resolution at this stage. Call customer support.
    extern const std::string ACODE_CANT_PROCEED;
    // Unmapped System Code
    extern const std::string ACODE_UNMAPPED;

    const std::string ACODE_UNMAPPED            ("Unmapped");
    const std::string ACODE_CANT_PROCEED        ("CantProceed");
    const std::string ACODE_AUTORETRY           ("AutoRetry");
    const std::string ACODE_RESOURCE_UNAVAILABLE("ResourceUnavailable");
    const std::string ACODE_INVALID_PATHNAME    ("InvalidPathname");
    const std::string ACODE_BAD_PATH_ARGUMENT   ("BadPathArgument");
    const std::string ACODE_RESOURCE_LOCKED     ("ResourceLocked");
    const std::string ACODE_ACCESS_DENIED       ("AccessDenied");

    // NOTE: BPCODE maps to generic-code (gcd)
    const std::string BPCODE_NEW_FILE_CREATED   ("NewFileCreated");
    const std::string BPCODE_NO_MEM             ("NoMem");
    const std::string BPCODE_ASSERT_FAILED      ("AssertFailed");
    const std::string BPCODE_PATH_EXISTS        ("PathAlreadyExists");
    const std::string BPCODE_WRONG_FILETYPE     ("WrongFileType");
    const std::string BPCODE_REPARSE_POINT      ("PathIsReparsePoint");
    const std::string BPCODE_IS_SYMLINK         ("PathIsSymlink");
    // Action would've resulted in clobbering
    const std::string BPCODE_WOULD_CLOBBER      ("WouldClobber");
    const std::string BPCODE_PATH_NOT_EXIST     ("PathNotExist");
    */

    var dt_Activity= 'Activity';// Represents an Activity object. Needed because message
                                // objects reassmbled across a the message-pipe loose their
                                // constructor property and hence there is no way to find out
                                // type of the object. 
   /*
    * More codes
    */
    var ac = {}, bc={}, msg={};
    ac.BadPathArgument = 'BadPathArgument';
    bc.ExistingStore = 'ExistingStore';
    msg[bc.ExistingStore] = "The selected folder seems to already be part of another Privy Wallet"; 

   function Activity(arg)
   {
        Object.defineProperties(this,
        {
            dt: {value: dt_Activity},
            name: {value: "unknown", writable: true, enumerable: true},
            actions: {value: [], writable: true, enumerable: true}    
        });
        
        if (arg && (typeof arg === 'string')) {
            this.name = arg;
        }
        else if (arg && (typeof arg === 'object') && (arg.dt === dt_Activity)) {
            this.name = arg.name;
            this.actions = arg.actions;
        }
        
        Object.freeze(this);
   }
   Activity.prototype.push = function (actn)
   {
       if (actn) {this.actions.push(actn);}
   };
   Activity.prototype.toString = function ()
   {
       var str = this.name || "", i,
           n = this.actions.length;
           
       for (i=0; i<n; i++) {
           str += ";" + this.actions[i];
       }
       return str;
   };
   
   // err is either o.err returned from the plugin or a message string. BPError.atvt is
   // always used to derive the activity when created from a throw statement.
    function BPError(_err)
    {
        Object.defineProperties(this,
        {// name and message are standard in ECmascript Error prototype.
            name: {writable: true, enumerable: true},
            message: {writable:true, enumerable: true},
            atvt: {writable:true, enumerable:true},
            err: {value:{}, writable:true, enumerable:true},
        });

        if (_err && (typeof _err === "string"))
        {
            this.atvt = BPError.atvt; // Take value of page atvt
            this.message = _err;
            this.name = "BPError";
        }
        else if (_err && (typeof _err === "object"))
        {
            this.name = _err.name;
            this.atvt = BPError.atvt;
            this.err = _err;
            
            if (_err.name === "PluginError" || _err.acode) {
                this.message = _err.gmsg || _err.smsg || _err.acode || _err.gcode || _err.scode;
            }
            else if (_err.name === "BPError") {
                // Copy Construct
                this.atvt = new Activity(_err.atvt);
                this.message = _err.message;        
            }
            else { // System error
                switch (_err.constructor) {
                    case Error:
                    case RangeError:
                    case TypeError:
                    case EvalError:
                    case ReferenceError:
                    case SyntaxError:
                    case URIError:
                        this.message = _err.message;
                    break;
                    default:
                        this.message = _err.name + ": " + _err.message;
                }                
            }
        }
        
        Object.freeze(this); // turn-off writable, configurable and extensible flags
    }
    BPError.atvt = undefined; // Global object for storing current activity. 
    BPError.prototype.toString = function()
    {
        //return JSON.stringify(this);
        return this.name + "://" + (this.message || "") +
               (this.atvt? "?activity=" + this.atvt.toString() : "") +
               (this.acd? "&acd="+this.acd : "") +
               (this.gcd? "&gcd="+this.gcd : "") + (this.scd? "&scd="+this.scd : "") +
               (this.smg? "&smg="+this.smg : "");
    };
    BPError.push = function (actn)
    {
        if (!BPError.atvt) {
            BPError.atvt = new Activity('unknown');
        }
        BPError.atvt.push(actn);
    };
    
    function alert (arg) 
    {
        var msg;
        if (arg && (typeof arg === 'string')) {
            msg = arg;
        }
        else if (arg && (typeof arg === 'object')) {
            msg = arg.message;
        }
        
        window.alert(msg);
    }
    
    function log (arg)
    {
        var be = new BPError(arg);
        //console.log(str);
        alert(be.toString());
    }
    
    var iface = {
        BPError: BPError,
        Activity: Activity,
        alert: alert,
        warn: alert,
        success: alert,
        log: log,
        loginfo: log,
        logwarn: log,
        logdebug: log,
        ac: ac,
        bc: bc,
        msg: msg
    };
    Object.freeze(iface);
    return iface;
    /** @end-class-def BPError **/
}());
