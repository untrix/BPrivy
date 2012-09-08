/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true */
/*global require, process, __filename */

'use strict';

var jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    fs  = require('fs.extra'),
    path = require('path'),
    bp   = require('./bp.js'),
    async = bp.newAsync('buildminify'),
    abs  = path.resolve,
    argv = process.argv.slice(2);

function uglify(orig_code)
{
    
    var ast = jsp.parse(orig_code); // parse code and get the initial AST
    ast = pro.ast_lift_variables(ast);
    ast = pro.ast_mangle(ast); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast, {dead_code:false}); // get an AST with compression optimizations
    return pro.gen_code(ast); // compressed code here
}

function readFileCallback(err, data, ctx)
{
    data = uglify(data.toString());
    fs.writeFile(ctx.df, data, async.runHere(bp.throwErr));
}

function minify(SRC, DST)
{
    var files = fs.readdirSync(SRC),
        i, n, d, f, df, sf, ext;
        
    for (i=0,n=files.length; i<n; i++)
    {
        f = files[i];
        ext = f.slice(f.lastIndexOf(".cat.")).toLowerCase();
        if (ext===".cat.js")
        {
            df = DST + f;
            sf = SRC + f;
            if ((!fs.existsSync(df)) ||
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
    console.error("Usage: node " + path.basename(__filename) + " <src dir> <dest dir>");
    process.exit(1);
}
else {
    fs.mkdirp(argv[1]);
    minify(abs(argv[0])+path.sep, abs(argv[1])+path.sep);
}

async.end();
