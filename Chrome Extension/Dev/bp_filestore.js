/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE, BP_MOD_PLAT, chrome, BP_MOD_TRAITS, window */
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
    var toJson = IMPORT(m.toJson),
        uid_aliases = IMPORT(m.uid_aliases),
        pass_aliases= IMPORT(m.pass_aliases),
        url_aliases = IMPORT(m.url_aliases),
        parseURL = IMPORT(m.parseURL),
        stripQuotes = IMPORT(m.stripQuotes);
    /** @import-module-begin **/
    m = BP_MOD_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
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
        /** Record Separator in the files */
        rec_sep = '\r\n\r\n,';
               
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

    var DB_FS = (function ()
    {
        var g_dbPath, // Currently opened DB's root path. Will be set at runtime.
            g_path_dt={}, // File to write e/k-records to. Will be set at runtime.
            g_dbStats,  // Will be set at runtime.
            dir_dt={}, // Name of directory holding "dt" dictionary. populated below
            file_dt={},// Name of the (only) file to write given dt records to. populated below
                       // For a given dt, we can read multiple files but only write to one - this one.
            csv_dt={}, // Name of csv file to export dt records to. populated below
            valid_dt={},// populated below
            path_sep = null, // populated below
            dt_settings = IMPORT(BP_MOD_TRAITS.dt_settings),
            dtl = [dt_eRecord, dt_pRecord, dt_settings],
            DOT = '.';

        var mod =
        {
            dtl: dtl,
            valid_dt: valid_dt,
             /** File/Dirname extenstions */
            ext_Root: ".3ab",
            ext_Dict: ".3ad",
            ext_Open: ".3ao",
            ext_Closed:".3ac",
            ext_MMap: ".3am",
            ext_Temp: ".3at",
            ext_Bad : ".3aq", // q => Quarantine
            ext_Csv : ".csv",
            ft_Open : "ft_Open",
            ft_Closed:"ft_Closed",
            ft_Temp : "ft_Temp",
            ft_Bad  : "ft_Bad",
            ft_Loaded:"ft_Loaded",
            cullDBName: function (dbPath)
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
            },
            putPathSep: function (p_sep)
            {
                path_sep = p_sep || BP_PLUGIN.pathSeparator();
            },
            getPathSep: function ()
            {
                return path_sep;
            },
            setDBPath: function (dbPath, dbStats)
            {
                if (dbPath)
                {
                    g_dbPath = dbPath;
                    dtl.forEach(function (dt, i)
                    {
                        g_path_dt[dt] = g_dbPath + path_sep + dir_dt[dt]+ path_sep + file_dt[dt];
                    });
                }
                else {
                    g_dbPath = null;
                    dtl.forEach(function (dt, i)
                    {
                        g_path_dt[dt] = null;
                    });
                }
                
                g_dbStats = dbStats;
            },
            getDTFilePath: function (dt)
            {
                return g_path_dt[dt];
            },
            getDTFileName: function (dt)
            {
                return file_dt[dt];
            },
            getDBPath: function  ()
            {
                return g_dbPath;
            },
            getDBName: function ()
            {
                return mod.cullDBName(g_dbPath);
            },
            getDBStats: function ()
            {
                return g_dbStats;
            },
            makeDTFilePath: function (dt, dbPath)
            {
                var fname = file_dt[dt];
                if (!dbPath || !fname) {
                    MOD_ERROR.logwarn("@makeDTFilePath: Bad argument supplied. path="+dbPath+" dt="+dt); 
                    throw new BPError("", "InternalError");
                }
                
                if (fname) {
                    return mod.makeDTDirPath(dt, dbPath) + file_dt[dt];
                }
            },            
            makeClosedDTFilePath: function(dt, dbPath)
            {
                if (!dbPath || !valid_dt[dt]) {
                    MOD_ERROR.logwarn("@makeClosedDTFilePath: Bad argument supplied.");
                    throw new BPError("", "InternalError");
                }
                
                return mod.makeDTDirPath(dt, dbPath) + Date.now().valueOf() + DOT + dt + mod.ext_Closed;
            },
            makeTempDTFilePath: function(dt, dbPath)
            {
                if (!dbPath || !valid_dt[dt]) {
                    MOD_ERROR.logwarn("@makeTempDTFilePath: Bad argument supplied.");
                    throw new BPError("", "InternalError");
                }
                return mod.makeDTDirPath(dt, dbPath) + Date.now().valueOf() + DOT + dt + mod.ext_Temp;
            },
            makeBadDTFilePath:  function(dt, dbPath)
            {
                if (!dbPath || !valid_dt[dt]) {
                    MOD_ERROR.logwarn("@makeBadDTFilePath: Bad argument supplied."); 
                    throw new BPError("", "InternalError");
                }
                return mod.makeDTDirPath(dt, dbPath) + Date.now().valueOf() + DOT + dt + mod.ext_Bad;
            },
            makeCsvFilePath: function (dt, dirPath)
            {
                if (!dirPath || !valid_dt[dt]) {
                    MOD_ERROR.logwarn("@makeCsvFilePath: Bad argument supplied."); 
                    throw new BPError("", "InternalError");
                }
                
                return dirPath + path_sep + csv_dt[dt] + "_" + Date.now() + mod.ext_Csv;
            },
            makeDTDirPath: function (dt, dbPath)
            {
                if (!dbPath || !valid_dt[dt]) {
                    MOD_ERROR.logwarn("@makeDTDirPath: Bad argument supplied. path="+dbPath+" dt="+dt); 
                    throw new BPError("", "InternalError");
                }
                return dbPath + path_sep + dir_dt[dt] + path_sep;                
            },
            makeDBPath: function (name, dir)
            {
                var dbPath = dir + path_sep + name;
                if (name.slice(name.length - mod.ext_Root.length) !== mod.ext_Root) 
                {
                    dbPath += mod.ext_Root;
                }
                return dbPath;
            },
            insideDB: function  (dbPath, out)
            {
                var pathArray = parsePath(dbPath), 
                    i, j, inDB=false;
                
                for (i = pathArray.length - 1; i >= 0; i--)
                {
                    if (pathArray[i] && (pathArray[i].ext === mod.ext_Root)) {
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
            },
            verifyDBForLoad: function (dbPath)
            {
                var o={}, goodPath;
        
                if (!mod.insideDB(dbPath, o)) {
                    goodPath = false;
                }
                else {
                    dbPath = o.dbPath;
                    goodPath = true;
                }
        
                var path_k = dbPath + path_sep + dir_dt[dt_eRecord],
                    path_p = dbPath + path_sep + dir_dt[dt_pRecord];
                
                if (!(goodPath && BP_PLUGIN.ls(dbPath, o) && BP_PLUGIN.ls(path_k, o) &&
                    BP_PLUGIN.ls(path_p, o)))
                {
                    throw new BPError("", 'BadPathArgument');
                }
                
                return dbPath;
            },
            /** 
             * Returns true if the file should be loaded into the DB
             * @param {Object} dirEnt dirEnt should be a dir-entry listing from BP_PLUGIN.ls and it should
             *      be a regular file. IN other words, it should be obtained from o.lsd.f or o.lsf   
             */
            toLoad: function (dirEnt)
            {
                switch (dirEnt.ext)
                {
                    case mod.ext_Open:
                    case mod.ext_Closed:
                    case mod.ext_Temp:
                        return true;
                    default:
                        return false;
                }
            },
            getType: function (fname)
            {
                var ext = fname.lastIndexOf(".");
                if (ext===-1) {
                    return false;
                }
                else {
                    ext = fname.slice(ext);
                    switch (ext)
                    {
                        case mod.ext_Closed:
                            return mod.ft_Closed;
                        case mod.ext_Open:
                            return mod.ft_Open;
                        case mod.ext_Temp:
                            return mod.ft_Temp;
                        case mod.ext_Bad:
                            return mod.ft_Bad;
                        default:
                            return undefined;
                    }
                }
            },
            isType: function (fType, fname)
            {
                var ext = fname.lastIndexOf(".");
                if (ext===-1) {
                    return false;
                }
                else {
                    ext = fname.slice(ext);
                    switch (fType)
                    {
                        case mod.ft_Closed:
                            return (ext === mod.ext_Closed);
                        case mod.ft_Temp:
                            return (ext === mod.ext_Temp);
                        case mod.ft_Open:
                            return (ext === mod.ext_Open);
                        case mod.ft_Bad:
                            return (ext === mod.ext_Bad);
                        default:
                            return false;
                    }
                }
            },
            isBad: function (fname)
            {
                return mod.isType(mod.ft_Bad, fname);
            },
            lsFiles: function (dbPath)
            {
                var dbStats = newDBStats(dbPath),
                    ft;
                DB_FS.dtl.forEach(function (dt, jj, dtl)
                {
                    var o={}, i, file_names, f,
                        path_dir = DB_FS.makeDTDirPath(dt, dbPath),
                        j, name;
                    if (BP_PLUGIN.ls(path_dir, o) && o.lsd && o.lsd.f)
                    {
                        f = o.lsd.f;
                        file_names = Object.keys(f);
        
                        // List files in reverse chronological order for faster insertion into
                        // MEM_STORE.
                        file_names.sort(function (x,y)
                        {
                            // We want a reverse-sort, hence flip x and y.
                            return f[y].mtm-f[x].mtm;
                        });
                        
                        for (j=0; j < file_names.length; j++)
                        {
                            name = file_names[j];
                            if ((ft=DB_FS.getType(name)))
                            {
                                dbStats.putDT(ft, dt, name, f[name]);
                            }
                        }
                    }
                });
                
                return dbStats;
            }          
        };
                
        // populate dir and file with all possible data-types
        // Right now, we're using the dt string as the file/dirname as well. However,
        // if needed a mapping can be performed in this function. For e.g. dt_eRecord
        // may be mapped to filename '.k.3ao' instead of '.e.3ao' if desired.
        dtl.forEach(function (dt, i)
        {
            dir_dt[dt] = dt + mod.ext_Dict;
            file_dt[dt]= dt + mod.ext_Open;
            valid_dt[dt] = true;
            
            switch (dt)
            {
                case dt_pRecord:
                    csv_dt[dt] = "UWallet_passwords";
                    break;
                default:
                    csv_dt[dt] = "UWallet_" + dt;
            }
        });

        return Object.freeze(mod);
    }());

    function newDBStats (dbPath)
    {
        function DBStats(dbPath)
        {
            Object.seal(Object.defineProperties(this,
            {
                dbPath: {value:dbPath},
                fs:     {value: {}, enumerable:true, writable:true},
                recs:   {value:
                    {
                        loaded: 0,
                        fluff:  0,
                        bad:    0
                    }, enumerable:true}
            }));
            
            Object.defineProperty(this.fs, DB_FS.ft_Loaded, {value: {}, writable:true});
            Object.defineProperty(this.fs, DB_FS.ft_Open, {value: {}, writable:true});
            Object.defineProperty(this.fs, DB_FS.ft_Closed, {value: {}, writable:true});
            Object.defineProperty(this.fs, DB_FS.ft_Temp, {value: {}, writable:true});
            Object.defineProperty(this.fs, DB_FS.ft_Bad, {value: {}, writable:true});
        }
        DBStats.prototype.getFSCat = function (cat)
        {
            return this.fs[cat];
        };
        DBStats.prototype.getFSCatDT = function (dt, cat)
        {
            if (!this.fs[cat][dt])
            {
                if (!DB_FS.valid_dt[dt])
                {
                    throw new BPError ('@DBStats.prototype.get', 'InternalError', 'BadArgument');
                }
                else
                {
                    this.fs[cat][dt] = {};
                }
            }

            return this.fs[cat][dt];
        };
        DBStats.prototype.num = function (cat)
        {
            var dtl = Object.keys(this.fs[cat]),
                i, num;
            
            for (num=0,i=dtl.length-1; i>=0; i--)
            {
                num += Object.keys(this.fs[cat][dtl[i]]).length;
            }
            
            return num;
        };
        DBStats.prototype.putDT = function (cat, dt, name, dirent)
        {
            this.getFSCatDT(dt, cat)[name]=dirent;
        };
        DBStats.prototype.loadedDT = function (dt, name, dirent)
        {
            this.putDT(DB_FS.ft_Loaded, dt, name, dirent);
        };
        DBStats.prototype.badDT = function (dt, name, dirent)
        {
            this.putDT(DB_FS.ft_Bad, dt, name, dirent);
        };
        DBStats.prototype.numLoaded = function ()
        {
            return this.num(DB_FS.ft_Loaded);
        };
        DBStats.prototype.numBad = function ()
        {
            return this.num(DB_FS.ft_Bad);
        };
        DBStats.prototype.updRecs = function (notes)
        {
            if (notes && notes.isNew) {
                if (notes.causedOverflow) {
                    this.recs.fluff++;
                }
                else {
                    this.recs.loaded++;
                }
            }
            else if (notes) { // if (rec.notes.isOldRepeat || rec.notes.isNewRepeat || rec.notes.isOverflow)
                this.recs.fluff++;
            }
            else {
                this.recs.bad++;
            }
        };
        DBStats.prototype.diffNewClosed = function (other)
        {
            var dtl = Object.keys(this.getFSCat(DB_FS.ft_Closed)),
                diff = newDBStats(this.dbPath),
                fname, j;
            dtl.forEach(function (dt, i, dtl)
            {
                var stats1 = this.getFSCatDT(dt, DB_FS.ft_Closed),
                    fnames1 = Object.keys(stats1),
                    stats2 = other.getFSCatDT(dt, DB_FS.ft_Closed);
                    
                //fnames1.forEach(function(fname, i, fnames)
                for (j=fnames1.length-1; j>=0; j--)
                {
                    fname = fnames1[j];
                    if (!stats2.hasOwnProperty(fname))
                    {
                        diff.putDT(DB_FS.ft_Closed, dt, fname, stats1[fname]);
                    }
                }
            }, this);
            
            return diff;
        };
        DBStats.prototype.clrRecs = function ()
        {
            this.recs.loaded = this.recs.fluff = this.recs.bad = 0;
        };
        DBStats.prototype.walkCat = function (cat, callback, db2)
        {
            var fsCat = this.getFSCat(cat),
                dtl = Object.keys(fsCat), i, j;
            for (i=0; i<dtl.length; i++)
            {
                var dt = dtl[i],
                    dtDirPath = DB_FS.makeDTDirPath(dt, this.dbPath),
                    dtDirPath2= db2 ? DB_FS.makeDTDirPath(dt, db2) : undefined,
                    fnames = Object.keys(fsCat[dt]),
                    len = fnames.length,
                    fpath;
                    
                for (j=0; j<len; j++)
                {
                    fpath = dtDirPath + fnames[j];
                    callback(fpath, dt, cat, fnames[j], dtDirPath2);
                }
            }
        };

        
        return new DBStats(dbPath);
    }


    function unloadDB()
    {
        MEM_STORE.clear(); // unload the previous DB.
        DB_FS.setDBPath(null);
    }
    
    /**
     * @param filePath
     * @param dt
     * @parm  {Boolean} bP Dictates whether or not the records should be saved to DB after
     *        reading. Used for mergeDB operations where records are loaded from an external
     *        DB and written onto the currently open DB.
     */
    function loadFile(filePath, dt, dbStats)
    {
        var i, notes, 
            //loaded=0,
            ftraits = MEM_STORE.DT_TRAITS.getTraits(dt).file,
            // Have BPPlugin format the return data like a JSON array. It is more efficient
            // to do this inside the plugin because it can prefix and suffix the data
            // without having to copy it over. In the case of javascript strings are immutable
            // and hence we would have to copy the string over twice in order to prepend
            // and append to the string (perhaps using typed-arrays may circumvent one of
            // the two copies).
            o={prefix: '[{"header":true}', suffix: "]"};
        BP_PLUGIN.readFile(filePath, o);
        var recs = JSON.parse(o.dat);
        if (recs && (typeof recs === 'object') && recs.constructor === Array)
        {
            // Loading records in reverse chronological order for faster insertion into
            // MEM_STORE.
            
            // Remove the first entry that we artifically inserted above.
            delete recs[0];
            recs.reduceRight(function(accum, rec, i, recs)
            {
                try
                {
                    notes = MEM_STORE.insertRec(rec, dt);
                    dbStats.updRecs(notes);
                } 
                catch (e) 
                {
                    var bpe = new BPError(e);
                    BP_MOD_ERROR.log("loadFile@bp_filestore.js (Skipping record) " + bpe.toString());
                    dbStats.recs.bad++;
                }
            },0);
            MOD_ERROR.log("Loaded file " + filePath);
        }
        else 
        {
            MOD_ERROR.log("File " + filePath + " is corrupted");
        }
    }
      
    /**
     * Helper function to loadDB 
     */
    function loadDBFiles(dbPath, io)
    {
        var dbStats = io.dbStats || newDBStats(dbPath);
        if (!io.dbStats) {io.dbStats = dbStats;}
        
        DB_FS.dtl.forEach(function (dt, jj, dtl)
        {
            var o={}, i, file_names, f,
                path_dir = DB_FS.makeDTDirPath(dt, dbPath),
                j, name;
            if (BP_PLUGIN.ls(path_dir, o) && o.lsd && o.lsd.f)
            {
                f = o.lsd.f;
                file_names = Object.keys(f);

                // Load files in reverse chronological order for faster insertion into
                // MEM_STORE.
                file_names.sort(function (x,y)
                {
                    // We want a reverse-sort, hence flip x and y.
                    return f[y].mtm-f[x].mtm;
                });
                
                for (j=0; j < file_names.length; j++)
                {
                    name = file_names[j];
                    if (DB_FS.toLoad(f[name]))
                    {
                        try 
                        {
                            loadFile(path_dir + name, dt, dbStats);
                            dbStats.loadedDT(dt, name, f[name]);
                        }
                        catch (e) 
                        {
                            var bpe = new BPError(e),
                                oldPath = path_dir + name,
                                newPath = DB_FS.makeBadDTFilePath(dt, dbPath);
                            BP_MOD_ERROR.logwarn("Moving bad file " + oldPath + " to " + newPath);
                            o={};
                            BP_PLUGIN.rename(oldPath, newPath, o);
                            dbStats.badDT(dt, name, f[name]);
                        }
                    }
                    else if (DB_FS.isBad(name)) 
                    {
                        dbStats.badDT(dt, name, f[name]);
                    }
                }
            }
        });
        
        return dbStats;
    }
    
    function tempDTFiles(dbPath)
    {
        DB_FS.dtl.forEach(function (dt, j, dtl)
        {
            var o, i,
                path_dir = DB_FS.makeDTDirPath(dt, dbPath),
                frmPath,
                toPath,
                done;

            frmPath = DB_FS.makeDTFilePath(dt, dbPath);
            toPath  = DB_FS.makeTempDTFilePath(dt, dbPath);
            
            for (i=0; i<3 && !done; i++) // try 3 times to create a unique filename
            {
                o={};
                if (!BP_PLUGIN.exists(frmPath, o)) {
                    done = true;
                    continue;
                }
                
                o={};
                done = BP_PLUGIN.rename(frmPath, toPath, o, false); // don't clobber
                if (!done)
                {
                    // Looks like a vestige of a failed previous attempt. We shouldn't
                    // delete it, let's try another filename
                    if (o.err && o.err.gcode==='WouldClobber')
                    {
                        toPath  = DB_FS.makeTempDTFilePath(dt, dbPath);
                    }
                    else
                    {
                        throw new BPError(o.err);
                    }
                }
            }
        });
    }
    
    /**
     * @param dbPath
     * @return          returns the root of the DB-folder that was read/loaded. Should be
     *                  equal to the dbPath if it was the root of the DB. If DB path was a
     *                  path inside an existing DB, then the system backtracks up to the root
     *                  of the DB and loads that. That's the path which is returned.
     *                  io.dbStats is populated with stats of the opened files.   
     */
    function loadDB(dbPath, io)
    {
        var dbStats;
        if (!io) {io = {};}
        // First determine if this DB exists and is good.
        dbPath = DB_FS.verifyDBForLoad(dbPath);

        if (!io.merge)
        {
            console.log("loadingDB " + dbPath);
            MEM_STORE.clear(); // unload the previous DB.
        }
        else
        {
            if (dbPath === DB_FS.getDBPath())
            {
                throw new BPError("This wallet is already loaded. Specify a different one");
            }
            console.log("Merging in DB " + dbPath);
        }
        
        loadDBFiles(dbPath, io);
        dbStats = io.dbStats;
        DB_FS.setDBPath(dbPath, dbStats);
                
        MOD_ERROR.log("Loaded DB " + dbPath + ". files loaded: "+dbStats.numLoaded()+
                      ", files bad: "+dbStats.numBad()+
                      ", recs loaded: "+dbStats.recs.loaded + ", recs bad: " +dbStats.recs.bad +
                      ", recs fluff: " +dbStats.recs.fluff);
        return dbPath;
    }
    
    /** 
     * Removes the files whose names are obtained from dbStats.getFSCat. Won't delete
     * the main DT file though. Will remove all other files listed in the
     * files object.
     */
    // function rmFiles (fsCat, dbPath)    // {        // var dtl = Object.keys(fsCat), i, j;        // for (i=0; i<dtl.length; i++)        // {            // var dt = dtl[i],                // dirPath = DB_FS.makeDTDirPath(dt, dbPath),                // fnames = Object.keys(fsCat[dt]),                // len = fnames.length,                // o;//                             // for (j=0; j<len; j++)            // {                // o={};                // if (fnames[j] === DB_FS.getDTFileName(dt)) { // TODO:                     // // Skp the main DT-file                    // continue;                // }                // BP_PLUGIN.rm(dirPath + fnames[j], o);            // }        // }    // }
    
    function rmFilesCat (cat, dbStats)
    {
        function rm(fpath, dt, ft, fname, dtDirPath2)
        {
            var o = {};
            if (fname !== DB_FS.getDTFileName(dt))
            { 
                // Skp the main DT-file
                BP_PLUGIN.rm(fpath, o);
            }       
        }
        dbStats.walkCat(cat, rm, null);
    }
    
    // Constructor. Inherits from Array
    function RecsBuf(sep)
    {
        Object.defineProperties(this,
        {
            sep:    {value: sep||rec_sep}
        });
    }
    RecsBuf.prototype = Object.create(Array.prototype);
    RecsBuf.prototype.flush = function (fpath)
    {
        var o={};
        if (!BP_PLUGIN.appendFile(fpath, this.sep, o) ||
            !BP_PLUGIN.appendFile(fpath, this.join(this.sep), o))
        {
            throw new BPError(o.err);
        }
        else 
        {
            this.length = 0;
        }
    };

    function insertRec(rec, dt)
    {
        var result = false, 
            dtPath = DB_FS.getDTFilePath(dt),
            o={};

        if (dtPath)
        {
            result = BP_PLUGIN.appendFile(dtPath, rec_sep+JSON.stringify(rec), o);
            if (!result) {
                throw new BPError(o.err);
            }
        }
        
        return result;
    }
    
    function compactDB(io)    {        var io2 = {},
            dbPath = DB_FS.getDBPath(),
            dt, 
            dnIt, dn, recs, rIt, acoll, aIt, arec,
            buf, o,
            i, dtPath,
            temp;        // 1. Move files to <rand-number>.<dt>.3at with clobbering disabled.        // 2. Reload DB. (loads all loadable file extensions in the DB).        // 3. Append MEM_STORE to <rand>.<dt>.3ac files until the last batch which will go to the
        //    usual DT file <dt>.3ao. Normally <dt>.3ao files shouldn't exist        //    because we renamed them in step 1. In case DropBox or another browser        //    instance had created the files between then and now, we will end-up        //    appending the compacted records to the file - and that's exactly what we want.        // 4. Remove files loaded in step-2.        
        if (!dbPath) {
            throw new BPError ("No DB loaded");
        }        tempDTFiles(dbPath);        dbPath = loadDB(dbPath, io);
        io.dbStats.clrRecs();
        // Iterate the MEM_STORE and write recs to the appropriate files.
        for (i=0; i<DB_FS.dtl.length; i++)
        {
            dt = DB_FS.dtl[i];
            dnIt = MEM_STORE.newDNodeIterator(dt);
            buf = new RecsBuf();
            while ((dn=dnIt.next()))
            {
                if ((recs=dn.getData(dt)))
                {
                    rIt = new BP_MOD_TRAITS.RecsIterator(recs);
                    while ((acoll=rIt.next()))
                    {
                        aIt = acoll.newIt();
                        for (arec=aIt.next(); 
                             arec; 
                             arec=aIt.next())
                        {
                            buf.push(JSON.stringify(arec));
                            io.dbStats.recs.loaded++;                            if (buf.length>=100)                            {
                                buf.flush(DB_FS.makeClosedDTFilePath(dt, dbPath));                            }
                        }
                    }
                }
            }
            
            if (buf.length)
            {
                buf.flush(DB_FS.getDTFilePath(dt));
            }
        }
        
        //rmFiles(io.dbStats.getFSCat('loaded'), dbPath);
        rmFilesCat(DB_FS.ft_Loaded, io.dbStats);
        return dbPath;    }

    function mergeDirs (io)
    {
        var dbStats1 = DB_FS.lsFiles(io.db1),
            dbStats2 = DB_FS.lsFiles(io.db2),
            dbStats1_new = dbStats1.diffNewClosed(dbStats2),
            dbStats2_new = dbStats2.diffNewClosed(dbStats1);
            
        function copy(fpath, dt, ft, fname, dtDirPath2)
        {
            var toPath = dtDirPath2 + fname,
                o = {};
                        
            if (!BP_PLUGIN.copy(fpath, toPath, o, false)) {
                throw new BPError (o.err);
            }
        }

        dbStats2_new.walkCat(DB_FS.ft_Closed, copy, io.db1);
        dbStats1_new.walkCat(DB_FS.ft_Closed, copy, io.db2);
    }
        function mergeDB(db2, out)    {
        var db1 = DB_FS.getDBPath(),
            io = {db1:db1, db2:db2};
        
        if (!db1) {
            throw new BPError ("No DB loaded");
        }
        else if (!db2) {
            throw new BPError ("DB2 not selected", "InternalError", "BadArgument");
        }
        else if (db2===db1) {
            throw new BPError ("This wallet is already loaded. Please select a different one.", "UserError", "BadArgument");
        }
                mergeDirs(io);
        return true;
        //var io2 = {};
        //loadDB(db1, io2);
        //loadDTFiles(db2, {persist:true});
        // if (!oneWay)        // {            // DB_FS.copyDTFiles(db2);        // }    }
    // function mergeInDB(db1, db2)    // {        // DB_FS.mvDBFiles(db1, 'merging');        // loadDB(db1);        // loadDB(db2, {merge:true});        // MEM_STORE.append(db1);        // DB_FS.rmDBFiles('compacting');    // }//         // function mergeOutDB(db1, db2)    // {        // MEM_STORE.blockInserts(); // Since we'll be loading the db2, we don't want any                                   // // inserts to it while we're merging because from user                                  // // POV those inserts were meant for db1        // mergeInDB(db2, db1);        // loadDB(db1);        // MEM_STORE.unblockInserts();    // }//     
    
    function writeCSV(arec, buf, fpath, traits)
    {
        buf.push(traits.toCSV(arec));
        if (buf.length>=1000) {
            buf.flush(fpath);
        }
    }
    
    function curry (func)
    {
        // convert arguments into an array. Remove the 'func' argument though.
        var ctx = Array.prototype.slice.apply(arguments);
        ctx.shift();
        return function ()
        {
            func.apply(null, Array.prototype.slice.apply(arguments).concat(ctx));
        };
    }
    
    function exportCsvDT(dt, fpath)
    {
        var dbPath = DB_FS.getDBPath(),
            traits = MEM_STORE.DT_TRAITS.getTraits(dt),
            buf;
        if (!dbPath) {
            throw new BPError("", "UserError", "NoDBLoaded");
        }
        if (!traits) {
            throw new BPError("", "InternalError", "BadArgument");
        }
        
        buf = new RecsBuf("\n");
        buf.push(traits.csvHeader());
        MEM_STORE.newDNodeIterator(dt).walkCurr(curry(writeCSV, buf, fpath, traits));
        buf.flush(fpath);
    }
    
    function exportCSV(dirPath, obfuscated)
    {
        var dtl=[dt_pRecord, dt_eRecord],
            i, fpath;
            
        for (i=dtl.length-1; i>=0; i--) // would rather use foEach, but that is reportedly slower
        {
            fpath = DB_FS.makeCsvFilePath(dtl[i], dirPath);
            exportCsvDT(dtl[i], fpath);
        }
    }
    
    function createDB(name, dir) // throws
    {
        var dbPath, i, 
            o = {};
            
        if (DB_FS.insideDB(dir)) {
            throw new BPError(BP_MOD_ERROR.msg.ExistingStore, 'BadPathArgument', 'ExistingStore');
        }
        
        dbPath = DB_FS.makeDBPath(name, dir);

        if (BP_PLUGIN.createDir(dbPath,o))
        {
            DB_FS.dtl.forEach(function (dt, j)
            {
                var p = DB_FS.makeDTDirPath(dt, dbPath);
                if (!BP_PLUGIN.createDir(p,o)) 
                {
                    var err = o.err;
                    o={}; 
                    BP_PLUGIN.rm(dbPath, o);
                    throw new BPError(err);
                }
            });
        }
        else
        {
            throw new BPError(o.err);
        }
        
        MEM_STORE.clear(); // unload the previous DB.
        DB_FS.setDBPath(dbPath); // The DB is deemed loaded (though it is empty)
        return dbPath; // same as return DB_FS.getDBPath();
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
        var o={}, rval, i, prec, drec, pidx, csv, line, url, notes;
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
                        url = parseURL(csv[pidx.url]);
                        prec = newPRecord(url || {}, 
                                          Date.now(), 
                                          csv[pidx.userid],
                                          csv[pidx.pass]);
                        if (!MEM_STORE.PREC_TRAITS.isValidCSV(prec))
                        {
                            console.log("Discarding invalid csv record - " + JSON.stringify(csv));
                            prec = null; continue;
                        }
                        else
                        {
                            // Tell MEM_STORE to discard this value if it already existed
                            // in the store. This will prevent extra processing and fluff
                            // entering the MEM and FILE stores if the user repeatedly
                            // imports the same/similar csv records.
                            drec = new MEM_STORE.DRecord(prec, dt_pRecord, {noTmUpdates:true});
                        }
                        
                        if ((notes=MEM_STORE.insertDrec(drec)))
                        {
                            try {
                                if (!notes.isOldRepeat && !notes.isNewRepeat && !notes.isOverflow) {
                                    insertRec(prec, dt_pRecord);
                                }
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
        DB_FS.putPathSep(p_sep);
        //path_sep = p_sep || (BP_PLUGIN && BP_PLUGIN.pathSeparator) ? BP_PLUGIN.pathSeparator() : undefined;        
    }
                  
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        init: {value: init},
        importCSV: {value: importCSV},
        exportCSV: {value: exportCSV},
        CSVFile: {value: CSVFile},
        createDB: {value: createDB},
        loadDB: {value: loadDB},
        unloadDB:   {value: unloadDB},
        compactDB:  {value: compactDB},
        mergeInDB:    {value: mergeDB},
        getDBPath: {value: DB_FS.getDBPath},
        getDBStats:{value: DB_FS.getDBStats},
        cullDBName: {value: DB_FS.cullDBName},
        getDBName: {value: DB_FS.getDBName},
        insertRec: {value: insertRec}
    });
    Object.freeze(iface);

    console.log("loaded filestore");
    return iface;

}());