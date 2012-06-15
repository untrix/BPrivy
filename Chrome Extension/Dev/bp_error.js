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
    Error object returned by plugin:
    o: {
        err: {
           acode: "Actionable (BP) Code",
           gcode: "BP Code (More Specific than A-Code)",
           scode: "System Specific Code",
           gmsg: "Generic/BP Message",
           smsg: "System Message",
           path: "Path 1",
           path2: "Path 2"
        },
    }
    o: {
        lsd: { //Output of list-dir
            d: { //Listing of directories
                dir1.ex1: {
                    ex: ex1, //filename extension if applicable
                    st: dir1 //filename stem if applicable
                },
                dir2: {},
                ...
            },
            f: {//Listing of regular files
                file1.ex1: {
                    sz: 55,  //file size - mandatory
                    ex: ex1, //filename extension if applicable 
                    st:      //filename stem if applicable
                },
                file2: {sz: 60}, // No extension or stem here
                ...
            },
            o: {//entries that are neither normal files nor directories. e.g. Windows Reparse Points that are not symlinks
                "Documents and Settings": {}
            },
            e: {//Those directory entries where errors were encountered
                Drive:/absolutepath: {
                    //Can have all properties of the err object shown above
                    acode: ...,
                    scode: ...,
                    smsg: ...,
                    name: stem.ext, // Filename
                    ex: ext, // file extension
                    st: filestem, // file stem
                },
                C:/hiberfil.sys: {
                    acode: "ResourceLocked"
                    ex: ".sys"
                    name: "hiberfil.sys"
                    scode: "ERROR_SHARING_VIOLATION"
                    smsg: "The process cannot access the file because it is being used by another process"
                    st: "hiberfil"
                },
                C:/pagefile.sys: {
                    acode: "ResourceLocked"
                    ex: ".sys"
                    name: "pagefile.sys"
                    scode: "ERROR_SHARING_VIOLATION"
                    smsg: "The process cannot access the file because it is being used by another process"
                    st: "pagefile"
                },
                ...
            },
        },
    }
    o: {
        lsf: {//Output of list-file. one file only
            filename.ext: {
                // Same as file entry in directory listing
            }
        }
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
   // err is either o.err returned from the plugin or a message string. actn is an optional
   // action string denoting the sub-activity when the error occurred. If not supplied,
   // BPError.actn is used. BPError.atvt is always used to derive the activity.
    function BPError(err)
    {
        if (err && (typeof err === "object"))
        {
            Object.defineProperties(this,
            {   // name and message are standard in ECmascript Error prototype.
                name: {value:"BPError"},
                err: {value:err}
            });
        }
        else if (err && (typeof err === "string"))
        {
            Object.defineProperties(this,
            {
                 name: {value:"BPError"},
                 err: {value: {gmsg:err}}
            });
        }
        
        Object.defineProperties(this,
        {
            message: {value: err.gmsg},
            name: {value:"BPError"},
            atvt: {value:BPError.atvt} // The current activity this thread is engaged in.
        });
        Object.freeze(this);
    }
    BPError.atvt = {}; // Global object for storing current activity
    BPError.prototype.toString = function()
    {
        return JSON.stringify(this);
        /*return this.name + "://" + (this.message? this.message : "") +
                "?activity=" + JSON.stringify(this.atvt) +
               (this.acd? "&acd="+this.acd : "") +
               (this.gcd? "&gcd="+this.gcd : "") + (this.scd? "&scd="+this.scd : "") +
               (this.smg? "&smg="+this.smg : "");*/
    };
    
    return {BPError: BPError};
    /** @end-class-def BPError **/
}());
