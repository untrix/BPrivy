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
    var MOD_COMMON = IMPORT(BP_MOD_COMMON),
        toJson = IMPORT(m.toJson),
        uid_aliases = IMPORT(m.uid_aliases),
        pass_aliases= IMPORT(m.pass_aliases),
        url_aliases = IMPORT(m.url_aliases),
        parseURL = IMPORT(m.parseURL),
        stripQuotes = IMPORT(m.stripQuotes),
        iterObj     = IMPORT(m.iterObj),
        iterArray2  = IMPORT(m.iterArray2);
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
        rec_sep = '\r\n\r\n,',
        dtl_null = null,
        cats_null = null,
        this_null;
               
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
            /* 
             * NOTE. The list dtl is in processing order. That is, we want to deliberately 
             * process load and store DTs in the order least important to most important.
             * This will ensure that if something were to go wrong with file-system access
             * it would happen with the less important DT first and hopefully would exception
             * stop the process before it got to the more important DTs.
             */
            dtl = [dt_settings, dt_eRecord, dt_pRecord],
            DOT = '.',
            ext = {
                ext_Root: ".3ab",
                ext_Dict: ".3ad",
                ext_Open: ".3ao",
                ext_Closed:".3ac",
                ext_MMap: ".3am",
                ext_Temp: ".3at",
                ext_Bad : ".3aq", // q => Quarantine
                ext_Csv : ".csv"
            },
            cat_Load = {
                cat_Open : "cat_Open",
                cat_Closed:"cat_Closed",
                cat_Temp : "cat_Temp",
            },
            cat_Bad = "cat_Bad";

        var mod =
        {
            dtl: dtl,
            valid_dt: valid_dt,
            fileCap: 100, //File capacity in #recs
            /** File/Dirname extenstions populated later/below */
            ext_Root: ext.ext_Root,
            ext_Dict: ext.ext_Dict,
            ext_Open: ext.ext_Open,
            ext_Closed:ext.ext_Closed,
            ext_MMap: ext.ext_MMap,
            ext_Temp: ext.ext_Temp,
            ext_Bad : ext.ext_Bad, // q => Quarantine
            ext_Csv : ext.ext_Csv,
            cat_Open : cat_Load.cat_Open,
            cat_Closed:cat_Load.cat_Closed,
            cat_Temp : cat_Load.cat_Temp,
            cat_Bad  : cat_Bad,            /** 
             * Returns true if the file should be loaded into the DB
             * @param {Object} dirEnt dirEnt should be a dir-entry listing from BP_PLUGIN.ls and it should
             *      be a regular file. IN other words, it should be obtained from o.lsd.f or o.lsf   
             */
            // Loadable DB-file categories. Populated later/below
            cats_Load: [],
            /**
             * Returns undefined if the file should not be loaded. Otherwise returns its
             * category.
             */
            toLoad: function (dirEnt)
            {
                switch (dirEnt.ext)
                {
                    case mod.ext_Open:
                        return mod.cat_Open;
                    case mod.ext_Closed:
                        return mod.cat_Closed;
                    case mod.ext_Temp:
                        return mod.cat_Temp;
                    default:
                        return undefined;
                }
            },
            getCat: function (fname)
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
                            return mod.cat_Closed;
                        case mod.ext_Open:
                            return mod.cat_Open;
                        case mod.ext_Temp:
                            return mod.cat_Temp;
                        case mod.ext_Bad:
                            return mod.cat_Bad;
                        default:
                            return undefined;
                    }
                }
            },
            isCat: function (fType, fname)
            {
                var ext = fname.lastIndexOf(".");
                if (ext===-1) {
                    return false;
                }
                else {
                    ext = fname.slice(ext);
                    switch (fType)
                    {
                        case mod.cat_Closed:
                            return (ext === mod.ext_Closed);
                        case mod.cat_Temp:
                            return (ext === mod.ext_Temp);
                        case mod.cat_Open:
                            return (ext === mod.ext_Open);
                        case mod.cat_Bad:
                            return (ext === mod.ext_Bad);
                        default:
                            return false;
                    }
                }
            },
            isBad: function (fname)
            {
                return mod.isCat(mod.cat_Bad, fname);
            },
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
                if (g_dbStats) {Object.freeze(g_dbStats);}
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
            getFSNums: function ()
            {
                var dupes = 0;
                if (g_dbStats)
                {
                    dupes = g_dbStats.calcDupes();
                }
                
                return {
                    dupes: dupes
                };
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
            makeFileName: function (cat, dt)
            {
                var fname = Date.now().valueOf() + DOT + dt;
                switch (cat)
                {
                    case mod.cat_Closed:
                        fname += mod.ext_Closed;
                        break;
                    case mod.cat_Bad:
                        fname += mod.ext_Bad;
                        break;
                    case mod.cat_Open:
                        fname += mod.ext_Open;
                        break;
                    case mod.cat_Temp:
                        fname += mod.ext_Temp;
                        break;
                    default:
                        MOD_ERROR.logwarn("filestore.js@makeFileName: Bad 'cat' argument");
                        throw new BPError("", "InternalError", "BadArgument");
                }
                
                return fname;
            },
            quarantineFile: function (fname, fpath)
            {
                BP_PLUGIN.rename(fpath, fpath+mod.ext_Bad, {}); //  no clobber by default
            },
            renameBad: function (name)
            {
                if (!name) {
                    MOD_ERROR.logwarn("filestore.js@renameBad: Bad argument supplied."); 
                    throw new BPError("", "InternalError");
                }
                return name + mod.ext_Bad;
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
            verifyDBForLoad: function (dbPath, errMsg)
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
                    throw new BPError(errMsg || '', 'BadDBPath');
                }
                
                return dbPath;
            },
            lsFiles: function (dbPath)
            {
                var dbStats = newDBMap(dbPath),
                    cat;
                DB_FS.dtl.forEach(function (dt, jj, dtl)
                {
                    var o={}, i, file_names, f,
                        dtDirPath = DB_FS.makeDTDirPath(dt, dbPath),
                        j, name;
                    if (BP_PLUGIN.ls(dtDirPath, o) && o.lsd && o.lsd.f)
                    {
                        f = o.lsd.f;
                        file_names = Object.keys(f);
        
                        // List files in reverse chronological order for faster insertion into
                        // MEM_STORE.
                        
                        for (j=0; j < file_names.length; j++)
                        {
                            name = file_names[j];
                            if ((cat=DB_FS.getCat(name)))
                            {
                                dbStats.put(dt, cat, name, f[name]);
                            }
                        }
                    }
                });
                
                return dbStats;
            },
            renameDTFile: function (toCat, dt, dbStats)
            {
                var o, i,
                    frmPath,
                    toName,
                    dbPath = dbStats.dbPath,
                    dtDirPath = DB_FS.makeDTDirPath(dt, dbStats.dbPath),
                    done;
    
                frmPath = DB_FS.makeDTFilePath(dt, dbPath);
                toName  = DB_FS.makeFileName(toCat, dt);

                for (i=0; i<3 && !done; i++) // try 3 times to create a unique filename
                {
                    o={};
                    if (!BP_PLUGIN.exists(frmPath, o)) {
                        done = true;
                        continue;
                    }
                    
                    o={};
                    done = BP_PLUGIN.rename(frmPath, dtDirPath + toName, o); // no clobber by default
                    if (!done)
                    {
                        if (o.err && o.err.gcode==='WouldClobber')
                        {
                            // Let's try another filename
                            toName  = DB_FS.makeFileName(toCat, dt);
                        }
                        else
                        {
                            throw new BPError(o.err);
                        }
                    }
                }
                
                if (!done) {
                    MOD_ERROR.logwarn("renameDTFile@filestore.js: Could not rename file");
                    throw new BPError("", "InternalError");
                }
                else {
                    dbStats.delDTFileEnt(dt);
                    dbStats.put(dt, toCat, toName);
                }
            },
            rmFiles: function (dbStats, keepDTFiles)
            {
                dbStats.iterEnt(this_null, dtl_null, cats_null,
                function (dt, cat, fname, dirEnt)
                {
                    var o = {},
                        fpath = DB_FS.makeDTDirPath(dt)+fname;
        
                    if ( (!keepDTFiles) || (fname !== DB_FS.getDTFileName(dt)) )
                    {
                        BP_PLUGIN.rm(fpath, o);
                    } // else skip the main DT-file
                });
                //dbStats.walkCats(DB_FS.cats_Load, rmCbk, keepDTFiles);
            },
            copy: function (dbMap, db2Path, bClobber)
            {
                dbMap.iterEnt(this_null, dtl_null, cats_null,
                function (dt, cat, fname)
                {
                    var frmPath = DB_FS.makeDTDirPath(dt, dbMap.dbPath)+fname,
                        toPath = DB_FS.makeDTDirPath(dt, db2Path) + fname,
                        o = {};
                                
                    if (!BP_PLUGIN.copy(frmPath, toPath, o, bClobber))
                    {
                        throw new BPError (o.err);
                    }
                });
            },            
            /** 
             * Returns negative if modified-time eX < eY, zero if same, positive if mtime eX>eY 
             * Takes into account the fact that on FAT filesystems, m-timestamps have a granularity
             * of 2 seconds which makes multiple files have the same timestamp in case of compacted
             * DB.
             */
            mtmCmp: function (dt, eX, eY)
            {
                var n = eX.mtm-eY.mtm;
                if (n) {return n;}
                else 
                {   // timestamps are same. So now we look at the filenames - they have timestamps in them.
                    if ((eX.stm === dt) && (eX.ext === DB_FS.ext_Open)) {return 1;}
                    else if ((eY.stm === dt) && (eY.ext === DB_FS.ext_Open)) {return -1;}
                    else if (!isNaN(Number(eX.stm))) 
                    {
                        if (!isNaN(Number(eY.stm))) 
                        {
                            return eX.stm - eY.stm;
                        }
                    }
                }
                // Couldn't find a difference.
                return 0;
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
        // Setup ext and cat constants
        iterObj(cat_Load, this_null, function (cat, val)
        {
            mod.cats_Load.push(val);
        });
        
        return Object.freeze(mod);
    }());


    // function DBStats(dbPath, dbSObj)
    // {
        // if (dbSObj)
        // {                
            // Object.seal(Object.defineProperties(this,
            // {
                // dbPath: {value:dbSObj.dbPath, enumerable:true},
                // fs:     {value: dbSObj.fs, enumerable:true, writable:true}
            // }));
//             
            // // empty out dbSObj
            // delete dbSObj.fs; //This is a Object object, hence 'fs' should be configurable.
        // }
        // else
        // {
            // Object.seal(Object.defineProperties(this,
            // {
                // dbPath: {value:dbPath, enumerable:true},
                // fs:     {value: {}, enumerable:true, writable:true}
            // }));
            // Object.defineProperty(this.fs, DB_FS.cat_Open, {value: {}, writable:true, enumerable:true});
            // Object.defineProperty(this.fs, DB_FS.cat_Closed, {value: {}, writable:true, enumerable:true});
            // Object.defineProperty(this.fs, DB_FS.cat_Temp, {value: {}, writable:true, enumerable:true});
            // Object.defineProperty(this.fs, DB_FS.cat_Bad, {value: {}, writable:true, enumerable:true});
        // }
    // }
    // DBStats.prototype.getFSCat = function (cat)
    // {
        // return this.fs[cat];
    // };
    // DBStats.prototype.getFSCatDT = function (cat, dt)
    // {
        // if (!this.fs[cat][dt])
        // {
            // if (!DB_FS.valid_dt[dt])
            // {
                // throw new BPError ('@DBStats.prototype.get', 'InternalError', 'BadArgument');
            // }
            // else
            // {
                // this.fs[cat][dt] = {};
            // }
        // }
// 
        // return this.fs[cat][dt];
    // };
    // DBStats.prototype.getDTFileEnt = function(dt)
    // {
        // return this.getFSCatDT(DB_FS.cat_Open, dt)[DB_FS.getDTFileName(dt)];
    // };
    // DBStats.prototype.getFileEnt = function(cat, dt, fname)
    // {
        // return this.getFSCatDT(cat, dt)[fname];  
    // };
    // DBStats.prototype.num = function (cat)
    // {
        // var dtl = Object.keys(this.fs[cat]),
            // i, num;
//         
        // for (num=0,i=dtl.length-1; i>=0; i--)
        // {
            // num += Object.keys(this.fs[cat][dtl[i]]).length;
        // }
//         
        // return num;
    // };
    // DBStats.prototype.calcDupes = function ()
    // {
        // var dupes = 0;
        // var dts = this.getFSCat(DB_FS.cat_Open);
        // MOD_COMMON.iterKeys(dts, function (dt, ents, dbStats)
        // {
            // dupes += Object.keys(ents).length;
            // if (ents[DB_FS.getDTFileName(dt)])
            // {
                // dupes--;
            // }
        // }, this, this);
// 
        // return dupes;
    // };
    // DBStats.prototype.putCat = function (cat, dt, name, dirent)
    // {
        // var ent = dirent || {};
        // ent.cat = cat;
        // ent.dt = dt;
        // this.getFSCatDT(cat, dt)[name]=ent;
    // };
    // DBStats.prototype.del = function (cat, dt, name)
    // {
        // delete this.getFSCatDT(cat, dt)[name];
    // };
    // DBStats.prototype.delDTFileEnt = function (dt)
    // {
        // this.del(DB_FS.cat_Open, dt, DB_FS.getDTFileName(dt));
    // };
    // DBStats.prototype.delDTFileEnts = function ()
    // {
        // var dts = this.getFSCat(DB_FS.cat_Open);
        // MOD_COMMON.iterKeys(dts, function (dt, ents, dbStats)
        // {
            // dbStats.delDTFileEnt(dt);
        // }, this, this);
    // };
    // DBStats.prototype.putBad = function (dt, name, dirent)
    // {
        // this.putCat(DB_FS.cat_Bad, dt, name, dirent);
    // };
    // DBStats.prototype.numLoaded = function ()
    // {
        // var num = 0,
            // dbStats = this;
        // MOD_COMMON.iterArray(DB_FS.cats_Load, function (cat)
        // {
            // num += dbStats.num(cat);
        // });
        // return num;
    // };
    // DBStats.prototype.numBad = function ()
    // {
        // return this.num(DB_FS.cat_Bad);
    // };
    // DBStats.prototype.diff = function (cats, other)
    // {
        // /** Helper to diff. Call with thisArg === this */
        // function doDiff (obj, cat, dt, fname, dirEnt, dtDirPath, args)
        // {//this, f.cat, f.dt, f.fname, f.dirEnt, dtDirPath[f.dt], ctx]
            // //obj, cat, dt, fname, dirEnt, dtDirPath, args
// 
            // if (!args.other.getFileEnt(cat, dt, fname))
            // {
                // args.diffStats.putCat(cat, dt, fname, dirEnt);
            // }
//                 
            // return args.diff;
        // }
// 
        // var diffStats = newDBStats(this.dbPath);
        // //MOD_COMMON.iterArray(cats || DB_FS.cats_Load, diffCat, {diff:diff, other:other}, this);
//         
        // this.walkCats(cats || DB_FS.cats_Load, doDiff, {diffStats:diffStats, other:other}, this);
        // return diffStats;
    // };
    // DBStats.prototype.merge = function (rhs, cats)
    // {
        // var lhs = this;
        // rhs.walkCats(cats || DB_FS.cats_Load, function(rhs, cat, dt, fname, dirEnt, dtDirPath)
        // {
            // lhs.putCat(cat, dt, fname, dirEnt);
        // });
    // };
    // /** Returns per-dt, reverse-time-sorted list of files and then concatenates them all
     // * in DB_FS.dtl order
     // */
    // DBStats.prototype.makeRevList = function (cats)
    // {
        // //var that = this;
        // /** Helper to makeSortedList. Does not sort the file list */
        // // function makeListCat (cat, fList)
        // // {
            // // var fsCat = that.getFSCat(cat),
                // // dtl = Object.keys(fsCat),
                // // i, j;
            // // for (i=0; i<dtl.length; i++)
            // // {
                // // var dt = dtl[i],
                    // // //dtDirPath = DB_FS.makeDTDirPath(dt, this.dbPath),
                    // // fnames = Object.keys(fsCat[dt]),
                    // // len = fnames.length,
                    // // fname, dE;
// //                     
                // // for (j=0; j<len; j++)
                // // {
                    // // fname = fnames[j];
                    // // dE = fsCat[dt][fname];
                    // // fList.push({cat:cat, dt:dt, fname:fname, dirEnt:dE});
                // // }
            // // }
// //             
            // // return fList;
        // // }
// 
        // /**
         // * Makes a reverse-time sorted list of files belonging to dt===dt and appends it
         // * to the supplied ctx.fList. Requires 'this' to be mapped to the enclosing 'this'.
         // */
        // function makeRevListDT (dt, args)
        // {
            // var cats = args.cats,
                // fList = [],
                // i, cat, lsf, j, fnames, ent;
            // for (i=cats.length-1; i>=0; i--)
            // {
                // cat = cats[i];
                // lsf = this.getFSCatDT(cat, dt);
                // if (lsf)
                // {
                    // fnames = Object.keys(lsf);
                    // for (j=fnames.length-1; j>=0; j--)
                    // {
                        // ent = lsf[fnames[j]];
                        // ent.fname = fnames[j];
                        // fList.push(ent);
                    // }
                // }
            // }
//     
            // fList.sort(function(e1, e2)
            // {
                // // We want a reverse-sort, hence flip x and y.
                // return DB_FS.mtmCmp(e1.dt, e2, e1);
            // });
//             
            // MOD_COMMON.concatArray(args.fList, fList);
        // }
// 
        // var fList = [];
        // MOD_COMMON.iterArray(DB_FS.dtl, makeRevListDT, {cats:cats, fList:fList}, this);
//                
        // return fList;
    // };
    // /** Helper Function to walkCats*/
    // DBStats.prototype.walkList = function (fList, callback, ctx, thisArg)
    // {       
        // var len = fList.length,
            // thisVal = thisArg || this,
            // f, i,
            // dtDirPath = [];
        // for (i=0; i<len; i++)
        // {
            // f = fList[i];
            // if (!dtDirPath[f.dt]) {dtDirPath[f.dt] = DB_FS.makeDTDirPath(f.dt, this.dbPath);}
            // callback.apply(thisVal, [this, f.cat, f.dt, f.fname, f, dtDirPath[f.dt], ctx]);
        // }
    // };
    // /**
     // * Walks the specified categories of files in dbStats and calls the callback with
     // * for each file encountered. Provides arguments relating to the file, followed
     // * by one additional context argument passed in to walkCats. The file-related arguments
     // * are (cat, dt, fname, dirEnt, dtDirPath); 
     // */
    // DBStats.prototype.walkCats = function (cats, callback, ctx, thisArg)
    // {
        // var fList = this.makeRevList(cats);
        // this.walkList(fList, callback, ctx, thisArg);
    // };   
    /**
     * Normally invoked with only one argument - dbPath. Constructs a new DBStats object.
     * dbSObj should be an Object object derived after converting DBStats to JSON and back. 
     */
    function newDBMap (dbPath, dbMObj)
    {
        function DBMap(dbPath, dbMObj)
        {
            if (dbMObj)
            {                
                Object.seal(Object.defineProperties(this,
                {
                    dbPath: {value:dbMObj.dbPath, enumerable:true},
                    dtM:    {value: dbMObj.dtM, enumerable:true, writable:true}
                }));
                
                // empty out dbMObj.
                //This is a Object object, hence 'dtM' should be configurable. If dbMObj
                //was a DBMap object, then an exception will be thrown here as it should.
                delete dbMObj.dtM;
            }
            else
            {
                Object.seal(Object.defineProperties(this,
                {
                    dbPath: {value:dbPath, enumerable:true},
                    dtM:     {value: {}, enumerable:true, writable:true}
                }));
            }
                // Object.defineProperty(this.fs, DB_FS.cat_Open, {value: {}, writable:true, enumerable:true});
                // Object.defineProperty(this.fs, DB_FS.cat_Closed, {value: {}, writable:true, enumerable:true});
                // Object.defineProperty(this.fs, DB_FS.cat_Temp, {value: {}, writable:true, enumerable:true});
                // Object.defineProperty(this.fs, DB_FS.cat_Bad, {value: {}, writable:true, enumerable:true});
        }
        function getOrMakeObj (self, key)
        {
            if (!self[key]) {
                self[key] = {};
            }
            return self[key];
        }
        function getOrMakeCatM (self, dt)// private, therefore not in prototype
        {
            return getOrMakeObj (self.dtM, dt);
        }
        function getCatM (self, dt)
        {
            return self.dtM[dt];
        }
        function getOrMakeEntM (self, dt, cat)// private, therefore not in prototype
        {
            return getOrMakeObj (getOrMakeCatM(self, dt), cat);
        }
        function getEntM (self, dt, cat)
        {
            var catM=self.dtM[dt];
            if (catM) {
                return catM[cat];
            }
        }
        DBMap.prototype.getDTL = function ()
        {
            return Object.keys(this.dtM);
        };
        // DEPRICATED
        DBMap.prototype.getFileEnt = function(cat, dt, fname)
        {
            return this.getFileEnt2(dt, cat, fname);
        };
        DBMap.prototype.getFileEnt2 = function(dt, cat, fname)
        {
            var entM = getEntM(this, dt, cat);
            if (entM) {
                return entM[fname];
            }
        };
        DBMap.prototype.getDTFileEnt = function(dt)
        {
            return this.getFileEnt2(dt, DB_FS.cat_Open, DB_FS.getDTFileName(dt));
        };
        function iterDTM (self, thisArg, dtl, func, ctx) // private, therefore not in prototype
        {
            iterArray2(dtl || DB_FS.dtl, self,
            function(dt)
            {
                var catM = getCatM(self, dt); //self.dtM[dt];
                if (catM) {
                    func.apply(thisArg, [dt, catM, ctx]);
                }
            });
                
        }
        function iterDTCatM (self, thisArg, dtl, catl, func, ctx)// private, therefore not in prototype
        {
            iterDTM (self, self, dtl, 
            function (dt, catM)
            {
                iterArray2(catl || DB_FS.cats_Load, self, 
                function(cat)
                {
                    var entM = catM[cat];
                    if (entM) {
                        func.apply(thisArg, [dt, cat, entM, ctx]);
                    }
                });
            });
        }
        DBMap.prototype.numEnts = function (catl)
        {
            var num = 0;
            iterDTCatM (this, this, this.getDTL, catl, 
            function(dt, cat, entM)
            {
                num += Object.keys(entM).length;
            });
                
            return num;
        };
        DBMap.prototype.iterEnt = function (thisArg, dtl, catl, func, ctx)
        {
            iterDTCatM(this, this, dtl, catl, 
            function (dt, cat, entM)
            {                        
                iterObj(entM, this, 
                function(fname, dirEnt)
                {
                    func.apply(thisArg, [dt, cat, fname, dirEnt, ctx]);
                });
            });
        };
        DBMap.prototype.iterEntSorted = function (thisArg, dtl, catl, func, ctx)
        {
            cmp = cmp || DB_FS.mtmCmp;
            iterDTM (this, this, dtl,
            function (dt, catM)
            {
                var ents = []; // This will be the sorted list of dirEnts
                iterArray2(catl|| DB_FS.cats_Load, this,
                function(cat)
                {
                    var entM = catM[cat];
                    if (!entM) {return;}
                    iterObj(entM, this,
                    function (fname, dirEnt)
                    {
                        //Need to do this until we enhance
                        //BP_PLUGIN.ls to insert fname into dirEnt
                        dirEnt.fname = fname;
                        dirEnt.cat = cat;
                        ents.push(dirEnt);
                    });
                });
                
                ents.sort(function (e1, e2) {
                // We want a reverse-sort, hence flip x and y.
                 return cmp(e1.dt, e2, e1);
                });
                iterArray2(ents, this,
                function(dirEnt)
                {
                    func.apply(thisArg, [dt, dirEnt.cat, dirEnt.fname, dirEnt, ctx]);
                });  
            }); 
        };
        DBMap.prototype.calcDupes = function ()
        {
            var dupes = 0;
            this.iterEnt(this, DB_FS.dtl, [DB_FS.cat_Open],
            function(dt, cat, fname, dirEnt)
            {
                if (fname !== DB_FS.getDTFileName(dt)) {
                    dupes++;
                }
            });
    
            return dupes;
        };
        // DEPRICATED
        DBMap.prototype.putCat = function (cat, dt, name, dirent)
        {
            return this.put(dt, cat, name, dirent);
        };
        DBMap.prototype.put = function (dt, cat, name, dirent)
        {
            var ent = dirent || {};
            ent.cat = cat;
            ent.dt = dt;
            getOrMakeEntM(this, dt, cat)[name]=ent;
        };
        DBMap.prototype.del2 = function (dt, cat, name)
        {
            var entM = getEntM(this, dt, cat);
            if (entM) {delete entM[name];}
        };
        // DEPRICATED
        DBMap.prototype.del = function (cat, dt, name)
        {
            return this.del2(dt, cat, name);
        };
        DBMap.prototype.delDTFileEnt = function (dt)
        {
            this.del2(dt, DB_FS.cat_Open, DB_FS.getDTFileName(dt));
        };
        DBMap.prototype.delDTFileEnts = function ()
        {
            var dtl = this.getDTL();
            iterDTCatM(this, this, dtl, [DB_FS.cat_Open],
            function(dt, cat, entM)
            {
                delete entM[DB_FS.getDTFileName(dt)];
            });
        };
        DBMap.prototype.putBad = function (dt, name, dirent)
        {
            this.put(dt, DB_FS.cat_Bad, name, dirent);
        };
        DBMap.prototype.numLoaded = function ()
        {
            return this.numEnts(DB_FS.cats_Load);
        };
        DBMap.prototype.numBad = function ()
        {
            return this.numEnts([DB_FS.cat_Bad]);
        };
        DBMap.prototype.diff = function (cats, other)
        {
            var diffStats = newDBMap(this.dbPath);
            this.iterEnt(this, null, cats,
            function(dt, cat, fname, dirEnt)
            {
                if (!other.getFileEnt2(dt, cat, fname))
                {
                    diffStats.put(dt, cat, fname, dirEnt);
                }
            });
            
            return diffStats;
        };
        DBMap.prototype.merge = function (rhs, cats)
        {
            rhs.iterEnt(this, null, cats, function (dt, cat, fname, dirEnt)
            {
                this.put(dt, cat, fname, dirEnt);
            });
        };
        
        return new DBMap(dbPath, dbMObj);
    }

    var UC_TRAITS = Object.freeze(
    {
        csvImport: {
        // noTmUpdates: Set to true implies that if a record has the same key and value
        //               but has a newer timestamp from that already present in the DB,
        //               then it will be discarded by the MEM_STORE. In other words,
        //               'newRepeats' will be discarded by the MEM_STORE. By default they're
        //               kept.
        //               If it had the same key+value but an older timestamp, it would be
        //               discarded anyway ('oldRepeat');
            noTmUpdates: true,
            // return true if the record should be persisted to filestore.
            toPersist: function (notes)
                {
                    return (notes.isRecentUnique);
                }
        },
        importFile: {
            // return true if the record should be persisted to filestore.
            toPersist: function (notes)
                {
                    return (notes.isRecentUnique || notes.isNewRepeat);
                }
        },
        insertNewRec: { 
            toPersist: function (notes) // Should be same as importFile
            {
                return (notes.isRecentUnique || notes.isNewRepeat);
            }
        }
    });
    
    function unloadDB()
    {
        MEM_STORE.clear(); // unload the previous DB.
        DB_FS.setDBPath(null);
    }
    
    /**
     * @param filePath
     * @param dt
     * @parm  {Object} dbStats  Output pram. dbStats is updated based on loading activity.
     * @param {Object} dirEnt   Directory entry object (for dbStats) to be updated. May or may not
     *                  eventually get inserted into dbStats.
     * @param {Object} buf      A RecsBuf object is present specifies that the loaded records should be
     *                  collected for saving in addition to being loaded in memory. This is used
     *                  for importing records from an external DB.
     */
    function loadFile(dbPath, cat, dt, dtDirPath, fname, dirEnt, dbStats, buf)
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
            o={prefix: '[{"header":true}', suffix: "]"},
            recs,
            filePath = dtDirPath+fname;
            
        if (!BP_PLUGIN.readFile(filePath, o))
        {
            return false;
        }
        
        try
        {
            recs = JSON.parse(o.dat);
        }
        catch (e)
        { 
            BP_MOD_ERROR.logwarn("loadFile@filestore: Corrupted file: " + filePath);
            DB_FS.quarantineFile(fname, filePath);
            dbStats.putBad(dt, fname, dirEnt);
            return false;
        }
        
        if (recs && (typeof recs === 'object') && recs.constructor === Array)
        {
            // Loading records in reverse chronological order for faster insertion into
            // MEM_STORE.
            
            // Remove the first entry that we artifically inserted above.
            delete recs[0];
            // Update how many recs this file holds - needed in the importFile scenario.
            dirEnt.numRecs = recs.length;
            recs.reduceRight(function(accum, rec, i, recs)
            {
                try
                {
                    notes = MEM_STORE.insertRec(rec, dt);
                    // In case of file-import, the imported records need to be persisted
                    // to the local DB. Such records are merely saved to buf here - not
                    // actually written to file (that's done later). But we need to check with
                    // both DT and UC traits whether the record should be persisted.
                    if (buf && MEM_STORE.DT_TRAITS.getTraits(dt).toPersist(notes) && UC_TRAITS.importFile.toPersist(notes))
                    {
                        buf.pushRec(rec);
                    }
                } 
                catch (e) 
                {
                    var bpe = new BPError(e);
                    BP_MOD_ERROR.log("loadFile@bp_filestore.js (Skipping record) " + bpe.toString());
                    MEM_STORE.getStats().bad++;
                }
            },0);
            
            MOD_ERROR.log("Loaded file " + filePath);
            dbStats.put(dt, cat, fname, dirEnt);
            return true;
        }
        else 
        {
            MOD_ERROR.log("loadFile@filestore: Empty file?: " + filePath);
        }
    }
    
    /**
     * @param dbPath
     * @return          returns the root of the DB-folder that was read/loaded. Should be
     *                  equal to the dbPath if it was the root of the DB. If DB path was a
     *                  path inside an existing DB, then the system backtracks up to the root
     *                  of the DB and loads that. That's the path which is returned.
     * @param {Object}  dbStats is created if not present. io.dbStats.fs and io.dbStats.recs 
     *                  are populated per the loaded DB. If an existing dbStats object was supplied
     *                  then the impact of calling loadDB is additive - i.e. the existing values
     *                  in the collection will stay and existing counts will simply be incremented.
     */
    function loadDB(dbPath, dbStats, exclude)
    {
        /**
         * Helper function to loadDB. Loads files of given DB.
         * @returns Nothing
         * @param   {Object}io  dbStats is created if not present. dbStats 
         *                  are populated per the loaded DB. If an existing dbStats object was supplied
         *                  then the impact of calling loadDB is additive - i.e. the existing values
         *                  in the collection will stay and existing counts will simply be incremented.
         * @param   {Object} excludes Optional. A DBStats object containing files to exclude from the
         *                  load operation. Used by the DB-cleanup operation.
         */
        function loadDBFiles(dbPath, dbStats, exclude)
        {
            DB_FS.dtl.forEach(function (dt, jj, dtl)
            {
                var o={}, i, file_names, f,
                    dtDirPath = DB_FS.makeDTDirPath(dt, dbPath),
                    j, name, cat;
                if (BP_PLUGIN.ls(dtDirPath, o) && o.lsd && o.lsd.f)
                {
                    f = o.lsd.f;
                    file_names = Object.keys(f);
    
                    // Load files in reverse chronological order for faster insertion into
                    // MEM_STORE.
                    file_names.sort(function (x,y)
                    {
                        return DB_FS.mtmCmp(dt, f[y], f[x]);
                    });
                    
                    for (j=0; j < file_names.length; j++)
                    {
                        name = file_names[j];
                        if ((cat=DB_FS.toLoad(f[name])) && !(exclude && exclude.getFileEnt(cat, dt, name)))
                        {
                            try 
                            {
                                loadFile(dbPath, cat, dt, dtDirPath, name, f[name], dbStats);
                            }
                            catch (e) 
                            {
                                var bpe = new BPError(e),
                                    oldPath = dtDirPath + name,
                                    newPath = dtDirPath + DB_FS.renameBad(name);
                                dbStats.putBad(dt, name, f[name]);
                            }
                        }
                        else if (DB_FS.isBad(name)) 
                        {
                            dbStats.putBad(dt, name, f[name]);
                        }
                    }
                }
            });
            
            return dbStats;
        }

        var memStats;
        dbStats = dbStats || newDBMap(dbPath);
        // First determine if this DB exists and is good.
        dbPath = DB_FS.verifyDBForLoad(dbPath);

        console.log("loadingDB " + dbPath);
        MEM_STORE.clear(); // unload the previous DB.
        
        loadDBFiles(dbPath, dbStats, exclude);
        memStats = MEM_STORE.getStats();
        DB_FS.setDBPath(dbPath, dbStats);
                
        MOD_ERROR.log("Loaded DB " + dbPath + ". files loaded: "+dbStats.numLoaded()+
                      ", files bad: "+dbStats.numBad()+
                      ", recs loaded: "+memStats.loaded + ", recs bad: " +memStats.bad +
                      ", recs fluff: " +memStats.fluff);
        return dbPath;
    }
    
    /**
     *  Constructor. Inherits from Array
     * @param   {string} sep    Separator. If not supplied, defaults to rec_sep.
     */
    function RecsBuf(sep)
    {
        Object.defineProperties(this,
        {
            sep:    {value: sep||rec_sep}
        });
    }
    RecsBuf.prototype = Object.create(Array.prototype);
    RecsBuf.prototype.flush = function (fpath, count, bRev)
    {
        var o, array;
        
        if (!this.length) {
            return;
        }
        else if ((count) && (count>0) && (count < this.length)) 
        {
            if (bRev) {
                array = this.splice(this.length-count, count);   
            }
            else {
                array = this.splice(0, count);
            }
        }
        else {
            count = undefined;
            array = this;
        }
        
        // Need to perform append in one-shot. Hence am providing this.sep as prefix
        // to appendFile. AppendFile will write both prefix+payload in one shot.
        o={prefix:this.sep};
        if (bRev) {array.reverse();}
        if (!BP_PLUGIN.appendFile(fpath, array.join(this.sep), o))
        {
            throw new BPError(o.err);
        }
        else if (!count)
        {
            this.length = 0; // delete all elements of the array
        }
    };
    RecsBuf.prototype.flushDT = function (dt, dbPath, count, bRev)
    {
        var o={};
        this.flush(DB_FS.getDTFilePath(dt, dbPath), count, bRev);
    };
    RecsBuf.prototype.pushRec = function (arec)
    {
        this.push(JSON.stringify(arec));
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
    
    function compactDB()    {
        /**
         * Renames open files (<dt>.3ao) to temporary files (extension <rand>.<dt>.3at). Used
         * by CompactDB to enable it to close the open files. 
         */
        function tempDTFiles(dbStats)
        {
            DB_FS.dtl.forEach(function (dt, j, dtl)
            {
                DB_FS.renameDTFile(DB_FS.cat_Temp, dt, dbStats);
            });
        }

        function writeArec (arec, ctx)
        {
            var fname,
                buf = ctx.buf,
                dt = ctx.dt, 
                dbStats = ctx.dbStats;
            buf.pushRec(arec);
            if (buf.length>=DB_FS.fileCap)
            {
                fname = DB_FS.makeFileName(DB_FS.cat_Closed, dt);
                buf.flush(DB_FS.makeDTDirPath(dt, dbStats.dbPath) + fname);
                dbStats.put(dt, DB_FS.cat_Closed, fname);
            }
        }
        
        var dbPath = DB_FS.getDBPath(),
            dt, 
            dnIt, dn, recs, rIt, acoll, aIt, arec,
            buf, o,
            i, dtPath,
            temp,
            dbStatsCompacted,
            dbStats = newDBMap(DB_FS.getDBPath());        
        if (!dbPath) {
            throw new BPError ("No DB loaded");
        }
        
        // Rename open files to temp-closed status. This will ensure that we won't need
        // to delete open files in the last step (because we renamed them to temp). This
        // is necessary in order to allow for the possibility that some new changes may
        // creep into the DB between now and the last step, either form another concurrently
        // editing browser (either on the same device or on another device accessing a DB
        // stored on NFS) or through sky-drives such as DropBox. New records will be
        // written only to .3ao files.        tempDTFiles(newDBMap(dbPath));
        // Clear old records and load DB to memory - including the temp files created above.        dbPath = loadDB(dbPath, dbStats);
        // Iterate the MEM_STORE and write recs to the appropriate files.
        dbStatsCompacted = newDBMap(dbPath);
        for (i=0; i<DB_FS.dtl.length; i++)
        {
            dt = DB_FS.dtl[i];
            dnIt = MEM_STORE.newDNodeIterator(dt);
            buf = new RecsBuf();
            
            dnIt.walk(writeArec, {buf:buf, dt:dt, dbStats:dbStatsCompacted});
            
            if (buf.length)
            {
                buf.flush(DB_FS.getDTFilePath(dt));
            }
        }
        
        // Remove files that we had earlier loaded. Their records have all been incorporated
        // into the newly created files. Skip the main DT files if encountered because
        // those would've been surely created after step 1.
        DB_FS.rmFiles(dbStats, true);
                // We have to reload again just to populate accurate mem-stats :(
        loadDB(dbPath);
        return dbPath;    }

    /**
     * Import records from files supplied in dbStats of categories specified in cats
     * If (!cats) then load all categories.
     * @param {DBStats} dbSSrc  Read-only. List of files to import.
     * @param {DBStats} dbSWrote    Record of files that were actually written to.
     * @param {DBStats} dbSRead Record of files that were successfully read and parsed from
     *                          among those in dbSSrc. Normally should be identical to dbSSrc.
     * @param {DBStats} dtFilesDst  Read-only. Entries of destination-DT files at the time of
     *                          invocation. numRecs are used from these entries in order to
     *                          determine the remaining space in the files.
     */
    function importFiles(cats, dbSSrc, dbSWrote, dbSRead, dtFilesDst)
    {
        var bufs = {};

        // Import files in reverse chronological order.
        dbSSrc.iterEntSorted(this_null, dtl_null, cats,
        function (dt, cat, fname, dirEnt)
        {
            var dtDirPath = DB_FS.makeDTDirPath(dt, dbSSrc.dbPath),
                dtOpenEnt = dtFilesDst.getDTFileEnt(dt),
                numOpenRecs = dtOpenEnt ? (dtOpenEnt.numRecs || 0): 0;// dt-file (.3ao) may not exist
                
            if (!bufs[dt]) {bufs[dt] = new RecsBuf();}
            
            loadFile(dbSSrc.dbPath, cat, dt, dtDirPath, fname, dirEnt, dbSRead, bufs[dt]);
            while (numOpenRecs + bufs[dt].length >= DB_FS.fileCap)
            {
                // flush records to DT-file. Then close the file.
                bufs[dt].flushDT(dt, dbSWrote.dbPath, DB_FS.fileCap-numOpenRecs, true);
                // close the file and fix dbStats appropriately
                DB_FS.renameDTFile(DB_FS.cat_Closed, dt, dbSWrote);
                // Fix impacted vars.
                numOpenRecs = 0; dtOpenEnt = undefined;
            }
        });
        
        BP_MOD_COMMON.iterKeys(bufs, function(dt, buf)
        {
            if (buf.length)
            {
                buf.flushDT(dt, dbSWrote.dbPath, 0, true);
                dbSWrote.putCat(DB_FS.cat_Open, dt, DB_FS.getDTFileName(dt));
            }
        });
    }

    /**
     * Consolidates multiple open files per DT (if more than one) into a single one.
     * Multiple open files will be created by Sky-Drives like DropBox. This process
     * will import those records and delete those files.
     * Assumes that the DB is already loaded - won't reload it.
     */
    function cleanLoadInternal(dbPath)
    {
        var dbSrc   = DB_FS.lsFiles(dbPath),
            dbSRead = newDBMap(dbPath), // Reads are from same DB-Path
            dbSWrote = newDBMap(dbPath),
            dbSFluff = newDBMap(dbPath),// Writes are into same DB Path
            retStats = newDBMap(dbPath);

        // Prepare a collection of fluff files.
        dbSrc.delDTFileEnts(); // DT files are not fluff, so remove them.
        dbSFluff.merge(dbSrc, [DB_FS.cat_Open, DB_FS.cat_Temp]);

        // Now load db excluding the fluff. Collect load-stats into retStats for
        // final return.
        loadDB(dbPath, retStats, dbSFluff);

        // Import the fluff now
        importFiles(DB_FS.cats_Load, dbSFluff, dbSWrote, dbSRead, retStats);
        // Remove the fluff files that we successfully imported.
        // If all went well dbSRead == dbSFluff, but only if all went well.
        DB_FS.rmFiles(dbSRead);

        // Finally, consolidate the loaded files with those created as a result of
        // importation. These are the DB stats that would be generated
        // if we were to run loadDB again at this point.
        retStats.merge(dbSWrote, DB_FS.cats_Load);
        // Set the global stats/path.
        DB_FS.setDBPath(dbPath, retStats);
        // Done.
        return retStats;
    }
    
    function cleanLoadDB()
    {
        cleanLoadInternal(DB_FS.getDBPath());
    }        

    function merge (db1, db2, oneWay)
    {
        var dbStats1 = newDBMap(db1),
            dbStats2,
            dbStats2_diff,
            dbStats1_diff,
            dbStatsMods = newDBMap(db1); // to track newly created files
                                          // that will need to be copied over to db2
        
        dbStats1 = cleanLoadInternal(db1);
        dbStats2 = DB_FS.lsFiles(db2);
        dbStats2_diff = dbStats2.diff([DB_FS.cat_Closed, DB_FS.cat_Temp], dbStats1);
        var dbStatsImported = newDBMap(db2);

        // Include all open files as well.
        dbStats2_diff.merge(dbStats2, [DB_FS.cat_Open]);
        // importFiles([DB_FS.cat_Open], dbStats2, dbStatsMods, dbStatsImported);
        // Import closed/temp files next. While doing that, save names of new/modified files
        
        /** NOTE: ImportFiles should be invoked only once with all files, because it ensures
         *  that the files are walked in reverse chronological order, thereby ensuring maximum
         *  fluff-removal from the imported data.
         */
        importFiles(DB_FS.cats_Load, dbStats2_diff, dbStatsMods, dbStatsImported, dbStats1);

        if (!oneWay)
        {   // Merge-Out. Copy the missing files to db2
            
            // List the files that are missing in db2.
            dbStats1 = DB_FS.lsFiles(db1);
            dbStats1_diff = dbStats1.diff(DB_FS.cats_Load, dbStats2);
            // Add files that were newly created or modified
            //dbStats1_diff.merge(dbStatsMods);
            // Finally, ensure that all DT-files are included. We copy those no matter
            // what.
            dbStats1_diff.merge(dbStats1, [DB_FS.cat_Open]);
            DB_FS.copy(dbStats1_diff, db2, true); // clobber = true.
            // dbStats1_diff.walkCats(DB_FS.cats_Load, copy, newDBMap(db2));
            
            // Delete the files in db2 that were imported from there. Their recs. were
            // incorporated into dbStatsMods. However, since DT-filenames are the same,
            // we don't want to delete files that were just copied to db2. Hence remove
            // those names from the mods collection.
            dbStatsImported = dbStatsImported.diff(DB_FS.cats_Load, dbStats1_diff);
            DB_FS.rmFiles(dbStatsImported);
        }
    }

    function mergeMain(db2, bIn)
    {
        var db1 = DB_FS.getDBPath();
        
        // First determine if the DBs exists and are good.
        db1 = DB_FS.verifyDBForLoad(db1);
        db2 = DB_FS.verifyDBForLoad(db2);
        
        // if (!db1) {
            // throw new BPError ("","UserError", "NoDBLoaded");
        // }
        // else if (!db2) {
            // throw new BPError ("", "InternalError", "NoDBSelected");
        // }
        if (db2===db1) {
            throw new BPError ("", "UserError", "DBAlreadyLoaded");
        }
        
        if (bIn === true ) {
            merge(db1, db2, true);    
        }
        else if (bIn === false) {
            merge(db2, db1, true);
            loadDB(db1);
        }
        else if (bIn === undefined) {
            merge(db1, db2, false);
        }        
        return true;
    }
   
    function mergeInDB(db2)
    {
        return mergeMain(db2, true);
    }
    
    function mergeOutDB(db2)
    {
        return mergeMain(db2, false);
    }
    
    function mergeDB(db2)
    {
        return mergeMain(db2);
    }
    
    function writeCSV(arec, ctx)
    {
        var buf=ctx.buf;
        
        buf.push(ctx.traits.toCSV(arec));
        if (buf.length>=1000) {
            buf.flush(ctx.fpath);
        }
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
        MEM_STORE.newDNodeIterator(dt).walkCurr(writeCSV, {buf:buf, fpath:fpath, traits:traits});
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
                    var csvf = new CSVFile(path),
                        uct = UC_TRAITS.csvImport;

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
                            drec = new MEM_STORE.DRecord(prec, dt_pRecord, uct);
                        }
                        
                        if ((notes=MEM_STORE.insertDrec(drec)))
                        {
                            try {
                                if (MEM_STORE.DT_TRAITS.getTraits(dt_pRecord).toPersist(notes) && uct.toPersist(notes)) {
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
        mergeDB:    {value: mergeDB},
        mergeInDB:  {value: mergeInDB},        
        mergeOutDB: {value: mergeOutDB},
        getDBPath: {value: DB_FS.getDBPath},
        getDBStats:{value: DB_FS.getDBStats},
        newDBMap:{value: newDBMap},
        cullDBName: {value: DB_FS.cullDBName},
        getDBName: {value: DB_FS.getDBName},
        insertRec: {value: insertRec},
        cleanLoadDB:   {value: cleanLoadDB},
        UC_TRAITS: {value: UC_TRAITS}
    });
    Object.freeze(iface);

    console.log("loaded filestore");
    return iface;

}());