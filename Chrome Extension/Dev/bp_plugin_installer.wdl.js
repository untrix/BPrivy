/**
 * @author Sumeet S Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

/* JSLint directives */

/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin PLUGIN_INSTALLER
 */
function BP_GET_PLUGIN_INSTALLER(g)
{
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_doc = g.g_win.document,
        g_win = g.g_win;

    var m;
    /** @import-module-begin Common */
    m = g.BP_COMMON;
    var BP_COMMON = IMPORT(m);
    /** @import-module-begin W$ */
    m = IMPORT(g.BP_W$);
    var BP_W$ = m,
        w$exec = IMPORT(m.w$exec),
        w$defineProto = IMPORT(m.w$defineProto),
        WidgetElement = IMPORT(m.WidgetElement),
        w$undefined = IMPORT(m.w$undefined);
    /** @import-module-begin Error */
    m = g.BP_ERROR;
    var BP_ERROR = IMPORT(m),
        BPError = IMPORT(m.BPError);
    /** @import-module-begin Error */
    var BP_PLAT = IMPORT(g.BP_PLAT);
    /** @import-module-begin Error */
    var BP_CONFIG = IMPORT(g.BP_CONFIG);
    /** @import-module-end **/    m = null;

    /** @globals-begin */
    var g_installText = "Keys@Untrix&trade; requires a plugin. Please follow these steps to install it:",
        g_upgradeText = "Please follow these steps to update the plugin:",
        g_unsupportedOSText = "We're terribly sorry, at this time we only support Windows operating system :( "+
            "We're working on supporting other operating systems and the software will automatically update.";
    /** @globals-end **/

    function Installer(){}
    Installer.wdt = function(ctx)
    {
        var text, bText,
            url = 'https://commondatastorage.googleapis.com/www.untrix.com/downloads/K3YRING.msi';
        switch (ctx.mode)
        {
            case 'installPlugin':
                text = g_installText;
                bText = 'Install';
                break;
            case 'upgradePlugin':
                text = g_upgradeText;
                bText = 'Upgrade';
                break;
            default:
                return w$undefined;
        }

        return {
        tag:'form',
        addClass:'modal-body form-horizontal',
            children:[
            {html:'<legend><small>' + text + '</small></legend>'},
            {tag:'fieldset', addClass:'control-group',
                children:[
                {tag:'label',
                 addClass:'control-label',
                 text:'1. Install Plugin'
                },
                {tag:'div', addClass:'controls',
                    children:[
                    {tag:'button',
                     text:bText,
                     addClass: 'btn btn-info span2',
                     attr:{type:'button'},
                     on:{'click':function(e){ g_win.open(url, '_self');}}
                    }
                    ]
                }
                ]
            },
            // {tag:'fieldset', addClass:'control-group',
                // children:[
                // {tag:'label',
                 // addClass:'control-label',
                 // text:'Install'
                // },
                // {tag:'div', addClass:'controls',
                    // children:[
                    // {tag:'label',
                     // text:'Launch the downloaded file and follow the instructions.'
                    // }
                    // ]
                // }
                // ]
            // },
            {tag:'fieldset', addClass:'control-group',
                children:[
                {tag:'label',
                 addClass:'control-label',
                 text:'2. Refresh App'
                },
                {tag:'div', addClass:'controls',
                    children:[
                    {tag:'button',
                     text:'Refresh',
                     addClass: 'btn btn-info span2',
                     attr:{type:'button'},
                     on:{'click':function(e){ BP_PLAT.reload(); modalDialog.destroy();}}
                    }
                    ]
                }
                ]
            }
            ]
        };
    }

    function Text(){}
    Text.wdt = function(ctx)
    {
        var text;
        switch (ctx.mode)
        {
            case 'unsupportedOS':
                text = g_unsupportedOSText;
                break;
            default:
                return w$undefined;
        }

        ctx.bNeedFooter = true;

        return {
        tag:'p',
        addClass:'modal-body',
        text: text
        };
    }

    function Footer(){}
    Footer.wdt = function(ctx)
    {
        if (!ctx.bNeedFooter) { return w$undefined; }
        else {
            return {
            tag:'div', addClass:'modal-footer',
                children:[
                {tag:'button',
                addClass:'btn btn-info',
                attr:{'data-dismiss':'modal', tabindex:1},
                text:'Ok',
                on:{ 'click': function(e){modalDialog.destroy();}}
                }
                ]
            };
        }
    }

    function modalDialog() {}
    modalDialog.wdt = function(ctx)
    {
        return {
        tag:'div',
        ref: 'dialog',
        cons: modalDialog,
        addClass:'modal',
        attr:{ id:'modalDialog', role:'dialog' },
        iface:{ mode:ctx.mode, closeWin:ctx.closeWin },
        on:{  },
        _final:{ appendTo:ctx.appendTo, show:false },
        _cull:['modalHeader'],
            children:[
            {tag:'div', addClass:'modal-header',
                children:[
                {tag:'img',
                 addClass:'pull-left',
                 attr:{src:'icons/icon48.png',width:'24px', height:'24px'}
                },
                {tag:'button', addClass:'close',
                 text:'x',
                 save:['dialog'],
                 on:{ 'click': function(e){modalDialog.destroy();} }
                },
                {tag:'h2', ref:'modalHeader',
                 css:{ 'text-align':'center' }
                }
                ]
            },
            Installer.wdt, Text.wdt, // All but one will return w$undefined
            Footer.wdt // Returns non-w$undefined only if ctx.bNeedFooter
            ]
        };
    }
    modalDialog.prototype = w$defineProto(modalDialog,
    {
        onInsert: {value: function()
        {
            this.$().modal({show:false, backdrop:'static'});
            this.$().on('shown', modalDialog.onShown);  // must use JQuery for Bootstrap events.
            this.$().on('hidden', modalDialog.onHidden);// must use JQuery fro Bootstrap events.

            switch (this.mode)
            {
                case 'unsupportedOS':
                    this.modalHeader.$().text('Unsupported Operating System');
                    break;
                case 'upgradePlugin':
                    this.modalHeader.$().text('Plugin Upgrade Required');
                    break;
                case 'installPlugin':
                default:
                    this.modalHeader.$().text('Plugin Install Required');
            }

            return this;
        }},

        showModal: {value: function()
        {
            this.$().modal('show');
            return this;
        }},

        hideModal: {value: function()
        {
            this.$().modal('hide');
            return this;
        }}
    });
    modalDialog.onShown = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog');
        if (!dialog) { return; }
        $('#modalDialog *').tooltip({container:'body'}); // used to leak DOM nodes in version 2.0.4.
    };
    modalDialog.onHidden = function(e)
    {
        var dialog = BP_W$.w$get('#modalDialog'),
            closeWin;
        if (dialog) {
            closeWin = dialog.closeWin; // do this before dialog destroy
            dialog.destroy();
            if (closeWin) {
                g_win.close();
            }
        }
    };
    modalDialog.create = function(ops)
    {
        var ctx, temp,
            dialog = BP_W$.w$get('#modalDialog');

        if (dialog) {
            dialog.hide().destroy();
            dialog = null;
        }

        // Create the Widget.
        ctx = {};
        BP_COMMON.copy2(ops, ctx);
        ctx.appendTo = 'body';

        dialog = BP_W$.w$exec(modalDialog.wdt, ctx);

        BP_COMMON.delProps(ctx); // Clear DOM refs inside the ctx to aid GC

        if (dialog)
        {
            dialog.onInsert().showModal();
        }

        return dialog;
    };
    modalDialog.destroy = function()
    {
        var w$dialog = BP_W$.w$get('#modalDialog');

        if (w$dialog) {
            w$dialog.hideModal();
        }
    };

    BP_ERROR.logdebug("constructed mod_wallet_form");
    return Object.freeze(
    {
        launch: modalDialog.create
    });

}