/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, MOD_CONNECT, MOD_CS_PLAT, MOD_COMMON, IMPORT */
/*jslint browser : true, devel : true, es5 : true */
/*properties console.info, console.log, console.warn */
/*properties 
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */

/** @remove Only used in debug builds */
"use strict";

/**
 * @module CS
 */
function com_bprivy_CS(g_win) 
{
    "use strict"; // TODO: @remove Only used in debug builds
    
    var m;
    /** @import-module-begin Common */
    m = MOD_COMMON;
    var CSS_HIDDEN = IMPORT(m.CSS_HIDDEN);
    var dt_eRecord = IMPORT(m.dt_eRecord);
    var dt_pRecord = IMPORT(m.dt_pRecord);
    /** @import-module-begin Connector */
    m = MOD_CONNECT;
    var ft_userid = IMPORT(m.ft_userid);   // Represents data-type userid
    var ft_pass = IMPORT(m.ft_pass);        // Represents data-type password
    var newERecord = IMPORT(m.newERecord);
    var newPRecord = IMPORT(m.newPRecord);
    var saveRecord = IMPORT(m.saveRecord);
    var deleteRecord = IMPORT(m.deleteRecord);
    var getRecs = IMPORT(m.getRecs);
    var tag_eRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_eRecord));
    var tag_pRecs = IMPORT(m.DNODE_TAG.getDataTag(dt_pRecord));
    /** @import-module-begin CSPlatform */
    m = MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var getURL = IMPORT(m.getURL);
    /** @import-module-end */    m = null;
    
    /** @globals-begin */
	// Names used in the code. A mapping is being defined here because
	// these names are externally visible and therefore may need to be
	// changed in order to prevent name clashes with other libraries.
	// These are all merely nouns/strings and do not share a common
	// semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
	var eid_panel = "com-bprivy-panel"; // Used by panel elements
	var eid_panelTitle ="com-bprivy-panelTitle"; // Used by panel elements
	var eid_panelList ="com-bprivy-panelList"; // Used by panel elements
    var eid_opElement = 'com-bprivy-op-'; // ID prefix of an output line of panel
    var eid_userOElement = "com-bprivy-useridO-"; // ID Prefix used by panel elements
	var eid_passOElement = "com-bprivy-passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = "com-bprivy-useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = "com-bprivy-passI-"; // ID Prefix Used by panel elements
	var eid_inForm = "com-bprivy-iform-";
	var eid_xButton = "com-bprivy-x"; // ID of the panel close button

	// CSS Class Names. Visible as value of 'class' attribute in HTML
	// and used as keys in CSS selectors. These need to be globally
	// unique as well. We need these here in order to ensure they're
	// globally unique and also as a single location to map to CSS files.
	var css_panel = "com-bprivy-panel";
	var css_output ="com-bprivy-out";
	var css_userOut = "com-bprivy-user-out";
	var css_userIn = "com-bprivy-user-in";
	var css_passOut = "com-bprivy-pass-out";
	var css_passIn = "com-bprivy-pass-in";
	var css_bButton = "com-bprivy-tb";
	var css_container = "com-bprivy-li";
    var css_container2 = "com-bprivy-ul";
	var css_xButton = "com-bprivy-x";
	
	// These are 'data' attribute names. If implemented as jQuery data
	// these won't manifest as HTML content attributes, hence won't
	// clash with other HTML elements. However, their names could clash
	// with jQuery. Hence they are placed here so that they maybe easily
	// changed if needed.
	var pn_d_value = "bpValue";
	var pn_d_dataType = "bpDataType";
	var pn_d_peerID = 'bpPeerID';

    // Other Globals
    var g_doc = g_win.document;
    var g_loc = g_doc.location;
    var g_db ={};
    var g_draggedElementID;
    var g_ioItemID = 0;
    var settings = {ShowPanelForMultipleLogins: true}; // User Setting
    /** @globals-end **/
    
    /** Placeholder password decryptor */
    function decrypt(str) {return str;}
    /** Placeholder password encryptor */
    function encrypt(str) {return str;}

    /** Intelligently returns true if the input element is a userid/username input field */
    function isUserid(el)
     {
         if (el.tagName.toLowerCase() !== 'input') {return false;}
         if (el.type)
            {return (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");}
         else
             {return true;} // text type by default
     }
    
    /** Intelligently returns true if the element is a password field */
    function isPassword (el)
     {
         if (el.tagName.toLowerCase() !== 'input') {return false;}
        return (el.type === "password");
     }

    /** Returns true if the BPrivy control panel should be created in the supplied browsing context */
	function canHavePanel(win) {
		return (win.top === win.self);
	}
	
	function isDocVisible(document) {
        /*properties is */
		return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
	}

	function isFrameVisible(frame)
	{
		var retval = true;
		console.info("Entered IsFrameVisible");
		if (frame.hidden) {
			retval = false;
		}
		else if (!frame.style) {
			retval = true;
		}
		else// frame.style exists
		{
			if(frame.style.visibility && frame.style.visibility === 'hidden') {
				retval = false;
			}
			else if(frame.style.display && frame.style.display === 'none') {
				retval = false;
			}
		}

		console.info("Exiting IsFrameVisible");
		return retval;
	}

	function preventDefault (ev)
	{
		console.log("pd invoked");
		ev.preventDefault();
		return false;
	}
	
	function stopPropagation(ev)
	{
		//console.info("stopPropagation invoked");
		ev.stopPropagation();
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
	
	function setupDNDWatchers(win)
	{
		function inputHandler(e)
		{
		    console.info("inputHandler invoked");
            var eRec = newERecord(), dragged_el;
            if (g_draggedElementID) {
                dragged_el = g_doc.getElementById(g_draggedElementID);
                console.info("DraggedElementID is " + g_draggedElementID);
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
				//console.info("Linking elements " + g_draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
			}
		}
		
		$(g_doc.getElementsByTagName('input')).each(function(i, el) {
			if (isUserid(el) || isPassword(el))
			{
				el.addEventListener("input", inputHandler, false);
				console.log("Added event listener for element " + el.id + "/" + el.name);
			}
		});
	}
	
	function createImageElement(imgPath)
	{
		var el = g_doc.createElement("img");
		el.src = getURL(imgPath);
		
		return el;
	}
	
	function makeDataDraggable(eid)
	{
		function handleDragStart (e)
		{
			console.info("DragStartHandler entered");
			//$("#bpPanel").draggable("destroy");
			e.dataTransfer.effectAllowed = "copyLink";
			//e.dataTransfer.dropEffect = "copy";
			var data = $(e.target).data(pn_d_value);
			if ($(e.target).data(pn_d_dataType) === ft_pass) {
			    data = decrypt(data);
			}
			
			//console.info("setting data to " + data + " and bpcontent to " + e.target.id);
			e.dataTransfer.setData('text/plain', data);
			//e.dataTransfer.setData(n.bpContentType, e.target.id);
			//e.dataTransfer.addElement(e.target);
			//e.dataTransfer.setDragImage(createImageElement("icon16.png"), 0, 0);
			//e.stopPropagation();
			//console.info("DataTransfer.items = "+ e.dataTransfer.items.toString());
			//console.info("tranfer data = " + e.dataTransfer.getData("text/plain"));
			g_draggedElementID = e.target.id;
			return true;
		}

		g_doc.getElementById(eid).addEventListener('dragstart', handleDragStart, false);

		function handleDragEnd(e)
		{
			console.info("DragEnd received");
			g_draggedElementID = null;
			return true;
		}

		g_doc.getElementById(eid).addEventListener('dragend', handleDragEnd, false);
	}
	
	function createOpItem(id, u, p)
	{
	    var opid = eid_opElement + id;
	    var ueid = eid_userOElement + id;
	    var peid = eid_passOElement + id;
	    
        var j_div = $(g_doc.createElement("div")).attr(
            {
                id: opid
            }
        ).addClass(css_container);

        var j_opu = $(g_doc.createElement('span')).attr(
            {draggable: true,
             id: ueid,
             name: ueid
             }
            ).addClass(css_output + " " + css_userOut).text(u);
        j_opu.data(pn_d_dataType, ft_userid).data(pn_d_value, u);

        var j_opp = $(g_doc.createElement('span')).attr(
            {
                draggable: true,
                id: peid,
                name: peid
            }
            ).addClass(css_output + " " + css_passOut).text("*****");
        j_opp.data(pn_d_dataType, ft_pass).data(pn_d_value, p);
        
        j_div.append(j_opu).append(j_opp);

        return j_div[0];
	}
	
	/** Creates input fields for the IO Widget **/
	function createInItem(id, u, p)
	{
	    var ifid = eid_inForm + id;
	    var ueid = eid_userIElement + id;
	    var peid = eid_passIElement + id;

        var j_inf = $(g_doc.createElement('form')).attr({id: ifid, 'class': css_container});
        var j_inu = $(g_doc.createElement('input')).attr(
        {
            type: 'text',
            id: ueid,
            name: ueid,
            value: u
        }).addClass(css_userIn).data(pn_d_value, u);
        var j_inp = $(g_doc.createElement('input')).attr(
        {
            type: 'password',
            id: peid,
            name: peid,
            value: decrypt(p)
        }).addClass(css_userIn).data(pn_d_value, p);

        j_inf.append(j_inu).append(j_inp);
        
        return j_inf[0];
	}
	
	/** Toggles the IO Widget **/
	function toggleIO(e)
	{
        var d = e.target.dataset;
        console.info("tb clicked" + JSON.stringify(d));
	    var op = g_doc.getElementById(d.opid),
	        ifm = g_doc.getElementById(d.ifid),
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
            ifm = createInItem(id, uo, po);
	        if (ifm) {
	            $(ue).removeData(); // removes the jquery .data() cache
	            $(pe).removeData();
	           parent.removeChild(op);
	           parent.appendChild(ifm);
	        }
	    }
	    else if (ifm) { // replace input-form with draggable text
	        col = ifm.elements;
	        ue = col[eid_userIElement + id];
	        pe = col[eid_passIElement + id];
	        var u = ue.value;
	        var p = encrypt(pe.value);
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
	        op = createOpItem(id, u, p);
	        if (op) {
	            //parent.removeChild(ifm);
	            parent.appendChild(op);// Insert the 'op' item.
	        }
	        
	        $(ifm).remove(); // Then remove the 'ifm' item.
	    }
	}
	
	/** Creates an IO Widget with a Toggle Button and Output Fields **/
	function insertIOItem (user, pActions)
	{
	    var jq = $('#' + eid_panelList);
	    var id = (++g_ioItemID);
		var opid = eid_opElement + id;
		var ifid = eid_inForm + id;
		
		var j_li = $(g_doc.createElement("li")).attr({value: id}).addClass(css_container);
        var tb = g_doc.createElement('input'); // Toggle Button
        tb.addEventListener('click', toggleIO, false);
        var j_tb = $(tb).attr(
            {
                'data-opid': opid,
                'data-ifid': ifid,
                'data-id': id,
                type: 'button'
            }
        );

        j_li.append(j_tb);
        j_li.append(createOpItem(id, user, pActions.curr.pass)); // Output Fields
        jq.append(j_li);

		// Prevent mousedown to bubble up in order to prevent panel dragging by
		// jquery-ui.
		j_li[0].addEventListener('mousedown', stopPropagation, false);
	}
	
	function insertIOItems()
    {
        var pRecsMap, i, nma;
        if (!(pRecsMap = g_db[tag_pRecs])) {
            return;
        }
        else {
            nma = Object.getOwnPropertyNames(pRecsMap);
        }
        
        for (i=0; i<nma.length; i++) {
            insertIOItem(nma[i], pRecsMap[nma[i]]);
        }
    } 
    
    // CREATE THE CONTROL-PANEL
    function createPanel(doc)
    {
        var html =  '<div id="com-bprivy-panel" class="com-bprivy-panel" style="display:none">' +
                        '<ul id="com-bprivy-panelList" class="com-bprivy-ul">' +
                            '<div id="com-bprivy-panelTitle">BPrivy' +
                                '<input type="button" id="com-bprivy-x" accesskey="q" class="com-bprivy-x"></input>' +
                            '</div>' +
                        '</ul>' +
                    '</div>';
        doc.body.insertAdjacentHTML('beforeend', html);
        makeDataDraggable(eid_panelList);
        doc.getElementById(eid_xButton).addEventListener('click', togglePanel);
        insertIOItems();
        
        var j_panel = $('#' + eid_panel);
        // Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
        // by setting position:relative. Also we can use right:0px here because draggable() does not like it.
        // Hence we need to calculate the left value :(         
        var panelW = j_panel.outerWidth();
        var winW = doc.body.clientWidth ? doc.body.clientWidth : $(doc.body).innerWidth();
        
        var left = (winW-panelW);
        left = (left>0)? left: 0;
        
        console.info("WinW = " + winW + " panelW = " + panelW);

        j_panel.css({position: 'fixed', top: '0px', 'left': left + "px"});

        // Make it draggable after all above mentioned style properties have been applied to the element.
        // Otherwise draggable() will override those properties.
        j_panel.draggable();
        
        return j_panel;
    }

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
        var eRecsMap, pRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone;
        // auto-fill
        // if we don't have a stored username/password, then there is nothing
        // to autofill.
        if (!(pRecsMap = g_db.pRecsMap)) {
            return;
        }
        else {
            ua = Object.getOwnPropertyNames(pRecsMap); 
            // if there is more than one username, do not autofill
            if (ua && (ua.length !== 1)) {
                return;
            }
            else if (g_db.eMapArray) {
                // Cycle through tag_eRecs records starting with the
                // best URL matching node.
                l = g_db.eMapArray.length; uDone=false; pDone=false;
                for (i=0; (i<l) && (!pDone) && (!uDone); ++i) {
                    eRecsMap = g_db.eMapArray.pop();
                    
                    uer = eRecsMap[ft_userid].curr;
                    per = eRecsMap[ft_pass].curr;
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
                            uer.loc = g_loc;
                            deleteRecord(uer);
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
                            per.loc = g_loc;
                            deleteRecord(per);
                        }
                    }
                }
            }
        }
    }
     
    function showPanel()
    {
        createPanel(g_doc).show();
    }
    
    function togglePanel(e/*unused*/)
    {
        // Only show the panel in the top-level frame.
        if(canHavePanel(g_win)) 
        {
            var el = g_doc.getElementById(eid_panel);
            if (el)
            {
                g_draggedElementID = null;
                $(el).remove();
            }
            else {
                showPanel();
            }
        }        
    }
    
    /** 
     * Invoked upon receipt of DB records from Connector or FileStore module.
     * @param {db}  Holds DB records relevant to this page. 
     */
    function callbackGetDB (db)
    {
        g_db = db;
        
        console.info("bp_cs retrieved DB-Records\n" + JSON.stringify(g_db));
        if ((!autoFill()) && settings.ShowPanelIfMultipleLogins) {
            showPanel();
        }
    }
    
	function clickBP (request, sender, sendResponse)
	{
		togglePanel(request);
		sendResponse({});
	}
	
	function main()
	{
		if(canHavePanel(g_win)) 
		{
			console.log("BP_CS entered on page " + location.href);
			//createPanel(g_win);
            getRecs(g_loc, callbackGetDB);
			registerMsgListener(clickBP);
            setupDNDWatchers(g_win);

			
			// experimentation
/*			var el = g_doc.createElement('com-bprivy-data');
			el.setAttribute('id', 'com.facebook.www1/login.asp?b=a&x=y#abc');
			$(el).prop("hidden", true).addClass(CSS_HIDDEN);
			$(el).appendTo(g_doc.body);*/
		}
	}
	
	return main;
}
/** @ModuleEnd */

com_bprivy_CS(window)();

/*
    function createPanelTitle ()
    {
        var j_div = $(g_doc.createElement("div")).attr({
                    id: eid_panelTitle
                }).text("BPrivy");
        var j_xBtn = $(g_doc.createElement("button")).attr(
                    {    
                        type: "button",
                        id: eid_xButton,
                        accesskey: "q",
                        'for': eid_panel
                    }).addClass(css_xButton);
        // Make it closable via. the x button
        j_xBtn[0].addEventListener("click", togglePanel);
        j_div.append(j_xBtn);
        return j_div;
    }
    
    function createPanel(doc)
    {
        var panelW, winW, left;

        var tmp_el = doc.createElement("div");
        var j_panel = $(tmp_el).attr('id', eid_panel).addClass(css_panel);
        
        var j_ul = $("<ul></ul>").attr("id", eid_panelList).addClass(css_container2);
        
        j_ul.append(createPanelTitle());
        insertIOItem(j_ul, "1", "username1", "password1");
        insertIOItem(j_ul, "2", "user2@facebook.com", "passw2");
        // Attache dragStart and End listener to container in order to make its items draggable.
        makeDataDraggable(eid_panelList);

        j_panel.append(j_ul);
        
        if (doc.body) {
            j_panel.hide().appendTo('body');
        }
        
        // Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
        // by setting position:relative. Also we can use right:0px here because draggable() does not like it.
        // Hence we need to calculate the left value :(         
        panelW = j_panel.outerWidth();
        winW = doc.body.clientWidth ? doc.body.clientWidth :
                $(doc.body).innerWidth();
        
        left = (winW-panelW);
        left = (left>0)? left: 0;
        
        console.info("WinW = " + winW + " panelW = " + panelW);

        j_panel.css({position: 'fixed', top: '0px', 'left': left + "px"});

        // Make it draggable after all above mentioned style properties have been applied to the element.
        // Otherwise draggable() will override those properties.
        j_panel.draggable();
        

        
      // var l_btn = doc.createElement("button");
        // var j_btn = $(l_btn).attr({
                                                         // type: 'button',
                                                         // id: eid_Button,
                                                         // accesskey: 'p',
                                                         // hidden: 'hidden',
                                                         // 'for': eid_panel,
                                                         // 'class': CSS_HIDDEN
                                                     // }).appendTo(doc.body);
//                                                      
        // l_btn.addEventListener("click", function (e){console.info("click"); j_panel.toggle();});
        // console.log('accesskey and label are ' + l_btn.accessKey + " and " + l_btn.accessKeyLabel);
        return j_panel;
    }
 
 
 function Fill(request, sender, sendResponse)
 {
 console.log("Received BPClick event");
 var el = g_doc.activeElement;
 var response = [];
 if ((el instanceof HTMLInputElement))
 {
 if (IsUserID(el))
 {
 el.value = "Username";
			// {
 response[0] = {"username": "LoginID"};
 }
 else if (el.type === "password")
 el.style = "background: red; color: blue";
 response[0] = {"username": "Password"};
 }
 }
 sendResponse(response);
 }

		// "dropHandler": function(e)
		// {
			// console.info("DropHandler invoked");
			// var data = e.dataTransfer.getData(n.bpContentType); 
			// if (data)
				// console.info("Data from element " + data + " dropped at element " + e.target.id);
			// }
		// },
		
		// "dragoverHandler": function (e)
		// {
			// console.log("dragoverHandler invoked");
			// var items = e.dataTransfer.items;
			// var found = false;
			// if (items)
			// {
				// for (var i = 0; i < items.length; i++)
				// {
					// if (items[i].type === n.bpContentType)
						// found = true;
					// console.log(items[i].kind + ":" + items[i].type);
				// }
			// }
// 
			// if (found)
			// {
				// console.info("found x-bp-content data hovering over element " + e.target.id + "/" + e.target.name); 
				// e.dataTransfer.dropEffect = "copy";
				// e.preventDefault();
				// return false;
			// }	
		// },
		

 */