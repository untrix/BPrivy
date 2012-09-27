var BP_DLL = {};
var BP_MOD_BOOT = (function()
{   "use strict";

    // function hasPass(form)
    // {
        // return Array.prototype.some.apply(form.elements,[function(el)
        // {
            // return ((el.tagName.toLowerCase() === 'input') && (el.type === "password"));
        // }]);
    // }
    
    function scan(ctxEl)
    {
        // var bNumForms = 0;
//         
        // Array.prototype.forEach.apply(doc.forms, [function (form, i, forms)
        // {
            // if (hasPass(form))
            // {
                // ++bNumForms;
            // }
        // }]);
//         
        // return bNumForms;
        var el = ctxEl.querySelector('input[type=password]');        return Boolean(el);
    }
        
    function observe(doc, callback)
    {
        function onMutation(mutations, observer)
        {
            function handleMutation(mutation)
            {
                var i, n, node, nodes=mutation.addedNodes;
                for (i=0, n=nodes.length; i<n; ++i)
                {
                    node = nodes[i];
                    if ((node.nodeType===node.ELEMENT_NODE)&&(node.tagName!=='IFRAME')) {                        callback(node, observer);
                    }
                }
            }
            
            console.log("Mutation observed by loader:\n");
            var i, n;
            for (i=0, n=mutations.length; i<n; i++)
            {
                handleMutation(mutations[i]);
            }
        }

        var observer = new WebKitMutationObserver(onMutation);
        observer.observe(doc,
            {
                childList:true,
                subtree:true,
                // attributes:true,
                // attributeFilter: ['offsetWidth', 'offsetHeight'],
                // attributeOldValue: true
            });
    }
        
    return Object.freeze(
        {
            scan: scan,
            observe: observe
        });
}());
