/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global $, console, chrome, bp_3db */
/*jslint browser:true, devel:true */

// HTMLElement IDs. Visible to other scripts as well as the browser.
/*members 
 * eid_panel, eid_panelTitle, eid_panelList, eid_userElement, eid_passElement
 */

// CSS Class Names. Visible to the browser.
/*members
 * css_panel, css_output, css_userOut, css_passOut, css_container
 */

// Externally visible proprietary properties.
/*members
 * data_value, data_dataType, data_peerID
 */

"use strict";
/**
 * @ModuleBegin CS
 */
//var bp_CS =(function() {

	function getModuleInterface(){}
	
	// Names used in the code. A mapping is being defined here because
	// these names are externally visible and therefore may need to be
	// changed in order to prevent name clashes with other libraries.
	// These are all merely nouns/strings and do not share a common
	// semantic. They are grouped according to semantics.
	var n =
	{
	    // Element ID values. These could clash with other HTML elements
	    // Therefore they need to be crafted to be globally unique.
		eid_panel: "com.untrix.bpPanel", // Used by panel elements
		eid_panelTitle:"com.untrix.bpPanelTitle", // Used by panel elements
		eid_panelList:"com.untrix.bpPanelList", // Used by panel elements
		eid_userElement: "com.untrix.bp-username-", // ID Prefix used by panel elements
		eid_passElement: "com.untrix.bp-pass-", // ID Prefix Used by panel elements
	
		// CSS Class Names. Visible as value of 'class' attribute in HTML
		// and used as keys in CSS selectors. These need to be globally
		// unique as well. We need these here in order to ensure they're
		// globally unique and also as a single location to map to CSS files.
		css_panel: "bp-panel",
		css_output:"bp-out",
		css_userOut: "bp-user-out",
		css_passOut: "bp-pass-out",
		css_container: "bp-container",
		
		// These are 'data' attribute names. If implemented as jQuery data
		// these won't manifest as HTML content attributes, hence won't
		// clash with other HTML elements. However, their names could clash
		// with jQuery. Hence they are placed here so that they maybe easily
		// changed if needed.
		data_value: "bpValue",
		data_dataType: "dataType",
		data_peerID: 'bpPeerID'
    };

    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /*members
     * dt_userid, dt_pass
     */
    var dt =
    {
        dt_userid: "userid",   // Represents data-type userid
        dt_pass: "pass"        // Represents data-type password
	};

    var draggedElementID = null;
    
    function decrypt(str) {return str;}

    function isUserid(el)
     {
         /*members type */
         if (el.type)
            {return (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");}
         else
             {return true;} // text type by default
     }
    
     function isPassword (el)
     {
        return (el.type === "password");
     }

	function DoCreatePanel(win) {
	    /*members top, self */
		return (win.top == win.self);
	}
	
	function IsDocVisible(document) {
	    /*members webkitVisibilityState, body, is*/
		return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
	}

	function IsFrameVisible(frame)
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

	function preventDefault (e)
	{
		console.log("pd invoked");
		e.preventDefault();
		return false;
	}
	
	function stopPropagation(e)
	{
		//console.info("stopPropagation invoked");
		e.stopPropagation();
	}
	
	function autoFillPeer(el, data)
	{
        var p = findPeerElement(el);
        if (p)
        {
            if (data.type() === n.pass) {
                p.value = decrypt(data);
            }
            else {
                p.value = data;
            }
        }
	}
	
	function setupDNDWatchers()
	{
		function inputHandler(e)
		{
            var record = bp_3db.constructRecord(), dragged_el;
            dragged_el = draggedElementID ? document.getElementById(draggedElementID) : null;
            
			if ( dragged_el && ($(dragged_el).val() === e.target.value))
			{
			    record.tagName = e.target.tagName;
			    record.elementID = e.target.id;
			    record.elementName = e.target.name;
			    record.elementType = e.target.type;
                record.elementDataType = $(dragged_el).data(n.dataType);
                
				bp_3db.saveTagDescription(record);
				
				var p = $(dragged_el).data(n.peerID);
				if (p) {
				    autoFillPeer(e.target, $(p).data(n.value));
				}
				//console.info("Linking elements " + draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
			}
		}
		
		$("input").each(function(i, el) {
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
		el.src = chrome.extension.getURL(imgPath);
		
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
			var data = $(e.target).data(n.value);
			if ($(e.target).data(n.dataType) === n.pass) {
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
			draggedElementID = e.target.id;
			return true;
		}

		j_container[0].addEventListener('dragstart', handleDragStart, false);

		function handleDragEnd(e)
		{
			console.info("DragEnd received");
			draggedElementID = null;
			return true;
		}

		j_container[0].addEventListener('dragend', handleDragEnd, false);
	}
	
	function insertIOItem (jq, id, user, pass)
	{
		var userid = n.userElementIDPrefix + id;
		var passid = n.passElementIDPrefix + id;
		var j_li = $(document.createElement("li")).addClass(n.containerClass);

		var j_inu = $("<span></span>").attr(
			{draggable: true,
			 //contenteditable: true,
			 //required: true,
			 id: userid,
			 name: userid
			 //size: 12,
			 //maxlength: 100
			 }
			).addClass(n.outputClass + " " + n.userOutClass).text(user);
		j_inu.data(n.dataType, dt.userid).data(n.value, user);

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
			).addClass(n.outputClass + " " + n.passOutClass).text("...");
        j_inp.data(n.dataType, dt.pass).data(n.value, pass);
        
		jq.append(j_li.append(j_inu).append(j_inp));

		// Prevent mousedown to bubble up in order to prevent panel dragging by
		// jquery-ui.
		j_li[0].addEventListener('mousedown', stopPropagation, false);
	}
	
    function createPanelTitle ()
	{
		return $(document.createElement("div")).attr({
					id: n.panelTitleId
				}).text("BPrivy");
	}

	// CREATE THE CONTROL-PANEL
	function CreatePanel()
	{
		var panelW, winW, left;
		//var document = win.document;

		var tmp_el = document.createElement("div");
		var panel = $(tmp_el).attr('id', n.panelId).addClass(n.panelClass);
		
		var ul = $("<ul></ul>").attr("id", n.panelListId).addClass(n.containerClass);
		
		ul.append(createPanelTitle());
		insertIOItem(ul, "1", "username1", "password1");
		insertIOItem(ul, "2", "user2", "passw2");
		// Attache dragStart and End listener to container in order to make its items draggable.
		makeDataDraggable(ul);

		panel.append(ul);
		
		if (document.body) {
			panel.hide().appendTo('body');
		}
		
		// Make sure that postion:fixed is supplied at element level otherwise draggable() overrides it
		// by setting position:relative. Also we can use right:0px here because draggable() does not like it.
		// Hence we need to calculate the left value :(			
		panelW = panel.outerWidth();
		winW = document.body.clientWidth ? document.body.clientWidth :
				$(document.body).innerWidth();
		
		left = (winW-panelW);
		left = (left>0)? left: 0;
		
		console.info("WinW = " + winW + " panelW = " + panelW);

		panel.css({position: 'fixed', top: '0px', 'left': left + "px"});

		// Make it draggable after all above mentioned style properties have been applied to the element.
		// Otherwise draggable() will override those properties.
		panel.draggable();
		
		return panel;
	}

	function clickBP (request, sender, sendResponse)
	{
		// Only show the panel in the top-level frame.
		if(DoCreatePanel(this)) 
		{
			$(document.getElementById(n.panelId)).toggle();
		}
	
		sendResponse({});
		return;
	}
	
	function main()
	{
		if(DoCreatePanel(this)) 
		{
			console.log("BP_CS entered on page " + location.href);
			CreatePanel();
			setupDNDWatchers();
			chrome.extension.onRequest.addListener(clickBP);
		}
	}
	
	main();

	var bp_CS = getModuleInterface();
//return bp_CS;}());
/** @ModuleEnd */


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