/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/*global $, IMPORT, BP_PLUGIN */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin FileStore
 */
function BP_GET_DBFS(g)
{
    "use strict";
    var window = null, document = null, console = null;
    /** @import-module-begin Error */
    var m = IMPORT(g.BP_ERROR),
        BP_ERROR = m,
        BPError = IMPORT(m.BPError);
    /** @import-module-begin common **/
    m = IMPORT(g.BP_COMMON);
    var iterObj = IMPORT(m.iterObj),
        iterArray2 = IMPORT(m.iterArray2);
    /** @import-module-begin **/
    m = g.BP_TRAITS;
    var BP_TRAITS = IMPORT(m),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-end **/ m = null;
    
    var dtl_null = null,
        this_null = null,
        cats_null = null;

    function parseSegment (sgmnt)
    {
        var regex = /^(.*)(\.[^.]+)$/;
        var o = {'name': sgmnt};
        
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
        var regex = /(^[\/\\]*)?(?:([^\\\/]+)[\\\/]+)/g;
        var lastex =/([^\\\/]+)$/; 
        if (path)
        {
            var vals=[], idx, array;
            while ((array = regex.exec(path)))
            {
                vals.push(parseSegment((array[1] || "") + array[2]));
                idx = regex.lastIndex;
            }
            // Catch the last field. It has no separator at the end.
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
            dt_settings = IMPORT(BP_TRAITS.dt_settings),
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
                ext_Root: ".3ab", // .3db is taken :(
                //ext_Root: ".uwallet", // TODO: Change this back to .3ab
                ext_Dict: ".3ad",
                ext_Open: ".3ao",
                ext_Closed:".3ac",
                ext_MMap: ".3am", // unused as yet: dump of in-memory dictionary
                ext_Temp: ".3at",
                ext_Bad : ".3aq", // q => Quarantine
                ext_CryptInfo : ".3ak", // Encrypted key and Cryptinfo
                ext_Key : ".3ak", // Same as cryptinfo
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
            'dtl': dtl,
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
            ext_CryptInfo: ext.ext_CryptInfo,
            ext_Key: ext.ext_Key,
            ext_Csv : ext.ext_Csv,
            cat_Open : cat_Load.cat_Open,
            cat_Closed:cat_Load.cat_Closed,
            cat_Temp : cat_Load.cat_Temp,
            cat_Bad  : cat_Bad,
            /** 
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
                var i;
                if (dbPath)
                {
                    g_dbPath = dbPath;
                    for (i=dtl.length-1; i>=0; --i) //TODO: Not tested yet - 8/22
                    //dtl.forEach(function (dt, i)
                    {
                        g_path_dt[dtl[i]] = g_dbPath + path_sep + dir_dt[dtl[i]]+ path_sep + file_dt[dtl[i]];
                    }
                }
                else {
                    g_dbPath = null;
                    for (i=dtl.length-1; i>=0; --i) //TODO: Not tested yet - 8/22
                    //dtl.forEach(function (dt, i)
                    {
                        g_path_dt[dtl[i]] = null;
                    }
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
                    'dupes': dupes
                };
            },
            makeCryptInfoPath: function(dbPath, dbName, keyDir)
            {
                var path, o;
                // if (BP_ERROR.confirm("Click OK if you would like to store the encryption "+
                                     // "key file separate from the passwords (recommended)"))
                if (keyDir)
                {
                    // o = {dtitle: "UWallet: Select folder for storing key file ",
                        // dbutton: "Select"};
                   // if (!BP_PLUGIN.chooseFolder(o)) {throw new BPError(o.err);}
                   
                   path = keyDir + path_sep + dbName + mod.ext_Key;
                   // BP_ERROR.alert("Key will be stored in: " + path + 
                                  // ". You may move/copy it as you like.");
                }
                else {
                    path = dbPath + path_sep + dbName + mod.ext_Key;
                    // BP_ERROR.alert("Encryption key will be stored along with the passwords");
                }
                
                return path;
            },
            findCryptInfoFile: function(dbPath)
            {
                var o={}, path;
                
                if (!BP_PLUGIN.ls(dbPath, o)) {throw new BPError(o.err);}
                
                if (o.lsd && o.lsd.f) {
                    iterObj(o.lsd.f, o, function(fname, ent, dbPath)
                    {
                        if (ent.ext === mod.ext_Key) {
                            path = dbPath + path_sep + fname;
                            return true; // exits the iterObj loop
                        }
                    }, dbPath);
                }
                
                if (!path) {
                    throw new BPError("Key File not found inside the Wallet. Is it stored outside?");
                }
                // if (!path) {
                    // // The user stored the key outside the DB, for extra security.
                   // o = {filter:['Key File','*.3ak'],
                        // dtitle: "UWallet: Select Key File for " + dbPath,
                        // dbutton: "Select",
                        // clrHist: true};
                   // if (!BP_PLUGIN.chooseFile(o)) {throw new BPError(o.err);}
//                    
                   // path = o.path;
                // }
                
                return path;
            },
            findCryptInfoFile2: function(dbPath)
            {
                var o={}, path;
                
                if (BP_PLUGIN.ls(dbPath, o) && o.lsd && o.lsd.f)
                {
                    iterObj(o.lsd.f, o, function(fname, ent, dbPath)
                    {
                        if (ent.ext === mod.ext_Key) {
                            path = dbPath + path_sep + fname;
                            return true; // exits the iterObj loop
                        }
                    }, dbPath);
                }
                return path;
            },
            makeDTFilePath: function (dt, dbPath)
            {
                var fname = file_dt[dt];
                if (!dbPath || !fname) {
                    BP_ERROR.logwarn("@makeDTFilePath: Bad argument supplied. path="+dbPath+" dt="+dt); 
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
                        BP_ERROR.logwarn("filestore.js@makeFileName: Bad 'cat' argument");
                        throw new BPError("", "InternalError", "BadArgument");
                }
                
                return fname;
            },
            quarantineFile: function (fname, fpath)
            {
                // dbPath1 and dbPath2 are being passed as NULL because the only reason
                // BP_PLUGIN.rename needs them is for decryption/encryption. Since we're
                // renaming within the same DB, there is no need o decrypt/encrypt the
                // data. Hence it is okay to pass null for both DBs.
                BP_PLUGIN.rename("null", fpath, "null", fpath+mod.ext_Bad, {}); //  no clobber by default
            },
            renameBad: function (name)
            {
                if (!name) {
                    BP_ERROR.logwarn("filestore.js@renameBad: Bad argument supplied."); 
                    throw new BPError("", "InternalError");
                }
                return name + mod.ext_Bad;
            },
            makeCsvFilePath: function (dt, dirPath)
            {
                if (!dirPath || !valid_dt[dt]) {
                    BP_ERROR.logwarn("@makeCsvFilePath: Bad argument supplied."); 
                    throw new BPError("", "InternalError");
                }
                
                return dirPath + path_sep + csv_dt[dt] + "_" + Date.now() + mod.ext_Csv;
            },
            makeDTDirPath: function (dt, dbPath)
            {
                if (!dbPath || !valid_dt[dt]) {
                    BP_ERROR.logwarn("@makeDTDirPath: Bad argument supplied. path="+dbPath+" dt="+dt); 
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
                        // MEMSTORE.
                        
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
                    done = BP_PLUGIN.rename(dbPath, frmPath, dbPath, dtDirPath + toName, o); // no clobber by default
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
                    BP_ERROR.logwarn("renameDTFile@filestore.js: Could not rename file");
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
                function anonRmDirEnt(dt, cat, fname, dirEnt)
                {
                    var o = {secureDelete:true},
                        fpath = DB_FS.makeDTDirPath(dt, dbStats.dbPath) + fname;
        
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
                function anonCopyDirEnt(dt, cat, fname)
                {
                    var frmPath = DB_FS.makeDTDirPath(dt, dbMap.dbPath)+fname,
                        toPath = DB_FS.makeDTDirPath(dt, db2Path) + fname,
                        o = {};
                                
                    if (!BP_PLUGIN.copy(dbMap.dbPath, frmPath, 
                                        db2Path, toPath, o, bClobber))
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
        iterObj(cat_Load, this_null, function anonInitCats(cat, val)
        {
            mod.cats_Load.push(val);
        });
        
        return Object.freeze(mod);
    }());


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
            function anonApplyCatM(dt)
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
            function anonVisitCatM(dt, catM)
            {
                iterArray2(catl || DB_FS.cats_Load, self,
                function anonApplyEntM (cat)
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
            iterDTCatM (this, this, this.getDTL(), catl, 
            function anonCountEnts(dt, cat, entM)
            {
                num += Object.keys(entM).length;
            });
                
            return num;
        };
        DBMap.prototype.iterEnt = function (thisArg, dtl, catl, func, ctx)
        {
            iterDTCatM(this, this, dtl, catl, 
            function anonIterEntM(dt, cat, entM)
            {                        
                iterObj(entM, this, 
                function anonVisitDirEnt(fname, dirEnt)
                {
                    func.apply(thisArg, [dt, cat, fname, dirEnt, ctx]);
                });
            });
        };
        DBMap.prototype.iterEntSorted = function (thisArg, dtl, catl, func, ctx, cmp)
        {
            cmp = cmp || DB_FS.mtmCmp;
            iterDTM (this, this, dtl,
            function anonIterCatM(dt, catM)
            {
                var ents = []; // This will be the sorted list of dirEnts
                iterArray2(catl|| DB_FS.cats_Load, this,
                function anonIterEntM(cat)
                {
                    var entM = catM[cat];
                    if (!entM) {return;}
                    iterObj(entM, this,
                    function anonPushDirEnt(fname, dirEnt)
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
                function anonSortedApply(dirEnt)
                {
                    func.apply(thisArg, [dt, dirEnt.cat, dirEnt.fname, dirEnt, ctx]);
                });  
            }); 
        };
        DBMap.prototype.calcDupes = function ()
        {
            var dupes = 0;
            this.iterEnt(this, DB_FS.dtl, [DB_FS.cat_Open],
            function anonIncrDupe(dt, cat, fname, dirEnt)
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
            function anonDeleteEnt(dt, cat, entM)
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
            function anonDiffDBStat(dt, cat, fname, dirEnt)
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
            rhs.iterEnt(this, null, cats, function mergeDBStat(dt, cat, fname, dirEnt)
            {
                this.put(dt, cat, fname, dirEnt);
            });
        };
        
        return new DBMap(dbPath, dbMObj);
    }

    function init ()
    {
        DB_FS.putPathSep(BP_PLUGIN.pathSeparator());
    }

    BP_ERROR.log("constructed mod_dbfs");
    return Object.freeze(
    {
        init: init,
        DB_FS: DB_FS,
        getDBPath: DB_FS.getDBPath,
        getDBStats: DB_FS.getDBStats,
        cullDBName: DB_FS.cullDBName,
        getDBName: DB_FS.getDBName,
        newDBMap: newDBMap
    });
}