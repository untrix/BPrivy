/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome  */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome
 */
var  BP_MOD_MAIN_PLAT = (function() 
{
    "use strict"; //TODO: Remove this from prod. build
    
    var g = {contextMenuID: null};

    function bpClick(tab)
    {
        chrome.tabs.sendRequest(tab.id, {click: true});
    }  
    
    function bpMenuClick(info, tab)
    {
        if (info.menuItemId === g.ContextMenuID)
        {
            console.info("BPMenuItem was clicked on page " + info.pageUrl);
            bpClick(tab);
        }
    }

    function main(doc) 
    {          
        var menuProperties = {"type": "normal", "title": "BPrivy", "contexts": ["all"], "onclick": bpMenuClick, "documentUrlPatterns": document.url};
        var menu_id = chrome.contextMenus.create(menuProperties);
        console.info("Menu Item ID " + menu_id + " Created");
    
        chrome.browserAction.onClicked.addListener(bpClick);
        doc.designMode = 'on';// enables saving the document
       
        g.ContextMenuID = menu_id;
        console.info("Menu Item ID = " + g.ContextMenuID);
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
    return module;
}());
