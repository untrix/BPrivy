/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
/* members el.type,
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */


/**
 * @module CS
 */
var BP_MOD_PANEL_FRM = (function (g_win)
{
    "use strict"; // TODO: @remove Only used in debug builds

    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var CSS_HIDDEN = IMPORT(m.CSS_HIDDEN);
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    var encrypt = IMPORT(m.encrypt);
    var decrypt = IMPORT(m.decrypt);
    var stopPropagation = IMPORT(m.stopPropagation);
    var preventDefault = IMPORT(m.preventDefault);
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    var newPRecord = IMPORT(m.newPRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var deleteRecord = IMPORT(m.deleteRecord);
    var getRecs = IMPORT(m.getRecs);
    var tag_eRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_eRecord));
    var tag_pRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_pRecord));
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var getURL = IMPORT(m.getURL);
    var addEventListener = IMPORT(m.addEventListener); // Compatibility function
    /** @import-module-end */    m = null;
    
    /** @globals-begin */
	// Names used in the code. A mapping is being defined here because
	// these names are externally visible and therefore may need to be
	// changed in order to prevent name clashes with other libraries.
	// These are all merely nouns/strings and do not share a common
	// semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
	var eid_panel_prfx = "com-bprivy-panel-"; // Used by panel elements
	var eid_panelTitle ="com-bprivy-panelTitle"; // Used by panel elements
	var eid_panelList ="com-bprivy-panelList"; // Used by panel elements
	var eid_ioItem = "com-bprivy-ioItem";
    var eid_opElement = 'com-bprivy-op-'; // ID prefix of an output line of panel
    var eid_userOElement = "com-bprivy-useridO-"; // ID Prefix used by panel elements
	var eid_passOElement = "com-bprivy-passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = "com-bprivy-useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = "com-bprivy-passI-"; // ID Prefix Used by panel elements
	var eid_inForm = "com-bprivy-iform-";
	var eid_tButton = "com-bprivy-tB-"; // ID prefix for IO toggle button
	var eid_xButton = "com-bprivy-xB"; // ID of the panel close button

	// CSS Class Names. Visible as value of 'class' attribute in HTML
	// and used as keys in CSS selectors. These need to be globally
	// unique as well. We need these here in order to ensure they're
	// globally unique and also as a single location to map to CSS files.
    var css_class_li = "com-bprivy-li "; // Space at the end allows concatenation
    var css_class_ioFields = "com-bprivy-io-fieldset ";// Space at the end allows concatenation
	var css_class_field ="com-bprivy-field ";// Space at the end allows concatenation
	var css_class_userIn = "com-bprivy-user-in ";// Space at the end allows concatenation
    var css_class_userOut = "com-bprivy-user-out ";// Space at the end allows concatenation
    var css_class_passIn = "com-bprivy-pass-in ";// Space at the end allows concatenation
	var css_class_passOut = "com-bprivy-pass-out ";// Space at the end allows concatenation
	var css_class_tButton = "com-bprivy-tB ";
	
	// These are 'data' attribute names. If implemented as jQuery data
	// these won't manifest as HTML content attributes, hence won't
	// clash with other HTML elements. However, their names could clash
	// with jQuery. Hence they are placed here so that they maybe easily
	// changed if needed.
	var pn_d_value = "bpValue";
	var pn_d_dataType = "bpDataType";
	var pn_d_peerID = 'bpPeerID';
	var pn_d_panelID = 'bpPanelID';
	var pn_d_ctx = 'bpPanelCtx';
    var MT_TEXT_PLAIN = 'text/plain';
    var MT_BP_PREFIX = 'application/x-bprivy-';
    var MT_BP_DT = MT_BP_PREFIX + 'dt';
    var MT_BP_PASS = MT_BP_PREFIX + ft_pass;
    var MT_BP_USERID = MT_BP_PREFIX + ft_userid;

    // Other Globals
    var g_doc = g_win.document;
    var g_loc = g_doc.location;
    var g_ioItemID = 0;
    var u_cir_s = '\u24E2';
    var u_cir_S = '\u24C8';
    var u_cir_e = '\u24D4';
    var u_cir_E = '\u24BA';
    var u_cir_X = '\u24CD';
    /** @globals-end **/
    
	function createImageElement(imgPath)
	{
		var el = g_doc.createElement("img");
		el.src = getURL(imgPath);
		
		return el;
	}
	
    function makeDataDraggable2(ctx, j_panelList) // ctx = {doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db}
    {
        var dnd = ctx.dnd;
        function handleDragStart (e)
        {
            console.info("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = $(e.target).data(pn_d_value);
            if ($(e.target).data(pn_d_dataType) === ft_pass) {
                data = decrypt(data);
            }
            
            e.dataTransfer.items.add('', MT_BP_PREFIX + $(e.target).data(pn_d_dataType)); // Keep this on top for quick matching later
            e.dataTransfer.items.add($(e.target).data(pn_d_dataType), MT_BP_DT); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, MT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(createImageElement("icon16.png"), 0, 0);
            e.dataTransfer.addElement(e.target);
            //dnd.draggedElementID = e.target.id;
            //dnd.draggedElement = e.target;
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        function handleDrag(e)
        {
            console.info("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }
        
        addEventListener(j_panelList[0], 'dragstart', handleDragStart);
        addEventListener(j_panelList[0], 'drag', handleDrag);

        function handleDragEnd(e)
        {
            console.info("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //dnd.draggedElementID = null;
            //dnd.draggedElement = null;
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        addEventListener(j_panelList[0], 'dragend', handleDragEnd);
    }
    
    function createOpItem(doc, id, u, p)
	{
	    var opid = eid_opElement + id;
	    var ueid = eid_userOElement + id;
	    var peid = eid_passOElement + id;
	    
        var j_div = $(doc.createElement("div")).attr(
            {
                id: opid
                //style: BP_MOD_CSS.style_ioFields
            }
        ).addClass(css_class_ioFields);

        var j_opu = $(doc.createElement('span')).attr(
            {draggable: true,
             id: ueid,
             name: ueid
             //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_userOut
             }
            ).addClass(css_class_field+css_class_userOut).text(u);
        j_opu.data(pn_d_dataType, ft_userid).data(pn_d_value, u);

        var j_opp = $(doc.createElement('span')).attr(
            {
                draggable: true,
                id: peid,
                name: peid
                //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_passOut
            }
            ).addClass(css_class_field + css_class_passOut).text("*****");
        j_opp.data(pn_d_dataType, ft_pass).data(pn_d_value, p);
        
        j_div.append(j_opu).append(j_opp);

        return j_div[0];
	}
	
	function isValidInput(str) { return Boolean(str); } // TODO: Probably need to extend this
	
	/** Creates input fields for the IO Widget **/
	function createInItem(doc, id, u, p)
	{
	    var ifid = eid_inForm + id;
	    var ueid = eid_userIElement + id;
	    var peid = eid_passIElement + id;

        var j_inf = $(doc.createElement('div')).attr({id: ifid, 'class': css_class_ioFields});
        var j_inu = $(doc.createElement('input')).attr(
        {
            type: 'text',
            id: ueid,
            name: ueid,
            value: u
            //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_userIn
        }).addClass(css_class_field+css_class_userIn).data(pn_d_value, u);
        var j_inp = $(doc.createElement('input')).attr(
        {
            type: 'password',
            id: peid,
            name: peid,
            value: decrypt(p)
            //style: BP_MOD_CSS.style_field + BP_MOD_CSS.style_passIn
        }).addClass(css_class_field+css_class_passIn).data(pn_d_value, p);

        j_inf.append(j_inu).append(j_inp);
        
        return j_inf[0];
	}
	
	/** Toggles the IO Widget **/
	function toggleIO(e)
	{
	    var doc = e.target.ownerDocument; // TODO: Experimenting, was g_doc
        var d = e.target.dataset;
        console.info("tb clicked" + JSON.stringify(d));
	    var op = doc.getElementById(d.opid),
	        ifm = doc.getElementById(d.ifid),
	        id = d.id,
	        parent, col, ue, pe, uo, po;
	    
	    if (op) { // replace draggable text with input form
	        // Save the 'op' values.
	        col = op.children;
	        ue = col[eid_userOElement + id];
	        pe = col[eid_passOElement + id];
	        uo = $(ue).data(pn_d_value);
	        po = $(pe).data(pn_d_value);
	        // remove the 'op' item.
	        // Create an 'ifm' item and save the values hidden away somewhere.
	        parent = op.parentElement;
            ifm = createInItem(doc, id, uo, po);
	        if (ifm) {
	            $(ue).removeData(); // removes the jquery .data() cache
	            $(pe).removeData();
	           parent.removeChild(op);
	           parent.appendChild(ifm);
	           $(e.target).val(u_cir_S); // unicode circled s = save
	        }
	    }
	    else if (ifm) { // replace input-form with draggable text
	        col = ifm.children;
	        ue = col[eid_userIElement + id];
	        pe = col[eid_passIElement + id];
	        var u = ue.value;
	        var p = encrypt(pe.value);
	       
	        if (!isValidInput(ue.value) || !isValidInput(pe.value)) {return false;}
	        
	        uo = $(ue).data(pn_d_value);
	        po = $(pe).data(pn_d_value);
	        // Check if values have changed. If so, save to DB.
	        if ((uo !== u) || (po !== p))
	        {
	            // save to db
	            var pRec = newPRecord();
	            pRec.loc = g_loc;
	            pRec.userid = u;
	            pRec.pass = p;
                // Can't update locally because we only have one DNode locally and
                // that may not be the right one to insert the record into.
	            saveRecord(pRec);
	            if (uo !== u) {
	                // delete the original p-record. Goes to the mothership.
	                // Can't update locally because we only have one DNode locally and
	                // that may not be the right one to insert the record into.
	                deleteRecord({loc: g_loc, userid: uo});
	            }
	        }
	        // Then save the values and create a new 'op' item.
	        parent = ifm.parentElement;
	        op = createOpItem(doc, id, u, p);
	        if (op) {
	            //parent.removeChild(ifm);
	            parent.appendChild(op);// Insert the 'op' item.
	            $(e.target).val(u_cir_E); // unicode circled e = edit
	        }
	        
	        $(ifm).remove(); // Then remove the 'ifm' item.
	    }

        e.stopPropagation(); // We don't want the enclosing web-page to interefere
        e.preventDefault(); // Causes event to get cancelled if cancellable
        return false; // Causes the event to be cancelled (except mouseover event).
	}
	
	/** Creates an IO Widget with a Toggle Button and Output Fields **/
	function insertIOItem (doc, user, pass, bInp)
	{
	    var jq = $('#' + eid_panelList);
	    var id = (++g_ioItemID);
	    var liid = eid_ioItem + id;
		var opid = eid_opElement + id;
		var ifid = eid_inForm + id;
		var tbid = eid_tButton + id;
		
		var j_li = $(doc.createElement("div")).attr({id: liid, class: css_class_li});
        var tb = doc.createElement('input'); // Toggle Button
        tb.addEventListener('click', toggleIO, false);
        var j_tb = $(tb).attr(
            {
                'data-opid': opid,
                'data-ifid': ifid,
                'data-id': id,
                'data-tbid': tbid,
                type: 'button',
                id: tbid
                //style: BP_MOD_CSS.style_tButton
            }
        ).addClass(css_class_tButton);

        j_li.append(j_tb);
        if (!bInp) {
            j_tb.val(u_cir_E); // Unicode circled e = edit
            j_li.append(createOpItem(doc, id, user, pass)); 
        } // Output Fields
        else {
            j_tb.val(u_cir_S); // unicode circled s = save
            j_li.append(createInItem(doc, id, user, pass));
        }
        jq.append(j_li);

		// Prevent mousedown to bubble up in order to prevent panel dragging by
		// jquery-ui.
		j_li[0].addEventListener('mousedown', stopPropagation, false);
	}
	
    /** Creates an IO Widget with a Toggle Button and Output Fields **/
    function insertIOItem2 (doc, j_panel, user, pass, bInp)
    {
        var jq = $('#' + eid_panelList, j_panel);
        var id = (++g_ioItemID);
        var liid = eid_ioItem + id;
        var opid = eid_opElement + id;
        var ifid = eid_inForm + id;
        var tbid = eid_tButton + id;
        
        var j_li = $(doc.createElement("div")).attr({id: liid, class: css_class_li});
        var j_tb = $('<input type="button">').attr(
            {
                'data-opid': opid,
                'data-ifid': ifid,
                'data-id': id,
                'data-tbid': tbid,
                id: tbid
                //style: BP_MOD_CSS.style_tButton
            }
        ).addClass(css_class_tButton);
        addEventListener(j_tb[0], 'click', toggleIO);

        j_li.append(j_tb);
        if (!bInp) {
            j_tb.val(u_cir_E); // Unicode circled e = edit
            j_li.append(createOpItem(doc, id, user, pass)); 
        } // Output Fields
        else {
            j_tb.val(u_cir_S); // unicode circled s = save
            j_li.append(createInItem(doc, id, user, pass));
        }
        jq.append(j_li);

        // Prevent mousedown to bubble up in order to prevent panel dragging by
        // jquery-ui.
        addEventListener(j_li[0], 'mousedown', stopPropagation);
    }
    
    function insertIOItems2(ctx, j_panel)
    {
        var doc = ctx.doc, db = ctx.db,
        i, userids, 
        pRecsMap=db.pRecsMap;
        if (pRecsMap) 
        {
            userids = Object.getOwnPropertyNames(pRecsMap);
        
            for (i=0; i<userids.length; i++) {
                //var curr = pRecsMap[userids[i]].curr;
                insertIOItem2(doc, j_panel, userids[i], pRecsMap[userids[i]].curr.pass);
            }
        }
        // Finally, create one Input Item for new entry.
        insertIOItem2(doc, j_panel, "","", true);
    }
    
    function insertSettingsPanel(j_panel)
    {
        var ml = '<input type="file" accept=".3db" class="com-bprivy-dbPath" placeholder="Insert DB Path Here" ></input>';
    }
    
    // Delete the control panel. Invoked when the x button is clicked.
    function deletePanel(el)
    {
        if (el)
        {   
            $(el).data(pn_d_ctx).db.clear(); //g_db.clear(); // clear the data.
            // Need to do this using jquery so that it will remove $.data of all descendants
            $(el).remove();
        }        
    }
    
    function deletePanelHandler(e)
    {
        if (e)
        {
            var id_panel = $(e.target).data(pn_d_panelID);
            deletePanel(g_doc.getElementById(id_panel));
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            window.close();
            return false; // Causes the event to be cancelled (except mouseover event).
        }
    }
    
    // CREATE THE CONTROL-PANEL
    function createPanel(ctx) // ctx = {doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db}
    {
        var doc = ctx.doc, id_panel = ctx.id_panel, dnd = ctx.dnd, db = ctx.db;
        var j_panel = $(doc.createElement('div')).attr({id: id_panel}).data(pn_d_ctx, ctx);
        var html =      '<div id="com-bprivy-panelTitle"><div id="com-bprivy-TitleText">BPrivy</div>' +
                            '<input type="button" id="com-bprivy-xB" accesskey="q" value="\u24CD"></input>' +
                        '</div>' +
                        '<div id="com-bprivy-panelList"></div>';
        j_panel[0].insertAdjacentHTML('beforeend', html);
        makeDataDraggable2(ctx, $('#'+eid_panelList,j_panel));
        var j_xButton = $('#'+eid_xButton, j_panel).data(pn_d_panelID, id_panel);
        addEventListener(j_xButton[0], 'click', deletePanelHandler);
        insertSettingsPanel(j_panel);
        insertIOItems2(ctx, j_panel);

        return j_panel[0];
    }

    //Assemble the interface    
    var iface = {};
    Object.defineProperties(iface, 
    {
        createPanel: {value: createPanel},
        deletePanel: {value: deletePanel},
        eid_panel_prfx: {value: eid_panel_prfx},
        eid_xButton: {value: eid_xButton},
        pn_d_value: {value: pn_d_value},
        pn_d_dataType: {value: pn_d_dataType},
        pn_d_peerID: {value: pn_d_peerID},
        pn_d_panelID: {value: pn_d_panelID},
        MT_BP_DT: {value: MT_BP_DT},
        MT_TEXT_PLAIN: {value: MT_TEXT_PLAIN},
        MT_BP_PREFIX: {value: MT_BP_PREFIX}
    });
    Object.freeze(iface);

    return iface;

}(window));
/** @ModuleEnd */

function BP_ENTRY_POINT()
{
    'use strict';
    /** @export-module-begin */
    var g_win = window;
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
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs);
    /** @import-module-begin Panel */
    m = BP_MOD_PANEL_FRM;
    var createPanel = IMPORT(m.createPanel);
    // Since there is only one panel, we're using eid_panel as the global panel id.
    var gid_panel = IMPORT(m.eid_panel_prfx) + '1';
    /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location);
    var g_doc = IMPORT(g_win.document);
    var settings = {AutoFill:true, ShowPanelIfNoFill: true}; // User Settings
    /** @globals-end **/
    

    /** 
     * Invoked upon receipt of DB records from the MemStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function callbackGetDB (db)
    {        
        console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(db));

        g_db.ingest(db);
        
        g_doc.body.appendChild( 
                    createPanel({doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db}));
    }

    function main()
    {
        console.log("BP_ENTRY_POINT entered on page " + location.href);
        getRecs(g_win.location, callbackGetDB);
    }
    
    main();

}
