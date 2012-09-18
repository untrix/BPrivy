var BP_DLL = {};
var BP_MOD_BOOT = (function()
{   "use strict";
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

                ++bNumForms;
            }
        }]);
        
        return bNumForms;
        // doc.addEventListener('submit', docSubmit);
    }
    
    return Object.freeze(
        {
            scan: scan
        });
}());
