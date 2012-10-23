/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome, BP_MOD_ERROR, BP_MOD_COMMON  */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome
 */
function BP_GET_PLAT() 
{
    "use strict";
    var window = null, document = null;
    
    var g = {contextMenuID: null, mW: null},
        MOD_WIN, 
        JS_INJECT_DETAILS = {allFrames:true, runAt:'document_start', file:'bp_cs.cat.js'},
        JQ_INJECT_DETAILS = {allFrames:true, runAt:'document_start', file:"tp/jquery.js"},
        CSS_INJECT_DETAILS = {file:'bp.css'};

    function bpClick(tab, frameUrl)
    {
        var req = MOD_WIN.clickReq(frameUrl || tab.url);
        req.click = true;
        if (frameUrl) {req.frameUrl = frameUrl;} // Direct message to the frame where the click happened.
        chrome.tabs.sendMessage(tab.id, req,
        function(resp)
        {
            if (!resp) 
            { // Set badge text
                switch (BP_MOD_COMMON.getScheme(tab.url))
                {
                    case "file:":
                        chrome.browserAction.setBadgeText({text:"oops", tabId:tab.id});
                        chrome.browserAction.setTitle({title:"User Blocked", tabId:tab.id});
                        BP_MOD_ERROR.alert("You have blocked BPrivy from accessing files. "+
                        "Please 1) change the setting on 'Manage Extensions' page, then 2) reload the page");
                        break;
                    default:
                        chrome.browserAction.setBadgeText({text:"oops", tabId:tab.id});
                        chrome.browserAction.setTitle({title:"Empty or restricted page", tabId:tab.id});
                        break;
                }
                
                // var url = "bp_panel.html",
                    // args = "location=0,menubar=0,resizable=yes,status=0,titlebar=0,toolbar=0,width=350,height=96";
                // var createData = {
                    // url: "bp_panel.html",
                    // width: 350,
                    // height: 96,
                    // focused: true,
                    // type: "panel"
                // };
                // if (g.mW) {g.mW.close();}
                // g.mW = window.open(url, 'mini-wallet', args, true);
                // if (window.focus) {g.mW.focus();}
                // if (g.mW){chrome.windows.update(g.mW, {focused:true});}
                // else {g.mW = chrome.windows.create(createData, function (w){g.mW = w.id;});}
                //chrome.browserAction.setPopup({popup:url});
            }
            else
            { // Unset badge text
                chrome.browserAction.setBadgeText({text:"", tabId:tab.id});
                chrome.browserAction.setTitle({title:"", tabId:tab.id});
                MOD_WIN.clickResp(tab.url);
            }
        });
    }  
    
    function bpMenuClick(info, tab)
    {
        if (info.menuItemId === g.contextMenuID)
        {
            bpClick(tab, info.frameUrl);
            //console.info("BPMenuItem was clicked on page " + info.pageUrl);
            // chrome.tabs.insertCSS(tab.id, CSS_INJECT_DETAILS, function()
            // {
                // chrome.tabs.executeScript(tab.id, JS_INJECT_DETAILS, function()
                // {
                    // bpClick(tab, info.frameUrl);
                // });
            // });
        }
    }

    function initScaffolding(doc, mod_win) 
    {          
        var menuProperties = {"type": "normal", "title": "BPrivy", "contexts": ["all"], 
                              "onclick": bpMenuClick/*, "documentUrlPatterns": document.url*/};
        var menu_id = chrome.contextMenus.create(menuProperties);
        //console.info("Menu Item ID " + menu_id + " Created");
    
        chrome.browserAction.onClicked.addListener(bpClick);
        chrome.pageAction.onClicked.addListener(bpClick);
       
        g.contextMenuID = menu_id;
        MOD_WIN = mod_win;
        //console.info("Menu Item ID = " + g.contextMenuID);
    }

    var module =
    {
        registerMsgListener: function(foo)
        {
            chrome.extension.onRequest.addListener(foo);
        },
        
        sendRequestToTab: function(tabID, obj) {
            chrome.tabs.sendRequest(tabID, obj);
        },
        
        initScaffolding: initScaffolding
    };
    
    Object.seal(module);
    console.log("constructed mod_main_plat");
    return module;
}
