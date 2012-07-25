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
    path = require('path'),
    abs = path.resolve,
    argv = process.argv.slice(2),
    child = require('child_process'),
    qualify = function (relDir, varFileNames) // takes relDir & variable number of files
    {   'use strict';
        var files = [], i, n;
        for (i=1, n=arguments.length; i<n; i++) {
            files.push(relDir + path.sep + arguments[i]);
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
    prod = abs(bld, 'prod'),
    minjs = abs(bld, 'minjs'),
    doneFlags = [],
    prod_js = [
    'bp_common.js',
    'bp_connector.js',
    'bp_CS.js',
    'bp_cs_platform_chrome.js',
    'bp_error.js',
    'bp_filestore.js',
    'bp_main.js',
    'bp_main_chrome.js',
    'bp_manage.js',
    'bp_memstore.js',
    'bp_panel.js',
    'bp_traits.js',
    'bp_w$.js'    
    ],
    prod_others = [
    'manifest.json',
    'bp_manage.html',
    'BP_Main.html'].
    concat(qualify('data', 'etld.json')).
    concat(lsDir(abs(src,'icons'), src)).    concat(lsDir(abs(src,'tp'), src));

fs.mkdirpSync(bld);

function done()
{
    return (doneFlags[1] && doneFlags[2] && doneFlags[3]);
}

var ch1 = child.fork('buildcss.js', [src,bld]);
ch1.on('exit', function (code, signal)
{
    doneFlags[1] = true;
    if (done()) {
        process.exit(code);
    }
});
ch1.disconnect();

var ch2 = child.fork('buildminify.js', [src, minjs]);
ch2.on('exit', function childExit(code, signal)
{
    doneFlags[2] = true;
    if (done()) {
        process.exit(code);
    }
});
ch2.disconnect();

function throwErr(err){ if (err) {doneFlags[3]=true; throw err;}}
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
            fs.copy(fsrc, fdst, throwErr);
        }
    });
}

console.log("Processing files " + JSON.stringify(prod_js)+JSON.stringify(prod_others));

function mkdirp(dirs)
{
    dirs.forEach(function(dir, i, dirs)
    {
        fs.mkdirpSync(dir);
    });
}
// ensure that all internal directories exist
mkdirp(Object.keys(lsSkel(prod, prod_others)));
copy(minjs, prod, prod_js);
copy(src, prod, prod_others);

doneFlags[3] = true;
if (done()) {process.exit(0);}
