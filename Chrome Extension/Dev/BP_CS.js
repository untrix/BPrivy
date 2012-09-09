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
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var MOD_COMMON = IMPORT(m),
        encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener), // Compatibility function
        trigger = IMPORT(m.trigger);
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
        dt_eRecord = IMPORT(m.dt_eRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_pass = IMPORT(m.fn_pass);        // Represents data-type password
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs),
        deleteRecord = IMPORT(m.deleteRecord),
        saveRecord = IMPORT(m.saveRecord),
        newERecord = IMPORT(m.newERecord),
        panelClosed = IMPORT(m.panelClosed);
    /** @import-module-begin */
    m = BP_MOD_WDL;
    var prop_value = IMPORT(m.prop_value),
        prop_fieldName = IMPORT(m.prop_fieldName),
        prop_peerID = IMPORT(m.prop_peerID),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS),
        cs_panel_wdt = IMPORT(m.cs_panel_wdt),
        MiniDB = IMPORT(m.MiniDB);
    /** @import-module-begin W$ */
        m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.w$exec),
        w$get = IMPORT(m.w$get),
        w$set = IMPORT(m.w$set);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location);
    var g_doc = IMPORT(g_win.document);
    var gid_panel; // id of created panel if any
    var settings = {AutoFill:true, ShowPanelIfNoFill: true}; // User Settings
    var g_bFillable; // Indicates that the page was found to be autofillable.
    var g_uElSel =  "[name=userid],[name=username],#userid,#username,[name=id],[name=uid],#id,#uid,[name=user],[name=uname],#user,#uname," +
                    "[name*=login],[name*=identity],[name*=accountname],[name*=signin]," +
                    "[name*=username],[name*=user_name],[name*=userid],[name*=logon],[name*=user_id]," +
                    "[id*=login],[id*=identity],[id*=accountname],[id*=signin]," +
                    "[id*=username],[id*=user_name],[id*=userid],[id*=logon],[id*=user_id]";

    // var g_uIdSel2 = "input[name=id i],input[name=uid i],input[name=user i],input[name=uname i],input[id=id i],input[id=uid i],input[id=user i],input[id=uname i]";
    // var g_uPattSel2="input[name*=login i],input[name*=identity i],input[name*=accountname i],input[name*=signin i]," +
                    // "input[name*=username i],input[name*=user_name i],input[name*=email i],input[name*=userid i],input[name*=logon i]," +
                    // "input[id*=login i],input[id*=identity i],input[id*=accountname i],input[id*=signin i]," +
                    // "input[id*=username i],input[id*=user_name i],input[id*=email i],input[id*=userid i],input[id*=logon i]";
    /** @globals-end **/

    /** @export-module-begin */
    var g_db = new MiniDB();
    /** Returns true if the BPrivy control panel should be created in the supplied browsing context */
    function isTopLevel(win) {
        return (win.top === win.self);
    }
    // var BP_MOD_CS = {};
    // Object.defineProperties(BP_MOD_CS, 
    // {
        // g_db: {value: g_db, enumerable:true}
    // });
    // Object.freeze(BP_MOD_CS);
    /** @export-module-end **/

    /**
     * Autofills element described by 'er' with string 'str'.
     * if dcrpt is true, then decrypts the data before autofilling.
     */
    function autoFillEl (er, str, dcrpt, test) {
        var $el, sel, selVisible;

        if (er.id)
        {
            sel = er.t + '[id="'+ er.id + '"]'; // Do not tack-on type here. Some fields omit type
                                     // which defaults to text when reading but not when selecting.
        }
        else if (er.n) // (!er.id), therefore search based on field name
        {
            sel = er.t + '[name="' + er.n + '"]' + (er.y? ('[type="'+ er.y + '"]') : '');
        }
        
        selVisible = ':not([hidden])';
        //$el = $(sel).filter(':visible');
        $el = $(sel);//.filter(selVisible);
        if (!test)
        {
            $el.each(function(i)
            {
                // NOTE: IE supposedly throws error if you focus hidden fields. If we encounter
                // that, then remove the focus() call from below.
                trigger(this, 'click');
                $(this).val(dcrpt ? decrypt(str) : str);
                trigger(this, 'input');
                trigger(this, 'change');
            });
        }

        // One or more elements may have the same name,type and tagName. We'll fill
        // them all because this is probably a pattern wherein alternate forms are
        // declared on the page for the same purpose but different environments
        // e.g. with JS/ without JS (twitter has such a page).
        
        if ($el.length) {
            return true;
        }
    }
    
    // Helper function to autoFill. Argument must be supplied even if empty string.
    // Returns true if username could be autofilled.
    function autoFillUHeuristic(u, test)
    {
        var $uel, rval;
        if ((u===undefined || u===null) && (!test))
        {
            return false;
        }
        
        $uel = $('input[type="text"],input[type=email]').filter(g_uElSel);//.filter(':visible');

        if ($uel.length) 
        {
            if (!test) 
            {
                $uel.each(function(index)
                {
                    trigger(this, 'click');
                    $(this).val(u);
                    trigger(this, 'input');
                    trigger(this, 'change');
                });
            }
            //$uel.click().val(u);
            rval = true;
        }
        if (rval !== true)
        {
            // try case-insensitive match
            $uel = $('input[type="text"],input[type=email]');
            $uel.each(function(index) // should be $uel.some in case of test.
            {
                var id = this.id? this.id.toLowerCase() : "",
                    nm = this.name? this.name.toLowerCase() : "",
                    found = false,
                    copy = g_doc.createElement('input'),
                    $copy = $(copy).attr({type:'text', 'id':id, 'name':name});
                    //$copy2 = $('<input type=text' + (id?(' id='+id):('')) + (nm?(' name='+nm):('')) + ' >');
                    
                if ($copy.is(g_uElSel))
                {
                    if (!test)
                    {
                        trigger(this, 'click');
                        $(this).val(u);
                        trigger(this, 'input');
                        trigger(this, 'change');
                    }             
                    rval = true;
                }
            });
        }
        return rval;
    }

    // Helper function to autoFill. Argument must be supplied even if empty string.
    // Returns true if password could be autofilled.
    function autoFillPHeuristic(p, test)
    {
        var $pel, rval;
        
        if ((p===undefined || p===null) && (!test))
        {
            return false;
        }

        $pel = $('input[type=password]');//.filter(':visible');
        
        if ($pel.length) 
        {
            if (!test)
            {
                $pel.each(function()
                {
                    trigger(this, 'click');
                    $(this).val(decrypt(p));
                    trigger(this, 'input');
                    trigger(this, 'change');
                });
                //$pel.click().val(p);
            }
            rval = true;
        }
        
        return rval;        
    }
    
    function autoFill(userid, pass) // if arguments are not supplied, takes them from global
    {
        var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone, pRecsMap, test;
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
                    p = pRecsMap[ua[0]].curr.p;
                }
                else /*if (ua.length > 1)*/ {
                    // if there is more than one username, do not autofill, but
                    // try to determine if autofilling is possible.
                    test = true;
                }
            }
        }
        
        if ((test || (u&&p)) && (g_db.eRecsMapArray))
        {
            // Cycle through eRecords starting with the
            // best URL matching node.
            l = g_db.eRecsMapArray.length; uDone=false; pDone=false;
            for (i=0, j=l-1; (i<l) && (!pDone) && (!uDone); ++i, j--)
            {
                eRecsMap = g_db.eRecsMapArray[j];
                
                if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}
                if ((!uDone) && uer) 
                {
                    uDone = autoFillEl(uer, u, false, test);
                    if (!uDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.
                      
                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(uer); // TODO: implement deleteRecord
                    }
                }
                if ((!pDone) && per) 
                {
                    pDone = autoFillEl(per, p, true, test);
                    if (!pDone && (i===0)) {
                        // The data in the E-Record was an exact URL match
                        // yet, it has been shown to be not useful.
                        // Therefore purge it form the K-DB.

                        // TODO: Can't assume that i===0 implies full url match.
                        // Need to construct a URLA from uer.loc and compare it with
                        // g_loc. Commenting out for the time being.
                        //deleteRecord(per); // TODO: implement deleteRecord
                    }
                }
            }
        }  

        uDone = uDone || autoFillUHeuristic(u, test);
        pDone = pDone || autoFillPHeuristic(p, test);
        if (uDone || pDone) 
        {
            g_bFillable = true;
            if (!test) {
                return true;
            }
        }
    }
    
    function getRecsAsync ()
    {
        getRecs(g_loc, cbackShowPanel);
    }
    
    function onClosed()
    {
        panelClosed(g_loc);
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
            try
            {
                var filled = autoFill();
            }
            catch (err)
            {
                BP_MOD_ERROR.logwarn(err);
            }
        
            if ((!filled) && g_bFillable && g_db.numUserids && settings.ShowPanelIfNoFill)
            {
                var ctx = {
                    it: new RecsIterator(g_db.pRecsMap), 
                    reload:getRecsAsync,
                    onClosed:onClosed,
                    autoFill:g_bFillable?autoFill:undefined, 
                    dbName:resp.dbName, //g_db.dbName,
                    dbPath:resp.dbPath //g_db.dbPath
                    },
                    panel = w$exec(cs_panel_wdt, ctx);
                gid_panel = panel.id;
                MOD_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
                // TODO: should probably clear DB here
            }
            else {
                // Remember to not keep any data lingering around ! Delete data the moment we're done
                // using it. Data should not be stored in the page if it is not visible to the user.
                g_db.clear();
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
    function cbackShowPanel (resp)
    {
        if (resp.result === true)
        {
            var db = resp.db;
            console.info("cbackShowPanel@bp_cs.js received DB-Records\n"/* + JSON.stringify(db)*/);
            g_db.ingest(db);
            try
            {
                autoFill();
            }
            catch (err)
            {
                BP_MOD_ERROR.logwarn(err);
            }
        }
        else
        {
            g_db.clear();
            var exc = new BPError(resp.err);
            BP_MOD_ERROR.logdebug("bp_cs.js@showPanel " + exc.toString());
        }

        // TODO: Since this is async, maybe we should check if the panel already exists?
        var ctx = {
            it: new RecsIterator(g_db.pRecsMap), 
            reload:getRecsAsync,
            onClosed:onClosed,
            autoFill:g_bFillable?autoFill:undefined, 
            dbName:resp.dbName, //g_db.dbName,
            dbPath:resp.dbPath //g_db.dbPath
            };
        var    panel = w$exec(cs_panel_wdt, ctx);
        gid_panel = panel.id;
        MOD_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
        try
        {
            setupDNDWatchers(g_win);
        }
        catch (err)
        {
            BP_MOD_ERROR.logwarn(err);
        }
        // TODO: should probably clear DB here
    }
   
    function clickBP (request, sender, sendResponse)
    {
        //if (isTopLevel(g_win)) 
        //{
            var panel;
            // var el = g_doc.getElementById(gid_panel);            // if (el)            // {                // // Need to do this using jquery so that it cleans up all related $.data attrs                // $(el).remove();            // }
            if (gid_panel && (panel = w$get('#'+gid_panel))) {
                panel.destroy();
                gid_panel = null;
                // Remember to not keep any data lingering around ! Delete data the moment we're done
                // using it. Data should not be stored in the page if it is not visible to the user.
                g_db.clear();
            }
            else 
            {
                gid_panel = null;
                (!g_db) || g_db.clear();
                // Post a message to MemStore to retrieve the set of recs afresh.
                // getRecs(g_loc, cbackShowPanel);
                request.result = true; // Make this look like a response for the callback.
                cbackShowPanel(request);
            }
        //}
        
        sendResponse({ack:true});
    }

    // function findPeerElement(el)
    // {}
//     
    // function autoFillPeer(el, data)
    // {
        // var p_el = findPeerElement(el);
        // if (p_el)
        // {
            // if (data.type() === fn_pass) {
                // p_el.value = decrypt(data);
            // }
            // else {
                // p_el.value = data;
            // }
        // }
    // }
    
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
        // console.info("dragoverHandler(type = " + e.type + ") invoked ! effectAllowed/dropEffect = " +
                        // e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
        var r = matchDTwField(e);
        if (r.isBPDrag)
        {
            if (r.dtMatched) {
                e.dataTransfer.dropEffect= 'copy';
                //$(e.currentTarget).focus();
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

                //console.log("dropHandler:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
                // Save an ERecord.
                var eRec = newERecord(e.target.ownerDocument.location,
                                      Date.now(),
                                      e.dataTransfer.getData(CT_BP_FN), // fieldName
                                      e.target.tagName,
                                      e.target.id,
                                      e.target.name,
                                      e.target.type);
                saveRecord(eRec, dt_eRecord);

                data = e.dataTransfer.getData(CT_TEXT_PLAIN);
                if (data) {
                    e.target.value = data;
                    trigger(e.target, 'input');
                    trigger(e.target, 'change');
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
                addEventListener(el, "input", function(e){console.log("Input event");});
                addEventListener(el, "change", function(e){console.log("Change event");});
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
            //getRecs(g_loc, cbackShowPanel);
            registerMsgListener(clickBP);
        }
        else {
            //getRecs(g_loc, cbackShowPanel);
            registerMsgListener(clickBP);
        }

        DLL_INIT = cbackShowPanel;
    }
    
    console.log("loaded CS");
    return main();
    
}(window));
