/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Untrix Soft
 */

/* JSLint directives */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true, stupid:true, sloppy:true */

/*global require, process, __filename, module */

var events = require('events'),
    path = require('path'),
    abs = path.resolve,
    fs = require('fs.extra'),
    jsp = require("uglify-js").parser,
    pro = require("uglify-js").uglify,
    UglifyJS = require("uglify-js"),
    global_objects = ['window','document','console','chrome','$','jQuery', 'webkitNotifications'];


var ProtoJobTracker = Object.create(events.EventEmitter.prototype,{
    done: {value: function ()
    {   'use strict';
        if ((--this.n)<=0) {
            this.emit('done', this);
        }
        // else {            // console.log(this.name + ' decr');        // }
    }},
    runHere: {value: function(func, ctx)
    {   'use strict';
        this.n++;
        var self = this;
        return function()
        {
            if (func) {
                // invoke func with all passed in arguments as well as ctx if available.
                // 'arguments' is actually not an array, therefore we need to convert it
                // to one by applying Array.prototype.slice to it.
                func.apply(null, (!ctx)? arguments: Array.prototype.slice.apply(arguments).concat([ctx]));
            }
            self.done();
        };
    }},
    track: {value: function ()
    {   'use strict';
        this.n++;
        var self = this;
        return function()
        {
            self.done();
        };
    }},
    logEnd: {value: function(self)
    {   'use strict';
        if (!self) {self=this;}
        console.log('<-- Job ended: ' + self.name);
    }},    end: {value: function(){this.done();}}
});

function Async (name, _done)
{   'use strict';
    var o = Object.create(ProtoJobTracker,
    {
        n   : {value: 1, writable: true}, // the incremented value of n will be decremented by a call to release()
        name: {value: name},
        constructor: {value: Async}
    });
    if (_done) {
        o.on('done', _done);
    }
    else {
        o.on('done', ProtoJobTracker.logEnd);
    }
    console.log('--> Job created: ' + name);
    return Object.seal(o);
}

function throwErr(err)
{   'use strict';
    if (err) { throw err; }
}

function copy(srcDir, dstDir, files, async)
{   'use strict';
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
            fs.copy(fsrc, fdst, async.runHere(throwErr));
        }
    });
}

function buildPackage(src, bld, async)
{   'use strict';
    copy(src, bld, ['updates.xml'], async);
}

function processFiles(src, dst, files, callback, async, force)
{   'use strict';
    files.forEach(function (fname, i, files)
    {
        var df = dst+fname,
            sf = src+fname;
        fs.readFile(src+fname, async.runHere(callback, {sf:sf, df:df, async:async, force:force}));
    });
}

function zero(path)
{   'use strict';
    var fd = fs.openSync(path, 'w'); // truncate the file.
    fs.closeSync(fd);
    return path;
}

function doBuild(files, target, force)
{   'use strict';
    var srcTime,
        ftime,
        rval;

    if (force || (!fs.existsSync(target))) {return true;}

    ftime = fs.lstatSync(target).mtime;

    return files.some(function (f, i, files)
    {
        //var mtime = fs.lstatSync(f).mtime;
        return (fs.lstatSync(f).mtime>ftime);
        // if (!srcTime) { srcTime = mtime;}
        // else if (mtime>srcTime) {srcTime = mtime;}
    });

    //return srcTime > fs.lstatSync(target).mtime;
}

function catIfNeeded(srcFiles, dest, force)
{   'use strict';
    var i, n, data;

    if ((!force) && (!doBuild(srcFiles, dest))) {
        return;
    }

    if (fs.existsSync(dest)) {
        zero(dest); // truncate the file.
    }

    console.log('Cating into ' + dest);
    srcFiles.forEach(function (f, i, srcFiles)
    {
        //console.log('Processing file ' + f);
        data = fs.readFileSync(f);
        if (i>0) {
            fs.appendFileSync(dest, "\n");
        }
        fs.appendFileSync(dest, data);
    });
}

function cleanJson(err, data, ctx)
{   'use strict';
    if (err) {throw err;}

    var o = JSON.parse(data);

    if (doBuild([ctx.sf], ctx.df, ctx.force)) {
        // Remove commented out keys
        Object.keys(o).forEach(function (k)
        {
            if (k.charAt(0)==='#') {delete o[k];}
        });
        console.log("Creating JSON file " + ctx.df);
        fs.writeFile(ctx.df, JSON.stringify(o, undefined, 4), ctx.async.runHere(throwErr));
    }
}

function uglify_old(orig_code, defines, beautify)
{

    var ast = jsp.parse(orig_code); // parse code and get the initial AST
    ast = pro.ast_lift_variables(ast);
    ast = pro.ast_mangle(ast, {defines:defines, except:global_objects}); // get a new AST with mangled names
    //ast = pro.ast_squeeze(ast, {dead_code:false}); // get an AST with compression optimizations
    ast = pro.ast_squeeze(ast); // trying with dead_code=true. Should remove dead-code.
    return pro.gen_code(ast, {beautify:beautify}); // compressed code here
}

function uglify(orig_code, defs, beautify)
{
    var toplevel = UglifyJS.parse(orig_code);
    toplevel.figure_out_scope();
    var compressor = UglifyJS.Compressor({dead_code:true, global_defs:defs, hoist_vars:true});
    var compressed_ast = toplevel.transform(compressor);
    compressed_ast.figure_out_scope();
    compressed_ast.compute_char_frequency();
    compressed_ast.mangle_names({reserved:global_objects});
    var code = compressed_ast.print_to_string({beautify:beautify});
    return code;

}

function minify(sf, df, beautify, copyright)
{
    var data = fs.readFileSync(sf);
    data = uglify(data.toString(), {RELEASE:false}, true);
    if (copyright) {fs.writeFileSync(df, copyright);}
    fs.appendFileSync(df, data);
}

module.exports = {
    newAsync:Async,
    throwErr:throwErr,
    buildPackage:buildPackage,
    processFiles:processFiles,
    cleanJson:cleanJson,
    zero:zero,
    doBuild:doBuild,
    catIfNeeded:catIfNeeded,
    uglify:uglify,
    minify:minify
};
