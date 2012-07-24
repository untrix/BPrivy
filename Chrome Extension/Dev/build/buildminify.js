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
    fs  = require('fs'),
    path = require('path'),
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
        i, n, d, f;
        
    for (i=0,n=files.length; i<n; i++)
    {
        if (files[i].slice(-3).toLowerCase()===".js")
        {
            f = files[i];
            d = fs.readFileSync(path.resolve(SRC, f));
            d = uglify(d.toString());
            fs.writeFileSync(path.resolve(DST, f), d);
        }
    }
}

if (argv.length < 2) {
    throw new Error("Usage: " + __filename + " <src dir> <dest dir>");
}
else {
    minify(argv[0], argv[1]);
}
