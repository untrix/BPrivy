/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON, BP_MOD_ERROR, BP_MOD_MEMSTORE */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin Panel
 */
var BP_MOD_PANEL = (function ()
{
    "use strict";
    var m;
    /** @import-module-begin Error */
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    // Names used in the code. A mapping is being defined here because
    // these names are externally visible and therefore may need to be
    // changed in order to prevent name clashes with other libraries.
    // These are all merely nouns/strings and do not share a common
    // semantic. They are grouped according to semantics.
    // Element ID values. These could clash with other HTML elements
    // Therefore they need to be crafted to be globally unique within the DOM.
    var eid_panel = "com-bprivy-panel"; // Used by panel elements
    var eid_panelTitle ="com-bprivy-panelTitle"; // Used by panel elements
    var eid_panelTitleText = "com-bprivy-panelTitleText";
    var eid_panelList ="com-bprivy-panelList"; // Used by panel elements
    var eid_ioItem = "com-bprivy-ioItem-";
    var eid_opElement = 'com-bprivy-op-'; // ID prefix of an output line of panel
    var eid_userOElement = "com-bprivy-useridO-"; // ID Prefix used by panel elements
    var eid_passOElement = "com-bprivy-passO-"; // ID Prefix Used by panel elements
    var eid_userIElement = "com-bprivy-useridI-"; // ID Prefix used by panel elements
    var eid_passIElement = "com-bprivy-passI-"; // ID Prefix Used by panel elements
    var eid_inForm = "com-bprivy-iform-";
    var eid_tButton = "com-bprivy-tB-"; // ID prefix for IO toggle button
    var eid_xButton = "com-bprivy-xB"; // ID of the panel close button
    var eid_fButton = "com-bprivy-fB"; // ID of the fill fields button

    // Other Globals
    var g_doc = g_win.document;
    var g_loc = g_doc.location;
    var g_ioItemID = 0;
    var u_cir_s = '\u24E2';
    var u_cir_S = '\u24C8';
    var u_cir_e = '\u24D4';
    var u_cir_E = '\u24BA';
    var u_cir_F = '\u24BB';
    var u_cir_X = '\u24CD';
    /** @globals-end **/

    /********************** Declarative Code Begin ***************************/
   
    // Returns a newly created object inherited from the supplied object or constructor
    // argument. If the argument is a constructor, then the o.prototype is set to a new
    // object created using that constructor. Otherwise o.prototype=argument
    function newInherited(arg)
    {
        function Inheritor(){}
        if (typeof arg === 'object') {
            Inheritor.prototype = arg;
        }
        else if (typeof arg === 'function') {
            Inheritor.prototype = new arg();
        }
        return new Inheritor();
    }
    
    var BUTTON_TRAITS = {};
    Object.defineProperties(BUTTON_TRAITS,
    {
        html:
        {
            value: '<button type="button"></button>'
        }
    }); Object.freeze(BUTTON_TRAITS);
    
    var xBUTTON_TRAITS = newInherited(BUTTON_TRAITS);
    Object.defineProperties(BUTTON_TRAITS,
    {
        eid: {value: "com-bprivy-xB"}
    }); Object.freeze(xBUTTON_TRAITS);
    
    var PANEL_TRAITS = {};
    Object.defineProperties(PANEL_TRAITS,
    {
        hasXButton: {value: false},
        html:
        {
            value:  '<div style="display:none">' + 
                        '<div id="com-bprivy-panelTitle">' +
                            '<div id="com-bprivy-TitleText"></div>'+
                        '</div>' +
                        '<div id="com-bprivy-panelList"></div>' +
                    '</div>'
        },
        eid: {value: "com-bprivy-panel"},
        eid_title: {value: "com-bprivy-panelTitle"},
        eid_titleText: {value: "com-bprivy-TitleText"}
    }); Object.freeze(PANEL_TRAITS);
    
    var CS_PANEL_TRAITS = newInherited(PANEL_TRAITS);
    Object.defineProperties(CS_PANEL_TRAITS,
    {
        hasXButton: {value: true}
    }); Object.freeze(CS_PANEL_TRAITS);
    
   
    /*************************** DOM Markup (JML) ********************************/
    var cs_panelTitleText_jml = {
        tag:"div", attr:{ id: eid_panelTitleText }, text:"BPrivy"
    };

    function xButton_jml($el)
    {
        function click (e) 
        {
            // Need to do this using jquery so that it will remove $.data of all descendants
            $el.remove();
            e.stopPropagation(); // We don't want the enclosing web-page to interefere
            e.preventDefault(); // Causes event to get cancelled if cancellable
            return false; // Causes the event to be cancelled (except mouseover event).
        }
        // $el = element to be 'x'd.
        var jml =
        {html:'<button type="button" accesskey="q">', attr:{ id:eid_xButton, accesskey:'q'},
         text: u_cir_X, on:{ click: click }
        };
        
        return jml;
    }
    
    function cs_panelList_jml ()
    {
        function handleDragStart (e)
        {
            //console.info("DragStartHandler entered");
            e.dataTransfer.effectAllowed = "copy";
            var data = $(e.target).data(pn_d_value);
            if ($(e.target).data(pn_d_dataType) === ft_pass) {
                data = decrypt(data);
            }
            
            e.dataTransfer.items.add('', MT_BP_PREFIX + $(e.target).data(pn_d_dataType)); // Keep this on top for quick matching later
            e.dataTransfer.items.add($(e.target).data(pn_d_dataType), MT_BP_DT); // Keep this second for quick matching later
            e.dataTransfer.items.add(data, MT_TEXT_PLAIN); // Keep this last
            e.dataTransfer.setDragImage(createImageElement("icon16.png"), 0, 0);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        function handleDrag(e)
        {
            //console.info("handleDrag invoked. effectAllowed/dropEffect =" + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            //if (e.dataTransfer.effectAllowed !== 'copy') {e.preventDefault();} // Someone has intercepted our drag operation.
            e.stopImmediatePropagation();
        }
        
        function handleDragEnd(e)
        {
            //console.info("DragEnd received ! effectAllowed/dropEffect = "+ e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
            e.stopImmediatePropagation(); // We don't want the enclosing web-page to interefere
            //return true;
        }

        var jml =
        {tag:'div', id:eid_panelList,
         on:{ dragstart: handleDragStart, drag:handleDrag, dragend:handleDragEnd},
              children:[]
        };
    }
    
    function cs_panel_jml ()
    {
        var jml =
        {tag:"div", attr:{ id:eid_panel, style:"display:none" },
            children:[
            {tag:"div", attr:{ id: eid_panelTitle },
                children:[
                cs_panelTitleText_jml,
                xButton_jml(eid_panel)]
            },
            cs_panelList_jml()]
        };
        
        return jml;
    }
    
    /********************** Declarative Code End ***************************/
    /********************** Procedural Code Begin ***************************/
    
    function DomElement()
    {
        Object.defineProperties(this,
        {
            el: {writable:true}, // pointer to DOM element object
            $el: {writable:true}, // pointer to jquery wrapped DOM element object
            id: {writable:true}, // element id
            name: {writable:true} // element name attribute
        });
    }
    
    /** @begin-class-def Button */
    function newButton ()
    {
        var me = newInherited(DomElement);
        
        Object.defineProperties(me,
        {
            traits: {value: BUTTON_TRAITS, writable:true, enumerable:true}
        });
        
        return me;
    }
    /** @end-class-def Button **/
    
    // = {doc: g_doc, id_panel: gid_panel, dnd: g_dnd, db: g_db, autoFill: autoFill, autoFillable: autoFillable}
    /** @begin-class-def Panel */
    function newPanel (args) // pseudo constructor
    {
        // args.keys() === [dt_traits, ui_traits]
        // ui_traits.keys() === [html]

        var me = newInherited(DomElement);
        Object.defineProperties(me,
        {
            traits: {value: PANEL_TRAITS},
            ioItems: { // Array of ioItems
                value: []
            },
            destroy: { // Destructor
                value: function() {} 
            },
            show: { // shows/hides the panel
                value: function(show, position) {}
            }
        });
        
        me.$el = $(me.traits.html)
        
        return me;
    }

    /** @end-class-def Panel **/
    
}());
