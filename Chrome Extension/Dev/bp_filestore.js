/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE, BP_MOD_PLAT, chrome */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin FileStore
 */
var BP_MOD_FILESTORE = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    /** @import-module-begin Error */
    var m = IMPORT(BP_MOD_ERROR),
        BPError = IMPORT(m.BPError),
        MOD_ERROR = m;
    /** @import-module-begin common **/
    m = BP_MOD_COMMON;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        toJson = IMPORT(m.toJson),
        uid_aliases = IMPORT(m.uid_aliases),
        pass_aliases= IMPORT(m.pass_aliases),
        url_aliases = IMPORT(m.url_aliases),
        parseURL = IMPORT(m.parseURL),
        stripQuotes = IMPORT(m.stripQuotes);
    /** @import-module-begin connector **/
    m = BP_MOD_CONNECT; 
    var newPRecord = IMPORT(m.newPRecord);
    /** @import-module-begin MemStore **/
    var MEM_STORE = IMPORT(BP_MOD_MEMSTORE);
    /** @import-module-end **/    m = null;

    /** @constant ID of BP-Plugin HtmlEmbedElement*/
    var eid_bp = "com-untrix-bpplugin",
    // Points to the bp-plugin
        BP_PLUGIN,
        /** File/Dirname extenstions */
        ext_Root = ".3ab",
        ext_Dict = ".3ad",
        ext_Open = ".3ao",
        ext_Closed=".3ac",
        ext_MMap = ".3am",
        ext_Temp = ".3at",
        ext_Csv  = ".csv",
        path_sep,
        /** Record Separator in the files */
        rec_sep = '\r\n\r\n,',
        /**
         * Name of knowledge-dict directory on filesystem. Should be case insensitive
         * since not all filesystems will honor case.
         */
        dir_k = ".k" + ext_Dict,
        file_k = ".k" + ext_Open,
        /**
         * Name of passwords-dict directory on filesystem. Should be case insensitive
         * since not all filesystems will honor case.
         */
        dir_p = ".p" + ext_Dict,
        file_p = ".p" + ext_Open,
        g_dbPath, // Currently opened DB's root path. Will be set at runtime.
        g_path_k, // File to write e/k-records to. Will be set at runtime.
        g_path_p; // File to write p-records to. Will be set at runtime.
       
    function parseSegment (sgmnt)
    {
        var regex = /^(.*)(\.[^.]+)$/;
        var o = {name: sgmnt};
        
        if (sgmnt)
        {
            var vals=[], array;
            array = regex.exec(sgmnt);
            if (array) {
                o.stem = array[1];
                o.ext = array[2];
            }
            else {
                o.stem = sgmnt;
            }
        }
        
        return o;
    }
        
    function cullDBName(dbPath)
    {
        var regex, array;
        if (path_sep === "/") {
            regex = /^.*\/([^\/]+)$/;
        }
        else {
            regex = /^.*\\([^\\]+)$/;
        }
        
        array = regex.exec(dbPath);
        if (array) {
            var o = parseSegment(array[1]);
            if (o) {
                return o.stem;
            }
        }
    }
    
    function parsePath(path)
    {
        var regex = /(?:^[\/\\]*)?(?:([^\\\/]+)[\\\/]+)/g;
        var lastex =/([^\\\/]+)$/; 
        if (path)
        {
            var vals=[], idx, array;
            while ((array = regex.exec(path)))
            {
                vals.push(parseSegment(array[1]));
                idx = regex.lastIndex;
            }
            // Catch the last field. It has no comma at the end.
            array = lastex.exec(path.slice(idx));
            if (array && array[1]) {
                vals.push(parseSegment(array[1]));
            }
            
            return vals.length ? vals : null;
        }
    }

    function insideDB (dbPath, out)
    {
        var pathArray = parsePath(dbPath), 
            i, j, inDB=false;
        
        for (i = pathArray.length - 1; i >= 0; i--)
        {
            if (pathArray[i] && (pathArray[i].ext === ext_Root)) {
                inDB = true;
                break;
            }
        }
        
        if (inDB && out) 
        {
            for (out.dbPath='',j=0; j<=i; j++) {
                out.dbPath += (j>0 ? path_sep : '') + pathArray[j].name;
            }
        }
        
        return inDB;
    }
        
    function getDBPath ()
    {
        return g_dbPath;
    }
    
    function getDBName ()
    {
        return cullDBName(g_dbPath);
    }
    
    function insertRec(rec)
    {
        var result = false, o={};
        switch (rec.dt) {
            case dt_eRecord:
                result = BP_PLUGIN.appendFile(g_path_k, rec_sep+JSON.stringify(rec), o);
                break;
            case dt_pRecord:
                result = BP_PLUGIN.appendFile(g_path_p, rec_sep+JSON.stringify(rec), o);                
                break;
        }
        
        if (!result) {
            throw new BPError(o.err);
        }
        
        return result;
    }
    
    function loadFile(filePath)
    {
        var i, o={prepend: '[{"header":true}', append: "]"}; // Format the return data like a JSON array.
        BP_PLUGIN.readFile(filePath, o);
        var data = '[{"header":true}' + o.dat + "]";
        var recs = JSON.parse(data);
        if (recs && (typeof recs === 'object') && recs.constructor === Array) {
            for (i=recs.length-1; i>0; i--) {
                try {
                    MEM_STORE.insertRec(recs[i]);
                } catch (e) {
                    var bpe = new BPError(e);
                    BP_MOD_ERROR.log("loadFile@bp_filestore.js (Skipping record) " + bpe.toString());
                }
            }
            MOD_ERROR.log("Loaded file " + filePath);
        }
        else {
            MOD_ERROR.log("File " + filePath + " is corrupted");
        }
    }
    
    function verifyDBForLoad (dbPath) 
    {
        var o={}, goodPath;

        if (!insideDB(dbPath, o)) {
            goodPath = false;
        }
        else {
            dbPath = o.dbPath;
            goodPath = true;
        }

        var path_k = dbPath + path_sep + dir_k,
            path_p = dbPath + path_sep + dir_p;
        
        if (!(goodPath && BP_PLUGIN.ls(dbPath, o) && BP_PLUGIN.ls(path_k, o) && BP_PLUGIN.ls(path_p, o))) {
            throw new BPError("", 'BadPathArgument');
        }
        
        return dbPath;
    }
    
    function loadDB(dbPath)
    {
        var o = {}, file_names, path_dir_p, path_dir_k,
            i, f, dbBad=false;

        // First determine if this DB exists and is good.
        dbPath = verifyDBForLoad(dbPath);
        
        console.log("loadingDB " + dbPath);
        MEM_STORE.clear(); // unload the previous DB.

        g_dbPath = dbPath;
        g_path_k = g_dbPath + path_sep + dir_k + path_sep + file_k;
        g_path_p = g_dbPath + path_sep + dir_p + path_sep + file_p;

        // Load P-Records
        o={};
        if (BP_PLUGIN.ls(g_dbPath + path_sep + dir_p, o) && o.lsd && o.lsd.f)
        {
            path_dir_p = g_dbPath + path_sep + dir_p + path_sep;
            f = o.lsd.f; file_names = Object.keys(f);
            for (i=file_names.length-1; i>=0; --i)
            {
                if (f[ file_names[i] ].ext === ext_Open) {
                    try {
                        loadFile(path_dir_p + file_names[i]);
                    } catch (e) {
                        var bpe = new BPError(e);
                        BP_MOD_ERROR.warn(bpe);
                        BP_MOD_ERROR.logwarn("Skipping remainder file " + path_dir_p + file_names[i]);
                    }
                }
            }
        }
        // Load K-Records
        o={};
        if (BP_PLUGIN.ls(g_dbPath + path_sep + dir_k, o) && o.lsd && o.lsd.f)
        {
            path_dir_k = g_dbPath + path_sep + dir_k + path_sep;
            f = o.lsd.f; file_names = Object.keys(f);
            for (i=file_names.length-1; i>=0; --i)
            {
                if (f[ file_names[i] ].ext === ext_Open) {
                    try {
                        loadFile(path_dir_k + file_names[i]);
                    } 
                    catch (e) {
                        var bpe = new BPError(e);
                        BP_MOD_ERROR.warn(bpe);
                        BP_MOD_ERROR.logwarn("Skipping remainder file " + path_dir_k + file_names[i]);
                    }
                }
            }
        }
        
        MOD_ERROR.log("Loaded DB " + dbPath);
        return g_dbPath;
    }
    
    function createDB(name, dir) // throws
    {
        var root, i, 
            o = {};
            
        if (insideDB(dir)) {
            throw new BPError(BP_MOD_ERROR.msg.ExistingStore, 'BadPathArgument', 'ExistingStore');
        }
        if (name.slice(name.slice.length - ext_Root.length) !== ext_Root) {
            root = dir + path_sep + name + ext_Root;
        }

        if (BP_PLUGIN.createDir(root,o))
        {
            var p = root + path_sep + dir_p;
            if (!BP_PLUGIN.createDir(p,o)) {
                o={}; BP_PLUGIN.rm(root, o);
                throw new BPError(o.err);
            }
            p = root + path_sep + dir_k;
            if (!BP_PLUGIN.createDir(p,o)) {
                o={}; BP_PLUGIN.rm(root, o);
                throw new BPError(o.err);
            }
        }
        else
        {
            throw new BPError(o.err);
        }
        
        g_dbPath = root; // The DB is deemed loaded (though it is empty)
        return root;
    }

    function findPPropsIdx(keys)
    {
        var rval = {}, i, j, n, k,
            //keys,
            bN = false, bP = false, bU = false;
        //for (i=0; i<5; i++) 
        //{ // Search the first few rows for a valid line
            //keys = Object.keys(recs[i]);
            
            for (j=0, n=keys.length; j<n; j++) 
            {
                k = keys[j];
                if ((!bN) && (uid_aliases.indexOf(k) !== (-1))) {
                    rval.userid = j;
                    bN = true; continue;
                }
                else if ((!bP) && (pass_aliases.indexOf(k) !== (-1))) {
                    rval.pass = j;
                    bP = true; continue;
                }
                else if ((!bU) && (url_aliases.indexOf(k) !== (-1))) {
                    rval.url = j;
                    bU = true; continue;
                }
            }
            
            //if ((bN && bP && bU)) {break;}   // We're done.
            //else {bN = (bP = (bU = false));} // Probably a header line. Start over
        //}
        
        // We'll return rval only if we got all property names
        if (bN && bP && bU) {return rval;}
    }
    
    /**
     * @begin-class-def TextFileStream
    */
    function TextFileStream(pth)
    {
        Object.defineProperties(this,
        {
            path: {value: pth, writable:false, configurable:false, enumerable:true},
            buf: {writable:true, configurable:false, enumerable:false},
            siz: {writable: true, configurable:false, enumerable:true},
            // Skips comment lines (beginning with # or //) and empty lines (only whitespace)
            //regex: {value: new RegExp('(?:^([^#\\/][^\\/].*[^\\s]+.*)$){1,1}?', 'mg'),
            regex: {value: new RegExp('^(?!#)(?!\\/\\/)(.*[^\\s]+.*)$', 'mg'),             writable: false, enumerable: false, configurable: false}
        });
        Object.seal(this);
    }
    // Returns the next data-line, i.e. the next non-comment and non-empty line
    TextFileStream.prototype.getDataLine = function() // throws BPError
    {
        var o={};
        if (!this.buf) {
            if (!BP_PLUGIN.readFile(this.path, o)) {throw new BPError(o.err);}
            this.buf = o.dat;
            this.siz = o.siz;
        }
        var rval = this.regex.exec(this.buf);
        if (rval!==null) {
            //console.log("getDataLine-->" + rval[1]);
            return rval[1];
        }
    };
    
    /** @end-class-def **/
   
    /** 
     * @begin-class-def CSVFile
     * @param props Optional. An array of property names to be provided only when the props are
     *              not embedded within the csv file.
     *              Currently, properties are mapped to pRec properties and if a prop can't be
     *              mapped, then an exception is thrown. Providing a props array from outside
     *              will prevent such a mapping attempt and subsequent exception. That also
     *              means, that this.pidx will stay undefined.
     *  
     */
    function CSVFile(path, _props) // throws BPError
    {
        var n, err = {};
        err.gcode = "InvalidFileContents";
        err.path = path;

        Object.defineProperties(this,
        {
            fstrm: {value: new TextFileStream(path), writable:false, enumerable:false, configurable:false},
            csvex: {value: /\s*,\s*/, writable:false, configurable:false, enumerable:false},
            props: {writable:true, enumerable:false, configurable:false},
            regex: {writable:true, enumerable:false, configurable:false},
            pidx: {writable:true, enumerable:false, configurable:false}
        });
        // Load and Initialize.
        if (!_props) 
        {
            var line = this.fstrm.getDataLine();
            if (!line)
            {throw new BPError(err);}// line is undefined || null || !empty
            
            // Parse the first data-line for property names
           this.props = line.split(this.csvex);// split by space-comma-space
        } else { // Props array was provided.
            this.props = _props;            
        }
        
        if (!this.props || !this.props.length) { throw new BPError(err);}
        else 
        { // Remove leading quotes
            for (n = this.props.length; n; n--)
            {
                this.props[n-1] = stripQuotes(this.props[n-1]);
                if (!this.props[n-1]) {throw new BPError(err);}
            }
        }

        // Map the property names to P-Rec properties if the props derived from the file.
        if (!_props) {
            this.pidx = findPPropsIdx(this.props);
            if (!this.pidx) { throw new BPError(err);}
        }

        // Finally, generate a regular expression for data parsing
        // Make a regexp with props.length capture groups
        var field = "[\\s\"\']*([^\\s\"\']*)[\\s\"\']*",
            separator = '\\s*,\\s*', 
            i,
            regex = '^' + field;

        for (n = this.props.length-1, i=0; i<n; i++)
        {
            regex = regex + separator + field;
        }
        regex = regex + '$';
        this.regex = new RegExp(regex);

        Object.freeze(this);
    }
    // Returns an array of values from the next csv-line in the file. If EOF is encountered,
    // returns undefined. If Line is found, but can't be parsed, then returns null. THis
    // function may get confused by embedded commas (within quotes). getcsv2 handles that
    // case.
    // Returns an  zero-based array of CSV fields.
    CSVFile.prototype.getcsv = function()
    {
        var line = this.fstrm.getDataLine();
        if (line)
        {
            var vals = line.match(this.regex);
            if (vals)
            {
                vals.shift();
                return vals;
            }
            else {return null;} // Line was retrieved but didn't match the pattern.
        }
    };
    // Same semantics as getcsv but better implementation. This function will identify
    // quoted fields with embedded commas.
    // Returns an  zero-based array of CSV fields.
    CSVFile.prototype.getcsv2 = function()
    {
        var regex = /\s*(?:"([^"]*)"|'([^']*)'|([^"',]*))\s*,/g;
        var lastex = /\s*(?:"([^"]*)"|'([^']*)'|([^"',]*))\s*$/;
        var line = this.fstrm.getDataLine();
        if (line)
        {
            var vals=[], idx, array;
            while ((array = regex.exec(line)))
            {
                vals.push(array[1] || (array[2] || array[3]));
                idx = regex.lastIndex;
            }
            // Catch the last field. It has no comma at the end.
            array = lastex.exec(line.slice(idx));
            vals.push(array[1] || (array[2] || array[3]));
            
            if (vals.length === this.props.length) {return vals;}
            else {return null;}
        }
    };
    /** @end-class-def CSVFile **/
   
    function importCSV(path, obfuscated)
    {
        var o={}, rval, i, prec, pidx, csv, line;
        if (BP_PLUGIN.ls(path, o))
        {
            switch (path.slice(-4).toLowerCase())
            {
                case ".csv":
                    BPError.actn = "ImportCSV";
                    var csvf = new CSVFile(path);

                    while ((csv = csvf.getcsv2()) !== undefined)
                    {
                        if (!csv) {continue;} // unparsable line
                        else {BP_MOD_ERROR.loginfo("Importing " + JSON.stringify(csv));}
                        pidx = csvf.pidx;
                        prec = newPRecord(parseURL(csv[pidx.url]), Date.now(), 
                                          csv[pidx.userid],
                                          csv[pidx.pass]);
                        // prec.userid = csv[pidx.userid];                        // prec.pass = csv[pidx.pass];                        // prec.loc = parseURL(csv[pidx.url]);
                        if (!MEM_STORE.PREC_TRAITS.isValid(prec)) {
                            console.log("Discarding invalid csv record - " + JSON.stringify(csv));
                            prec = null; continue;
                        }
                        if (MEM_STORE.insertRec(prec)) {
                            try {
                                insertRec(prec);                                
                            } catch (e) {
                                var bpe = new BPError(e);
                                BP_MOD_ERROR.log("importCSV@bp_filestore.js (Skipping record) " + bpe.toString());
                            }
                        }
                    }
                    return true;
                default:
                    return false;              
            }
        }
        else
        {
            throw new BPError(o.err);
        }
    }
       
    function init (p_sep)
    {
        BP_PLUGIN = document.getElementById(eid_bp);
        path_sep = p_sep || (BP_PLUGIN && BP_PLUGIN.pathSeparator) ? BP_PLUGIN.pathSeparator() : undefined;        
    }
                  
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        init: {value: init},
        importCSV: {value: importCSV},
        CSVFile: {value: CSVFile},
        createDB: {value: createDB},
        loadDB: {value: loadDB},
        getDBPath: {value: getDBPath},
        cullDBName: {value: cullDBName},
        getDBName: {value: getDBName},
        insertRec: {value: insertRec}
    });
    Object.freeze(iface);

    return iface;

}());