/**

 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/*global chrome, BP_DLL, BP_BOOT */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * Boot Script.
 * Should be tiny and shouldn't require loading any other code at all. Certainly
 * not jQuery or any such 'standard' library - nothing at all.
 * Requires bp_cs_boot_head.js though for holding common debug/release code.
 */

(function()
{   "use strict";
    var eidCommand = "com-untrix-uwallet-click",
        eidCss = 'com_untrix_uwallet_css',
        cm_form= "form",
        dt_eRecord = "e",
        DICT_TRAITS,
        head = (document.head || document.getElementsByTagName( "head" )[0] || document.documentElement),
        g_bTopLevel = (window.top === window.self),
        g_myUrl = window.location.href;

    function loadBP_CS(dll_init_func)
    {
        var com;

        com = document.getElementById(eidCommand);
        if (com) {head.removeChild(com);}
        chrome.extension.onMessage.removeListener(onMessage);

        function loadJS (path)
        {
            var xhr = new XMLHttpRequest();

            xhr.open("GET", chrome.extension.getURL(path), false);
            xhr.send();
            var resp = xhr.response;
            // Only place where eval is used. Is okay becuase we're loading files from our
            // extension only. These files are picked from the extension's folder on the
            // Filesystem.
            eval(resp);
        }

        function loadCSSAsync (path, callback)
        {
            var css = document.getElementById(eidCss);

            if (!css) {
                css = document.createElement('link');
                css.rel = "stylesheet";
                css.type= "text/css";
                css.id = eidCss;
                css.href= chrome.extension.getURL(path);
            }
            else {return;}

            if (callback) {css.onload = callback;}
            head.insertBefore(css, head.firstChild);
        }

        loadJS("tp/jquery.js");
        loadJS("tp/jquery-ui.js");
        loadJS("bp_cs.cat.js");
        loadCSSAsync("bp.css", function(e)
        {
            dll_init_func();
        });
    }

    function setupCommand(doc, func)
    {
        var com = doc.getElementById(eidCommand);

        if (!com) {
            com = document.createElement('command');
            com.type="command";
            com.accessKey = 'q';
            com.tabindex = -1; // ensures that the command won't get sequentially focused.
            com.id = eidCommand;
            com.addEventListener('click', func);
            com.dataset.untrix = true;
            head.insertBefore(com, head.firstChild);
            //console.log("Instrumented command");
        }
    }
    function onClickComm()
    {
        loadBP_CS(function()
        {
            if (BP_DLL.onClickComm)
            {
                BP_DLL.onClickComm();
            }
        });
    }

    function loadDll()
    {
        loadBP_CS(function()
        {
            if (BP_DLL.onDllLoad)
            {
                BP_DLL.onDllLoad();
            }
        });
    }

    function onClickBP(req, sender, sendResp)
    {
        console.log("onMessage@bp_cs_boot: Handling received message in document " + document.location.href);
        sendResp({result:true, frameUrl:g_myUrl});
        loadBP_CS(function(){if (BP_DLL.onClickBP) {BP_DLL.onClickBP();}});
    }

    function onAutoFillable(req, sender, callback)
    {
        loadBP_CS(function()
        {
            if (BP_DLL.onAutoFillable) {
                BP_DLL.onAutoFillable(req, sender, callback);
            }
            else
            {
               callback(
                {
                    autoFillable:false,
                    frameUrl: g_myUrl
                });
            }
        });
    }

    function onMessage(req, sender, sendResp)
    {
        if (!BP_BOOT.amDestFrame(req)) {return;}

        switch(req.cm)
        {
            case 'cm_clickBP':
                onClickBP(req, sender, sendResp);
                break;
            case 'cm_autoFillable':
                onAutoFillable(req, sender, sendResp);
                return true; // allows us to exit without invoking callback.
                break;
            default: // do nothing.
                break;
        }
    }

    chrome.extension.onMessage.addListener(onMessage);
    setupCommand(document, onClickComm);
    chrome.extension.sendRequest({cm:'cm_bootLoaded', loc:document.location}, function(resp)
    {
        // if (resp.result && resp.cm && (resp.cm === 'cm_loadDll')) {
            // loadDll();
        // }
    });
    //if (window.top === window.self) {
        window.addEventListener('unload', BP_BOOT.onUnload);
    //}
    if (document.hasFocus())  {BP_BOOT.onFocus();}
    window.addEventListener('focus', BP_BOOT.onFocus);
    if (BP_BOOT.scan(document)) {
        loadDll();
    }
    else {
        BP_BOOT.observe(document, function(_/*mutations*/, observer)
        {
            if ((!BP_DLL.bLoaded) && BP_BOOT.scan(document)) {
                observer.disconnect();
                loadDll();
                BP_DLL.bLoaded = true;
            }
        },{doBatch:true});
    }
}());
