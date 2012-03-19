/* Global declaration for JSLint */
/*global document */

// Private namespace in a Function Closure
var bp = ( function() {
	// Element IDs and Selectors
	var panelId = "bpPanel";
	var	panelSelector = "#" + panelId;
	var panelTitleId = "bpPanelTitle";
	var panelListId = "bpPanelList";

	// CSS Class Names
	var panelClass = "bp-panel";
	var userInpClass = "bp-user-in";
	var passInpClass = "bp-pass-in";
	var outputClass  = "bp-out";
	var userOutClass = "bp-user-out";
	var passOutClass = "bp-pass-out";
	var panelTitleClass = "bp-panel-title";
	var containerClass = "bp-container";

	var _f = {
		"bpcPanelId" : function() {
			return panelId;
		},
		
		"bpcPanelSelector" : function() {
			return panelSelector;
		},
		
		"DoCreatePanel" : function() {
			return (top == self);
		},
		
		"IsDocVisible" : function(document) {
			return ((document.webkitVisibilityState && (document.webkitVisibilityState === 'visible')) || ($(document.body).is(":visible")));
		},
	
		"IsFrameVisible" : function(frame)
		{
			var retval = true;
			console.info("Entered IsFrameVisible");
			if (frame.hidden)
				retval = false;
			else if (!frame.style)
				retval = true;
			else// frame.style exists
			{
				if(frame.style.visibility && frame.style.visibility === 'hidden')
					retval = false;
				else if(frame.style.display && frame.style.display === 'none')
					retval = false;
			}

			console.info("Exiting IsFrameVisible");
			return retval;
		},

		"preventDefault": function (e)
		{
			console.log("pd invoked");
			e.preventDefault();
			return false;
		},
		
		"stopPropagation": function (e)
		{
			console.info("stopPropagation invoked");
			e.stopPropagation();
			return true;
		},
		
		"handleDragEnd": function (e)
		{
			console.info("DragEnd received");
			return true;
		},

		"handleDragStart": function (e)
		{
			console.info("DragStartHandler entered");
			//$("#bpPanel").draggable("destroy");
			e.dataTransfer.effectAllowed = "copy";
			//e.dataTransfer.dropEffect = "copy";
			var data = e.target.value;
			console.info("setting data to " + data);
			e.dataTransfer.setData('text/plain', data);
			e.dataTransfer.setData('text/x-bp-content', e.target.id);
			//e.dataTransfer.setDragImage(e.target, 0, 0);
			e.stopPropagation();
			console.info("DataTransfer.items = "+e.dataTransfer.items[0]);
			console.info("tranfer data = " + e.dataTransfer.getData("text/plain"));
			return true;
		},
		
		"addDragListeners": function (j)
		{
			j[0].addEventListener('dragstart', _f.handleDragStart, false);
			j[0].addEventListener('dragend', _f.handleDragEnd, false);
		},
		
		"InsertIOItem": function (jq, id, user, pass)
		{
			var userid = "username" + id;
			var passid = "password" + id;
			var j_li = $(document.createElement("li")).addClass(containerClass);

			var j_inu = $("<span></span>").attr(
												{draggable: true,
													//contenteditable: true,
												 //required: true,
												 id: userid, 
												 value:user,
												 //size: 12,
												 //maxlength: 100
												 }
												).addClass(outputClass + " " + userOutClass).text(user);

			var j_inp = $("<span></span>").attr(
												{
													draggable: true,
													//contenteditable: true,
												    //required: true, 
													id: passid, 
													value: pass,
													//size:12,
													//cols: 12, rows: 1,
													//maxlength: 100,
												}
												).addClass(outputClass + " " + passOutClass).text("...");
						
			jq.append(j_li.append(j_inu).append(j_inp));

			// Prevent mousedown to bubble up in order to prevent panel dragging by
			// jquery-ui.
			j_li[0].addEventListener('mousedown', _f.stopPropagation, false);
		},
		
		"createPanelTitle": function () {
			return $(document.createElement("div")).attr({
						id: panelTitleId
					}).text("BPrivy");
		},

		// CREATE THE CONTROL-PANEL
		"CreatePanel": function()
		{
			var panelW, winW, left;
			//var document = win.document;

			var tmp_el = document.createElement("div");
			var panel = $(tmp_el).attr('id', panelId).addClass(panelClass);
			
			var ul = $("<ul></ul>").attr("id", panelListId).addClass(containerClass);
			
			ul.append(_f.createPanelTitle());
			_f.InsertIOItem(ul, "1", "username1", "password1");
			_f.InsertIOItem(ul, "2", "user2", "passw2");
			_f.addDragListeners(ul);

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
		},
		
		"GetPanel": function ()
		{
			var el = document.getElementById(bp.bpcPanelId());
			if(el)
				return $(el);
			else
				console.error("BPGetPanel could not find BPPanel");
		},

		"dropHandler": function(e)
		{
			console.info("DropHandler invoked");
			var data = e.dataTransfer.getData("text/x-bp-content"); 
			if (data)
			{
				console.info("Data from element " + data + " dropped at element " + e.target.id);
			}
		},
		
		"isUserid": function (el)
		 {
			 if (el.type)
			 	return (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="url" || el.type==="number");
			 else
				 return true; // text type by default
		 },
		
		 "isPassword": function (el)
		 {
		 	return (el.type === "password");
		 },

		"probe": function (e)
		{
			console.log("probe invoked");	
		},
		
 		"setupDNDLinks": function()
 		{
 			$("input").each(function(i, e) {
 				if (_f.isUserid(e) || _f.isPassword(e))
 				{
 					e.addEventListener("drop", _f.dropHandler, true);
 					e.addEventListener("dragover", _f.probe, false);
 					console.log("Added event listener for element " + e.id + "/" + e.name);
 				}
 			});
 		},
 		
		"clickBP": function (request, sender, sendResponse)
		{
			// Only show the panel in the top-level frame.
			if(bp.DoCreatePanel()) 
			{
				var p = bp.GetPanel();
				if (p) p.toggle();
			}
		
			sendResponse({});
			return;
		},
		
		"main": function()
		{
			if(bp.DoCreatePanel()) 
			{
				console.log("BP_CS entered on page " + location.href);
				_f.CreatePanel();
				_f.setupDNDLinks();
				chrome.extension.onRequest.addListener(_f.clickBP);
			}
		} 		 
	};
	
	return _f;
}() );

bp.main();

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
 response[0] = {"username": "LoginID"};
 }
 else if (el.type === "password")
 {
 el.style = "background: red; color: blue";
 response[0] = {"username": "Password"};
 }
 }
 sendResponse(response);
 }

 */