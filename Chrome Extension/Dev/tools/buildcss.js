/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true, sloppy:true */
/*global require, process, __filename */

var fs = require('fs.extra'),
    path = require('path'),
    abs  = path.resolve,
    argv = process.argv.slice(2),
    recess = require('recess'),
    events = require('events'),
    bp = require('./bp.js'),
    pendingItems=1;
    
    if (argv.length < 2) 
    {
        console.error("Usage: node " + path.basename(__filename) + " <src dir> <build dir>");
        process.exit(1);
    }
    var SRC = abs(argv[0]) + path.sep,
        DST = abs(argv[1]) + path.sep,
        TMPDIR = abs(DST, 'tmp') + path.sep,
        TYPE = argv[2];

function zero(path)
{   'use strict';
    var fd = fs.openSync(path, 'w'); // truncate the file.
    fs.closeSync(fd);
    return path;
}

function doBuild(files, target)
{
    var srcTime;
    if (!fs.existsSync(target)) {return true;}
    
    files.forEach(function (f, i, files)
    {
        var mtime = fs.lstatSync(f).mtime;
        if (!srcTime) { srcTime = mtime;}
        else if (mtime>srcTime) {srcTime = mtime;}
    });
    
    return srcTime > fs.lstatSync(target).mtime;
}

function catIfNeeded(srcFiles, dest)
{
    'use strict';
    var i, n, data;
    
    if (!doBuild(srcFiles, dest)) {
        return;
    }
    
    if (fs.existsSync(dest)) {
        zero(dest); // truncate the file.
    }
    
    console.log('Cating ' + dest);
    srcFiles.forEach(function (f, i, srcFiles)
    {
        //console.log('Processing file ' + f);
        data = fs.readFileSync(f);
        fs.appendFileSync(dest, data);
    });
}

// cat([SRC+'dev_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.dev.less');// cat([SRC+'release_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.release.less');
if (!fs.existsSync(abs('dev_header.less')) || !fs.existsSync(abs('release_header.less'))) {
    throw new Error("You need to create a dev_header.less and release_header.less files based on dev_header.sample.less."+
        " Replace extension-id with whatever you see in your local Google Chrome instance.");
}
// Ensure that the tmp dir exists.
fs.mkdirp(TMPDIR);
catIfNeeded(['dev_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dev.less');
catIfNeeded(['release_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.release.less');
catIfNeeded(['dist_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dist.less');
/*
 var recess = require('recess')

recess('./js/fat.css', { compile: true }, function (err, obj) {
  if (err) throw err
  console.log(
    obj // recess instance for fat.css
  , obj.output // array of loggable content
  , obj.errors // array of failed lint rules
  )
})
*/

var async = bp.newAsync('buildcss');

function makeRecessCback (fpath) 
{
    'use strict';
    return function (err, obj)
    {   var i, n;
        if (err) {throw err;}
        zero(fpath);
        console.log('Compiling ' + fpath);
        for (i=0, n=obj.length; i<n; i++) {//TODO: convert this to a forEach loop
            fs.appendFile(fpath, obj[i].output, async.runHere(bp.throwErr));
        }
    };
}

var devTarget = abs(SRC, 'bp.css'), 
    releaseTarget = abs(DST, 'release', 'bp.css'),
    distTarget = abs(DST, 'dist', 'bp.css'),
    srcFiles=[];
    
// Ensure that the build dirs exist.
fs.mkdirp(abs(DST, 'release'));
fs.mkdirp(abs(DST, 'dist'));

srcFiles=[SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dev.less'];
if (doBuild(srcFiles, devTarget)) {    recess(srcFiles, {compile:true, compress:false}, async.runHere(makeRecessCback(devTarget)));}

srcFiles = [SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.release.less'];
if (doBuild(srcFiles, releaseTarget)) { 
    recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(releaseTarget)));
}

srcFiles = [SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dist.less'];
if (doBuild(srcFiles, distTarget)) {
    recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(distTarget)));
}

async.end();
