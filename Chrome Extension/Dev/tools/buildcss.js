/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012-2013. All Rights Reserved, Untrix Inc
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
    console.error("Usage: node " + path.basename(__filename) + " <src dir> <build dir> [all] [force]");
    process.exit(1);
}
var SRC = abs(argv[0]) + path.sep,
    DST = abs(argv[1]) + path.sep,
    TMPDIR = abs(DST, 'tmp') + path.sep,
    ALL = Boolean(argv[2]==='all'),
    FORCE = Boolean((argv[2]==='force') || (argv[3]==='force'));


// cat([SRC+'dev_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.dev.less');// cat([SRC+'release_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.release.less');
if (!fs.existsSync(abs('dev_header.less')) || !fs.existsSync(abs('release_header.less'))) {
    throw new Error("You need to create a dev_header.less and release_header.less files based on dev_header.sample.less."+
        " Replace extension-id with whatever you see in your local Google Chrome instance.");
}

var async = bp.newAsync('buildcss');

// Ensure that the tmp dir exists.
fs.mkdirp(TMPDIR);
catIfNeeded(['dev_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dev.less', FORCE);
if (ALL) {
    catIfNeeded(['release_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.release.less', FORCE);
    catIfNeeded(['dist_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dist.less', FORCE);
}// catIfNeeded(['dev_header.less', SRC+'bp.less'], TMPDIR+'bp.dev.less', FORCE);
// catIfNeeded(['release_header.less', SRC+'bp.less'], TMPDIR+'bp.release.less', FORCE);
// catIfNeeded(['dist_header.less', SRC+'bp.less'], TMPDIR+'bp.dist.less', FORCE);
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
    devTargetUncompressed = abs(SRC, 'bp.full.css'),
    releaseTarget = abs(DST, 'release', 'bp.css'),
    distTarget = abs(DST, 'dist', 'bp.css');

// Ensure that the build dirs exist.
fs.mkdirp(abs(DST, 'release'));
fs.mkdirp(abs(DST, 'dist'));

//var srcFiles=[SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dev.less'];
var srcFiles=[SRC+'bp.less', TMPDIR+'bp.dev.less'];
if (doBuild(srcFiles, devTarget, FORCE)) {
    recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(devTarget)));
}
srcFiles=[SRC+'bp.less', TMPDIR+'bp.dev.less'];
if (doBuild(srcFiles, devTargetUncompressed)) {
    recess(srcFiles, {compile:true, compress:false}, async.runHere(makeRecessCback(devTargetUncompressed)));
}

if (ALL) {
    srcFiles = [SRC+'bp.less', TMPDIR+'bp.release.less']; // reverse order of concatenation
    if (doBuild(srcFiles, releaseTarget, FORCE)) {
        recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(releaseTarget)));
    }

    srcFiles = [SRC+'bp.less', TMPDIR+'bp.dist.less']; // reverse order of concatenation
    if (doBuild(srcFiles, distTarget, FORCE)) {
        recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(distTarget)));
    }
}
// var srcFile=TMPDIR+'bp.dev.less';
// if (doBuild([srcFile], devTarget, FORCE)) {
    // recess(srcFile, {compile:true, compress:false}, async.runHere(makeRecessCback2(devTarget)));
// }
// srcFile=TMPDIR+'bp.release.less';
// if (doBuild([srcFile], releaseTarget, FORCE)) {
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget)));
// }
// srcFile=TMPDIR+'bp.dist.less';
// if (doBuild([srcFile], distTarget, FORCE)) {
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget)));
// }


var srcFile=SRC+'bp_manage.less',
    devTarget2 = abs(SRC, 'bp_manage.css'),
    releaseTarget2 = abs(DST, 'release', 'bp_manage.css'),
    distTarget2 = abs(DST, 'dist', 'bp_manage.css');

if (doBuild([srcFile], devTarget2, FORCE)) {
    recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(devTarget2)));
}
if (ALL) {
    if (doBuild([srcFile], releaseTarget2, FORCE)) {
        recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget2)));
    }
    if (doBuild([srcFile], distTarget2, FORCE)) {
        recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget2)));
    }
}    // srcFile=SRC+'bp.less';
// var devTarget3 = abs(SRC, 'bp_panel.css'),
    // releaseTarget3 = abs(DST, 'release', 'bp_panel.css'),
    // distTarget3 = abs(DST, 'dist', 'bp_panel.css');
// if (doBuild([srcFile], devTarget3, FORCE)) {
    // recess(srcFile, {compile:true, compress:false}, async.runHere(makeRecessCback2(devTarget3)));
// }
// if (doBuild([srcFile], releaseTarget3, FORCE)) {
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(releaseTarget3)));
// }
// if (doBuild([srcFile], distTarget3, FORCE)) {
    // recess(srcFile, {compile:true, compress:true}, async.runHere(makeRecessCback2(distTarget3)));
// }
devTarget = abs(SRC, 'bp_notification.css');
devTargetUncompressed = abs(SRC, 'bp_notification.full.css');
releaseTarget = abs(DST, 'release', 'bp_notification.css');
distTarget = abs(DST, 'dist', 'bp_notification.css');

srcFiles=[SRC+'bp_notification.less', TMPDIR+'bp.dev.less'];
if (doBuild(srcFiles, devTarget, FORCE)) {
    recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(devTarget)));
}
srcFiles=[SRC+'bp_notification.less', TMPDIR+'bp.dev.less'];
if (doBuild(srcFiles, devTargetUncompressed, FORCE)) {
    recess(srcFiles, {compile:true, compress:false}, async.runHere(makeRecessCback(devTargetUncompressed)));
}

if (ALL) {
    srcFiles = [SRC+'bp_notification.less', TMPDIR+'bp.release.less']; // reverse order of concatenation
    if (doBuild(srcFiles, releaseTarget, FORCE)) {
        recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(releaseTarget)));
    }
    srcFiles = [SRC+'bp_notification.less', TMPDIR+'bp.dist.less']; // reverse order of concatenation
    if (doBuild(srcFiles, distTarget, FORCE)) {
        recess(srcFiles, {compile:true, compress:true}, async.runHere(makeRecessCback(distTarget)));
    }
}

async.end();
