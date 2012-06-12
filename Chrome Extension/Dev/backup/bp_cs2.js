/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT, BP_MOD_PANEL_FRM */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
/* members el.type,
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */


(function(g_win)
{
    'use strict';
    /** @export-module-begin */
    var g_dnd = {};
    var g_db = {
        ingest: function(db) {
            if (db) {
                this.pRecsMap = db.pRecsMap; 
                this.eRecsMapArray = db.eRecsMapArray;
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
    var makeURL = IMPORT(m.getURL);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs);
    var deleteRecord = IMPORT(m.deleteRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var newERecord = IMPORT(m.newERecord);
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    /** @import-module-begin Panel */
    m = BP_MOD_PANEL_FRM;
    var createPanel = IMPORT(m.createPanel);
    var deletePanel = IMPORT(m.deletePanel);
    // Since there is only one panel, we're using eid_panel as the global panel id.
    var gid_panel = IMPORT(m.eid_panel_prfx) + '1';
    var pn_d_value = IMPORT(m.pn_d_value);
    var pn_d_dataType = IMPORT(m.pn_d_dataType);
    var pn_d_peerID = IMPORT(m.pn_d_peerID);
    var pn_d_panelID = IMPORT(m.pn_d_panelID);
    var eid_xButton = IMPORT(m.eid_xButton);
    var MT_BP_DT = IMPORT(m.MT_BP_DT);
    var MT_TEXT_PLAIN = IMPORT(m.MT_TEXT_PLAIN);
    var MT_BP_PREFIX = IMPORT(m.MT_BP_PREFIX);
    /** @import-module-end **/ m = null;
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location);
    var g_doc = IMPORT(g_win.document);
    var settings = {AutoFill:true, ShowPanelIfNoFill: true}; // User Settings
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
        if((el === undefined) && er.name) 
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
            
            if (ell.length === 1) {
                el = ell[0];
            }
            else {
                el = null;
            }
        }

        if (el) {
            // We found the element. AutoFill it.
            el.value = dcrpt ? decrypt(str) : str;
            return true;
        }
    }
    

    function autoFill()
    {
        var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone,
        // auto-fill
        // if we don't have a stored username/password, then there is nothing
        // to autofill.
        pRecsMap  = g_db.pRecsMap;
        if (pRecsMap) 
        {
            ua = Object.keys(pRecsMap); 
            // if there is more than one username, do not autofill
            if (ua && (ua.length === 1) && (g_db.eRecsMapArray)) 
            {
                // Cycle through tag_eRecs records starting with the
                // best URL matching node.
                l = g_db.eRecsMapArray.length; uDone=false; pDone=false;
                for (i=0; (i<l) && (!pDone) && (!uDone); ++i) {
                    eRecsMap = g_db.eRecsMapArray.pop();
                    
                    if (eRecsMap[ft_userid]) { uer = eRecsMap[ft_userid].curr;}
                    if (eRecsMap[ft_pass]) {per = eRecsMap[ft_pass].curr;}
                    if ((!uDone) && uer) {
                        u = ua[0];
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
                        p = pRecsMap[ua[0]].curr.pass;
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
        }
        
        if (uDone && pDone) {
            return true;
        }
    }
       
    function deletePanelHandler(e)
    {
        if (e)
        {
            var id_panel = $(e.target).data(pn_d_panelID);
            var el = g_doc.getElementById(id_panel);
            $(el).remove();
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            return false; // Causes the event to be cancelled (except mouseover event).
        }
    }

    function createIFramePanel()
    {
        var j_panel = $(g_doc.createElement('div')).attr({id: gid_panel}),
            html =      '<div id="com-bprivy-panelTitle"><div id="com-bprivy-TitleText">BPrivy</div>' +
                            '<input type="button" id="com-bprivy-xB" accesskey="q" value="\u24CD"></input>' +
                        '</div>' +
                        '<iframe width="300" height="200" src="' + makeURL("bp_panel.html") + '"></iframe>';
        g_doc.body.appendChild(j_panel[0]);
        j_panel[0].insertAdjacentHTML('beforeend', html);
        var j_xButton = $('#'+eid_xButton, j_panel).data(pn_d_panelID, gid_panel);
        addEventListener(j_xButton[0], 'click', deletePanelHandler);
        
        // Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
        // by setting position:relative. Also we can use right:0px here because draggable() does not like it.
        // Hence we need to calculate the left value :(         
        var panelW = j_panel.outerWidth();
        var winW = g_doc.body.clientWidth || $(g_doc.body).innerWidth();
        
        var left = (winW-panelW);
        left = (left>0)? left: 0;
        
        console.info("WinW = " + winW + " panelW = " + panelW);

        j_panel.css({position: 'fixed', top: '0px', 'left': left + "px"});

        // Make it draggable after all above mentioned style properties have been applied to the element.
        // Otherwise draggable() will override those properties.
        j_panel.draggable();
    }
    
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function callbackGetDB (db)
    {        
        console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(db));

        g_db.ingest(db);
        
        if (settings.AutoFill) {
            if (!autoFill() && g_db.numUserids && settings.ShowPanelIfNoFill)
            {
                createIFramePanel();
            }
        }
    }
    
    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function asyncShowPanel (db)
    {
        console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(g_db));
        g_db.ingest(db);
        // TODO: Since this is async, maybe we should check if the panel exists.
        if (!g_doc.getElementById(gid_panel)) {
            createIFramePanel();
        }
    }
   
    function clickBP (request, sender, sendResponse)
    {
        if(isTopLevel(g_win))
        {
            var el = g_doc.getElementById(gid_panel);
            if (el)
            {
                // Need to do this using jquery so that it cleans up all related $.data attrs
                $(el).remove();
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
            if (data.type() === ft_pass) {
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

    function isFieldType (ft, el)
    {
        switch (ft)
        {
            case ft_userid: return isUserid(el);
            case ft_pass: return isPassword(el);
            default: return;
        }
    }
    
    function matchDTwField(e)
    {
        var dtMatched = false, isBPDrag = false, 
        items = e.dataTransfer.items, pn=MT_BP_PREFIX + $(e.target).data(pn_d_dataType),
        n;
        for (n=items.length-1; n>=0; n--)
        {
            if (items[n] && items[n].type === pn) {
                dtMatched = true; isBPDrag = true;
                console.info("Matched BP Drag w/ Field !");
                break;
            }
            else if ((!isBPDrag) && items[n] && items[n].type === MT_BP_DT) {
                isBPDrag = true;
                console.info("Matched BP Drag !");
            }
        }
        
        return {dtMatched: dtMatched, isBPDrag: isBPDrag};        
    }
    
    function dragoverHandler(e)
    {
        console.info("dragoverHandler(type = " + e.type + ") invoked ! effectAllowed/dropEffect = " +
                        e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);

        var r = matchDTwField(e);
        if (r.isBPDrag)
        {
            if (r.dtMatched) {
                e.dataTransfer.dropEffect= 'copy';
            }
            else {
                e.dataTransfer.dropEffect = 'none'; // Prevent drop here.
            }
            
            console.info("dropEffect set to " + e.dataTransfer.dropEffect);
            e.preventDefault(); // cancel the event signalling that we've handled it.
            e.stopImmediatePropagation();
        }
        //return true; // return true to signal that we're not cancelling the event (some code out there)
    }
    
    function dropHandler(e)
    {
        console.info("dropHandler invoked ! effectAllowed/dropEffect = " + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
 
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

                // Save an ERecord.
                var eRec = newERecord();
                eRec.tagName = e.target.tagName;
                eRec.id = e.target.id;
                eRec.name = e.target.name;
                eRec.type = e.target.type;
                eRec.fieldType = e.dataTransfer.getData(MT_BP_DT);
                //could this lead to a security issue? should we use g_doc instead?
                eRec.loc = e.target.ownerDocument.location;
                saveRecord(eRec);

                data = e.dataTransfer.getData(MT_TEXT_PLAIN);
                if (data) {
                    e.target.value = data;
                }
            }
        }
        console.info("dropEffect set to " + e.dataTransfer.dropEffect);
    }

    function setupDNDWatchers(win)
    {
        function inputHandler(e)
        {
            console.info("inputHandler invoked");
            var eRec = newERecord(), dragged_el;
            if (g_dnd.draggedElementID) {
                //dragged_el = g_doc.getElementById(g_dnd.draggedElementID);
                dragged_el = g_dnd.draggedElement;
                console.info("DraggedElementID is " + g_dnd.draggedElementID);
            }
            else {
                console.info("DraggedElementID is null");
            }
            
            if ( dragged_el && ($(dragged_el).data(pn_d_value) === e.target.value))
            {
                eRec.tagName = e.target.tagName;
                eRec.id = e.target.id;
                eRec.name = e.target.name;
                eRec.type = e.target.type;
                eRec.fieldType = $(dragged_el).data(pn_d_dataType);
                eRec.loc = g_doc.location;
                                
                saveRecord(eRec);
                
                var p = $(dragged_el).data(pn_d_peerID);
                if (p) {
                    autoFillPeer(e.target, $(p).data(pn_d_value));
                }
                console.info("Linking elements " + g_dnd.draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
            }
        }
        
        $(g_doc.getElementsByTagName('input')).each(function(i, el) {
            if (isUserid(el) || isPassword(el))
            {
                //addEventListener(el, "input", inputHandler);
                addEventListener(el, "dragenter", dragoverHandler);
                addEventListener(el, "dragover", dragoverHandler);
                addEventListener(el, "drop", dropHandler);
                if (isUserid(el)) {$(el).data(pn_d_dataType, ft_userid);}
                else {$(el).data(pn_d_dataType, ft_pass);}
                console.log("Added event listener for element " + el.id + "/" + el.name);
            }
        });
    }
    
    function main()
    {
        if(isTopLevel(g_win)) 
        {
            console.log("BP_CS entered on page " + location.href);
            getRecs(g_win.location, callbackGetDB);
            registerMsgListener(clickBP);
            setupDNDWatchers(g_win);
        }
    }
    
    return main();
    
    // Following are not being used.
    // function isDocVisible(document) {
        // /*properties is */
        // return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
    // }
// 
    // function isFrameVisible(frame)
    // {
        // var retval = true;
        // console.info("Entered IsFrameVisible");
        // if (frame.hidden) {
            // retval = false;
        // }
        // else if (!frame.style) {
            // retval = true;
        // }
        // else// frame.style exists
        // {
            // if(frame.style.visibility && frame.style.visibility === 'hidden') {
                // retval = false;
            // }
            // else if(frame.style.display && frame.style.display === 'none') {
                // retval = false;
            // }
        // }
// 
        // console.info("Exiting IsFrameVisible");
        // return retval;
    // }

}(window));
