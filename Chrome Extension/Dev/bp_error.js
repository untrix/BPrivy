/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

function BP_GET_ERROR(g)
{
    'use strict';
    var window = null, document = null, console = null,
        g_win = g.g_win,
        g_console = g.g_console;

   /** @begin-class-def BPError
    o: {//Object returned by the plugin
        path: // sanitizes and echo's back path parameter
        path2: // The second path-parameter if any.
        err: {
           acode: "Actionable (BP) Code",
           gcode: "BP Code (More Specific than A-Code)",
           scode: "System Specific Code",
           gmsg: "BP Message (G stands for Generic)",
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
    const bp::ustring ACODE_UNSUPPORTED         (L"Unsupported");
    const bp::ustring ACODE_CRYPT_ERROR         (L"CryptoError");

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
    const bp::ustring BPCODE_FILE_TOO_BIG       (L"FileTooBig");
    const bp::ustring BPCODE_INVALID_COPY_ARGS  (L"InvalidCopyArgs");
    const bp::ustring BPCODE_BAD_FILE           (L"FileCorrupted");

    */

    var dt_Activity= 'Activity';// Represents an Activity object. Needed because message
                                // objects reassmbled across a the message-pipe loose their
                                // constructor property and hence there is no way to find out
                                // type of the object.
   /**
    * More codes
    */
    var msg = Object.freeze(
    {
        /***********Action Codes and Corresponding Messages ****************/
        BadPathArgument:"Bad Path Argument.",
        BadDBPath:"The selected folder is not a Wallet folder",
        Unsupported:'Unsupported Feature.', //Unsupported URL etc.
        Diag:'', // Diagnostic Message
        BadWDL: 'Bad WDL argument.',
        UserError: 'There seems to have been a user error. Did you do something wrong? :)',
        BadPasswordOrCryptInfo: 'Wrong password or Key. Please retry with the right ones.',
        BadCryptInfo: 'You used the wrong Key. Please retry with the correct Key.',
        /*********** 'G-Codes/BP-Codes and Corresponding Messages' **************/
        ETLDLoadFailed: 'ETLD Load Failed',
        ExistingStore: "The selected folder seems to already be part of an existing DB.",
        NotJSObject: "Argument is not a javascript object.",
        NoDBLoaded: "Please load a uWallet first.",
        DBAlreadyLoaded: "This wallet is already loaded. Please select a different one.",
        NoDBSelected: "Please choose a uWallet first.",
        InternalError: "InternalError",
        CryptError: 'Encryption/Decryption Error: Perhaps an incorrect password or encryption-key-file.',
        KeyNotLoaded: 'The Key file has not been loaded. Could be an error in the software. Please close the window and retry.'
    });

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
   Activity.prototype.pop = function ()
   {
       this.actions.pop();
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
   
   // _err is either o.err returned from the plugin or a message string. BPError.atvt is
   // always used to derive the activity when created from a throw statement.
    function BPError(_err, acode, gcode)
    {
        Object.defineProperties(this,
        {// name and message are standard in ECmascript Error prototype.
            name: {value:"BPDiags", enumerable: true},
            message: {writable:true, enumerable: true},
            atvt: {writable:true, enumerable:true},
            err: {value:{}, writable:true, enumerable:true}
        });

        if (_err!==undefined && _err!==null && (typeof _err === "string"))
        {
            this.atvt = BPError.atvt; // Take value of page atvt
            this.message = _err || ( (acode&&msg[acode]) ? msg[acode] : String() + (gcode?msg[gcode]:''));
            this.err.name = "BPDiags";
            this.err.acode = acode || 'Diag';
            this.err.gcode = gcode;
        }
        else if (_err && (typeof _err === "object"))
        {
            if (_err.name === "PluginDiags") 
            {
                this.atvt = BPError.atvt;
                this.err = _err;
                //this.message = _err.gmsg || _err.smsg || _err.acode || _err.gcode || _err.scode;
                this.message = _err.gmsg || msg[_err.acode || _err.gcode] || _err.acode || _err.gcode || _err.smsg || _err.scode;
                this.message += _err.path1? ' path1='+_err.path1 : '';
            }
            else if (_err.name === "BPDiags") 
            {
                // Copy Construct
                //_err.atvt may be a json object hence need to wrap it with Activity object
                this.atvt = new Activity(_err.atvt);
                this.message = _err.message;
                this.err = _err.err;
            }
            else { // System error
                this.err = _err;
                this.atvt = BPError.atvt;
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
        var msg = (this.message || "Something went wrong :(" ),
            diags =((this.err.acode==='Diag') ? '' :  (
                   "\n" + this.err.name + "://" + 
                   (this.atvt? "?activity=" + this.atvt.toString() : "") +
                   (this.err.acode? "&acode="+this.err.acode : "") +
                   (this.err.gcode? "&gcode="+this.err.gcode : "") + 
                   (this.err.scode? "&scode="+this.err.scode : "") +
                   (this.err.smsg? "&smsg="+this.err.smsg : "")
               )),
            str = msg+diags;
        
        //var str = this.msg + (this.atvt?"activity="+this.atvt.toString()+"\n":'') + (this.err?JSON.stringify(this.err):'');
        return str.length<=200? str : str.slice(0,200);
    };
    BPError.push = function (actn)
    {
        if (!BPError.atvt) {
            BPError.atvt = new Activity('unknown');
        }
        BPError.atvt.push(actn);
    };
    BPError.pop = function ()
    {
        if (BPError.atvt) {
            BPError.atvt.pop();
        }
    };

    function alert (arg)
    {
        var be = new BPError(arg);
        g_console.log(be.toString());
        g_win.alert(be.message || "Something went wrong :(");
    }
    
    function confirm (str)
    {
        return g_win.confirm(str);
    }
    
    function prompt (msg)
    {
        return g_win.prompt(msg);
    }
    
    function log (arg)
    {
        var be = new BPError(arg);
        g_console.log(be.toString());
    }
    
    function logwarn (arg)
    {
        var be = new BPError(arg);
        if (be.err.acode === 'Unsupported') {
            g_console.error(be.toString());
        }
        else {
            g_console.error(be.toString());
        }
    }
    
    var iface = {
        BPError: BPError,
        Activity: Activity,
        alert: alert,
        warn: alert,
        success: alert,
        confirm: confirm,
        prompt: prompt,
        log: log,
        loginfo: log,
        logdebug: log,
        logwarn: logwarn,
        msg: msg
    };
    Object.freeze(iface);
    g_console.log("constructed mod_error");
    return iface;
    /** @end-class-def BPError **/
}
