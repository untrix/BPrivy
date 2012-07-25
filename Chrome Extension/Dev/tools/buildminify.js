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

var jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    fs  = require('fs.extra'),
    path = require('path'),
    abs  = path.resolve,
    argv = process.argv.slice(2);

function uglify(orig_code)
{   'use strict';
    
    var ast = jsp.parse(orig_code); // parse code and get the initial AST
    ast = pro.ast_lift_variables(ast);
    ast = pro.ast_mangle(ast); // get a new AST with mangled names
    ast = pro.ast_squeeze(ast, {dead_code:false}); // get an AST with compression optimizations
    return pro.gen_code(ast); // compressed code here
}

function minify(SRC, DST)
{   'use strict';
    var files = fs.readdirSync(SRC),
        i, n, d, f, df;
        
    for (i=0,n=files.length; i<n; i++)
    {
        if (files[i].slice(-3).toLowerCase()===".js")
        {
            f = files[i];
            if ((!fs.existsSync(DST+f)) || 
                (fs.lstatSync(SRC+f).mtime > fs.lstatSync(DST+f)))
            {
                df = path.resolve(DST, f);
                console.log('Minifying ' + df);
                d = fs.readFileSync(path.resolve(SRC, f));
                d = uglify(d.toString());
                fs.writeFileSync(df, d);
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
