/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */

/*global chrome, BP_DLL, BP_MOD_BOOT */

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
        g_bTopLevel = (window.top === window.self);

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
            com.tabindex = -1; // ensures that the command won't get sequentially focussed.
            com.id = eidCommand;
            com.addEventListener('click', func);
            head.insertBefore(com, head.firstChild);
            console.log("Instrumented command");
        }
    }
      
    // function Control(el, fieldName)
    // {
        // // Field names copied from Arec and ERecord for consistency
        // Object.defineProperties(this, 
        // {
            // f: {value: fieldName, enumerable: true},
            // t: {value: el.tagName, enumerable: true},
            // id: {value: el.id, enumerable: true},
            // n: {value: el.name, enumerable: true},
            // y: {value: el.type, enumerable: true},
            // v: {value: el.value || el.text}
        // });
    // }
//
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

    function onDllLoad()
    {
        loadBP_CS(function()
        {
            if (BP_DLL.onDllLoad) 
            {
                BP_DLL.onDllLoad();
            }
        });
    }

    function onMessage(req, sender, sendResp)
    {
        var myUrl, com;
        
        myUrl = window.location.href;
        // // Ignore the request if it is not meant for us.
        // if ((req.frameUrl && (req.frameUrl !== myUrl)) || ((!req.frameUrl) && (!isTopLevel(window))) )
        // {
            // return;
        // }
        if (req.frameUrl)
        {
            if (req.frameUrl !== myUrl) {return;}
            // else we're good
        }
        else // req does not have frameUrl
        {
            if (!document.hasFocus()) 
            {
                if (!g_bTopLevel) {
                    return; // top-level window will handle this message
                }
                // else we're top-level window and our tab is active/visible, otherwise
                // chrome would not have sent us this message.
            }
            else // doc has focus
            {
                if (document.activeElement.tagName.toLowerCase() === 'iframe')
                {
                    return; // iframe will handle this message
                }
                // else we're the most nested browsing context that is focussed
            }
        }

        console.log("onMessage@bp_cs_boot: Handling received message in document " + document.location.href);
        sendResp({ack:true});
        loadBP_CS(function(){if (BP_DLL.onClickBP) {BP_DLL.onClickBP();}});
    }

    chrome.extension.onMessage.addListener(onMessage);
    setupCommand(document, onClickComm);
    if (BP_MOD_BOOT.scan(document)) {
        onDllLoad();
    }
    else {
        BP_MOD_BOOT.observe(document, function(node,observer)
        {
            if (BP_MOD_BOOT.scan(node)) {
                observer.disconnect();
                onDllLoad();
            }
        });
    }
}());
