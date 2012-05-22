/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* JSLint directives */
/*global $, console, window, com_bprivy_GetModule_Connector, com_bprivy_GetModule_CSPlatform, com_bprivy_GetModule_Common */

/**
 * @ModuleBegin FileStore
 */
function com_untrix_GetModule_FileStore(g_doc)
{
    /** @import-module-begin common **/
    var m = com_bprivy_GetModule_Common;
    var dt_eRecord = m.dt_eRecord;
    var dt_pRecord = m.dt_pRecord;
    var toJson = m.toJson;
    var uid_aliases = m.uid_aliases;
    var pass_aliases= m.pass_aliases;
    var url_aliases = m.url_aliases;
    var m.parseURL = m.parseURL;
    /** @import-module-begin connector **/
    m = com_bprivy_GetModule_Connector; 
    var constructPRecord = m.constructPRecord;
    /** @import-module-end **/    m = null;

    /** @constant ID of BP-Plugin HtmlEmbedElement*/
    var eid_bp = "com-untrix-bpplugin";
    // Points to the bp-plugin
    var g_bp = g_doc.getElementById(eid_bp);  
    /**
     * Name of knowledge-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_k = "k";
    /**
     * Name of passwords-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_p = "p";
    /** File/Dirname extenstions */
    var ext_Root = ".3db";
    var ext_Dict = ".3ad";
    var ext_Open = ".3ao";
    var ext_Closed=".3ac";
    var ext_MMap = ".3am";
    
    function savePRec(rec)
    {
        // switch (rec.dt)
        // {
            // case dt_pRecord: // password rec
//             
            // case dt_eRecord: // knowledge rec  
            // default:
            // break;         
        // }
    // }
    
    function createDB(path, o)
    {
        var p = path + ext_Root;
        var o2;
        if (g_bp.createDir(path,o))
        {
            p = path + "/" + dir_p;
            if (!g_bp.createDir(p)) {
                o2={}; g_bp.rm(path, o2);
                return false;
            }
            p = path + "/" + dir_k;
            if (!g_bp.createDir(p)) {
                o2={}; g_bp.rm(path, o2);
                return false;
            }
        }
        else
        {
            return false;
        }
        
        return true;
    }
    
    function findPPropsIdx(props)
    {
        var rval = {}, keys = Object.keys(props);
        var bN = false, bP = false, bU = false;
        for (var p, i=0; i<keys.length; i++) {
            p = keys[i];
            if ((!bN) && (p in uid_aliases)) {
                rval.name = i;
                bN = true;
                continue;
            }
            else if ((!bP) && (p in pass_aliases)) {
                rval.pass = i;
                bP = true;
                continue;
            }
            else if ((!bU) && (p in url_aliases)) {
                rval.url = i;
                bU = true;
                continue;
            }
        }
        
        // We'll return rval only if we got all property names
        if (bN && bP && bU) {return rval;}
    }
    
    function importCSV(path, insPRec)
    {
        var o={}, rval, i, recs, crec, prec, pProps;
        if (g_bp.ls(path, o))
        {
            switch (path.slice(-4).toLowerCase())
            {
                case ".csv":                   
                    rval = g_bp.readFile(path, o);
                    if (!rval) {throw o.err;}
                    recs = $.csv2Array(o.rdf);
                    pProps = findPPropsIdx(recs[0]);
                    if (pProps)
                    {   //Iterate csv starting with second item
                        for (i=1; i<recs.length; i++)
                        {
                            crec = recs[i];
                            prec = constructPRecord();
                            prec.userid = crec[pProps.userid];
                            prec.pass = crec[pProps.pass];
                            prec.loc = parseURL(pProps.url);
                            if (insPRec(prec)) {
                                savePRec(prec);
                            }
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
                default:
                    return false;
                // case ".3db":
                    // path = path + "/" + dir_p + "/open.3eo";
                    // rval = g_bp.readJFile(path, o);
                    // if (!rval) {throw o.err;}
                    // recs = JSON.parse(o.rdf);
                    // return recs;
//                 
                // case ".3eo":
                // case ".3ec":
                    // rval = g_bp.readJFile(path, o);
                    // if (!rval) {throw o.err;}
                    // recs = JSON.parse(o.rdf);
                    // return recs;                
            }
        }
        else
        {
            var err = o.err.gmsg + "(" + o.err.gcode + "). " + o.err.smsg;
            console.error(err);
            g_doc.defaultView.alert(err);
            return false;
        }
    }
}
