/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global chrome */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * Boot Script.
 * Should be tiny and shouldn't require loading any other code at all. Certainly
 * not jQuery or any such 'standard' library - nothing at all.
 */

function com_untrix_uwallet_load(req, sender, callback)
{   "use strict";
    var myUrl, DLL_INIT;
    
    function isTopLevel(win) 
    {
        return (win.top === win.self);
    }
    
    myUrl = window.location.href;
    // Ignore the request if it is not meant for us.
    if ((req.frameUrl && (isTopLevel(window) || (req.frameUrl !== myUrl))) || (!req.frameUrl && !isTopLevel(window)) )
    {
        return;
    }
    
    chrome.extension.onMessage.removeListener(com_untrix_uwallet_load);
    callback({ack:true});
    
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
        var css = document.getElementById('com_untrix_uwallet_css'),
            head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
            
        if (!css) {
            css = document.createElement('link');
            css.rel = "stylesheet";
            css.type= "text/css";
            css.href= chrome.extension.getURL(path);
        }
        else {return;}

        if (callback) {css.onload = callback;}
        head.insertBefore(css, head.firstChild);
    }

    loadJS("tp/jquery.js");
    loadJS("bp_cs.cat.js");
    loadCSSAsync("bp.css", function(e)
    {
        if (DLL_INIT) {DLL_INIT(req);}
    });
}

chrome.extension.onMessage.addListener(com_untrix_uwallet_load);
    
    // function loadCSJQ ()
    // {
        // $.getScript(BP_MOD_CS_PLAT.getURL('/bp_load_cs.js'), function(data, textStatus, jqxhr)
        // {
            // if (BP_MOD_BOOTSTRAP && BP_MOD_BOOTSTRAP.load) {
                // console.log("JS Load successful !");
            // }
        // });
    // }
//     
