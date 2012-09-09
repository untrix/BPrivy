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
    doBuild = bp.doBuild,
    zero = bp.zero,
    catIfNeeded = bp.catIfNeeded,
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


// cat([SRC+'dev_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.dev.less');// cat([SRC+'release_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.release.less');
if (!fs.existsSync(abs('dev_header.less')) || !fs.existsSync(abs('release_header.less'))) {
    throw new Error("You need to create a dev_header.less and release_header.less files based on dev_header.sample.less."+
        " Replace extension-id with whatever you see in your local Google Chrome instance.");
}
// Ensure that the tmp dir exists.
fs.mkdirp(TMPDIR);
// catIfNeeded(['dev_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dev.less');
// catIfNeeded(['release_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.release.less');
// catIfNeeded(['dist_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dist.less');catIfNeeded(['dev_header.less', SRC+'bp.less'], TMPDIR+'bp.dev.less');
catIfNeeded(['release_header.less', SRC+'bp.less'], TMPDIR+'bp.release.less');
catIfNeeded(['dist_header.less', SRC+'bp.less'], TMPDIR+'bp.dist.less');
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
function makeRecessCback2 (fpath) 
{
    'use strict';
    return function (err, obj)
    {   var i, n;
        if (err) {throw err;}
        zero(fpath);
        console.log('Compiling ' + fpath);
        
        fs.appendFile(fpath, obj.output, async.runHere(bp.throwErr));
    };
}
var devTarget = abs(SRC, 'bp.css'), 
    releaseTarget = abs(DST, 'release', 'bp.css'),
    distTarget = abs(DST, 'dist', 'bp.css');
    
// Ensure that the build dirs exist.
fs.mkdirp(abs(DST, 'release'));
fs.mkdirp(abs(DST, 'dist'));

// //var srcFiles=[SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dev.less'];
// var srcFiles=[SRC+'bp.less', 'dev_header.less']; // reverse order of concatenation
// if (doBuild(srcFiles, devTarget)) {
    // recess(srcFiles, {compile:true, compress:false}, async.runHere(makeRecessCback(devTarget)));
// }
// 
// //srcFiles = [SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.release.less'];
// srcFiles=[SRC+'bp.less', 'release_header.less']; // reverse order of concatenation
// if (doBuild(srcFiles, releaseTarget)) { 
    // recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(releaseTarget)));
// }
// 
// //srcFiles = [SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dist.less'];
// srcFiles=[SRC+'bp.less', 'dist_header.less']; // reverse order of concatenation
// if (doBuild(srcFiles, distTarget)) {
    // recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(distTarget)));
// }
var srcFile=TMPDIR+'bp.dev.less';
if (doBuild([srcFile], devTarget)) {
    recess(srcFile, {compile:true, compress:false}, async.runHere(makeRecessCback2(devTarget)));
}
srcFile=TMPDIR+'bp.release.less';
if (doBuild([srcFile], releaseTarget)) { 
    recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget)));
}
srcFile=TMPDIR+'bp.dist.less';
if (doBuild([srcFile], distTarget)) {
    recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget)));
}


var srcFile=SRC+'bp_manage.less',
    devTarget2 = abs(SRC, 'bp_manage.css'),
    releaseTarget2 = abs(DST, 'release', 'bp_manage.css'),
    distTarget2 = abs(DST, 'dist', 'bp_manage.css');

if (doBuild([srcFile], devTarget2)) {
    recess(srcFile, {compile:true, compress:false}, async.runHere(makeRecessCback2(devTarget2)));
}
if (doBuild([srcFile], releaseTarget2)) { 
    recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget2)));
}
if (doBuild([srcFile], distTarget2)) {
    recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget2)));
}    // srcFile=SRC+'bp.less';
// var devTarget3 = abs(SRC, 'bp_panel.css'),
    // releaseTarget3 = abs(DST, 'release', 'bp_panel.css'),
    // distTarget3 = abs(DST, 'dist', 'bp_panel.css');
// if (doBuild([srcFile], devTarget3)) {
    // recess(srcFile, {compile:true, compress:false}, async.runHere(makeRecessCback2(devTarget3)));
// }
// if (doBuild([srcFile], releaseTarget3)) { 
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget3)));
// }
// if (doBuild([srcFile], distTarget3)) {
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget3)));
// }



async.end();
