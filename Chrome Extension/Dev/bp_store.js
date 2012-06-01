/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* JSLint directives */
/*global $, console, window, MOD_CONNECT, MOD_CS_PLAT, IMPORT, MOD_COMMON, MOD_ERROR */
//*members */

var MOD_MEMSTORE = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var m;
    /** @import-module-begin Error */
    m = IMPORT(MOD_ERROR);
    var BPError = IMPORT(m.BPError);
    /** @import-module-begin Common */
    m = MOD_COMMON;
    var PROTO_HTTP = IMPORT(m.PROTO_HTTP);
    var PROTO_HTTPS = IMPORT(m.PROTO_HTTPS);
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin Connector */
    m = MOD_CONNECT;
    var cm_getRecs = IMPORT(m.cm_getRecs);
    var recKey = IMPORT(m.recKey);
    var newActions = IMPORT(m.newActions); // Actions constructor
    var DNODE_TAG = IMPORT(m.DNODE_TAG);
    var tag_eRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_eRecord));
    var tag_pRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_pRecord));
    /** @import-module-end **/    m = null;

    /** @globals-begin */

    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_EQUAL = Number(0);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_SUB = Number(-1);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_SUPER = Number(1);
    /** 
     * @constant 
     * @enumerator return value of comparison function 
     */
    var D_DIFF = Number(2);
    /** Two in-mem Tries. Make sure this file is run only in one thread otherwise multiple
     * copies of the tries will get created.
     */
    var g_pd, g_kd;

    /** @globals-end **/
    
    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode. Discards URL-scheme, query and fragment
     * values as those are deemed irrelevant for our purpose.
     */
    function newUrla (l) // throws BPError
    {
        var ha, pa, qa, pr, pn, urla = [], i, s;

        // Note: We need scheme and hostname at a minimum for a valid URL. We also need
        // pathname before we insert into TRIE, hence we'll append a "/" if path is missing.
        // But first ensure that this is indeed a URL.
        if (! (l && 
                (typeof l.protocol=== "string") && (l.protocol.length > 0) &&
                (typeof l.hostname === "string") && (l.hostname.length > 0) ) )
            {throw new BPError("Scheme or Hostname lacking in URI argument to newUrla: "+JSON.stringify(l));}
        
        pr = l.protocol.toLowerCase();

        // Split hostname into an array of strings.       
        ha = l.hostname.split('.');
        ha.reverse();
        
        if (!l.pathname) {s = "/";} // In practice, all code tacks-on a "/" if missing in a valid URL.
        else {s = l.pathname;}
        // Split pathname into path segments.
        // First remove leading slashes
        s = s.replace(/^\/+/,'');
        // Now split into an array of strings.
        pa = s.split('/');

        if (l.search) {
            qa = l.search.split('&');
        }

        if (l.port) {
            i = Number(l.port);
            switch(pr) {
                case PROTO_HTTP:
                    if(i !== 80) {pn = i;}
                break;
                case PROTO_HTTPS:
                    if(i !== 443) {pn = i;}
                break;
                default:
                    pn = i;
            }
        }
        
        // Construct the url segment array
                // if (pr) {
            // switch(pr) {
               // case PROTO_HTTP:
                    // urla.push('{s}http');
                    // break;
                // case PROTO_HTTPS:
                    // urla.push('{s}https');
                    // break;
                // default:
                    // urla.push('{s}' + pr);           
            // }
        // }

        if (ha) {
            for (i=0; i<ha.length; i++) {
                if (i===0) {
                    // Top-Level Domain. Doesn't account for TLDs like 'co.in' though.
                    urla.push(DNODE_TAG.TLD + ha[i].toLowerCase());
                }
                else if (i === (ha.length-1)) {
                    // Host name
                    urla.push(DNODE_TAG.HOST + ha[i].toLowerCase());
                }
                else {
                    // Second level domain
                    urla.push(DNODE_TAG.DOMAIN + ha[i].toLowerCase());
                }
            }
        }
        if (pn) {urla.push(DNODE_TAG.PORT + pn);} // Port Number
        if (pa) { // Path
            for (i=0; i<pa.length; i++) {
                if (pa[i] !== '') {
                    urla.push(DNODE_TAG.PATH + pa[i]);
                }
            }
        }
        
        return urla;
    }

    /** @begin-class-def Iterator */
    /**
     * @constructor
     * @interface
     */
    function Iterator (urla)
    {
        this._a = urla;      
        this._i = 0;
        Object.seal(this);
    }
    /** Returns current value and advances iterator if possible */
    Iterator.prototype.incr = function() 
    {
        var i = this._i;
        if ((++this._i) > this._a.length) {this._i = i;}
        return this._a[i];
    };
    /** Returns current value and recedes iterator if possible */
    Iterator.prototype.decr = function()
    {
        var i = this._i;
        if ((--this.i) < 0) { this.i = i; }
        return this._a[i];
    };
    Iterator.prototype.count = function() 
    {
        return (this._a.length - this._i);
    };
    Iterator.prototype.get = function(i) 
    {
        return this._a[i? i : this._i];
    };
    Iterator.prototype.rwnd = function()
    {
        this._i = 0;
        return this._a[this._i];
    };
    Iterator.prototype.pos = function() 
    {
        return this._i;
    };
    Iterator.prototype.seek = function(i)
    {
        if(i) {
            this._i = i;
        }
    };
    Iterator.prototype.isBelowTLD = function()
    {
        var s = this._a[this._i];
        return (s.search(/^\{[st]\}.+/) === (-1));
    };
    function compare (i1, i2)
    {
        while (i1.count() && i2.count())
        {
            if (i1.get() !== i2.get()) {
                return D_DIFF;
            }
            else {
                i1.incr();
                i2.incr();
            }
        }
        
        if (i1.count() === i2.count() === 0) {return D_EQUAL;}
        else if (i1.count() < i2.count()) {return D_SUB;}
        else {return D_SUPER;}
    }
    /** @end-class-defn **/
      
    /** @begin-class-def DNode */

    // Following properties will be added as needed
    // Payload objects. Theoretically a given node could contain payload from
    // multiple record-types - i.e.  K or P - however, here we've chosen to store
    // payload of only one type per dictionary/trie. Hence there is a separate
    // trie
    // per Rec type. Right now there are two - g_kd and g_pd. The payload's
    // property
    // value is constructed such that it won't clash with the properties for
    // the child-node pointers, which are URL-segments. Hence the key for the
    // payload is constructed such that it will never conflict with any URL
    // segment. At this writing the values chosen are {erec} and {pdict}. Hence
    // a payload object of a DNode in the g_kdb dictionary will look like:
    // this["{dt}e-rec"] =
    // {"ft_userid":{"dt":"E-Record","fieldType":"ft_userid","tagName":"INPUT","id":"email","name":"email","type":"text"},"ft_pass":{"dt":"E-Record","fieldType":"ft_pass","tagName":"INPUT","id":"pass","name":"pass","type":"password"}}
    // The payload itself is an object with multiple properties. Each of the
    // properties is a 'record' (i.e. e-rec in k-dict and p-rec in p-dict).
    // The property-name is the record-key and is carried within each record
    // as the property named 'key'. Giving a generic name to the key makes it
    // possible to write generic dictionary code regardless of the dictionary
    // or record type. For each dictionary, the record keys are chosen
    // differently.
    // For e.g. in the case of e-dict, the record keys are from a fixed set :
    // 'ft_userid',
    // 'ft_password', 'dt_email' etc. etc. because that makes sense for that
    // domain. However,
    // for the p-dict the record keys can be anything because they are the
    // username.
    // If we wanted to store - say credit card numbers, then that would be a
    // completely separate dictionary with the card-number+type as the key but
    // no URL. Also, please note that for g-dict and p-dict, in the bigger
    // picture, URL is also part of the key. Now, if we were storing bookmarks,
    // then there would be no payload at all - only the URL key. We would need
    // to put markers in the URL-trie though, in order to mark which D-Nodes
    // represented an actual bookmark v/s which were merely on the path to an
    // actual bookmark. Because of the semantic and syntactic difference
    // between different data-types (or call it data-domains) I decided to create
    // a
    // separate trie per data-domain. Hence there is a separate trie/dictionary
    // for 'knowledge' records, a separate one for 'passwords' and for
    // 'bookmarks'
    // as well in the future.
    // A dt_pRecord payload will look like:
    // this["{dt}p-rec"] = {'username1':'password1', 'username2':'password2'};
    // References to child-nodes for walking down the url-trie. The key of the
    // child node
    // e.g. this['yahoo.'] = child-node;
    // e.g. this['google.'] = child-node;
    // e.g. this['/path1'] = child-node;
    // e.g. this['www'] = child-node;
    // e.g. this['www:8080'] = child-node;

    /** @constructor */
    function DNode (){}
    function newDNode () {return new DNode();}
    
    /** Class DupeRecs Record Collection
     *  Manages duplicate records according to record-type rules.
     */
    //function DupeRecs

    /** Helper function to DNode.prototype.insert */
    DNode.prototype.tryInsert = function (drec)
    {
        var rec = drec.rec,
            k = drec.urli.incr(),
            r, t, ki;
        if (!k) 
        {
            var recTag = DNODE_TAG.getDataTag(rec.dt);
            var recsMap = this[recTag];
            if (!recsMap) {
                this[recTag] = (recsMap = {});
            }
            r = recsMap[ki=recKey(rec)];
            if (r) {
                r.insert(rec);
            }
            else {
                (recsMap[ki] = newActions()).insert(rec);
            }
        }
        else 
        {   // continue walking down the trie
            var n = this[k];
            if (!n) {
                this[k] = (n = newDNode());
            }
            
            return n; // Non-recursive
            // n.insert(rec); Tail-recursive.
        }
    };
    /** Non-Recursive insert. Usually invoked at the root of a tree. */
    DNode.prototype.insert = function (drec)
    {       
        var n = this;    
        do {
            n = n.tryInsert(drec);
        } while (n);
    };
    DNode.prototype.tryFind = function(urli) 
    {
        var k = urli.get(), n;
        if (!k) {
            return null; // exact URL match found!
        }
        else {
            n = this[k];
            if (!n) {
                return undefined; // exact URL match does not exist
            }
            else {
                urli.incr();
                return n;
                //if (n instanceof DNode) {
                    //urli.incr();
                    //return n; // Not recursive.
                    // return n.findBest(urli); Tail recursive.
                //}
                /*else {//(instanceof KNode)
                    var urli2 = n.urli;
                    var c = compare(urli,urli2.rwnd());
                    switch (c) {
                        case D_DIFF:
                        case D_SUB:
                            return this;
                        
                        case D_SUPER:
                        case D_EQUAL:
                            return n.next;
                    }
                }*/
            }
        }
    };
    /**
     * Non-recursive findBest match method. Invoked at the root node. Returns the
     * DNode that best matches {urli}
     * 
     * @param urli is an Iterator over url segments. The function will walk the url
     * segment array and navigate the dictionary by following nodes that match
     * the current url-segment. The walk will stop when/if a matching node isn't
     * found or if the url segment array is exhausted. Upon return, urli.count() 
     * indicates the number of unmatched url segments at the tail of the url array.
     * The segments before urli.count() matched. The matched node however, may not
     * have a value in it though. You will need to walk either up or down the tree
     * to find values depending on your use case.
    */
    DNode.prototype.findBestNode = function (urli, dt) 
    {
        var n, r = this;
        // Walk down the dictionary tree.
        do {
            n = r;
            r = n.tryFind(urli);
        } while (r);
        
        return n;
    };
    /**
     * Returns dt_eRecord records that best match urli.
     */
    DNode.prototype.findERecsMapArray = function (urli)
    {
        var n, r = this, stack = [];
        // Walk down the dictionary tree.
        do {
            // save secondary level knowledge
            if (r[tag_eRecs]) {stack.push(r[tag_eRecs]);}
            n = r;
            r = n.tryFind(urli);
        } while (r);
    
        //r = {};
        
        // In case of KDB records we need a full uri match.
        // Therfore we'll pick up the matched node's value
        // only if all of urli segments were matched - i.e.
        // if there were no remaining unmatched segments.
        // Note: Commenting out the below since I decided to
        // harvest ancestor nodes as well for heuristic matching (it is likely
        // that a website will reuse code for logins).
        // if (urli.count() === 0) {
            // r[dt_eRecord] = stack.pop();
        // }
        // Ancestor nodes are also harvested for heuristic
        // matching.
        return stack;
    };
    /**
     * Returns dt_pRecord records that best match urli.
     */
    DNode.prototype.findPRecsMap = function(urli) 
    {
        var n = this, n2;
        // Walk down the dictionary tree.
        do {
            // save node if it has the desired data type
            if (n[tag_pRecs]) {n2 = n; /*idb = urli.pos();*/}
            n = n.tryFind(urli);
        } while (n);
        
        // in the case of PDB, the data is only useful if it is
        // below the top-level-domain. Hence we should check urli
        // to determine that.
        // Update: Since p-records are collected from actual websites,
        // the URLs should be correct. Therefore, am not verifying TLD anymore.
        if (n2) {
            //urli.seek(idb);
            //if (urli.isBelowTLD()) {
                return n2[tag_pRecs];
            //}
        }
    };
    /** @end-class-def **/

    /**
     * @constructor
     * Sets up the supplied record for insertion into the db
     */
    function DRecord(rec)
    {
        // Construct url segment array iterator.
        var urla = newUrla(rec.loc);
        //delete rec.loc;
        
        this.urli = new Iterator(urla);
        this.rec = rec;
                
        Object.freeze(rec);
        Object.freeze(this);
    }
    /** @end-class-def **/

    g_kd = newDNode();
    g_pd = newDNode();
    
    /**
     * Returns dt_eRecord and dt_pRecord records that best match urli.
     */
    function getRecs(loc)
    {
        var kdb, pdb, r,
            urli = new Iterator(newUrla(loc));

        r = {};
        r.eMapArray = g_kd.findERecsMapArray(urli);
        urli.rwnd();
        r.pRecsMap = g_pd.findPRecsMap(urli);

        return r;
    }

    function insertRec(rec)
    {
        switch (rec.dt) {
            case dt_eRecord:
                g_kd.insert(new DRecord(rec));
                break;
            case dt_pRecord:
                g_pd.insert(new DRecord(rec));
                break;
        }
        return true;
    }
    
    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        insertRec: {value: insertRec},
        getRecs: {value: getRecs}
    });
    Object.freeze(iface);

    return iface;
})();

/**
 * @ModuleBegin FileStore
 */
var MOD_FILESTORE = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    /** @import-module-begin Error */
    var m = IMPORT(MOD_ERROR);
    var BPError = IMPORT(m.BPError);
    /** @import-module-begin common **/
    m = MOD_COMMON;
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    var toJson = IMPORT(m.toJson);
    var uid_aliases = IMPORT(m.uid_aliases);
    var pass_aliases= IMPORT(m.pass_aliases);
    var url_aliases = IMPORT(m.url_aliases);
    var parseURL = IMPORT(m.parseURL);
    var stripQuotes = IMPORT(m.stripQuotes);
    /** @import-module-begin connector **/
    m = MOD_CONNECT; 
    var newPRecord = IMPORT(m.newPRecord);
    /** @import-module-begin MemStore **/
    var MEM_STORE = MOD_MEMSTORE;
    /** @import-module-end **/    m = null;

    /** @constant ID of BP-Plugin HtmlEmbedElement*/
    var eid_bp = "com-untrix-bpplugin";
    // Points to the bp-plugin
    var g_bp = document.getElementById(eid_bp);  
    /** File/Dirname extenstions */
    var ext_Root = ".3ab";
    var ext_Dict = ".3ad";
    var ext_Open = ".3ao";
    var ext_Closed=".3ac";
    var ext_MMap = ".3am";
    var ext_Temp = ".3at";
    /**
     * Name of knowledge-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_k = "k" + ext_Dict;
    /**
     * Name of passwords-dict directory on filesystem. Should be case insensitive
     * since not all filesystems will honor case.
     */
    var dir_p = "p" + ext_Dict;
    
    function savePRec(rec)
    {
        // switch (rec.dt)
        // {
            // case dt_pRecord: // password rec
//             
            // case dt_eRecord: // knowledge rec  
            // default:
            // break;         
        // }
    // }
    }
    
    function createDB(dir, name) // throws
    {
        var o={},
            root = dir + "/" + name + ext_Root;
        
        if (g_bp.createDir(root,o))
        {
            var p = root + "/" + dir_p;
            if (!g_bp.createDir(p,o)) {
                o={}; g_bp.rm(root, o);
                throw new BPError(o.err);
            }
            p = root + "/" + dir_k;
            if (!g_bp.createDir(p,o)) {
                o={}; g_bp.rm(root, o);
                throw new BPError(o.err);
            }
        }
        else
        {
            throw new BPError(o.err);
        }
        
        return true;
    }
    
    function findPPropsIdx(keys)
    {
        var rval = {}, i, j, n, k,
            //keys,
            bN = false, bP = false, bU = false;
        //for (i=0; i<5; i++) 
        //{ // Search the first few rows for a valid line
            //keys = Object.keys(recs[i]);
            
            for (j=0, n=keys.length; j<n; j++) 
            {
                k = keys[j];
                if ((!bN) && (uid_aliases.indexOf(k) !== (-1))) {
                    rval.userid = j;
                    bN = true; continue;
                }
                else if ((!bP) && (pass_aliases.indexOf(k) !== (-1))) {
                    rval.pass = j;
                    bP = true; continue;
                }
                else if ((!bU) && (url_aliases.indexOf(k) !== (-1))) {
                    rval.url = j;
                    bU = true; continue;
                }
            }
            
            //if ((bN && bP && bU)) {break;}   // We're done.
            //else {bN = (bP = (bU = false));} // Probably a header line. Start over
        //}
        
        // We'll return rval only if we got all property names
        if (bN && bP && bU) {return rval;}
    }
    
    /**
     * @begin-class-def TextFileStream
    */
    function TextFileStream(pth)
    {
        Object.defineProperties(this,
        {
            path: {value: pth, writable:false, configurable:false, enumerable:true},
            buf: {writable:true, configurable:false, enumerable:false},
            siz: {writable: true, configurable:false, enumerable:true},
            regex: {value: new RegExp('(?:^([^#\\r\\n]+[^\\r\\n]*)[\\r\\n]*$){1,1}?', 'mg'), writable: false, enumerable: false, configurable: false}
        });
        Object.seal(this);
    }
    // Returns the next data-line, i.e. the next non-comment and non-empty line
    TextFileStream.prototype.getDataLine = function() // throws BPError
    {
        var o={};
        if (!this.buf) {
            if (!g_bp.readFile(this.path, o)) {throw new BPError(o.err);}
            this.buf = o.rdf.dat;
            this.siz = o.rdf.siz;
        }
        var rval = this.regex.exec(this.buf);
        if (rval!==null) {return rval[1];}
    };
    
    /** @end-class-def **/
    /** 
     *@begin-class-def CSVFile
     *  
     */
    function CSVFile(path) // throws BPError
    {
        var n, err = {};
        err.gcode = "InvalidFileContents";
        err.path = path;

        Object.defineProperties(this,
        {
            fstrm: {value: new TextFileStream(path), writable:false, enumerable:false, configurable:false},
            csvex: {value: /\s*,\s*/, writable:false, configurable:false, enumerable:false},
            props: {writable:true, enumerable:false, configurable:false},
            regex: {writable:true, enumerable:false, configurable:false},
            pidx: {writable:true, enumerable:false, configurable:false}
        });
        // Load and Initialize.
        var line;
        if (!(line = this.fstrm.getDataLine()))
        {throw new BPError(err);}// line is undefined || null || !empty
        
        // Parse the first data-line for property names
        this.props = line.split(this.csvex);// split by space-comma-space
        if (!this.props || !this.props.length) { throw new BPError(err);}
        else 
        { // Remove leading quotes
            for (n = this.props.length; n; n--)
            {
                this.props[n-1] = stripQuotes(this.props[n-1]);
                if (!this.props[n-1]) {throw new BPError(err);}
            }
        }

        // Map the property names to P-Rec properties.
        this.pidx = findPPropsIdx(this.props);
        if (!this.pidx) { throw new BPError(err);}

        // Finally, generate a regular expression for data parsing
        // Make a regexp with props.length capture groups
        var field = "[\\s\"\']*([^\\s\"\']*)[\\s\"\']*",
            separator = '\\s*,\\s*', 
            i,
            regex = '^' + field;

        for (n = this.props.length-1, i=0; i<n; i++)
        {
            regex = regex + separator + field;
        }
        regex = regex + '$';
        this.regex = new RegExp(regex);

        Object.freeze(this);
    }
    // Returns an array of values from the next csv-line in the file. If EOF is encountered,
    // returns undefined. If Line is found, but can't be parsed, then returns null. THis
    // function may get confused by embedded commas (within quotes). getcsv2 handles that
    // case.
    CSVFile.prototype.getcsv = function()
    {
        var line = this.fstrm.getDataLine();
        if (line)
        {
            var vals = line.match(this.regex);
            if (vals)
            {
                vals.shift();
                return vals;
            }
            else {return null;} // Line was retrieved but didn't match the pattern.
        }
    };
    // Same semantics as getcsv but better implementation. This function will identify
    // quoted fields with embedded commas.
    CSVFile.prototype.getcsv2 = function()
    {
        var regex = /\s*(?:"([^"]*)"|'([^']*)'|([^"',]*))\s*,/g;
        var lastex = /\s*(?:"([^"]*)"|'([^']*)'|([^"',]*))\s*$/;
        var line = this.fstrm.getDataLine();
        if (line)
        {
            var vals=[], array, idx;
            while ((array=regex.exec(line)))
            {
                vals.push(array[1]?array[1]:(array[2]?array[2]:array[3]));
                idx = regex.lastIndex;
            }
            // Catch the last field. It has no comma at the end.
            array = lastex.exec(line.slice(idx));
            vals.push(array[1]?array[1]:(array[2]?array[2]:array[3]));
            
            if (vals.length === this.props.length) {return vals;}
            else {return null;}
        }
    };
    /** @end-class-def CSVFile **/
   
    function importCSV(path)
    {
        var o={}, rval, i, prec, pidx, csv, line;
        if (g_bp.ls(path, o))
        {
            switch (path.slice(-4).toLowerCase())
            {
                case ".csv":
                    BPError.actn = "ImportCSV";
                    var csvf = new CSVFile(path);

                    while ((csv = csvf.getcsv2()) !== undefined)
                    {
                        if (!csv) {continue;} // unparsable line
                        else {console.log(JSON.stringify(csv));}
                        pidx = csvf.pidx;
                        prec = newPRecord();
                        prec.userid = csv[pidx.userid];
                        prec.pass = csv[pidx.pass];
                        prec.loc = parseURL(csv[pidx.url]);
                        if (!prec.isValid()) {
                            console.log("Discarding invalid csv record - " + JSON.stringify(csv));
                            prec = null; continue;
                        }
                        if (MEM_STORE.insertRec(prec)) {
                            savePRec(prec);
                        }
                    }
                    return true;
                default:
                    return false;
                // case ".3db":
                    // path = path + "/" + dir_p + "/open.3eo";
                    // rval = g_bp.readJFile(path, o);
                    // if (!rval) {throw o.err;}
                    // recs = JSON.parse(o.rdf);
                    // return recs;
//                 
                // case ".3eo":
                // case ".3ec":
                    // rval = g_bp.readJFile(path, o);
                    // if (!rval) {throw o.err;}
                    // recs = JSON.parse(o.rdf);
                    // return recs;                
            }
        }
        else
        {
            var err = o.err.gmsg + "(" + o.err.gcode + "). " + o.err.smsg;
            console.error(err);
            document.defaultView.alert(err);
            return false;
        }
    }
    
        //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        importCSV: {value: importCSV},
        createDB: {value: createDB}
    });
    Object.freeze(iface);

    return iface;

})();
