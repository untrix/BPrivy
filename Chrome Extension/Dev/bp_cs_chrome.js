/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */
/*global chrome, $, BP_BOOT, CustomEvent */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

//////////////// MAKE SURE THERE IS NO DEPENDENCY ON ANY OTHER MODULE ////////////////////
/**
 * @ModuleBegin GoogleChrome Platform
 */
function BP_GET_CS_PLAT(g)
{   // NOTE: Requires g.g_win to be the target DOM window. Instantiate a fresh module
    // for the DOM window where you want to use this.
    "use strict";
    var window = g.g_win, document = g.g_win.document, console = g.g_console, chrome = g.g_chrome,
        g_win = g.g_win,
        g_doc = g_win.document,
        g_console = g.g_console,
        NO_OP = function() {};
    var g_bTopLevel = (g_win.top === g_win.self),
        g_frameUrl = g_bTopLevel ? null : g_win.location.href,
        log = g_console.log.bind(g_console),
        debug = RELEASE ?  NO_OP : (g_console.debug.bind(g_console) || log),
        info = RELEASE ? NO_OP : (g_console.info.bind(g_console) || debug),
        warn = g_console.error.bind(g_console) || info;

    var module =
    {
        postMsgToMothership: function (o)
        {
            function rcvAck (rsp)
            {
                if (!rsp) {if (chrome.extension.lastError) {
                       warn(chrome.extension.lastError.message);
                    }
                }
                else if (rsp.result===false) {
                    warn(rsp.err);
                }
            }
            chrome.extension.sendRequest(o, rcvAck);
        },

        rpcToMothership: function (req, respCallback)
        {
            chrome.extension.sendRequest(req, function (resp)
            {
                respCallback(resp); // respCallback exists in function closure
            });
        },

        registerMsgListener: function(foo)
        {
            chrome.extension.onMessage.addListener(function(req, sender, callback)
            {
                if (BP_BOOT.amDestFrame(req))
                {
                    //console.log("MsgListener@bp_cs_chrome: Handling received message in document " + g_doc.location.href);
                    // Foo should return true if it wants to return without invoking callback,
                    // but wants to delegate that to some other async function.
                    return foo(req, sender, callback);
                }
            });
        },

        getURL: function(path)
        {
            var url = chrome.extension.getURL(path);
            return url;
            //return "chrome-extension://" + BP_MOD_DEV.chrome_extension_id + "/" + path;
        },

        /*getAbsPath: function(path)
        {
            // get url and then remove the leading file:///
            return chrome.extension.getURL(path).slice(8);
        },*/

        getBackgroundPage: function ()
        {
            return chrome.extension.getBackgroundPage();
        },

        addEventListener: function(el, ev, fn)
        {
            el.addEventListener(ev, fn);
        },

        addEventListeners: function(selector, ev, fn)
        {
            var j = $(selector), i = j.length;
            for (--i; i>=0; --i) {
                var el = j[i];
                if (el) {el.addEventListener(ev, fn);}
            }
        },

        addHandlers: function (el, on)
        {
            if (!el || !on || (typeof on !== 'object')) {return;}

            var ks = Object.keys(on), k, i, n;
            for (i=0, n=ks.length, k=ks[0]; i<n ; k=ks[++i])
            {
                el.addEventListener(k, on[k]);
            }
        },

        trigger: function (el, eventType, eventInterface, detail)
        {
            var ev = g_doc.createEvent(eventInterface || 'HTMLEvents');
            ev.initEvent(eventType, true, true);
            el.dispatchEvent(ev);
        },

        customEvent: function (el, eventType, detail)
        {
            var ev = new CustomEvent(eventType, {cancelable:true, bubbles:true, detail:detail});
            el.dispatchEvent(ev);
        }
    };

    debug("constructed mod_cs_plat");
    return module;
}
