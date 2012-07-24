/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*global require, process */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true */


var fs = require('fs'),
    path = require('path'),
    TMPDIR = path.resolve('tmp') + path.sep,
    argv = process.argv.slice(2),
    recess = require('recess');
    
    if (!argv[0]) {
        throw new Error('Mising src dir argument. Usage: "node buildcss.js <src dir>"');
        //process.exit(1);
    }
    var SRC = path.resolve(argv[0] || '') + path.sep;

console.log('Source directory ' + SRC);
console.log('Temp directory ' + TMPDIR);

function zero(path)
{   'use strict';
    var fd = fs.openSync(path, 'w'); // truncate the file.
    fs.closeSync(fd);
    return path;
}

function cat(src, dest, BASE)
{
    'use strict';
    var i, n, data;
    BASE = BASE || '';
    zero(path.resolve(BASE, dest)); // truncate the file.
    
    for (i=0,n=src.length; i<n; i++)
    {
        console.log('Processing file ' + path.resolve(BASE, src[i]));
        data = fs.readFileSync(path.resolve(BASE, src[i]));
        fs.appendFileSync(path.resolve(BASE, dest), data);
    }
}

// cat([SRC+'dev_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.dev.less');// cat([SRC+'prod_header.less', SRC+'bp_bootstrap.less', SRC+'bp_bootstrap-responsive.less', SRC+'bp.less'], 'bp.prod.less');
if (!fs.existsSync(path.resolve('dev_header.less'))) {
    throw new Error("You need to create a dev_header.less file based on dev_header.sample.less");
}
cat(['dev_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dev.less');
cat(['prod_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.prod.less');
cat(['dist_header.less', SRC+'bp_bootstrap.less'], TMPDIR+'bp.dist.less');
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


function getRecessFunc (fpath) 
{
    'use strict';
    return function (err, obj)
    {   var i, n;
        if (err) {throw err;}
        for (i=0, n=obj.length; i<n; i++) {
            fs.appendFileSync(path.resolve(fpath), obj[i].output);
        }
    };
}
//recess --compile ..\bp.less ..\bp_bootstrap-responsive.less ..\bp_bootstrap.less > ..\bp.css
var devTarget = path.resolve(SRC, 'bp.css'), 
    prodTarget = path.resolve(SRC, '..', 'prod', 'bp.css'),
    distTarget = path.resolve(SRC, '..', 'dist', 'bp.css');

recess([SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dev.less'], {compile:true, compress:false}, getRecessFunc(zero(devTarget)));
recess([SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.prod.less'], {compile:true, compress:true}, getRecessFunc(zero(prodTarget)));
recess([SRC+'bp.less', SRC+'bp_bootstrap-responsive.less', TMPDIR+'bp.dist.less'], {compile:true, compress:true}, getRecessFunc(zero(distTarget)));
