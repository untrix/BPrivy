/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global chrome, IMPORT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin GoogleChrome
 */
function BP_GET_PLAT(gg)
{
    "use strict";
    var window = null, document = null, console = null, $ = gg.$, jQuery = gg.jQuery, chrome = gg.g_chrome;

    /** @import-module-begin */
    var BP_ERROR = IMPORT(gg.BP_ERROR);
    /** @import-module-begin */
    var BP_COMMON = IMPORT(gg.BP_COMMON);
    /** @import-module-end **/

    var g = {contextMenuID: null, mW: null},
        MOD_WIN,
        JS_INJECT_DETAILS = {allFrames:true, runAt:'document_start', file:'bp_cs.cat.js'},
        JQ_INJECT_DETAILS = {allFrames:true, runAt:'document_start', file:"tp/jquery.js"},
        CSS_INJECT_DETAILS = {file:'bp.css'};

    function bpClick(tab, frameUrl)
    {
        var req = MOD_WIN.clickReq(frameUrl || tab.url); // MOD_WIN is a vestige at this time.
        req.click = true;
        if (frameUrl) {req.frameUrl = frameUrl;} // Direct message to the frame where the click happened.
        chrome.tabs.sendMessage(tab.id, req,
        function(resp)
        {
            /*if (!resp)
            { // Set badge text
                // TODO: Remove badge related code when we're sure that its not needed
                switch (BP_COMMON.getScheme(tab.url))
                {
                    case "file:":
                        chrome.browserAction.setBadgeText({text:"oops", tabId:tab.id});
                        chrome.browserAction.setTitle({title:"User Blocked", tabId:tab.id});
                        BP_ERROR.alert("You have blocked K3YRING from accessing files. "+
                        "Please 1) change the setting on 'Manage Extensions' page, then 2) reload the page");
                        break;
                    default:
                        chrome.browserAction.setBadgeText({text:"oops", tabId:tab.id});
                        chrome.browserAction.setTitle({title:"Empty or restricted page", tabId:tab.id});
                        break;
                }
            }
            else*/
           if (resp)
            { // Unset badge text
                // TODO: Remove badge related code when we're sure that its not needed
                //chrome.browserAction.setBadgeText({text:"", tabId:tab.id});
                //chrome.browserAction.setTitle({title:"", tabId:tab.id});
                MOD_WIN.clickResp(tab.url);// MOD_WIN is a vestige at this time.
            }
        });
    }

    function bpMenuClick(info, tab)
    {
        if (info.menuItemId === g.contextMenuID)
        {
            bpClick(tab, info.frameUrl || info.pageUrl);
        }
    }

    function init(doc, mod_win)
    {
        var menuProperties = {"type": "normal", "title": "K3YRING [beta]", "contexts": ["all"],
                              "onclick": bpMenuClick/*, "documentUrlPatterns": document.url*/};
        var menu_id = chrome.contextMenus.create(menuProperties);
        //BP_ERROR.loginfo("Menu Item ID " + menu_id + " Created");

        //chrome.browserAction.onClicked.addListener(bpClick);
        //chrome.pageAction.onClicked.addListener(bpClick);

        g.contextMenuID = menu_id;
        MOD_WIN = mod_win;
        //BP_ERROR.loginfo("Menu Item ID = " + g.contextMenuID);
    }

    function showBadge(details)
    {
        try {
            chrome.browserAction.setBadgeText({text:details.text || "", tabId:details.tabId});
            if (details.color) {
                chrome.browserAction.setBadgeBackgroundColor({color:details.color, tabId:details.tabId});
            }
        } catch (e) {}
        try {
            chrome.browserAction.setTitle({title:details.title || "", tabId:details.tabId});
        } catch (e) {}
    }

    function removeBadge(details)
    {
        details = details || {};
        var text = details.text;
        if (!text) {
            showBadge({tabId:details.tabId, title:"", color:[0,0,0,0]});
        }
        else {
            chrome.browserAction.getBadgeText({tabId:details.tabId}, function(txt)
            {
                if (txt === text) {
                    showBadge({tabId:details.tabId, title:"", color:[0,0,0,0]});
                }
            });
        }
    }

    function sendMessage(tabId, frameUrl, req, callback)
    {
        req.frameUrl = frameUrl;
        chrome.tabs.sendMessage(tabId, req, callback);
    }

    function reload()
    {
        gg.g_win.navigator.plugins.refresh(false);
        chrome.runtime.reload();
    }

    function closeAll(except)
    {
        var wins = chrome.extension.getViews();
        wins.forEach(function(win)
        {
            (win === except) || win.close();
        });
    }

    function uninstall()
    {
        chrome.management.uninstallSelf({showConfirmDialog:false});
    }

    function setButton(path)
    {
        chrome.browserAction.setIcon({'path':path});
    }

    function getTabUrl(tabId, func)
    {
        chrome.tabs.get(tabId, func);
    }

    var module =
    {
        registerMsgListener: function(foo) {chrome.runtime.onMessage.addListener(foo);},
        sendRequestToTab: function(tabID, obj) {chrome.tabs.sendMessage(tabID, obj);},
        init: init,
        bpClick: bpClick,
        showPageAction: function(tabId) {chrome.pageAction.show(tabId);},
        notifications: gg.webkitNotifications,
        showBadge: showBadge,
        removeBadge: removeBadge,
        sendMessage: sendMessage,
        reload: reload,
        closeAll: closeAll,
        uninstall: uninstall,
        setButton: setButton,
        getTabUrl: getTabUrl
    };

    Object.seal(module);
    BP_ERROR.logdebug("constructed mod_main_plat");
    return module;
}
