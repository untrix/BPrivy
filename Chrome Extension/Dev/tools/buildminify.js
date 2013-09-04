/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012-2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true */
/*global require, process, __filename */

'use strict';

var fs  = require('fs.extra'),
    path = require('path'),
    bp   = require('./bp.js'),
    async = bp.newAsync('buildminify'),
    abs  = path.resolve,
    argv = process.argv.slice(2),
    copyright,
    copyright_file = 'copyright.js';

function readFileCallback(err, data, ctx)
{
    data = bp.uglify(data.toString(), {RELEASE:true});
    fs.writeFileSync(ctx.df, copyright);
    fs.appendFile(ctx.df, data, async.runHere(bp.throwErr));
}

function minify(SRC, DST, FORCE)
{
    var files = fs.readdirSync(SRC),
        i, n, d, f, df, sf, ext, ext2;

    for (i=0,n=files.length; i<n; i++)
    {
        f = files[i];
        ext = f.slice(f.lastIndexOf(".cat.")).toLowerCase();
        ext2= f.slice(f.lastIndexOf(".out.")).toLowerCase();
        if ((ext===".cat.js") || (ext2===".out.js") || (ext2===".lib.js"))
        {
            df = DST + f;
            sf = SRC + f;
            if ( FORCE || (!fs.existsSync(df)) ||
                (fs.lstatSync(sf).mtime > fs.lstatSync(df).mtime))
            {
                console.log('Minifying ' + df);
                //readFileCallback will be invoked with {df:df} as last argument
                d = fs.readFile(sf, async.runHere(readFileCallback, {df:df}));
            }
        }
    }
}

if (argv.length < 2)
{
    console.error("Usage: node " + path.basename(__filename) + " <src dir> <dest dir> [force]");
    process.exit(1);
}
else {
    fs.mkdirp(argv[1]);
    copyright = fs.readFileSync(abs(argv[0])+path.sep+copyright_file);
    minify(abs(argv[0])+path.sep, abs(argv[1])+path.sep, Boolean(argv[2]==='force'));
}

async.end();
