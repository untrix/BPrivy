/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* JSLint directives */
/*global $, console, window, com_bprivy_GetModule_3db, com_bprivy_GetModule_CSPlatform, com_bprivy_GetModule_Common */

/**
 * @ModuleBegin adb
 */
function com_untrix_GetModule_adb(g_doc)
{
    /** @import-module-begin 3db */
    var m = com_bprivy_GetModule_3db();
    var dt_eRecord = m.dt_eRecord;
    var dt_pRecord = m.dt_pRecord;
    /** @import-module-begin common **/
    m = com_bprivy_GetModule_Common;
    var toJson = m.toJson;
    /** @import-module-end **/    m = null;

    /** @constant ID of BP-Plugin HtmlEmbedElement*/
    var eid_bp = "com-untrix-bpplugin";
    // Points to the bp-plugin
    var g_bp = g_doc.getElementById(eid_bp);  
    /**
     * Name of knowledge-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_k = "kdict";
    /**
     * Name of passwords-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_p = "pdict";
    /** File/Dirname extenstions */
    var ext_Root = ".3db";
    var ext_Dict = ".3ad";
    var ext_Open = ".3ao";
    var ext_Closed=".3ac";
    var ext_MMap = ".3am";
    
    function insertRecord(rec)
    {
        switch (rec.dt)
        {
            case dt_pRecord: // password rec
            
            case dt_eRecord: // knowledge rec  
            default:
            break;         
        }
    }
    
    function createDB(path)
    {
        var p = path + ext_Root;
        var o2, o={};
        if (g_bp.createDir(path,o))
        {
            p = path + "/" + dir_p;
            if (!g_bp.createDir(p)) {
                o2={}; g_bp.rm(path, o2);
                return o.err;
            }
            p = path + "/" + dir_k;
            if (!g_bp.createDir(p)) {
                o2={}; g_bp.rm(path, o2);
                return o.err;
            }
        }
        else
        {
            return o.err;
        }
    }
    
    function loadDB(path)
    {
        var o={};
        if (g_bp.ls(path, o))
        {
            switch (path.slice(-4).toLowerCase())
            {
                case ".csv":
                
                break;
                
                case ".3db":
                break;
            }
        }
        else
        {
            var err = o.err.gmsg + ". " + o.err.smsg;
            console.error(err);
        }
    }
}
