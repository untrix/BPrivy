/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true, 
  stupid:true, 
  sloppy:true */
/*global require, process, __filename */

var fs = require('fs.extra'),
    rimraf = require('rimraf'),
    rmrf = rimraf.sync,
    events = require('events'),
    path = require('path'),
    abs = path.resolve,
    argv = process.argv.slice(2),
    child = require('child_process'),
    bp = require('./bp.js'),
    async = bp.newAsync('build'),
    catIfNeeded = bp.catIfNeeded,
    qualify = function (relDir) // takes relDir & variable number of files
                                // and prepends relDir to them
    {   'use strict';
        var files = [], i, n;
        for (i=1, n=arguments.length; i<n; i++) {
            files.push(relDir + path.sep + arguments[i]);
        }
        return files;
    },
    qualifyA = function (dir, relFiles)
    {   'use strict';
        var files = [], i, n;
        for (i=0, n=relFiles.length; i<n; i++) {
            files.push(dir + path.sep + relFiles[i]);
        }
        return files;
    },
    lsDir = function (dirPath, src)
    {   'use strict';
        var list = [];
        
        function processFiles(files)
        {
            var i, n, stat, fpath;

            for (i=0,n=files.length; i<n; i++) 
            {
                fpath = abs(dirPath, files[i]);
                stat = fs.lstatSync(fpath);
                if (stat.isFile()) {
                    list.push(path.relative(src, fpath));
                }
                else {
                    list = list.concat(lsDir(fpath, src));
                }
            }
        }
        
        processFiles(fs.readdirSync(dirPath));
        
        return list;
    },
    lsSkel = function (basePath, files)
    {
        var list = {}, b;
            
        files.forEach(function (f, i, files)
        {
            if (f.indexOf(path.sep) !== -1) {
                b = path.dirname(f);
                list[abs(basePath, b)] = true;
            }
        });
        
        return list;
    };
    
if (argv.length < 2) 
{
    console.error("Usage: node " + path.basename(__filename) + " <src dir> <build dir>");
    process.exit(1);
}

var src = abs(argv[0]),
    bld = abs(argv[1]),
    release = abs(bld, 'release'),
    minjs = abs(bld, 'minjs'),
    dist = abs(bld, 'dist'),
    release_js = [
    'bp_cs.cat.js',
    'bp_main.cat.js',
    'bp_manage.cat.js'
    ],
    release_cs_js = [
       "bp_error.js", "bp_common.js", "bp_traits.js", 
       "bp_cs_platform_chrome.js", "bp_connector.js", "bp_w$.js", "bp_panel.wdl.js",
       "bp_cs.js"
    ],
    release_main_js=['bp_error.js','bp_common.js','bp_traits.js',"bp_main_chrome.js","bp_cs_platform_chrome.js",
                     "bp_connector.js","bp_memstore.js","bp_filestore.js","bp_main.js" ],
    release_manage_js=["bp_error.js","bp_common.js","bp_traits.js","bp_cs_platform_chrome.js","bp_w$.js",
                       "bp_connector.js","bp_memstore.js","bp_filestore.js","bp_panel.wdl.js",
                       "bp_editor.wdl.js","bp_manage.js"],
    release_others = [
    'bp_manage.html',
    'BP_Main.html'].
    concat(qualify('data', 'etld.json')).
    concat(lsDir(abs(src,'icons'), src)).    concat(lsDir(abs(src,'tp'), src)),
    release_json = ['manifest.json'];

fs.mkdirpSync(bld);

var ch1 = child.fork('buildcss.js', [src,bld]);
ch1.on('exit', async.track());
ch1.disconnect();

function copy(srcDir, dstDir, files)
{
    var i, n, 
        fsrc, fdst;
    files.forEach(function (f, i, files)
    {
        fsrc = abs(srcDir, f);
        fdst = abs(dstDir, f);
        if ((!fs.existsSync(fdst)) ||
            (fs.lstatSync(fsrc).mtime > fs.lstatSync(fdst).mtime))
        {
            console.log("Copying " + fdst);
            if (fs.existsSync(fdst)) {
                fs.unlinkSync(fdst); // truncate the file.
            }
            fs.copy(fsrc, fdst, async.runHere(bp.throwErr));
        }
    });
}

function mkdirp(dirs)
{
    dirs.forEach(function(dir, i, dirs)
    {
        fs.mkdirpSync(dir);
    });
}

// ensure that all internal directories exist
mkdirp(Object.keys(lsSkel(release, release_others)));
mkdirp(Object.keys(lsSkel(dist, release_others)));

catIfNeeded(qualifyA(src,release_cs_js), src + path.sep + 'bp_cs.cat.js');
catIfNeeded(qualifyA(src,release_main_js), src + path.sep + 'bp_main.cat.js');
catIfNeeded(qualifyA(src,release_manage_js), src + path.sep + 'bp_manage.cat.js');

var ch2 = child.fork('buildminify.js', [src, minjs]);
ch2.on('exit', async.runHere(function childExit(code, signal)
{
    copy(minjs, release, release_js);
    copy(src, release, release_others);
    copy(minjs, dist, release_js);
    copy(src, dist, release_others);
    var pem_dir = path.dirname(bld);
    copy(pem_dir, dist, ['key.pem']);

}));
ch2.disconnect();

// Ensure that (the handwritten) manifest.json is valid.
bp.processFiles(src+path.sep, release+path.sep, release_json, bp.cleanJson, async);
bp.processFiles(src+path.sep, dist+path.sep, release_json, bp.cleanJson, async);

var async2 = bp.newAsync('package');
// Interleave async and async2 here.
async.on('done', async2.runHere(function() {bp.buildPackage(src, bld, async2);}));
async.end();
async2.end();
