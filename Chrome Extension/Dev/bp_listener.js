/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Rights Reserved, Sumeet S Singh
 */
/*global IMPORT, CustomEvent */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin LISTENER
 */
function BP_GET_LISTENER(g)
{   'use strict';
    var window = null, document = null, console = null;

    /** @import-module-begin */
    var BP_PLAT = IMPORT(g.BP_PLAT),
        BP_ERROR= IMPORT(g.BP_ERROR),
        BP_COMMON = IMPORT(g.BP_COMMON);
    /** @import-module-end **/

    /** @globals begin */
    // element that will be used for dispatching and receiving events
    //var dispatchEl = g.g_win;
    
    function CallbackInfo (func, tabId, frameUrl)
    {
        Object.defineProperties(this, 
        {
            func: {value: func},
            tabId: {value:tabId},
            frameUrl: {value:frameUrl}
        });
    }
    function Scope (dict, dt, l)
    {
        Object.defineProperties(this,
        {
            dict: {value:dict}, // dt or 'temp_'+dt
            l:    {value:l},
            dt:   {value:dt}
        });
    }

    function dispatchRemote(eventType, detail, tabId, frameUrl)
    {
        // TODO: Implement when needed.
        //BP_PLAT.rpc(tabId, frameUrl, {cm:'cm_notify', eventType:eventType, detail:detail});
    }

    function handlerProxy(ev)
    {
        if ((ev.type === 'bp_task') && ev.detail && ev.detail.func) {
            ev.detail.func(ev.detail.detail);
            ev.stopImmediatePropagation();
            ev.preventDefault();
        }
    }

    /**
     * Listener constructor. 
     * @param {Scope} scope. Scope to watch.
     */
    function Listeners(scope)
    {
        Object.defineProperties(this,
        {
            scope: {value: scope},
            cbacks: {value:{}},
        });
    }
    Listeners.prototype.add = Listeners.prototype.listen = function(eventType, cbackInfo)
    {
        var func = cbackInfo.func,
            tabId = cbackInfo.tabId,
            frameUrl = cbackInfo.frameUrl;

        if (!this.cbacks[eventType]) { this.cbacks[eventType] = {}; }
        if (func) {
            if (!this.cbacks[eventType].funcs) {this.cbacks[eventType].funcs = [];}
            if (this.cbacks[eventType].funcs.indexOf(func) === -1)
            {
                this.cbacks[eventType].funcs.push(func);
            }
            // else we already have func            
        }
        else if (tabId) {
            if (!this.cbacks[eventType].tabs) {this.cbacks[eventType].tabs = {};}
            if (!this.cbacks[eventType].tabs[tabId]) {this.cbacks[eventType].tabs[tabId] = {};}
            if (!frameUrl) {frameUrl = 'undefined';}
            this.cbacks[eventType].tabs[tabId][frameUrl] = true;
        } 

        return;
    };
    Listeners.prototype.has = function(eventType, cbackInfo)
    {
        return Listeners.checkRemove.apply(this, [eventType, cbackInfo]);
    };
    Listeners.prototype.remove = function(eventType, cbackInfo)
    {
        return Listeners.checkRemove.apply(this, [eventType, cbackInfo, true]);
    };
    Listeners.prototype.dispatch = function(eventType, _detail)
    {
        var tabs;
        var ev = {type:eventType, scope:this.scope, detail:_detail};
        
        if (!this.cbacks[eventType]) { return; }
        if (this.cbacks[eventType].funcs)
        {
            this.cbacks[eventType].funcs.forEach(function(func)
            {
                // var init = {cancelable:true, bubbles:false, detail:{func:func, type:eventType, detail:_detail}};
                // var ev = new CustomEvent('bp_task', init);
                try {
                    //dispatchEl.dispatchEvent(ev);
                    func(ev);
                }
                catch (err) {
                    BP_ERROR.logwarn(err);
                }
            });
        }

        if (this.cbacks[eventType].tabs) 
        {
            tabs = this.cbacks[eventType].tabs;
            Object.keys(this.cbacks[eventType].tabs).forEach(function(tabId)
            {
                var frames = tabs[tabId];
                Object.keys(frames).forEach(function(frameUrl)
                {
                    if (frames[frameUrl]) {
                        try {
                            dispatchRemote(eventType, _detail, tabId, frameUrl);
                        }
                        catch (err) {
                            BP_ERROR.logwarn(err);
                        }
                    }
                });
            });
        }
    };
    Listeners.checkRemove = function(eventType, cbackInfo, remove)
    {
        var func = cbackInfo.func,
            tabId = cbackInfo.tabId,
            frameUrl = cbackInfo.frameUrl, 
            i;
        if (!this.cbacks[eventType]) { return false; }
        if (func) {
            if (!this.cbacks[eventType].funcs) {return false;}
            i = this.cbacks[eventType].funcs.indexOf(func);
            if ( i === -1) {return false;}
            if (remove) {
                this.cbacks[eventType].funcs.splice(i,1);
            }

            return true;
        }
        else if (tabId) {
            if (!this.cbacks[eventType].tabs) {return false;}
            if (!this.cbacks[eventType].tabs[tabId]) {return false;}
            if (remove) {
                delete this.cbacks[eventType].tabs[tabId][frameUrl];
            }
            return true;
        }
    };
    
    function newListeners(scope)
    { 
        return new Listeners(scope);
    }

    //dispatchEl.addEventListener('bp_task', handlerProxy);

    return Object.freeze(
        {
            newListeners: newListeners,
            CallbackInfo: CallbackInfo,
            Scope: Scope
        });
}
