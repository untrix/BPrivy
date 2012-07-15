/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT,
  BP_MOD_ERROR, BP_MOD_WDL, BP_MOD_W$, BP_MOD_TRAITS */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
/* members el.type,
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */


var BP_MOD_CS = (function(g_win)
{
    'use strict';
    /** @export-module-begin */
    var g_dnd = {};
    var g_db = {
        ingest: function(db) {
            if (db) {
                this.pRecsMap = db.pRecsMap; 
                this.eRecsMapArray = db.eRecsMapArray;
                this.dbName = db.dbName;
                delete this.numUserids;
                if (this.pRecsMap) {
                    this.numUserids = Object.keys(this.pRecsMap).length;
                }
                else {
                    this.numUserids = 0;
                }
                Object.defineProperty(this, "numUserids", {writable: false, configurable:true, enumerable:true});
            }
        },
        clear: function() {
            var keys = Object.keys(this), n;
            for (n=keys.length-1; n > 0; n--) {
                delete this[keys[n]];
            }
        }
    };
    Object.defineProperties(g_db,
    {
        ingest: {enumerable:false, writable:false, configurable:false},
        clear: {enumerable:false, writable:false, configurable:false}
    });
    /** Returns true if the BPrivy control panel should be created in the supplied browsing context */
    function isTopLevel(win) {
        return (win.top === win.self);
    }
    var BP_MOD_CS = {};
    Object.defineProperties(BP_MOD_CS, 
    {
        g_dnd: {value: g_dnd, enumerable:true},
        g_db: {value: g_db, enumerable:true}
    });
    Object.freeze(BP_MOD_CS);
    /** @export-module-end **/
   
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var encrypt = IMPORT(m.encrypt);
    var decrypt = IMPORT(m.decrypt);
    var stopPropagation = IMPORT(m.stopPropagation);
    var preventDefault = IMPORT(m.preventDefault);    
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs);
    var deleteRecord = IMPORT(m.deleteRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var newERecord = IMPORT(m.newERecord);
    var fn_userid = IMPORT(m.fn_userid);   // Represents data-type userid
    var fn_pass = IMPORT(m.fn_pass);        // Represents data-type password
    /** @import-module-begin Panel */
    //m = BP_MOD_PANEL;
    //var createPanel = IMPORT(m.createPanel);
    //var deletePanel = IMPORT(m.deletePanel);
    /** @import-module-begin */
    m = BP_MOD_WDL;
    var prop_value = IMPORT(m.prop_value),
        prop_fieldName = IMPORT(m.prop_fieldName),
        prop_peerID = IMPORT(m.prop_peerID),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS);
    /** @import-module-begin W$ */
        m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.w$exec),
        w$get = IMPORT(m.w$get),
        w$set = IMPORT(m.w$set);
    /** @import-module-begin WDL */
    m = BP_MOD_WDL;
    var cs_panel_wdt = IMPORT(m.cs_panel_wdt);
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location);
    var g_doc = IMPORT(g_win.document);
    var g_bFillable; // Boolean value indicates whether we have the knowledge to autofill this specific page.
    var gid_panel; // id of created panel if any
    var settings = {AutoFill:true, ShowPanelIfNoFill: false}; // User Settings
    var g_autoFillable; // Indicates that the page was found to be autofillable.
    /** @globals-end **/

    /**
     * Autofills element described by 'er' with string 'str'.
     * if dcrpt is true, then decrypts the data before autofilling.
     */
    function autoFillEl (er, str, dcrpt) {
        var nl, el, doc = g_doc, i, ell = [];
        if (er.id) 
        {
            el = doc.getElementById(er.id);
            if (!el) {el = null;}
        }
        if((el === undefined) && er.name) // (!er.id), therefore search based on field name
        {
            nl = doc.getElementsByName(er.name);

            for (i=0; i<nl.length; i++) 
            {
                if (nl.item(i).tagName !== er.tagName) {
                        continue;
                }
                if ((er.type) && 
                    (nl.item(i).type !== er.type)) {
                        continue;
                }
                ell.push(nl.item(i));
            }
            
            // if (ell.length === 1) {                // el = ell[0];            // }            // else {                // el = null;            // }
            if (ell.length > 0) {
                // One or more elements had the same name,type and tagName. We'll fill
                // them all because this is probably a pattern wherein alternate forms are
                // declared on the page for the same purpose but different environments
                // e.g. with JS/ without JS (twitter has such a page).
                el = ell[0];
            }
            else {
                el = null;
            }
        }

        if (el) {
            // We found the element(s). AutoFill it/them. We're assuming that it is an 'input'
            // element, hence values will go into its .value IDL attribute. If we start filling
            // other elements (such as textarea) then this assumption won't hold anymore.
            el.value = dcrpt ? decrypt(str) : str;
            if (ell.length > 1) {
                for (i=1; i<ell.length; i++)
                {
                    ell[i].value = dcrpt ? decrypt(str) : str;
                }
            }
            return true;
        }
    }
    

    function autoFill(userid, pass) // if arguments are not supplied, takes them from global
    {
        var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone, pRecsMap;
        // auto-fill
        // if we don't have a stored username/password, then there is nothing
        // to autofill.
        
        if (userid && pass) {
            u = userid; p = pass;
        }
        else if ((pRecsMap = g_db.pRecsMap)) 
        {
            ua = Object.keys(pRecsMap); 
            if (ua) {
                if (ua.length === 1) {
                    u = ua[0];
                    p = pRecsMap[ua[0]].curr.pass;
                }
                else if (ua.length > 1) {
                    // if there is more than one username, do not autofill, but
                    // try to determine if autofilling is possible.
                    u = "";
                    p = "";
                }
            }
        }
        
        if ((u!==undefined) && (p!==undefined) && (g_db.eRecsMapArray)) 
        {
            // Cycle through eRecords starting with the
            // best URL matching node.
            l = g_db.eRecsMapArray.length; uDone=false; pDone=false;
            for (i=0, j=l-1; (i<l) && (!pDone) && (!uDone); ++i, j--)
            {
                eRecsMap = g_db.eRecsMapArray[j];
                
                if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}
                if ((!uDone) && uer) {
                    uDone = autoFillEl(uer, u);
                    if (!uDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.
                      
                        // Location gets deleted from e-rec when it is
                        // inserted into the DB. Therefore we'll need to
                        // put it back in.
                        uer.loc = g_loc; // TODO: This may not be required anymore.

                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(uer); // TODO: implement deleteRecord
                    }
                }
                if ((!pDone) && per) {
                    pDone = autoFillEl(per, p, true);
                    if (!pDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.

                        // Location gets deleted from e-rec when it is
                        // inserted into the DB. Therefore we'll need to
                        // put it back in.
                        per.loc = g_loc; // TODO: This may not be required anymore.

                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(per); // TODO: implement deleteRecord
                    }
                }
            }
        }  

        if (uDone || pDone) {
            g_autoFillable = true;
            return true;
        }
    }
    
    function getRecsCallback () 
    {
        getRecs(g_win.location, asyncShowPanel);
    }
    
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function initialGetDB (resp)
    {   
        if (resp.result === true) 
        {
            var db = resp.db;
            console.info("bp_cs retrieved DB-Records\n" /*+ JSON.stringify(db)*/);
            g_db.ingest(db);
            g_bFillable = autoFill();
        
            if (settings.AutoFill) {
                if ((g_bFillable===false) && g_db.numUserids && settings.ShowPanelIfNoFill)
                {
                    var ctx = {it: new RecsIterator(g_db.pRecsMap), reload:getRecsCallback, dbName:g_db.dbName },
                        panel = w$exec(cs_panel_wdt, ctx);
                    gid_panel = panel.data.id;
                }
            }
        }
        else
        {
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.logdebug("bp_cs.js@init " + exc.toString() + "]");
        }        
    }
    
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function asyncShowPanel (resp)
    {
        if (resp.result === true)
        {
            var db = resp.db;
            console.info("bp_cs retrieved DB-Records\n"/* + JSON.stringify(db)*/);
            g_db.ingest(db);
        }
        else
        {
            g_db.clear();
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.logdebug("bp_cs.js@showPanel " + exc.toString() + "]");
        }

        // TODO: Since this is async, maybe we should check if the panel already exists?
        var ctx = {it: new RecsIterator(g_db.pRecsMap), reload:getRecsCallback, autoFill:g_bFillable?autoFill:undefined, dbName:g_db.dbName };
        var    panel = w$exec(cs_panel_wdt, ctx);
        gid_panel = panel.id;
    }
   
    function clickBP (request, sender, sendResponse)
    {
        if(isTopLevel(g_win)) 
        {
            var panel;
            // var el = g_doc.getElementById(gid_panel);            // if (el)            // {                // // Need to do this using jquery so that it cleans up all related $.data attrs                // $(el).remove();            // }
            if (gid_panel && (panel = w$get('#'+gid_panel))) {
                panel.die();
                gid_panel = null;
            }
            else {
                // Post a message to MemStore to retrieve the set of recs afresh.
                getRecs(g_win.location, asyncShowPanel);
            }
        }
        
        sendResponse({});
    }

    function findPeerElement(el)
    {}
    
    function autoFillPeer(el, data)
    {
        var p_el = findPeerElement(el);
        if (p_el)
        {
            if (data.type() === fn_pass) {
                p_el.value = decrypt(data);
            }
            else {
                p_el.value = data;
            }
        }
    }
    
    /** Intelligently returns true if the input element is a userid/username input field */
    function isUserid(el)
     {
         var tagName = el.tagName.toLowerCase(), rval = false;
         if (tagName === 'textarea') {rval = true;}
         else if (tagName !== 'input') {rval = false;}
         else {
             if (el.type)
                {rval = (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");}
             else
                 {rval = true;} // text type by default
         }
         
         return rval;
     }
    
    /** Intelligently returns true if the element is a password field */
    function isPassword (el)
     {
         if (el.tagName.toLowerCase() !== 'input') {return false;}
        return (el.type === "password");
     }

    function isField (ft, el)
    {
        switch (ft)
        {
            case fn_userid: return isUserid(el);
            case fn_pass: return isPassword(el);
            default: return;
        }
    }
    
    function matchDTwField(e)
    {
        var dtMatched = false, isBPDrag = false, 
        items = e.dataTransfer.items,
        w$el=w$get(e.target),
        n, len;
        for (n=0, len=items.length; n<len; n++)
        {
            if (items[n] && items[n].type === w$el.ct) {
                dtMatched = true; isBPDrag = true;
                //console.info("Matched BP Drag w/ Field !");
                break;
            }
            else if ((!isBPDrag) && items[n] && items[n].type === CT_BP_FN) {
                isBPDrag = true;
                //console.info("Matched BP Drag !");
            }
        }
        
        return {dtMatched: dtMatched, isBPDrag: isBPDrag};        
    }
    
    function dragoverHandler(e)
    {
        //console.info("dragoverHandler(type = " + e.type + ") invoked ! effectAllowed/dropEffect = " +
        //                e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);

        var r = matchDTwField(e);
        if (r.isBPDrag)
        {
            if (r.dtMatched) {
                e.dataTransfer.dropEffect= 'copy';
            }
            else {
                e.dataTransfer.dropEffect = 'none'; // Prevent drop here.
            }
            
            //console.info("dropEffect set to " + e.dataTransfer.dropEffect);
            e.preventDefault(); // cancel the event signalling that we've handled it.
            e.stopImmediatePropagation();
        }
        //return true; // return true to signal that we're not cancelling the event (some code out there)
    }
    
    function dropHandler(e)
    {
        //console.info("dropHandler invoked ! effectAllowed/dropEffect = " + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
 
        var data, r = matchDTwField(e);
        
        if (r.isBPDrag) {
            // Cancel event to tell browser that we've handled it and to prevent it from
            // overriding us with a default action.                        
            e.preventDefault();
            
            if (!r.dtMatched) {
                // This is our drag-event, but Data-type and field-type don't match.
                // Abort the drop.
                // prevent browser from dropping the password into a visible field.
                // or prevent browser from dropping userid into a password field.
                e.dataTransfer.dropEffect = 'none';                    
            }                     
            else {
                // Tell browser to set vlaue of 'current drag operation' to 'copy'
                e.dataTransfer.dropEffect = 'copy';

                console.log("dropHandler:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
                // Save an ERecord.
                var eRec = newERecord(e.target.ownerDocument.location,
                                      Date.now(),
                                      e.dataTransfer.getData(CT_BP_FN), // fieldName
                                      e.target.tagName,
                                      e.target.id,
                                      e.target.name,
                                      e.target.type);
                saveRecord(eRec);

                data = e.dataTransfer.getData(CT_TEXT_PLAIN);
                if (data) {
                    e.target.value = data;
                }
            }
        }
        // console.info("dropEffect set to " + e.dataTransfer.dropEffect);
    }

    function setupDNDWatchers(win)
    {       
        $('input').each(function(i, el)
        {
            var u, 
                w = w$set(el);
            if ( (u = isUserid(el)) || isPassword(el)) 
            {
                addEventListener(el, "dragenter", dragoverHandler);
                addEventListener(el, "dragover", dragoverHandler);
                addEventListener(el, "drop", dropHandler);
                if (u) {
                    w.ct = CT_BP_USERID;
                } else {
                    w.ct = CT_BP_PASS;
                }
                // console.log("Added event listener for element " + el.id +
                // "/" + el.name);
            }
        }); 
    }
    
    function main()
    {
        if(isTopLevel(g_win)) 
        {
            console.log("BP_CS entered on page " + location.href);
            getRecs(g_win.location, initialGetDB);
            registerMsgListener(clickBP);
            setupDNDWatchers(g_win);
        }
    }
    
    return main();
    
}(window));
