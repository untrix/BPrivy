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

(function()
{   "use strict";
    var eidCommand = "com-untrix-uwallet-click",
        eidCss = 'com_untrix_uwallet_css',
        cm_form= "form",
        dt_eRecord = "e",
        DICT_TRAITS,
        head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement,
        DLL_INIT, DLL_INIT_ASYNC;

    function com_untrix_uwallet_load(req, dll_init_func, sendResp)
    {
        var myUrl, com;
        
        function isTopLevel(win) 
        {
            return (win.top === win.self);
        }
        
        myUrl = window.location.href;
        // Ignore the request if it is not meant for us.
        if ((req.frameUrl && (req.frameUrl !== myUrl)) || ((!req.frameUrl) && (!isTopLevel(window))) )
        {
            return;
        }
        
        chrome.extension.onMessage.removeListener(cbackLoadCS);
        com = document.getElementById(eidCommand);
        if (com) {head.removeChild(com);}
        if (sendResp) {sendResp({ack:true});}
        
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
            dll_init_func(req);
        });
    }
    
    function setupCommand(doc, func)
    {
        var com = doc.getElementById(eidCommand);
        
        if (!com) {
            com = document.createElement('command');
            com.type="command";
            com.accessKey = 'q';
            com.id = eidCommand;
            com.addEventListener('click', func);
            head.insertBefore(com, head.firstChild);
            console.log("Instrumented command");
        }
    }
    
    /** Intelligently returns true if the element is a password field */
    function isPassword(el)
    {
       if (el.tagName.toLowerCase() !== 'input') {return false;}
       return (el.type === "password");
    }
    // function isButton(el)
    // {
        // var tagName = el.tagName.toLowerCase(),
            // type = (el.type? el.type.toLowerCase(): '');
        // return (((tagName === 'input') || (tagName === 'button')) && ((type==='submit') || (type==='button')));
    // }
    
    function hasPass(form)
    {
        return Array.prototype.some.apply(form.elements,[function(con,i)
        {
            if (isPassword(con)) {return true;}
        }]);
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
    function scan(doc)
    {
        /*
        function sendForm(form, ev)
        {
            var fU = [], fP = [],
                formData = {fUrl:form.action, loc:doc.location, fU:fU, fP:fP},
                ctrls = form.elements;
                
            console.log("sending form: "+ form);

            Array.prototype.forEach.apply(ctrls, [function (con, i, controls)
            {
                if (isUserid(con))
                {
                    fU.push(new Control(con,'u'));
                }
                else if (isPassword(con))
                {
                    fP.push(new Control(con, 'p'));
                }
            }]);
            
            if (fU.length && fP.length)
            {
                chrome.extension.sendRequest({cm:cm_form, form:formData}, function(resp)
                {
                    console.log("got response to formSubmit");
                });
            }
            
            if (ev && (ev.type==='submit') && form.dataset.untrix_submit) {
                form.dataset.untrix_submit(ev);
            }
        }
        
        function formSubmit(ev)
        {
            console.log("in formSubmit");
            sendForm(this, ev);
        }
        
        function btnClick(ev)
        {
            console.log("in btnClick");
            sendForm(this.form, ev);
        }
        
        function btnSubmit(ev)
        {
            console.log("in btnSubmit");
            sendForm(this.form, ev);
        }
        
        function passSubmit(ev)
        {
            console.log("in passSubmit");
            sendForm(this.form, ev);
        }

        function docSubmit(ev)
        {
            console.log("in docSubmit");
            sendForm(ev.target, ev);
        }
        
        function setupControls(form)
        {
            //console.log("Entered setupButtons");
            var ctrls = form.elements;//.querySelectorAll('input,[type="button"],[type="submit"]');
            Array.prototype.forEach.apply(ctrls, [function(con, i)
            {
                if (isButton(con)) {
                    con.addEventListener('submit', function(){console.log("Button Submitted");});
                    con.addEventListener('click', function(){console.log("Button Clicked");});
                    console.log("Instrumented Button");
                }
                else if (isPassword(con)) {
                    con.addEventListener('change', function(){console.log("Password Changed");});
                    console.log("Instrumented Password");
                }
                else if (isUserid(con)) {
                    con.addEventListener('change', function(){console.log("Userid Changed");});
                    console.log("Instrumented Userid");
                }
                             
            }]);
        }
        */

        var bNumForms = 0;
        
        Array.prototype.forEach.apply(doc.forms, [function (form, i, forms)
        {
            if (hasPass(form))
            {
                // if (form.onsubmit) {
                    // form.dataset.untrix_submit = form.onsubmit;
                    // form.setAttribute('onsubmit', "");
                // }    
                // form.addEventListener('submit', function(){window.alert("Form Submitted");});
                // form.addEventListener('change', function(){window.alert("Form Changed");});
                // setupControls(form);
                // chrome.extension.sendRequest({cm:"watchF", url:form.action || document.location.href});
                bNumForms++;
            }
        }]);
        
        return bNumForms;
        // doc.addEventListener('submit', docSubmit);
    }
    
    function loadCS_Async()
    {
        com_untrix_uwallet_load({frameUrl : window.location.href}, function(){if (DLL_INIT_ASYNC) {DLL_INIT_ASYNC();}});
    }

    function cbackLoadCS(req, sender, sendResp)
    {
        com_untrix_uwallet_load(req, function(req){if (DLL_INIT) {DLL_INIT(req);}}, sendResp);
    }

    chrome.extension.onMessage.addListener(cbackLoadCS);
    setupCommand(document, loadCS_Async);
    if (scan(document)) {
        loadCS_Async();
    }
}());
