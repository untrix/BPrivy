/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */

/*global chrome, BP_DLL, BP_MOD_BOOT, WebKitMutationObserver, console */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true,
  regexp:true, undef:false, vars:true, white:true, continue: true, nomen:true */

var BP_DLL = {};
var BP_BOOT = (function()
{   "use strict";
    var g_uSel = 'input[type="text"],input:not([type]),input[type="email"],input[type="tel"],input[type="number"]',
        g_uReg2= /(log|sign)(in|on)|signup|(user|account)(id|name|number|email)|^(id|user|uid|uname)$|identity|authentication/i,
        g_fReg2 = /(log|sign)(in|on)|^(auth)$|register|registration|authentication|enroll|join|ssoform|regform|(create)(user|account)/i,
        g_bTopLevel = (window.top === window.self),
        g_browsingContextContainers = ['iframe', 'object', 'embed'],
        g_mediaElements = ['img', 'audio', 'video'],
        g_autoFillable = false;

    function filterUntrix(els)
    {
        if (els) {
            return Array.prototype.filter.apply(els, [function(el)
            {
                return el.webkitMatchesSelector(':not([data-untrix])');
            }]);
        }
    }

    function nameMatch(els, reg)
    {
        var dashes = /[\-_]/g;
            
        function elMatch (el) 
        {
            return ( reg.test(el.getAttribute('name')?el.getAttribute('name').replace(dashes,""):"") ||
                     reg.test(el.getAttribute('id')?el.getAttribute('id').replace(dashes,""):"") );
        }
        
        if (els && reg) {
            return Array.prototype.filter.apply(els, [elMatch]);
        }
    }

    function scan(doc)
    {
        var els = [],
            el = doc.querySelector('input[type=password]:not([data-untrix])');
        if (!el) {
            els = doc.querySelectorAll(g_uSel);
            els = filterUntrix(els);
            els = nameMatch(els, g_uReg2);
        }
        if (!(el || els.length)) {
            els = doc.forms;
            els = filterUntrix(els);
            els = nameMatch(els, g_fReg2);
        }        return Boolean(el || els.length);
    }

    function observe(doc, callback, options)
    {
        var observer = new WebKitMutationObserver(onMutation);
        options = options || {};
        
        observer.observe(doc,
            {
                childList:true,
                subtree:true
                // attributes:true,
                // attributeFilter: ['offsetWidth', 'offsetHeight', 'style', 'class', 'hidden', 'display'],
                // attributeOldValue: true
            });

        function onMutation(mutations, observer)
        {
            //console.log("onMutation entered:\n");
            var i, n, bCall, mutes=[];
            
            for (i=0, n=mutations.length; i<n; i++)
            {
                if (isRelevant(mutations[i]))
                {
                    bCall = true;
                    if (options.filterMutes) {
                        mutes.push(mutations[i]);
                    }
                    else {
                        break;
                    }
                }
            }

            if (bCall) {
                console.log("Mutation observed:\n");
                callback(options.filterMutes?mutes:mutations, observer);
            }

            function isRelevant(mutation)
            {
                var bRlvnt = false, i, node,
                    added=[], removed=[],
                    nodes=mutation.addedNodes || [],
                    elName;
                for (i=nodes.length-1; i>=0; --i)
                {
                    node = nodes[i];
                    elName = node.localName;
                    if ((node.nodeType===node.ELEMENT_NODE)&&(g_browsingContextContainers.indexOf(elName)===-1)&&
                        ((!node.dataset) || (!node.dataset.untrix)))
                    {
                        if ((!options) || (!options.tagName) || (options.tagName === node.localName)) {
                            bRlvnt = true;
                            break;
                        }
                    }
                }
                
                if ((!bRlvnt) && options && options.bRemoved)
                {
                    nodes=mutation.removedNodes ||[];
                    for (i=nodes.length-1; i>=0; --i)
                    {
                        node = nodes[i];
                        if ((node.nodeType===node.ELEMENT_NODE)&&(g_browsingContextContainers.indexOf(elName)===-1)&&
                            ((!node.dataset) || (!node.dataset.untrix)))
                        {
                            if ((!options.tagName) || (options.tagName === node.localName)) {
                                bRlvnt = true;
                                break;
                            }
                        }
                    }
                }

                return bRlvnt;
            }
        }
    }
    
    function amDestFrame(req)
    {
        var activeElement;
        
        if (req.frameUrl)
        {
            if (req.frameUrl !== document.location.href) {return false;}
            // else we're good
        }
        else // req does not have frameUrl
        {
            if (!document.hasFocus())
            {
                if (!g_bTopLevel) {
                    return false; // top-level window will handle this message
                }
                // else we're top-level window and our tab is highlighted, otherwise
                // we would not have sent us this message.
            }
            else // doc has focus
            {
                activeElement = document.activeElement;
                if ((activeElement.localName === 'iframe') ||
                    (activeElement.localName === 'object' && activeElement.contentWindow))
                {
                    return false; // iframe will handle this message
                }
                // else we're the most nested browsing context that is focussed
            }
           //return g_autoFillable;
        }

        return true;
    }

    function onFocus(ev)
    {
        var elName = document.activeElement.localName.toLowerCase();

        if (elName !== 'iframe')
        {
            chrome.extension.sendRequest({cm:'cm_onFocus', isTopLevel:g_bTopLevel, elName:elName, frameUrl:document.location.href});
        }
    }

    function onUnload(ev)
    {
        chrome.extension.sendRequest({cm:'cm_onUnload', isTopLevel:g_bTopLevel, frameUrl:document.location.href});
    }

    return Object.freeze(
        {
            scan: scan,
            observe: observe,
            amDestFrame: amDestFrame,
            autoFillable: function(b) {g_autoFillable=b;},
            isAutoFillable: function() {return g_autoFillable;},
            onFocus: onFocus,
            onUnload: onUnload
        });
}());
