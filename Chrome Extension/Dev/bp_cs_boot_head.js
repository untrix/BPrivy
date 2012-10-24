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
        g_fReg2 = /(log|sign)(in|on)|^(auth)$|register|registration|authentication|enroll|join|ssoform|regform|(create)(user|account)/i;
        
    function nameMatch(els, reg)
    {
        var dashes = /[\-_]/g;
            
        function elMatch (el) 
        {
            return ( reg.test(el.getAttribute('name')?el.getAttribute('name').replace(dashes,""):"") ||
                     reg.test(el.getAttribute('id')?el.getAttribute('id').replace(dashes,""):"") );
        }
        
        return Array.prototype.filter.apply(els, [elMatch]);
    }

    function scan(doc)
    {
        var els = [],
            el = doc.querySelector('input[type=password]');
        if (!el) {
            els = doc.querySelectorAll(g_uSel);
            els = nameMatch(els, g_uReg2);
        }
        if (!(el || els.length)) {
            els = doc.forms;
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
                    nodes=mutation.addedNodes || [];
                for (i=nodes.length-1; i>=0; --i)
                {
                    node = nodes[i];
                    if ((node.nodeType===node.ELEMENT_NODE)&&(node.localName!=='iframe')&&((!node.getAttribute('id')) || (node.getAttribute('id').indexOf("com-untrix")!==0)))
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
                        if ((node.nodeType===node.ELEMENT_NODE)&&(node.localName!=='iframe')&&((!node.getAttribute('id')) || (node.getAttribute('id').indexOf("com-untrix")!==0)))
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

    return Object.freeze(
        {
            scan: scan,
            observe: observe
        });
}());
