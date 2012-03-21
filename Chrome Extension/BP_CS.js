
/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document */

/****************************************************************************/
/*****************************Module 3db ************************************/
/****************************************************************************/
// The following pattern defines a module, all who's contents are encolsed inside a
// anonymous function scope. The returned object holds references to the public
// interface of the module. The remaining functions and variables are private to the module.
//var bpModule3db = (function () {
/*ModuleBegin */

/*ModuleInterfaceGetter 3db */
function getModuleInterface(url) 
{
    // Fields of an event-record
    var fields = ['username', 'password', 'url', 'tag'];
    
    var saveRecord = function(o)
    {
        if (o && o.url && o.username)
        {
            var url = sanitizeUrl(o.url);
            eRecords[url][o.username] = o;
            return true;
        }
        else
            return false;
    }
    
    var getRecord = function(url, username)
    {
        if (url && username)
            return eRecords[url][username];
    }

    return {"saveRecord": saveRecord,
            "getRecord": getRecord};
}

var bpModule3db = getModuleInterface();
/*ModuleEnd */
//return getModuleInterface();}());

/****************************************************************************/
/**************************** Module bpcs ***********************************/
/****************************************************************************/

/* Global declaration for JSLint */
/*global document $ console chrome */


// The following pattern defines a module, all who's contents are encolsed inside a
// anonymous function scope. The returned object holds references to the public
// interface of the module. The remaining functions and variables are private to the module.
//var bpModuleCS =(function() {
/*ModuleBegin */

	function getModuleInterface(){}
	
	// Element IDs and Selectors
	var bp_g =
	{
		"panelId": "bpPanel",
		"panelTitleId":"bpPanelTitle",
		"panelListId":"bpPanelList",
	
		// CSS Class Names
		"panelClass": "bp-panel",
		"outputClass":"bp-out",
		"userOutClass": "bp-user-out",
		"passOutClass": "bp-pass-out",
		"containerClass": "bp-container",
		
		//
		"bpContentType": "x-bp-content",
		"draggedElementID": null,
		
		// Content Types
		"CTPropName": "bpContentType",
		"CTPropValUserid": "userid",
		"CTPropValPass": "pass"
	};

    function isUserid(el)
     {
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
		return (win.top == win.self);
	}
	
	function IsDocVisible(document) {
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
	
	function setupDNDWatchers()
	{
		function inputHandler(e)
		{
			if (bp_g.draggedElementID && ($("#"+bp_g.draggedElementID).val() === e.target.value))
			{
			    var link = {};
			    link.tag = e.target.tagName;
			    link.tagid = e.target.id;
			    link.tagname = e.target.name;
			    link.tagtype = e.target.type;
				link.name = $(document.getElementById(bp_g.draggedElementID)).attr("name");
				
				bpModule3db.saveLink(link);
				//console.info("Linking elements " + bp_g.draggedElementID + "/" + name + " and " + e.target.id + "/" + e.target.name);
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
	
	function makeItemsDraggable(j_container)
	{
		function handleDragStart (e)
		{
			console.info("DragStartHandler entered");
			//$("#bpPanel").draggable("destroy");
			e.dataTransfer.effectAllowed = "copyLink";
			//e.dataTransfer.dropEffect = "copy";
			var data = e.target.value;
			//console.info("setting data to " + data + " and bpcontent to " + e.target.id);
			e.dataTransfer.setData('text/plain', data);
			e.dataTransfer.setData(bp_g.bpContentType, e.target.id);
			//e.dataTransfer.addElement(e.target);
			e.dataTransfer.setDragImage(createImageElement("icon16.png"), 0, 0);
			//e.stopPropagation();
			//console.info("DataTransfer.items = "+ e.dataTransfer.items.toString());
			//console.info("tranfer data = " + e.dataTransfer.getData("text/plain"));
			bp_g.draggedElementID = e.target.id;
			return true;
		}

		j_container[0].addEventListener('dragstart', handleDragStart, false);

		function handleDragEnd(e)
		{
			console.info("DragEnd received");
			bp_g.draggedElementID = null;
			return true;
		}

		j_container[0].addEventListener('dragend', handleDragEnd, false);
	}
	
	function insertIOItem (jq, id, user, pass)
	{
		var userid = "username" + id;
		var passid = "password" + id;
		var j_li = $(document.createElement("li")).addClass(bp_g.containerClass);

		var j_inu = $("<span></span>").attr(
			{draggable: true,
			 //contenteditable: true,
			 //required: true,
			 id: userid,
			 name: userid,
			 value: user,
			 //size: 12,
			 //maxlength: 100
			 }
			).addClass(bp_g.outputClass + " " + bp_g.userOutClass).text(user);
		(j_inu[0])[bp_g.CTPropName] = bp_g.CTPropValUserid;

		var j_inp = $("<span></span>").attr(
			{
				draggable: true,
				//contenteditable: true,
			    //required: true, 
				id: passid,
				name: userid,
				value: pass
				//size:12,
				//cols: 12, rows: 1,
				//maxlength: 100,
			}
			).addClass(bp_g.outputClass + " " + bp_g.passOutClass).text("...");
        (j_inp[0])[bp_g.CTPropName] = bp_g.CTPropValPass;
        
		jq.append(j_li.append(j_inu).append(j_inp));

		// Prevent mousedown to bubble up in order to prevent panel dragging by
		// jquery-ui.
		j_li[0].addEventListener('mousedown', stopPropagation, false);
	}
	
    function createPanelTitle ()
	{
		return $(document.createElement("div")).attr({
					id: bp_g.panelTitleId
				}).text("BPrivy");
	}

	// CREATE THE CONTROL-PANEL
	function CreatePanel()
	{
		var panelW, winW, left;
		//var document = win.document;

		var tmp_el = document.createElement("div");
		var panel = $(tmp_el).attr('id', bp_g.panelId).addClass(bp_g.panelClass);
		
		var ul = $("<ul></ul>").attr("id", bp_g.panelListId).addClass(bp_g.containerClass);
		
		ul.append(createPanelTitle());
		insertIOItem(ul, "1", "username1", "password1");
		insertIOItem(ul, "2", "user2", "passw2");
		// Attache dragStart and End listener to container in order to make its items draggable.
		makeItemsDraggable(ul);

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
		if(DoCreatePanel()) 
		{
			$(document.getElementById(bp_g.panelId)).toggle();
		}
	
		sendResponse({});
		return;
	}
	
	function main()
	{
		if(DoCreatePanel()) 
		{
			console.log("BP_CS entered on page " + location.href);
			CreatePanel();
			setupDNDWatchers();
			chrome.extension.onRequest.addListener(clickBP);
		}
	}
	
	main();

	var bpModuleCS = getModuleInterface();
/*ModuleEnd */
//return getModuleInterface();}());


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
			// var data = e.dataTransfer.getData(bp_g.bpContentType); 
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
					// if (items[i].type === bp_g.bpContentType)
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