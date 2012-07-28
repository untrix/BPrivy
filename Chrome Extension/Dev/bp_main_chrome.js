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
var  BP_MOD_PLAT = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var g = {contextMenuID: null};

    function bpClick(tab)
    {
        chrome.tabs.sendMessage(tab.id, {click: true}, 
        function(resp)
        {
            if (!resp) 
            { // Set badge text
                chrome.browserAction.setBadgeText({text:"oops", tabId:tab.id});
                switch (BP_MOD_COMMON.getScheme(tab.url))
                {
                    case "file:":
                        chrome.browserAction.setTitle({title:"User Blocked", tabId:tab.id});
                        BP_MOD_ERROR.alert("You have blocked BPrivy from accessing files. Please change the setting on 'Manage Extensions' page");
                        break;
                    default:
                        chrome.browserAction.setTitle({title:"No passwords for this page", tabId:tab.id});
                        break;
                }                    
            }
            else { // Unset badge text
                chrome.browserAction.setBadgeText({text:"", tabId:tab.id});
                chrome.browserAction.setTitle({title:"", tabId:tab.id});
            }
        });
    }  
    
    function bpMenuClick(info, tab)
    {
        if (info.menuItemId === g.ContextMenuID)
        {
            //console.info("BPMenuItem was clicked on page " + info.pageUrl);
            bpClick(tab);
        }
    }

    function main(doc) 
    {          
        var menuProperties = {"type": "normal", "title": "BPrivy", "contexts": ["all"], "onclick": bpMenuClick, "documentUrlPatterns": document.url};
        var menu_id = chrome.contextMenus.create(menuProperties);
        //console.info("Menu Item ID " + menu_id + " Created");
    
        chrome.browserAction.onClicked.addListener(bpClick);
        doc.designMode = 'on';// enables saving the document
       
        g.ContextMenuID = menu_id;
        //console.info("Menu Item ID = " + g.ContextMenuID);
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
        
        init: main
    };
    
    Object.seal(module);
    console.log("loaded main_plat");
    return module;
}());
