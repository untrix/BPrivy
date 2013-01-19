/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, BP_PLUGIN, IMPORT */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin FileStore
 */
function BP_GET_FILESTORE(g)
{
    "use strict";
    var window = null, document = null, console = null,
        g_win = g.g_win;
    
    /** @import-module-begin Error */
    var m = IMPORT(g.BP_ERROR),
        BPError = IMPORT(m.BPError),
        BP_ERROR = m;
    /** @import-module-begin common **/
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(g.BP_COMMON),
        toJson = IMPORT(m.toJson),
        uid_aliases = IMPORT(m.uid_aliases),
        pass_aliases= IMPORT(m.pass_aliases),
        url_aliases = IMPORT(m.url_aliases),
        parseURL = IMPORT(m.parseURL),
        stripQuotes = IMPORT(m.stripQuotes),
        iterObj     = IMPORT(m.iterObj),
        iterArray2  = IMPORT(m.iterArray2);
    /** @import-module-begin **/
    m = g.BP_TRAITS;
    var dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin connector **/
    m = g.BP_CONNECT; 
    var newPAction = IMPORT(m.newPAction);
    /** @import-module-begin MemStore **/
    var MEMSTORE = IMPORT(g.BP_MEMSTORE);
    /** @import-module-begin UI Traits **/
    var eid_pfx = IMPORT(g.BP_TRAITS.eid_pfx);
    /** @import-module-begin **/
    m = g.BP_DBFS;
    var newDBMap = IMPORT(m.newDBMap),
        DB_FS = IMPORT(m.DB_FS);
    /** @import-module-end **/    m = null;

    /** @constant ID of BP-Plugin HtmlEmbedElement*/
    var eid_bp = eid_pfx + "bpplugin",
        /** Record Separator in the files */
        rec_sep = '\r\n\r\n,',
        dtl_null = null,
        this_null = null;
               
    var UC_TRAITS = Object.freeze(
    {
        csvImport: {
        // noTmUpdates: Set to true implies that if a record has the same key and value
        //               but has a newer timestamp from that already present in the DB,
        //               then it will be discarded by the MEMSTORE. In other words,
        //               'newRepeats' will be discarded by the MEMSTORE. By default they're
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
                    return (notes.isRecentUnique || notes.isRecentRepeat);
                }
        },
        insertNewRec: { 
            toPersist: function (notes) // Should be same as importFile
            {
                return (notes.isRecentUnique || notes.isRecentRepeat);
            }
        }
    });
    
    function unloadDB()
    {
        var dbPath = DB_FS.getDBPath(),
            o = {};
        if (dbPath) {
            BP_PLUGIN.destroyCryptCtx(dbPath, o);
        }
        MEMSTORE.clear(); // unload the previous DB.
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
        var i, dr,
            //loaded=0,
            ftraits = MEMSTORE.DT_TRAITS.getTraits(dt).file,
            // Have BPPlugin format the return data like a JSON array. It is more efficient
            // to do this inside the plugin because it can prefix and suffix the data
            // without having to copy it over. In the case of javascript strings are immutable
            // and hence we would have to copy the string over twice in order to prepend
            // and append to the string (perhaps using typed-arrays may circumvent one of
            // the two copies).
            o={prefix: '[{"header":true}', suffix: "]"},
            recs,
            filePath = dtDirPath+fname;
            
        if (!BP_PLUGIN.readFile(dbPath, filePath, o))
        {
            BP_ERROR.logwarn(o.err);
            if (o.err) {
                if ((o.err.acode === 'BadPasswordOrCryptInfo') || (o.err.acode === 'BadCryptInfo'))
                {
                    throw new BPError(o.err);
                }
            }

            return false;
        }
        
        try
        {
            recs = JSON.parse(o.dat);
        }
        catch (e)
        { 
            BP_ERROR.logwarn("loadFile@filestore: Corrupted file: " + filePath);
            //DB_FS.quarantineFile(fname, filePath);
            dbStats.putBad(dt, fname, dirEnt);
            return false;
        }
        
        if (recs && (typeof recs === 'object') && recs.constructor === Array)
        {
            // Loading records in reverse chronological order for faster insertion into
            // MEMSTORE.
            
            // Remove the first entry that we artifically inserted above.
            delete recs[0];
            // Update how many recs this file holds - needed in the importFile scenario.
            dirEnt.numRecs = recs.length;
            recs.reduceRight(function(accum, rec, i, recs)
            {
                try
                {
                    dr = MEMSTORE.insertRec(rec, dt);
                    // In case of file-import, the imported records need to be persisted
                    // to the local DB. Such records are merely saved to buf here - not
                    // actually written to file (that's done later). But we need to check with
                    // both DT and UC traits whether the record should be persisted.
                    if (buf && MEMSTORE.DT_TRAITS.getTraits(dt).toPersist(dr.notes) && 
                        UC_TRAITS.importFile.toPersist(dr.notes))
                    {
                        buf.pushRec(rec);
                    }
                } 
                catch (e) 
                {
                    var bpe = new BPError(e);
                    BP_ERROR.log("loadFile@bp_filestore.js (Skipping record) " + bpe.toString());
                    MEMSTORE.getStats().bad++;
                }
            },0);
            
            BP_ERROR.log("Loaded file " + filePath);
            dbStats.put(dt, cat, fname, dirEnt);

            return true;
        }
        else 
        {
            BP_ERROR.log("loadFile@filestore: Empty file?: " + filePath);
        }
    }
    
    function requestKey(dbPath)
    {
        if (!dbPath) {return;}
        
        return BP_ERROR.prompt("Please enter password for wallet at: " + dbPath);
    }
    
    function loadCryptCtx(dbPath, cryptInfoPath, k)
    {
        var o; 

        o ={};
        if (!BP_PLUGIN.cryptCtxLoaded(dbPath, o)) {throw new BPError(o.err);}
        if (!o.cryptCtx) {

            if (!cryptInfoPath) {
                cryptInfoPath = DB_FS.findCryptInfoFile(dbPath);
            }

            if (cryptInfoPath) {
                o = {};

                if (!k) {
                    //k = requestKey(dbPath);
                    throw new BPError("Please supply master password for " + dbPath);
                }
                
                if (!BP_PLUGIN.loadCryptCtx(k, cryptInfoPath, dbPath, o)) {
                    // var bp_err = new BPError(o.err);
                    // BP_ERROR.logwarn(bp_err);
                    // o.err.gmsg = BP_ERROR.msg[o.err.acode || o.err.gcode];
                    throw new BPError(o.err);
                }
            }
            //else this wallet is in cleartext - only use this mode for 
            // debugging/development purposes.   
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
    function loadDB(dbPath, dbStats, exclude, keyPath, k)
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
                    // MEMSTORE.
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
                                if (e.err.acode && ((e.err.acode === 'BadPasswordOrCryptInfo') || (e.err.acode === 'BadCryptInfo'))) {
                                    throw new BPError(e);
                                }
                                var oldPath = dtDirPath + name,
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

        var memStats,
            cryptInfoPath, k, o = {};
        dbStats = dbStats || newDBMap(dbPath);
        // First determine if this DB exists and is good.
        dbPath = DB_FS.verifyDBForLoad(dbPath);

        BP_ERROR.log("loadingDB " + dbPath);
        MEMSTORE.clear(); // unload the previous DB.
        
        loadCryptCtx(dbPath, keyPath, k);

        loadDBFiles(dbPath, dbStats, exclude);
        memStats = MEMSTORE.getStats();
        DB_FS.setDBPath(dbPath, dbStats);
                
        BP_ERROR.log("Loaded DB " + dbPath + ". files loaded: "+dbStats.numLoaded()+
                      ", files bad: "+dbStats.numBad()+
                      ", recs loaded: "+memStats.loaded + ", recs bad: " +memStats.bad +
                      ", recs fluff: " +memStats.fluff);
        return dbPath;
    }
    
    /**
     *  Wrapper around loadDB. Unloads the previous DB which causes removal of the crypt
     *  ctx of the currently loaded DB from within the plugin (even if it was same as 
     *  dbPath). The internal loadDB function won't unload the crypt-ctx and hence the
     *  same DB maybe loaded multiple times - for operations such as mergeDB - without
     *  asking the user for password everytime.
     *  When this function is invoked, the user will be prompted for password to dbPath
     *  unless its crypt-ctx was already loaded - but in all use-cases so far, the 
     *  crypt-ctx of dbPath should've been unloaded before loadDB is invoked hence as of
     *  now the user will always be prompted for password.
     */
    function loadDBExt(dbPath, keyPath, k)
    {
        unloadDB();
        return loadDB(dbPath, undefined, undefined, keyPath, k);
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
    RecsBuf.prototype.flush = function (dbPath, fpath, count, bRev)
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
        if (!BP_PLUGIN.appendFile(dbPath, fpath, array.join(this.sep), o))
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
        this.flush(dbPath, DB_FS.getDTFilePath(dt, dbPath), count, bRev);
    };
    RecsBuf.prototype.pushRec = function (actn)
    {
        this.push(JSON.stringify(actn));
    };

    function insertRec(rec, dt)
    {
        var result = false,
            dtPath = DB_FS.getDTFilePath(dt),
            dbPath = DB_FS.getDBPath(),
            o={};

        if (dtPath)
        {
            result = BP_PLUGIN.appendFile(dbPath, dtPath, rec_sep+JSON.stringify(rec), o);
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

        function writeAction (actn, ctx)
        {
            var fname,
                buf = ctx.buf,
                dt = ctx.dt, 
                dbStats = ctx.dbStats;
            buf.pushRec(actn);
            if (buf.length>=DB_FS.fileCap)
            {
                fname = DB_FS.makeFileName(DB_FS.cat_Closed, dt);
                buf.flush(dbStats.dbPath, DB_FS.makeDTDirPath(dt, dbStats.dbPath) + fname);
                dbStats.put(dt, DB_FS.cat_Closed, fname);
            }
        }
        
        var dbPath = DB_FS.getDBPath(),
            dt, 
            dnIt, dn, recs, rIt, acoll, aIt, actn,
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
        // Iterate the MEMSTORE and write recs to the appropriate files.
        dbStatsCompacted = newDBMap(dbPath);
        for (i=0; i<DB_FS.dtl.length; i++)
        {
            dt = DB_FS.dtl[i];
            dnIt = MEMSTORE.newDNodeIterator(dt);
            buf = new RecsBuf();
            
            dnIt.walk(writeAction, {'buf':buf, 'dt':dt, 'dbStats':dbStatsCompacted}, {doGC:true});
            
            if (buf.length)
            {
                buf.flush(dbPath, DB_FS.getDTFilePath(dt));
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
        function anonImportFile (dt, cat, fname, dirEnt)
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
        
        BP_COMMON.iterKeys(bufs, function finalBufFlush(dt, buf)
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

    function mergeMain(db2, bIn, keyPath, k)
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
        
        loadCryptCtx(db2, keyPath, k);
        
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
        BP_PLUGIN.destroyCryptCtx(db2, {});
        
        return true;
    }
   
    function mergeInDB(db2, keyPath, k)
    {
        return mergeMain(db2, true, keyPath, k);
    }
    
    function mergeOutDB(db2, keyPath, k)
    {
        return mergeMain(db2, false, keyPath, k);
    }
    
    function mergeDB(db2, keyPath, k)
    {
        return mergeMain(db2, undefined, keyPath, k);
    }
    
    function writeCSV(actn, ctx)
    {
        var buf=ctx.buf;
        
        buf.push(ctx.traits.toCSV(actn));
        if (buf.length>=1000) {
            buf.flush("", ctx.fpath);
        }
    }
    
    function exportCsvDT(dt, fpath)
    {
        var dbPath = DB_FS.getDBPath(),
            traits = MEMSTORE.DT_TRAITS.getTraits(dt),
            buf;
        if (!dbPath) {
            throw new BPError("", "UserError", "NoDBLoaded");
        }
        if (!traits) {
            throw new BPError("", "InternalError", "BadArgument");
        }
        
        buf = new RecsBuf("\n");
        buf.push(traits.csvHeader());
        MEMSTORE.newDNodeIterator(dt).walkCurr(writeCSV, {'buf':buf, 'fpath':fpath, 'traits':traits});
        buf.flush("", fpath);
    }
    
    function exportCSV(dirPath, obfuscated)
    {
        var dtl=[dt_pRecord, dt_eRecord],
            i, fpath, fnames=[];
            
        for (i=dtl.length-1; i>=0; i--) // would rather use foEach, but that is reportedly slower
        {
            fpath = DB_FS.makeCsvFilePath(dtl[i], dirPath);
            exportCsvDT(dtl[i], fpath);
            fnames.push(fpath);
        }
        
        return fnames;
    }
    
    function createDB(name, dir, keyDir, k) // throws
    {
        var dbPath, i, k, keyPath,
            o = {};
            
        if (DB_FS.insideDB(dir)) {
            throw new BPError(BP_ERROR.msg.ExistingStore, 'BadPathArgument', 'ExistingStore');
        }
        
        dbPath = DB_FS.makeDBPath(name, dir);
        keyPath = DB_FS.makeCryptInfoPath(dbPath, name, keyDir);
        
        try
        {
            // Create the directories.
            o={};
            if (BP_PLUGIN.createDir(dbPath,o))
            {
                // Create the cryptInfo file and context
                o={};
                if (!BP_PLUGIN.createCryptCtx(k,keyPath,dbPath,o)) {
                    throw new BPError(o.err);
                }

                o={};
                if (!k) {
                    //k = requestKey(dbPath);
                    throw new BPError("Please supply master password for " + dbPath);
                }
    
                DB_FS.dtl.forEach(function (dt, j)
                {
                    var p = DB_FS.makeDTDirPath(dt, dbPath);
                    if (!BP_PLUGIN.createDir(p,o)) 
                    {
                        throw new BPError(o.err);
                    }
                });
            }
            else {
                throw new BPError(o.err);
            }
            
            MEMSTORE.clear(); // unload the previous DB.
            DB_FS.setDBPath(dbPath); // The DB is deemed loaded (though it is empty)
        }
        catch (exp) {
            o = {};
            BP_PLUGIN.destroyCryptCtx(dbPath, o);
            BP_PLUGIN.rm(keyPath, {secureDelete:true});
            BP_PLUGIN.rm(dbPath);
            throw exp;
        }
        
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
    function TextFileStream(dbPath, pth)
    {
        Object.defineProperties(this,
        {
            dbPath: {value: dbPath, writable:false, configurable:false, enumerable:true},
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
            if (!BP_PLUGIN.readFile(this.dbPath, this.path, o)) {throw new BPError(o.err);}
            this.buf = o.dat;
            this.siz = o.siz;
        }
        var rval = this.regex.exec(this.buf);
        if (rval!==null) {
            //BP_ERROR.log("getDataLine-->" + rval[1]);
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
            fstrm: {value: new TextFileStream(null, path), writable:false, enumerable:false, configurable:false},
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
        var o={}, rval, i, prec, drec, pidx, csv, line, url, dr;
        if (BP_PLUGIN.ls(path, o))
        {
            switch (path.slice(-4).toLowerCase())
            {
                case ".csv":
                    BPError.atvt = new BP_ERROR.Activity("ImportCSV");
                    var csvf = new CSVFile(path),
                        uct = UC_TRAITS.csvImport;

                    while ((csv = csvf.getcsv2()) !== undefined)
                    {
                        if (!csv) {continue;} // unparsable line
                        else {BP_ERROR.loginfo("Importing " + JSON.stringify(csv));}
                        pidx = csvf.pidx;
                        url = parseURL(csv[pidx.url]);
                        prec = newPAction(url || {}, 
                                          Date.now(), 
                                          csv[pidx.userid],
                                          csv[pidx.pass]);
                        if (!MEMSTORE.PREC_TRAITS.isValidCSV(prec))
                        {
                            BP_ERROR.log("Discarding invalid csv record - " + JSON.stringify(csv));
                            prec = null; continue;
                        }
                        else
                        {
                            drec = new MEMSTORE.DRecord(prec, dt_pRecord, uct);
                        }
                        
                        if ((dr=MEMSTORE.insertDrec(drec)))
                        {
                            try {
                                if (MEMSTORE.DT_TRAITS.getTraits(dt_pRecord).toPersist(dr.notes) && uct.toPersist(dr.notes)) {
                                    insertRec(prec, dt_pRecord);
                                }
                            } catch (e) {
                                var bpe = new BPError(e);
                                BP_ERROR.log("importCSV@bp_filestore.js (Skipping record) " + bpe.toString());
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
       
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        importCSV: {value: importCSV},
        exportCSV: {value: exportCSV},
        CSVFile: {value: CSVFile},
        createDB: {value: createDB},
        loadDB: {value: loadDBExt}, // TODO: Change name of property to loadDB2
        unloadDB:   {value: unloadDB},
        cleanLoadDB:{value: cleanLoadDB},
        compactDB:  {value: compactDB},
        mergeDB:    {value: mergeDB},
        mergeInDB:  {value: mergeInDB},        
        mergeOutDB: {value: mergeOutDB},
        insertRec:  {value: insertRec},
        UC_TRAITS: {value: UC_TRAITS}
    });
    Object.freeze(iface);

    BP_ERROR.log("constructed mod_filestore");
    return iface;
}