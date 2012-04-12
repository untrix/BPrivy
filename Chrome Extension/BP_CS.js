/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, com_bprivy_GetModule_3db, com_bprivy_GetModule_CSPlatform, com_bprivy_GetModule_Common */
/*jslint browser : true, devel : true, es5 : true */
/*properties console.info, console.log, console.warn */
/*properties 
 * el.type, document.webkitVisibilityState, document.body, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */

/** @remove Only used in debug builds */
"use strict";

/**
 * @module CS
 */
function com_bprivy_CS(_win) 
{
    /** @import-module-begin 3db */
    var m = com_bprivy_GetModule_3db();
    var e_dt_userid = m.dt_userid;   // Represents data-type userid
    var e_dt_pass = m.dt_pass;        // Represents data-type password
    var constructERecord = m.constructERecord;
    var saveERecord = m.saveERecord;
    var getDB = m.getDB;
    /** @import-module-begin CSPlatform */
    m = com_bprivy_GetModule_CSPlatform();
    var registerMsgListener = m.registerMsgListener;
    var getURL = m.getURL;
    /** @import-module-begin Common */
    m = com_bprivy_GetModule_Common();
    var css_hidden = m.css_hidden;
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
	var eid_userElement = "com-bprivy-username-"; // ID Prefix used by panel elements
	var eid_passElement = "com-bprivy-pass-"; // ID Prefix Used by panel elements
	var eid_xButton = "com-bprivy-x"; // ID of the panel close button

	// CSS Class Names. Visible as value of 'class' attribute in HTML
	// and used as keys in CSS selectors. These need to be globally
	// unique as well. We need these here in order to ensure they're
	// globally unique and also as a single location to map to CSS files.
	var css_panel = "com-bprivy-panel";
	var css_output ="com-bprivy-out";
	var css_userOut = "com-bprivy-user-out";
	var css_passOut = "com-bprivy-pass-out";
	var css_container = "com-bprivy-li";
    var css_container2 = "com-bprivy-ul";
	var css_xButton = "com-bprivy-x";
	
	// These are 'data' attribute names. If implemented as jQuery data
	// these won't manifest as HTML content attributes, hence won't
	// clash with other HTML elements. However, their names could clash
	// with jQuery. Hence they are placed here so that they maybe easily
	// changed if needed.
	var pn_d_value = "bpValue";
	var pn_d_dataType = "dataType";
	var pn_d_peerID = 'bpPeerID';

    // Other Globals
    var g_draggedElementID = null;
    var g_win = _win;
    var g_kDB;
    var g_pDB;
    /** @globals-end **/
    
    /** Decrypts password */
    function decrypt(str) {return str;}

    /** Intelligently returns true if the element is a userid/username input field */
    function isUserid(el)
     {
         if (el.type)
            {return (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");}
         else
             {return true;} // text type by default
     }
    
    /** Intelligently returns true if the element is a password field */
    function isPassword (el)
     {
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
            if (data.type() === e_dt_pass) {
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
            var eRec = constructERecord(), dragged_el;
            if (g_draggedElementID) {
                dragged_el = document.getElementById(g_draggedElementID);
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
                eRec.recKey = $(dragged_el).data(pn_d_dataType);
                eRec.loc = win.document.location;
                                
				saveERecord(eRec);
				
				var p = $(dragged_el).data(pn_d_peerID);
				if (p) {
				    autoFillPeer(e.target, $(p).data(pn_d_value));
				}
				//console.info("Linking elements " + g_draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
			}
		}
		
		$(win.document.getElementsByTagName('input')).each(function(i, el) {
			if (isUserid(el) || isPassword(el))
			{
				el.addEventListener("input", inputHandler, false);
				console.log("Added event listener for element " + el.id + "/" + el.name);
			}
		});
	}
	
	function createImageElement(imgPath)
	{
		var el = document.createElement("img");
		el.src = getURL(imgPath);
		
		return el;
	}
	
	function makeDataDraggable(j_container)
	{
		function handleDragStart (e)
		{
			console.info("DragStartHandler entered");
			//$("#bpPanel").draggable("destroy");
			e.dataTransfer.effectAllowed = "copyLink";
			//e.dataTransfer.dropEffect = "copy";
			var data = $(e.target).data(pn_d_value);
			if ($(e.target).data(pn_d_dataType) === e_dt_pass) {
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

		j_container[0].addEventListener('dragstart', handleDragStart, false);

		function handleDragEnd(e)
		{
			console.info("DragEnd received");
			g_draggedElementID = null;
			return true;
		}

		j_container[0].addEventListener('dragend', handleDragEnd, false);
	}
	
	function insertIOItem (jq, id, user, pass)
	{
		var userid = eid_userElement + id;
		var passid = eid_passElement + id;
		var j_li = $(document.createElement("li")).addClass(css_container);

		var j_inu = $("<span></span>").attr(
			{draggable: true,
			 //contenteditable: true,
			 //required: true,
			 id: userid,
			 name: userid
			 //size: 12,
			 //maxlength: 100
			 }
			).addClass(css_output + " " + css_userOut).text(user);
		j_inu.data(pn_d_dataType, e_dt_userid).data(pn_d_value, user);

		var j_inp = $("<span></span>").attr(
			{
				draggable: true,
				//contenteditable: true,
			    //required: true, 
				id: passid,
				name: userid
				//size:12,
				//cols: 12, rows: 1,
				//maxlength: 100,
			}
			).addClass(css_output + " " + css_passOut).text("*****");
        j_inp.data(pn_d_dataType, e_dt_pass).data(pn_d_value, pass);
        
		jq.append(j_li.append(j_inu).append(j_inp));

		// Prevent mousedown to bubble up in order to prevent panel dragging by
		// jquery-ui.
		j_li[0].addEventListener('mousedown', stopPropagation, false);
	}
	
    function createPanelTitle ()
	{
		var j_div = $(document.createElement("div")).attr({
					id: eid_panelTitle
				}).text("BPrivy");
        var j_xBtn = $(document.createElement("button")).attr(
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

	// CREATE THE CONTROL-PANEL
	function createPanel(win)
	{
		var panelW, winW, left;
		var doc = win.document;

		var tmp_el = doc.createElement("div");
		var j_panel = $(tmp_el).attr('id', eid_panel).addClass(css_panel);
		
		var j_ul = $("<ul></ul>").attr("id", eid_panelList).addClass(css_container2);
		
		j_ul.append(createPanelTitle());
		insertIOItem(j_ul, "1", "username1", "password1");
		insertIOItem(j_ul, "2", "user2@facebook.com", "passw2");
		// Attache dragStart and End listener to container in order to make its items draggable.
		makeDataDraggable(j_ul);

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
		

		
/*		var l_btn = doc.createElement("button");
		var j_btn = $(l_btn).attr({
                                                         type: 'button',
                                                         id: eid_Button,
                                                         accesskey: 'p',
                                                         hidden: 'hidden',
                                                         'for': eid_panel,
                                                         'class': css_hidden
	                                                 }).appendTo(doc.body);
	                                                 
	    l_btn.addEventListener("click", function (e){console.info("click"); j_panel.toggle();});
	    console.log('accesskey and label are ' + l_btn.accessKey + " and " + l_btn.accessKeyLabel);*/
		return j_panel;
	}

    /** 
     * Invoked upon receipt of KDB records from 3DB module.
     * @param {db}  Holds KDB records relevant to this page. 
     */
    function loadDB (kdb) {
        g_kDB = kdb;
        console.info("bp_cs retrieved K-Records\n" + JSON.stringify(g_kDB));
    }
     
    function togglePanel(e)
    {
        // Only show the panel in the top-level frame.
        if(canHavePanel(g_win)) 
        {
            var el = document.getElementById(eid_panel);
            if (el)
            {
                g_draggedElementID = null;
                $(el).remove();
            }
            else
            {
                createPanel(g_win).show();
            }
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
            getDB(g_win.document.location, loadDB);
			setupDNDWatchers(g_win);
			registerMsgListener(clickBP);
			
			// experimentation
/*			var el = g_win.document.createElement('com-bprivy-data');
			el.setAttribute('id', 'com.facebook.www1/login.asp?b=a&x=y#abc');
			$(el).prop("hidden", true).addClass(css_hidden);
			$(el).appendTo(g_win.document.body);*/
		}
	}
	
	return main;

}
/** @ModuleEnd */

com_bprivy_CS(window)();

/*
 
 function Fill(request, sender, sendResponse)
 {
 console.log("Received BPClick event");
 var el = document.activeElement;
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