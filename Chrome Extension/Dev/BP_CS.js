/**
 * @preserve 
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 */
/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, BP_MOD_COMMON, IMPORT,
  BP_MOD_ERROR, BP_MOD_WDL, BP_MOD_W$, BP_MOD_TRAITS, BP_MOD_BOOT */
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */
/* members el.type,
 * el.type, win.top, win.self,
 * frame.hidden, frame.style, style.visibility, style.display, ev.preventDefault,
 * ev.stopPropagation, document.getElementById
 */

(function(g_win)
{
    'use strict';
    var m;
    /** @import-module-begin Common */
    m = BP_MOD_COMMON;
    var MOD_COMMON = IMPORT(m),
        iterArray2 = IMPORT(m.iterArray2),
        encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener), // Compatibility function
        addEventListeners = IMPORT(m.addEventListeners),
        trigger = IMPORT(m.trigger);
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_userid2= IMPORT(m.fn_userid2),
        fn_pass2 = IMPORT(m.fn_pass2),
        fn_pass = IMPORT(m.fn_pass);        // Represents data-type password
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs),
        deleteRecord = IMPORT(m.deleteRecord),
        saveRecord = IMPORT(m.saveRecord),
        tempRec = IMPORT(m.tempRec),
        newERecord = IMPORT(m.newERecord),
        newPRecord = IMPORT(m.newPRecord),
        panelClosed = IMPORT(m.panelClosed);
    /** @import-module-begin */
    m = BP_MOD_WDL;
    var CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS),
        cs_panel_wdt = IMPORT(m.cs_panel_wdt),
        MiniDB = IMPORT(m.MiniDB);
    /** @import-module-begin W$ */
        m = IMPORT(BP_MOD_W$);
    var w$exec = IMPORT(m.w$exec),
        w$get = IMPORT(m.w$get),
        w$set = IMPORT(m.w$set);
    /** @import-module-begin Error */
    m = BP_MOD_ERROR;
    var BPError = IMPORT(m.BPError);
    /** @import-module-end **/ m = null;
    
    /** @globals-begin */
    var g_loc = IMPORT(g_win.location),
        g_doc = IMPORT(g_win.document),
        settings = {AutoFill:true, ShowPanelIfNoFill: true}, // User Settings
        data_ct = "untrix_ct",
        data_fn = "untrix_fn", // Careful here. HTML5 will take all capitals in the IDL name
                               // and convert to lowercase with a hyphen prefix. Not sure
                               // if the normalized name needs to be used in querySelector
                               // of whether the IDL name will suffice. For the time being
                               // I am steering clear of hyphens and uppercase.
        sel_fn_u = "[data-"+data_fn+"="+fn_userid+']',
        sel_fn_p = "[data-"+data_fn+"="+fn_pass+']',
        sel_ct_u = "[data-"+data_ct+"="+CT_BP_USERID+']',
        sel_ct_p = "[data-"+data_ct+"="+CT_BP_PASS+']',
        MOD_DB = new MiniDB(),
        MOD_DND,
        MOD_FILL,
        MOD_PANEL,
        MOD_CS;
    
    /** @globals-end **/

    function isTopLevel(win) {
        return (win.top === win.self);
    }

    MOD_FILL = (function()
    {
        var data_finfo = 'finfo',
            g_bInited,
            g_uSel = 'input[type="text"],input:not([type]),input[type="email"],input[type="tel"],input[type="number"]',
            g_uSel2 =  "[name=userid],[name=username],#userid,#username,[name=id],[name=uid],#id,#uid,[name=user],[name=uname],#user,#uname," +
                        "[name*=login],[name*=identity],[name*=accountname],[name*=signin]," +
                        "[name*=username],[name*=user_name],[name*=userid],[name*=logon],[name*=user_id]," +
                        "[id*=login],[id*=identity],[id*=accountname],[id*=signin]," +
                        "[id*=username],[id*=user_name],[id*=userid],[id*=logon],[id*=user_id]",
            g_uSel3 = "[name*=email],[name*=phone],[id*=email],[id*=phone]",
            DECISION_TAB = []; // Defined later

            // var g_uIdSel2 = "input[name=id i],input[name=uid i],input[name=user i],input[name=uname i],input[id=id i],input[id=uid i],input[id=user i],input[id=uname i]";
            // var g_uPattSel2="input[name*=login i],input[name*=identity i],input[name*=accountname i],input[name*=signin i]," +
                            // "input[name*=username i],input[name*=user_name i],input[name*=email i],input[name*=userid i],input[name*=logon i]," +
                            // "input[id*=login i],input[id*=identity i],input[id*=accountname i],input[id*=signin i]," +
                            // "input[id*=username i],input[id*=user_name i],input[id*=email i],input[id*=userid i],input[id*=logon i]";

        function FormInfo(form, us, ps, buddys)
        {
            Object.defineProperties(this,
            {
                'form':   {value:form || [], writable:true, enumerable:true},// form DOM element. Could be a non-form element too.
                // An array or jQuery object of userid field DOM elements.
                'us':     {value: us || [], writable:true, enumerable:true},
                // An array or jQuery object of password field DOM elements
                'ps':     {value: ps || [], writable:true, enumerable:true},
                'buddys': {value: buddys || [], writable:true, enumerable:true},
                'bTabbed':{writable:true, enumerable:true}, // true if a child input has positive tabIndex.
                'tabIndex':{writable:true, enumerable:true} // similiar to tabIndex IDL attrib of elements.
            });
        }
        FormInfo.getVal = function(els)
        {
            var val;
            iterArray2(els, null, function(el)
            {
                if (el.value) {
                    val = el.value;
                    return true;
                }
            });
            
            return val;
        };
        FormInfo.prototype.count = function ()
        {
            return ( (this.form && this.form.elements) ? (this.form.elements.length||0) : 
                     ((this.us?(this.us.length||0):0) + (this.ps?(this.ps.length||0):0)) );
        };
        FormInfo.prototype.hook = function ()
        {   // Listen for change events for auto-capture. We only hook-up if we have a
            // userid field and a password field, because onChange requires both.
            if (this.buddys.length)
            {   // We'll only put hooks on the first pair.
                var pair = this.buddys[0], $el;
                
                $el = $(pair.u);
                addEventListener(pair.u, 'change', MOD_FILL.onChange);
                $el.data(data_finfo, this);
                $el.data(data_fn, fn_userid);
                $el.css({'background-color':'blue'});

                $el = $(pair.p);
                addEventListener(pair.p, 'change', MOD_FILL.onChange);
                $el.data(data_finfo, this);
                $el.data(data_fn, fn_pass);
                $el.css({'background-color':'green'});
            }
        };
        FormInfo.prototype.destroy = function()
        {
            $(this).removeData();
        };
        FormInfo.prototype.getUid = function()
        {
            return FormInfo.getVal(this.us);
        };
        FormInfo.prototype.getPass = function()
        {
            return FormInfo.getVal(this.ps);
        };
        FormInfo.prototype.isVisible = function()
        {
            return ($(this.form).is(':visible') || ($(this.us).filter(':visible').length) || ($(this.ps).filter(':visible').length) );
        };
        FormInfo.prototype.isFocussable = function ()
        {
            return (this.getTabIndex() >= 0);
        };
        /*
         * Roughly mimics the tabIndex IDL attribute of input elements, but applied to the
         * entire form. Returns:
         * -1 if form is deemed not focussable - i.e. all of its constituents have tabIndex=0.
         * 0  if form is deemed focussable but tabIndex is zero for all its constituent fields
         * +n A number equal to the lowest positive tabIndex of its constituents. In this
         *    case the form is deemed focussable.
         */
        FormInfo.prototype.getTabIndex = function ()
        {
            var t, t1, t2, bFocussable, ar;
                
            if (this.tabIndex !== undefined) {
                return this.tabIndex;
            }

            //ar = this.form.elements || (this.us.concat(this.ps));
            ar = this.us.concat(this.ps);
            iterArray2(ar, null, function(item)
            {
                t = item.tabIndex;
                // We do not want to include negative tabIndex values because per the
                // (confusing section 8.4.1 of) HTML5 spec. it either means that the
                // element is either not tab-navigable or that it is not focussable at
                // all.
                if (t>0)
                {
                    bFocussable = true;
                    if ((t1===undefined) || (t < t1)) {
                        t1 = t;
                    }
                }
                else if (t===0) {
                    bFocussable = true;
                }
                else if (t<0) {
                    if ((t2===undefined) || (t < t2)) {
                        t2 = t;
                    }
                }
            });
            
            if (!bFocussable) {this.tabIndex = t2 || (-1);}
            else {this.tabIndex = t1 || 0;}
            
            return this.tabIndex;
        };
        
        function Forms()
        {
            Object.defineProperties(this,
                {
                    _a: {value:[], writable:true}
                });
        }
        Forms.prototype.clear = function ()
        {
            this._a.length = 0;
        };
        Forms.prototype.length = function () {return this._a.length;};
        Forms.prototype.get = function (i) {return this._a[i];};
        Forms.prototype.push = function (info) {this._a.push(info);};
        Forms.prototype.walk = function (func)
        {
            iterArray2(this._a, this, function(fInfo)
            {
                func.apply(fInfo);
            });
        };
        Forms.prototype.append = function (forms)
        {
            if (forms && forms._a && forms._a.length)
            {
                this._a = this._a.concat(forms._a);
            }
        };
        Forms.prototype.rm = function (fInfo) // removes fInfo from collection
        {
            return this._a.some(function(item, i, ar)
            {
                if (item===fInfo) {
                    ar.splice(i,1);
                    return true;
                }
            });
        };
        Forms.prototype.getVisible = function ()
        {
            var out = new Forms(),
                i, fInfo;
            iterArray2(this._a, null, function(fInfo)
            {
                if (fInfo.isVisible()) {
                    out.push(fInfo);
                }
            });
            return out;
        };
        // Forms.prototype.getTabbed = function ()
        // {
            // var out;
            // iterArray2(this._a, null, function(item)
            // {
                // if (item.bTabbed) {
                    // out.push(item);
                // }
            // });
            // return out;
        // };
        Forms.prototype.getFirstFocussed = function ()
        {
            var first, focussable=[], t, t1;
            if (this.length())
            {
                iterArray2(this._a, null, function(item) // iterate in tree order
                {
                    t = item.getTabIndex();
                    if (t>0) {
                        focussable.push(item);
                        if ((t1===undefined) || (t < t1)) {
                            t1 = t;
                            first = item;
                        }
                    }
                    else if (t===0) {
                        focussable.push(item);
                    }
                });
            }

            return (first || focussable[0]);
        };
        // Forms.prototype.rmWithPass = function (n)
        // {
            // var out = new Forms(),
                // i, fInfo;
            // // Iteration order is in reverse since we will remove elements
            // for (i=this._a.length-1; i>=0; i--)
            // {
                // fInfo = this._a[i];
                // if (fInfo.ps && fInfo.ps.length) 
                // {
                    // if (fInfo.ps.length === n) {
                        // out.push(fInfo);
                        // this._a.splice(i,1);
                    // }
                // }
            // }
//             
            // return out;
        // };
        // Forms.prototype.rmSmallest = function ()
        // {
            // var j = 0, i;
            // for (i=this._a.length-1; i>=0; i--)
            // {
                // if (this._a[i].count() < this._a[j].count()) {
                    // j = i;
                // }
            // }
//             
            // return this._a.splice(j,1)[0];
        // };
        
        function FillInfo()
        {
            Object.defineProperties(this,
            {
                signin: {value: new Forms()},
                signup: {value: new Forms()}
            });
        }
        FillInfo.prototype.clear = function ()
        {
            this.signin.clear();
            this.signup.clear();
        };
        FillInfo.prototype.done = function ()
        {
            return (this.signin.length() && this.signup.length());
        };
        FillInfo.prototype.contains = function (form)
        {
            return ( (this.signin._a.indexOf(form)!==(-1)) ||
                     (this.signup._a.indexOf(form)!==(-1))  );
        };
        FillInfo.prototype.autoFillable = function () 
        {
            return (this.signin.length()>0) && this.signin.get(0).isVisible();
        };
        FillInfo.prototype.hook = function ()
        {
            this.signin.walk(FormInfo.prototype.hook);
            this.signup.walk(FormInfo.prototype.hook);
        };

        var m_info = new FillInfo();

        function info() {return m_info;}
        
        function onChange(ev)
        {
            var $this = $(ev.currentTarget),
                fn = $this.data(data_fn),
                fInfo = $this.data(data_finfo),
                uid, pass;
                
            if (fn === fn_userid)
            {
                uid = $this.val();
                pass = encrypt(fInfo.getPass());
            }
            else if (fn === fn_pass)
            {
                uid = fInfo.getUid();
                pass = encrypt($this.val());
            }
            
            if (uid && pass)
            {
                if (!MOD_DB.has(uid))
                {
                    console.log("Saving in mem, " + uid + " and " + pass);
                    tempRec(newPRecord(g_loc, Date.now(), uid, pass), dt_pRecord);
                }
                else {
                    console.log("Autofill?");
                }
            }
        }
        
        // function onChangeOld(ev)
        // {
            // var el = ev.currentTarget, //= this
                // $u, fn = el.dataset[data_fn],
                // u, actn, p;
// 
            // if (fn === fn_pass)
            // {   // Find the accompanying userid element
                // if (el.form)
                // {
                    // //$u = $('input[type="text"],input[type="email"],input[type="tel"],input[type="number"]', el.form.elements);
                    // // TODO: Take tabindex into account when looking for peer element
                    // // TODO: Implement a findPeerElement method that will find the peer element based
                    // // TODO: on tabindex in addition to other clues. tabindex seems to be a very reliable
                    // // TODO: hint. It may even be used during the initial scan.
                    // $u = $('[data-untrix_fn=u]', el.form);
                    // if ($u.length === 1)
                    // {
                        // u = $u[0].value;
                        // actn = MOD_DB.pRecsMap[u];
//                         
                        // if (!actn) {
                            // console.log("New userid " + u + " entered");
                            // MOD_PANEL.getc().tempRecord(u, el.value);
                        // }
                        // else {
                            // p = actn.curr.p;
                            // if (p !== encrypt(el.value)) {
                                // console.log("Password changed for userid " + u);
                                // MOD_PANEL.getc().editRecord(u, el.value);
                            // }
                        // }
                    // }
                    // else
                    // {
                        // console.log("Password field changed inside form with no userid");
                    // }
                // }
                // else 
                // {
                    // console.log("Password field changed without form");
                // }
            // }
            // else if (fn === fn_userid)
            // {
                // // TODO: In some cases the password may get filled first and then the username
                // // TODO: example, if the user mistyped the username, filled in the password
                // // TODO: but then went back to change the username. In this case, the password
                // // TODO: peer element will need to be discovered and the tempRecord updated.
                // // TODO: Also bear in mind that in many cases page training may not exist
                // // TODO: since the user would be populating the password into BP for the first
                // // TODO: time.
                // // findPeerElement(el, fn);
                // console.log("Username changed to " + el.value);
                // MOD_PANEL.getc().tempRecord(el.value);
            // }
        // }

        /**
         * Autofills element described by 'er' with string 'str'.
         * if dcrpt is true, then decrypts the data before autofilling.
         */
        // function autoFillEl (er, str, dcrpt, test) {
            // var $el, sel, selVisible;
//     
            // if (er.id)
            // {
                // sel = er.t + '[id="'+ er.id + '"]'; // Do not tack-on type here. Some fields omit type
                                         // // which defaults to text when reading but not when selecting.
            // }
            // else if (er.n) // (!er.id), therefore search based on field name
            // {
                // sel = er.t + '[name="' + er.n + '"]' + (er.y? ('[type="'+ er.y + '"]') : '');
            // }
//             
            // selVisible = ':not([hidden])';
            // //$el = $(sel).filter(':visible');
            // $el = $(sel);//.filter(selVisible);
//     
            // $el.each(function(i)
            // {
                // if (!test)
                // {
                    // // NOTE: IE supposedly throws error if you focus hidden fields. If we encounter
                    // // that, then remove the focus() call from below.
                    // this.focus();
                    // this.click();
                    // $(this).val(dcrpt ? decrypt(str) : str);
                    // trigger(this, 'input');
                    // trigger(this, 'change');
                // }
                // //if (er.f === fn_pass) {
                    // BP_MOD_CS_PLAT.addEventListener(this,'change', onChange);
                // //}
                // this.dataset[data_fn] = er.f; // mark the field for access via. selectors.
            // });
//     
            // // One or more elements may have the same name,type and tagName. We'll fill
            // // them all because this is probably a pattern wherein alternate forms are
            // // declared on the page for the same purpose but different environments
            // // e.g. with JS/ without JS (twitter has such a page).
//             
            // if ($el.length) {
                // return true;
            // }
        // }
        
        // Helper function to autoFill. Argument must be supplied even if empty string.
        // Returns true if username could be autofilled.
        // function autoFillUHeuristic(u, test)
        // {
            // var $uel, rval;
            // if ((u===undefined || u===null) && (!test))
            // {
                // return false;
            // }
//             
            // $uel = $('input[type="text"],input[type=email],input[type="tel"],input[type="number"]').filter(g_uSel2);//.filter(':visible');
//     
            // if ($uel.length) 
            // {
                // $uel.each(function(index)
                // {
                    // if (!test) 
                    // {
                        // this.focus();
                        // this.click();
                        // $(this).val(u);
                        // trigger(this, 'input');
                        // trigger(this, 'change');
                    // }
                    // this.dataset[data_fn] = fn_userid; // mark the field for access via. selectors.
                    // BP_MOD_CS_PLAT.addEventListener(this,'change', onChange);
                // });
//                 
                // rval = true;
            // }
            // if (rval !== true)
            // {
                // // try case-insensitive match
                // $uel = $('input[type="text"],input[type=email]');
                // $uel.each(function(index) // should be $uel.some in case of test.
                // {
                    // var id = this.id? this.id.toLowerCase() : "",
                        // nm = this.name? this.name.toLowerCase() : "",
                        // found = false,
                        // copy = g_doc.createElement('input'),
                        // $copy = $(copy).attr({type:'text', 'id':id, 'name':nm});
                        // //$copy2 = $('<input type=text' + (id?(' id='+id):('')) + (nm?(' name='+nm):('')) + ' >');
//                         
                    // if ($copy.is(g_uSel2))
                    // {
                        // if (!test)
                        // {
                            // this.focus();
                            // this.click();
                            // $(this).val(u);
                            // trigger(this, 'input');
                            // trigger(this, 'change');
                        // }             
                        // rval = true;
                        // this.dataset[data_fn] = fn_userid; // mark the field for access via. selectors.
                        // BP_MOD_CS_PLAT.addEventListener(this,'change', onChange);
                    // }
                // });
            // }
            // return rval;
        // }
    
        // Helper function to autoFill. Argument must be supplied even if empty string.
        // Returns true if password could be autofilled.
        // function autoFillPHeuristic(p, test)
        // {
            // var $pel, rval;
//             
            // if ((p===undefined || p===null) && (!test))
            // {
                // return false;
            // }
//     
            // $pel = $('input[type=password]');//.filter(':visible');
//             
            // if ($pel.length) 
            // {
                // $pel.each(function()
                // {
                    // if (!test)
                    // {
                        // this.focus();
                        // this.click();
                        // $(this).val(decrypt(p));
                        // trigger(this, 'input');
                        // trigger(this, 'change');
                    // }
                    // BP_MOD_CS_PLAT.addEventListener(this,'change', onChange);
                    // this.dataset[data_fn] = fn_pass; // mark the field for access via. selectors.
                // });
//             
                // rval = true;
            // }
//             
            // return rval;        
        // }
//         
        // function autoFill(userid, pass, test) // if arguments are not supplied, takes them from global
        // {
            // var eRecsMap, uer, per, ua, u, p, j, i, l, uDone, pDone, pRecsMap;
            // // auto-fill
            // // if we don't have a stored username/password, then there is nothing
            // // to autofill.
//             
            // if (userid && pass) {
                // u = userid; p = pass;
            // }
            // else if ((!test) && (pRecsMap = MOD_DB.pRecsMap)) 
            // {
                // ua = Object.keys(pRecsMap); 
                // if (ua) 
                // {
                    // if (ua.length === 1) {
                        // u = ua[0];
                        // p = pRecsMap[ua[0]].curr.p;
                    // }
                    // else /*if (ua.length > 1)*/ {
                        // // if there is more than one username, do not autofill, but
                        // // try to determine if autofilling is possible.
                        // test = true;
                    // }
                // }
            // }
//             
            // if ((test || (u&&p)) && (MOD_DB.eRecsMapArray))
            // {
                // // Cycle through eRecords starting with the
                // // best URL matching node.
                // l = MOD_DB.eRecsMapArray.length; uDone=false; pDone=false;
                // for (i=0, j=l-1; (i<l) && (!pDone) && (!uDone); ++i, j--)
                // {
                    // eRecsMap = MOD_DB.eRecsMapArray[j];
//                     
                    // if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                    // if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}
                    // if ((!uDone) && uer)
                    // {
                        // uDone = autoFillEl(uer, u, false, test);
                        // if (!uDone && (i===0)) {
                            // // The data in the E-Record was an exact URL match
                            // // yet, it has been shown to be not useful.
                            // // Therefore purge it form the K-DB.
//                           
                            // // TODO: Can't assume that i===0 implies full url match.
                            // // Need to construct a URLA from uer.loc and compare it with
                            // // g_loc. Commenting out for the time being.
                            // //deleteRecord(uer); // TODO: implement deleteRecord
                        // }
                    // }
                    // if ((!pDone) && per)
                    // {
                        // pDone = autoFillEl(per, p, true, test);
                        // if (!pDone && (i===0)) {
                            // // The data in the E-Record was an exact URL match
                            // // yet, it has been shown to be not useful.
                            // // Therefore purge it form the K-DB.
//     
                            // // TODO: Can't assume that i===0 implies full url match.
                            // // Need to construct a URLA from uer.loc and compare it with
                            // // g_loc. Commenting out for the time being.
                            // //deleteRecord(per); // TODO: implement deleteRecord
                        // }
                    // }
                // }
            // }  
//     
            // uDone = uDone || autoFillUHeuristic(u, test);
            // pDone = pDone || autoFillPHeuristic(p, test);
            // if (uDone || pDone) 
            // {
                // m_info.autoFillable = true;
                // if (!test) {
                    // return true;
                // }
            // }
        // }
        
        /**
         *  Returns ancestor of input element that wraps input elements in the neighborhood
         *  of el. The returned element itself may not be a form element (such is the case
         *  with about 2-3% websites tested).
         */
        function formAncestor(el)
        {
            var i, 
            p = el.form;

            if ((!p) && (el.tabIndex>=0)) {
                // el is focussable, therefore visible. Find its positioned ancestor.
                p = $(el).offsetParent();
                // Did we grab any input elements?
                if (p && ($('input', p).length<=1)) {
                    // oops, nothing here.
                    p = null;
                }
            }
            
            if (p) {
                return p;
            }

            // Return ancestor upto 5 levels above
            for (i=0, p=p||el.parentElement; (i<5)&&p; i++, p=p.parentElement)
            {
                if ($('input',p).length>1) {
                    break;
                }
            }
            
            return p;
        }
        /**
         * Apply case-insensitive filter to $el1 assuming these are all input[type=text]
         * elements. Selector should be all lower-case. Assumed that only id and text
         * properties are matched against.
         * 
         * DO NOT CHANGE the order of the supplied elements.
         */
        function idFilter($el1, sel)
        {
            var $el, els=[];

            // try case-insensitive filtering
            $el1.each(function(index)
            {
                var id = this.id? this.id.toLowerCase() : "",
                    nm = this.name? this.name.toLowerCase() : "",
                    found = false,
                    copy = g_doc.createElement('input'),
                    $copy = $(copy).attr({type:'text', 'id':id, 'name':nm});
                    
                if ($copy.is(sel))
                {
                    // Make sure we maintain element order.
                    els.push(this);
                }
            });
            
            return $(els);
        }

        // Returns a jQuery object containing matching fn_userid elements within cntxt.
        // @param cntxt can be a form element or a container/ancestor element. If it is a
        // non-form element, search will be performed on its descendents. If it is a form
        // element then form.elements set will be searched for matches (not their descendents).
        // If hasPass is true then it will be more lax in matching unless more than one
        // element is found. This is useful in cases where there was only one text field
        // besides the password field in a form (e.g. type===email) in which case, that
        // is probably the username field.
        //
        // IMPORTANT: Results must be sorted in tree-order.
        function uCandidates(cntxt, hasPass)
        {
            var $el, rval, $el1;
            //$el = 
            if (cntxt.elements) { // cntxt is a form element
                $el1 = $(cntxt.elements).filter(g_uSel);
            }
            else {
                $el1 = $(g_uSel, $(cntxt));//.filter(':visible');
            }
            
            if (!hasPass) {
                // Since the container doesn't have a password field, apply a strict filter.
                // Note: container may be the entire document itself.
                $el = idFilter($el1, g_uSel2);
            }
            else
            {   // Container form has a password field, therefore we can be more lax
                // in the comparison. Try varying levels of strictness and pick the strickest
                // possible one.
                if ($el1.length>1) // We have more than one candidate username fields
                {   // Try and see if further filtration helps.
                    $el = idFilter($el1, g_uSel2); // strickest filter
                    if ($el.length===0) {
                        // Nope, further filtering erased the entire set.
                        // Try including email and phone fields now.
                        $el = idFilter($el1, g_uSel3); // search for email and phone fields
                        if ($el.length===0) {
                            // This didn't succeed either. Roll back. 
                            $el = $el1;
                        }
                    }
                }
                else {
                    $el = $el1;    
                }
            }

            return $el;
        }

        // Returns a jQuery object containing matching fn_pass elements within cntxt.
        // IMPORTANT: Results must be sorted in tree-order.
        function pCandidates(cntxt)
        {
            if (cntxt.elements) { // cntxt is a form element
                return $(cntxt.elements || cntxt).filter('input[type=password]');
            }
            else {
                return $('input[type=password]', $(cntxt));//.filter(':visible');
            }
        }

        /**
         * Find forms inside the context element and return them in tree order. 
         */
        function findForms(ctxEl)
        {
            var forms = ctxEl.forms || $(ctxEl).find('form'),
                $candids, f, $forms;

            if (!forms) 
            {
                $forms = $([]);
                // jQuery ensures that .add operation is a union operation, not a blind
                // concat. Also, the results are sorted in tree-order ! That's exactly
                // what we want.
                $candids = uCandidates(ctxEl).add(pCandidates(ctxEl));
                $candids.each(function(i)
                {
                    f = formAncestor(this);
                    if (f) {
                        // union operation, not a blind concat. Tree order is guaranteed.
                        $forms.add(f);
                    }
                });
            }

            return forms || $forms.toArray();
        }
        
        // // return true if pos1/w1 is above pos2/w2 in the same column
        // function isAbove($el1, $el2)
        // {
            // var pos1 = $el1.position(), 
                // w1 = $el1.outerWidth(), 
                // pos2 = $el2.position(), 
                // w2 = $el2.outerWidth();
            // return ((pos1.left===pos2.left) &&
                    // (w1===w2) &&
                    // (pos1.top < pos2.top));
        // }
//         
        // function isDirectlyAbove($el1, $el2)
        // {
            // var pos1 = $el1.position(),
                // w1 = $el1.outerWidth(),
                // h1 = $el1.outerHeight(), 
                // pos2 = $el2.position(),
                // w2 = $el2.outerWidth(),
                // h2 = $el2.outerHeight(),
                // h = (h1<h2) ? h1: h2;
            // return ((pos1.left===pos2.left) &&
                    // (w1===w2) &&
                    // (pos1.top < pos2.top) && 
                    // ((pos2.top - (pos1.top + h1)) < h));
        // }
//         
        // function isBelow($el1, $el2)
        // {
            // return isAbove($el2, $el1);
        // }
//         
        // function isDirectlyBelow($el1, $el2)
        // {
            // return isDirectlyAbove($el2, $el1);
        // }
//         
        // function onLeft($el1, $el2)
        // {
            // var pos1 = $el1.position(),
                // h1 = $el1.outerHeight(),
                // pos2 = $el2.position(),
                // h2 = $el2.outerHeight();
            // return ((pos1.top===pos2.top) &&
                    // (pos1.left < pos2.left) &&
                    // (h1===h2));
        // }
//         
        // function isUpLeft($el1, $el2)
        // {
//             
        // }
//         
        // function immediateLeft($el1, $el2)
        // {  
            // var pos1 = $el1.position(),
                // h1 = $el1.outerHeight(),
                // w1 = $el1.outerWidth(),
                // pos2 = $el2.position(),
                // h2 = $el2.outerHeight(),
                // w2 = $el2.outerWidth(),
                // w = (w1<w2) ? w1 : w2;
            // return ((pos1.top===pos2.top) &&
                    // (pos1.left < pos2.left) &&
                    // (h1===h2) &&
                    // ((pos2.left - (pos1.left + w1)) < w));
        // }
//         
        // function onRight($el1, $el2)
        // {
            // return onLeft($el2, $el1);
        // }
//         
        // function immediateRight($el1, $el2)
        // {
            // return immediateLeft($el2, $el1);
        // }
//         
        // function nearest(fn, el, peersLR, peersUD, peersDiag)
        // {
            // var h = el.outerHeight(),
                // w = el.outerWidth(),
                // lr= nearestLR(fn, el, peersLR),
                // ud= nearestUD(fn, el, peersUD);
//                 
// 
            // if (lr) {
                // // in tree order, lr gets preference over ud.
                // return lr.el;
            // }
            // else if (ud) {
                // return ud.el;
            // }
        // }
        /**
         * Returns true if lhs preceds rhs in tree-order.
         * const unsigned short DOCUMENT_POSITION_DISCONNECTED = 0x01;
         * const unsigned short DOCUMENT_POSITION_PRECEDING = 0x02;
         * const unsigned short DOCUMENT_POSITION_FOLLOWING = 0x04;
         * const unsigned short DOCUMENT_POSITION_CONTAINS = 0x08;
         * const unsigned short DOCUMENT_POSITION_CONTAINED_BY = 0x10;
         * const unsigned short DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20; // historical
         */
        function isBefore(lhs, rhs)
        {
            if ((lhs.tabIndex>0) || (rhs.tabIndex>0)) {
                return (lhs.tabIndex < rhs.tabIndex);
            }

            return (lhs.compareDocumentPosition(rhs) & lhs.DOCUMENT_POSITION_FOLLOWING);
        }
        /**
         * Returns true if lhs follows rhs in tree-order.
         */
        function isAfter(lhs, rhs)
        {
            if ((lhs.tabIndex>0) || (rhs.tabIndex>0)) {
                return (lhs.tabIndex > rhs.tabIndex);
            }
            
            return (lhs.compareDocumentPosition(rhs) & lhs.DOCUMENT_POSITION_PRECEDING);
        }

        // @param fn Field-Type to find.
        // @param el The element that has been found.
        function findPeers(fn, el, _form)
        {
            var peers = [], 
                buddy,
                $peers,
                form = _form || formAncestor(el),
                //tabIndex = el.tabIndex,
                $el = $(el),
                pos, pos2, h, w;

            if (form)
            {
                if (fn === fn_userid) {
                    // $peers is sorted in tree order
                    $peers = $(uCandidates(form, true));
                }
                else if (fn === fn_pass) {
                    // $peers is sorted in tree order
                    $peers = $(pCandidates(form));
                }
                
                if ($peers && ($peers.length > 0))
                {
                    if ($peers.length>1)
                    {
                        $peers.each(function(i)
                        {
                            if (fn===fn_userid)
                            {
                                if (isBefore(this, el)) {
                                    peers.push(this);
                                }
                            }
                            else if (fn===fn_pass)
                            {
                                if (isAfter(this, el)) {
                                    peers.push(this);
                                }
                            }

                        });
                    }
                    else // only one verified peer match
                    {
                        peers.push($peers[0]);
                    }
                }
            }

            if (peers.length === 1) {
                buddy = peers[0];
            }
            else if (peers.length > 1) {
                if (fn === fn_userid) {
                    // select the last element of the tree-order list since that will be
                    // closest to the password element.
                    buddy = peers[peers.length-1];
                }
                else if (fn===fn_pass) {
                    // select the first element of the tree-order list since that will be
                    // closest to the userid element.
                    buddy = peers[0];
                }
            }
            
            return {peers:peers, buddy:buddy};
        }
        
        function findEl(eRec, ctxEl)
        {
            //var $form = $((eRec.fid?('#'+eRec.fid):'') + (eRec.fnm?('[name='+eRec.fnm+']'):'') );
            var $ctx = ctxEl ? $(ctxEl) : undefined;
            return $(eRec.t + (eRec.id?('#'+eRec.id):'') + (eRec.n?('[name='+eRec.n+']'):'') + (eRec.y? ('[type='+eRec.y+']') : ''), $ctx)[0];
        }
        
        function scrapeForms(ctxEl)
        {
            var forms,
                onePass = new Forms(),
                multiPass = new Forms(),
                noPass = new Forms(),
                noUser = new Forms(),
                tabbed=new Forms(),
                visible =new Forms(),
                all = new Forms();
            
            if (ctxEl) 
            {
                if (ctxEl.tagName.toLowerCase() === 'form') {
                    forms = [ctxEl];
                }
                else {
                    forms = findForms(ctxEl);
                }
            }
            else {
                forms = findForms(g_doc);
            }

            iterArray2(forms, null, function (form)
            {
                var $p, $u, o, fmInfo;

                // Skip the form if its already been seen before.
                if (!m_info.contains(form))
                {
                    $p = pCandidates(form);
                    fmInfo = new FormInfo(form);

                    if ($p.length>0)
                    {
                        fmInfo.ps = $p.toArray();
                        // One or more password fields found inside this form.
                        // Loop through password fields and collect all peer userid fields.
                        iterArray2($p, null, function(p)
                        {
                            o = findPeers(fn_userid, p, form);
                            if (o.buddy)
                            {
                                fmInfo.buddys.push({u:o.buddy, p:p});
                                // union of the two sets. tree-order is maintained by jQuery
                                fmInfo.us = $(fmInfo.us).add(o.peers).toArray();
                            }
                        });

                        if (fmInfo.buddys.length) {
                            if (fmInfo.ps.length===1) {
                                onePass.push(fmInfo);
                            }
                            else {
                                multiPass.push(fmInfo);
                            }
                        }
                        else {
                            noUser.push(fmInfo);                            
                        }
                        
                        all.push(fmInfo);
                    }
                    else 
                    {   // No password fields found inside this form. Do a strict match for userid fields.
                        // Strict matching will leave out email fields though. We pick only one of the
                        // matched fields.
                        $u = uCandidates(form, false);
                        if ($u.length>0)
                        {
                            fmInfo.us = $u.toArray();
                            noPass.push(fmInfo);
                            all.push(fmInfo);
                        }
                    }
                }
            });

            // var situationVector = {
                // tot:      all.length() + m_info.signin.length() + m_info.signup.length(), // num total forms
                // unC:      all.length(), // num uncategorized forms
                // signin:   m_info.signin.length(),
                // signup:   m_info.signin.length(),
                // onePass:  onePass.length(),
                // multiPass: multiPass.length(),
                // noUser:   noUser.length(),
                // noPass:   noPass.length(),
                // tabbed: tabbed.length(),
                // visible:  visible.length()
            // };
//             
            return {
                //sitVec:   situationVector,
                onePass:  onePass,
                multiPass: multiPass,
                noPass:   noPass,
                noUser:   noUser,
                //tabbed: tabbed,
                //visible:  visible,
                all:      all                
            };
        }

        // Scans the document to heuristically detect signin/signup forms as needed.
        // ctxEl argument binds the extent of the search to a single element. Used for
        // incremental scans when an element is dynamically added into a page.
        function scrape(ctxEl)
        {
            var formScan = scrapeForms(ctxEl),
                signin, 
                visible;

            if (formScan.all.length())
            {
                if (!m_info.signin.length())
                {   // Try to isolate a signin form
                    visible = formScan.onePass.getVisible();
                    if (visible.length()===1)
                    {
                        signin = visible.get(0);
                    }
                    else if (visible.length()>1)
                    {
                         signin = visible.getFirstFocussed();
                    }
                    else
                    {
                        // The onePass forms are not visible. Try to see if there is
                        // a visible noPass form. If yes, then that becomes the signin
                        // form, otherwise the onePass one.
                        visible = formScan.noPass.getVisible();
                        if (visible.length()>1) {
                            // one could also get the smallest form, but this works better.
                            signin = visible.getFirstFocussed();
                        }
                        else if (visible.length()===1) {
                            signin = visible.get(0);
                        }
                        else {
                            signin = formScan.onePass.getFirstFocussed();
                        }
                    }
                    
                    if (signin) {
                        m_info.signin.push(signin);
                    }
                }

                if (signin) {
                    formScan.all.rm(signin);    
                }
                // Collect the remaining forms for auto-capture
                m_info.signup.append(formScan.all);
            }
        }

        function scan(ctxEl)
        {
            var i, j, l, uEl, uEl2, pEl, pEl2, eRecsMap, uer, per, uer2, per2,
                loc = BP_MOD_CONNECT.newL(g_loc, dt_eRecord);
            
            if (!ctxEl) {
                m_info.clear();
            }            
            if (MOD_DB.eRecsMapArray.length)
            {
                // Cycle through eRecords starting with the best URL matching node.
                // By assumption, there can be at the most signin form and one signup
                // form in a frame. Therefore, by design, we capture at most one set of
                // signin eRecords and at most one set of signup eRecords. These assumptions
                // are embodied in the following code.
                l = MOD_DB.eRecsMapArray.length;
                for (i=0, j=l-1; (i<l) && ((!uEl && !pEl) || (!uEl2 && !pEl2)); ++i, j--)
                {
                    eRecsMap = MOD_DB.eRecsMapArray[j];

                    if ((!m_info.signin.length()) && (!uEl) && (!pEl))
                    {
                        if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                        if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}

                        if (uer)
                        {
                            uEl = findEl(uer, ctxEl);
                            if (!uEl && (i===0) && (!ctxEl) && loc.equal(uer.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(uer); // TODO: implement deleteRecord
                            }
                        }
                        if (per)
                        {
                            pEl = findEl(per, ctxEl);
                            if (!pEl && (i===0) && (!ctxEl) && loc.equal(per.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(per); // TODO: implement deleteRecord
                            }
                        }
                    }

                    if ((!m_info.signup.length()) && (!uEl2) && (!pEl2))
                    {
                        if (eRecsMap[fn_userid2]) { uer2 = eRecsMap[fn_userid2].curr;}
                        if (eRecsMap[fn_pass2]) {per2 = eRecsMap[fn_pass2].curr;}

                        if (uer2)
                        {
                            uEl2 = findEl(uer2, ctxEl);
                            if (!uEl2 && (i===0) && (!ctxEl) && loc.equal(uer2.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(uer2); // TODO: implement deleteRecord
                            }
                        }
                        if (per2)
                        {
                            pEl2 = findEl(per2, ctxEl);
                            if (!pEl2 && (i===0) && (!ctxEl) && loc.equal(per2.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(per2); // TODO: implement deleteRecord
                            }
                        }
                    }
                }
            }

            var o, fmInfo, fmInfo2;
            
            if (uEl && pEl) {
                fmInfo = new FormInfo(uEl.form, [uEl], [pEl], {u:uEl, p:pEl});
            }
            else if (uEl && (!pEl)) {
                o = findPeers(fn_pass, uEl);
                fmInfo = new FormInfo(uEl.form, [uEl], o.peers, {u:uEl, p:o.buddy});
            }
            else if (pEl && (!uEl)) {
                o = findPeers(fn_userid, pEl);
                fmInfo = new FormInfo(pEl.form, o.peers, [pEl], {u:o.buddy, p:pEl});
            }
            
            if (uEl2 && pEl2) {
                fmInfo2 = new FormInfo(uEl2.form, [uEl2], [pEl2], {u:uEl2, p:pEl2});
            }
            else if (uEl2 && (!pEl2)) {
                o = findPeers(fn_pass, uEl2);
                fmInfo2 = new FormInfo(uEl2.form, [uEl2], o.peers, {u:uEl2, p:o.buddy});
            }
            else if (pEl2 && (!uEl2)) {
                o = findPeers(fn_userid, pEl2);
                fmInfo2 = new FormInfo(pEl2.form, o.peers, [pEl2], {u:o.buddy, p:pEl2});
            }
                
            if (fmInfo)
            {
                m_info.signin.push(fmInfo);
            }

            if (fmInfo2)
            {
                m_info.signup.push(fmInfo2);
            }
            
            if ( !m_info.done() )
            {
                scrape(ctxEl);
            }
            
            m_info.hook();
        }
        
        // Assumes input element and fills it
        function fill(inp, val)
        {
            // NOTE: IE supposedly throws error if you focus hidden fields. If we encounter
            // that, then remove the focus() call from below.

            inp.focus();
            inp.click();
            $(inp).val(val);
            trigger(inp, 'input');
            trigger(inp, 'change');
        }
        
        function autoFill(userid, pass)
        {
            var u, p, pRecsMap, fInfo;

            if (m_info.signin.length())
            {
                fInfo = m_info.signin.get(0);
                if (fInfo.isVisible()) {
                    if (fInfo.buddys.length) {fill(fInfo.buddys[0].u, userid);}
                    if (fInfo.buddys.length) {fill(fInfo.buddys[0].p, pass);}
                }
            }        }

        function init()
        {
            if (!g_bInited) {try
            {
                //scan();
                g_bInited = true;
            }
            catch (ex)
            {
                BP_MOD_ERROR.logwarn(ex);
            }}
        }
        
        return Object.freeze(
        {
            'info': info,
            'scan': scan,
            'autoFill': autoFill,
            'init': init,
            'onChange': onChange
        });
    }());

    MOD_DND = (function()
    {
        var g_bInited;
        
        /** Intelligently returns true if the input element is a userid/username input field */
        function isUserid(el)
         {
             var tagName = el.tagName.toLowerCase(), rval = false;
             /*if (tagName === 'textarea') {rval = true;}
             else*/ if (tagName !== 'input') {rval = false;}
             else {
                 if (el.type)
                    {rval = (el.type==="text" || el.type==="email" || el.type==="tel" || el.type==="number");}
                 else
                     {rval = true;} // text type by default
             }
             
             return rval;
         }
    
        /** Intelligently returns true if the element is a password field */
        function isPassword (el)
         {
             if (el.tagName.toLowerCase() !== 'input') {return false;}
            return (el.type === "password");
         }
    
        function isField (ft, el)
        {
            switch (ft)
            {
                case fn_userid: return isUserid(el);
                case fn_pass: return isPassword(el);
                default: return;
            }
        }
        
        function matchDTwField(e)
        {
            var dtMatched = false, isBPDrag = false, 
            items = e.dataTransfer.items,
            w$el=w$get(e.target),
            n, len;
            for (n=0, len=items.length; n<len; n++)
            {
                if (items[n] && items[n].type === w$el.ct) {
                    dtMatched = true; isBPDrag = true;
                    //console.info("Matched BP Drag w/ Field !");
                    break;
                }
                else if ((!isBPDrag) && items[n] && items[n].type === CT_BP_FN) {
                    isBPDrag = true;
                    //console.info("Matched BP Drag !");
                }
            }
            
            return {dtMatched: dtMatched, isBPDrag: isBPDrag};        
        }
        
        function dragoverHandler(e)
        {
            // console.info("dragoverHandler(type = " + e.type + ") invoked ! effectAllowed/dropEffect = " +
                            // e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
    
            var r = matchDTwField(e);
            if (r.isBPDrag)
            {
                if (r.dtMatched) {
                    e.dataTransfer.dropEffect= 'copy';
                    //$(e.currentTarget).focus();
                }
                else {
                    e.dataTransfer.dropEffect = 'none'; // Prevent drop here.
                }
                
                //console.info("dropEffect set to " + e.dataTransfer.dropEffect);
                e.preventDefault(); // cancel the event signalling that we've handled it.
                e.stopImmediatePropagation();
            }
            //return true; // return true to signal that we're not cancelling the event (some code out there)
        }
        
        function dropHandler(e)
        {
            //console.info("dropHandler invoked ! effectAllowed/dropEffect = " + e.dataTransfer.effectAllowed + '/' + e.dataTransfer.dropEffect);
     
            var data, 
                r = matchDTwField(e),
                el, form;
            
            if (r.isBPDrag) {
                // Cancel event to tell browser that we've handled it and to prevent it from
                // overriding us with a default action.                        
                e.preventDefault();
                
                if (!r.dtMatched) {
                    // This is our drag-event, but Data-type and field-type don't match.
                    // Abort the drop.
                    // prevent browser from dropping the password into a visible field.
                    // or prevent browser from dropping userid into a password field.
                    e.dataTransfer.dropEffect = 'none';
                }                     
                else 
                {
                    el = e.currentTarget;
                    form = el.form;
                    // Tell browser to set vlaue of 'current drag operation' to 'copy'
                    e.dataTransfer.dropEffect = 'copy';
    
                    //console.log("dropHandler:dataTransfer.getData("+CT_BP_FN+")="+e.dataTransfer.getData(CT_BP_FN));
                    // Save an ERecord.
                    var eRec = newERecord(e.target.ownerDocument.location,
                                          Date.now(),
                                          e.dataTransfer.getData(CT_BP_FN), // fieldName
                                          el.tagName,
                                          el.id,
                                          el.name,
                                          el.type,
                                          ((form&&form.id)? form.id : undefined),
                                          ((form&&form.name)? form.name:undefined));
                    saveRecord(eRec, dt_eRecord);
    
                    data = e.dataTransfer.getData(CT_TEXT_PLAIN);
                    if (data) 
                    {
                        el.focus();
                        el.click();
                        el.value = data;
                        trigger(el, 'input');
                        trigger(el, 'change');
                    }
                }
            }
            // console.info("dropEffect set to " + e.dataTransfer.dropEffect);
        }
    
        function setupDNDWatchers(win)
        {       
            $('input').each(function(i, el)
            {
                var u, 
                    w = w$set(el);
                if ( (u = isUserid(el)) || isPassword(el))
                {
                    addEventListener(el, "dragenter", dragoverHandler);
                    addEventListener(el, "dragover", dragoverHandler);
                    addEventListener(el, "drop", dropHandler);
                    //addEventListener(el, "input", function(e){console.log("Watching Input event");});
                    //addEventListener(el, "change", function(e){console.log("Waching Change event");});
                    if (u) {
                        w.ct = CT_BP_USERID;
                        el.dataset[data_ct] = CT_BP_USERID;
                    } else {
                        w.ct = CT_BP_PASS;
                        el.dataset[data_ct] = CT_BP_USERID;
                    }
                    // console.log("Added event listener for element " + el.id +
                    // "/" + el.name);
                }
            }); 
        }
        
        function init()
        {
            if (!g_bInited) {try
            {
                setupDNDWatchers(g_win);
                g_bInited=true;
            }
            catch (ex)
            {
                BP_MOD_ERROR.logwarn(ex);
            }}
        }
        
        return Object.freeze(
        {
            init: init,
            setupDNDWatchers: setupDNDWatchers
        });
    }());

    MOD_PANEL = (function()
    {
        var m_panel, m_id_panel;
        
        function destroy()
        {
            if (m_id_panel && m_panel /*(panel = w$get('#'+m_id_panel))*/ ) 
            {
                m_panel.destroy();
                m_id_panel = null;
                m_panel = null;
                // Remember to not keep any data lingering around ! Delete data the moment we're done
                // using it. Data should not be stored in the page if it is not visible to the user.
                MOD_DB.init();
                return true;
            }
            
            return false;
        }
        
        function onClosed()
        {
            m_panel = null;
            m_id_panel = null;
            panelClosed(g_loc);
        }

        function create()
        {   //dbInfo should have db, dbName, dbPath
            destroy();
            var ctx = {
                it: new RecsIterator(MOD_DB.pRecsMap), 
                reload:MOD_CS.showPanelAsync,
                onClosed:onClosed,
                autoFill: (MOD_FILL.info().autoFillable()?MOD_FILL.autoFill:undefined), 
                dbName:MOD_DB.dbName,
                dbPath:MOD_DB.dbPath
            };
            m_panel = w$exec(cs_panel_wdt, ctx);
            m_id_panel = m_panel.id;
            MOD_COMMON.delProps(ctx); // Clear DOM refs in the ctx to aid GC
        }
        
        function get() {return m_panel;}
        
        function getc()
        {
            if (!m_panel) {
                create();
            }
            
            return m_panel;
        }
        
        return Object.freeze(
        {
            get: get,
            getc: getc,
            create: create,
            destroy: destroy,
            onClosed: onClosed
        });
    }());
      
    MOD_CS = (function()
    {
        /*
         * Show panel using the dbInfo returned in the response.
         */
        function cbackShowPanel (resp)
        {
            if (resp.result===true)
            {
                var db = resp.db;
                console.info("cbackShowPanel@bp_cs.js received DB-Records\n"/* + JSON.stringify(db)*/);
                MOD_FILL.scan();
                MOD_DB.ingest(resp.db, resp.dbInfo);
            }
            else 
            {
                MOD_DB.init(); // Just to be on the safe side
                BP_MOD_ERROR.logdebug(resp.err);
            }
    
            MOD_PANEL.create();
        }
        
        /*
         * Invoked by bp_cs_boot when it receives a bp-click request.
         * Should do the following:
         * 1. Scan the page for DND and autofill if not already done.
         * 2. Destroy the panel if it is displaying.
         * 3. Else, send a request to get db from background page.
         */
        function onDllLoad ()
        {
            MOD_FILL.init(); // scans only if not already done
            MOD_DND.init(); // init only if not already done
    
            if (!MOD_PANEL.destroy()) // destroy returns true if a panel existed and was destroyed
            {
                // MOD_DB.ingest(request.db, request.dbInfo);
                // MOD_PANEL.create();
                showPanelAsync();
            }
        }

        /*
         * Invoked upon receipt of a click message from bp_main. Sent along with mini-db when
         * user clicks the BP button or the context menu.
         * Should do the following:
         * 1. Scan the page for DND and autofill if not already done.
         * 2. Destroy the panel if it is displaying.
         * 3. Else, send a request to get db from background page.
         */
        function onClickBP (request, _ /*sender*/, sendResponse)
        {
            onDllLoad(request);
            sendResponse({ack:true});
        }
    
        function showPanelAsync()
        {
            getRecs(g_loc, cbackShowPanel);
        }
        
        /**
         * Invoked for showing panel the first time and for toggling it afterwards.
         * Should do the following:
         * 1. Scan the page for DND and autofill if not already done.
         * 2. Destroy the panel if it is displaying.
         * 3. Else, send a request to get db from background page.
         */
        function onClickComm (/*ev*/)
        {
            MOD_FILL.init(); // init only if not already done
            MOD_DND.init(); // init only if not already done
            
            if (!MOD_PANEL.destroy()) // destroy returns true if a panel existed and was destroyed
            {
                showPanelAsync();
            }
        }
        
        function setupCommand(doc, func)
        {
            var com = doc.getElementById("com-untrix-uwallet-click");
            if (!com) 
            {
                var head = doc.head || doc.getElementsByTagName( "head" )[0] || doc.documentElement;
                com = document.createElement('command');
                com.type="command";
                com.accessKey = 'q';
                com.tabindex = -1;// ensures that the command won't get sequentially focussed.
                com.id = "com-untrix-uwallet-click";
                com.addEventListener('click', func);
                head.insertBefore(com, head.firstChild);
                
                console.log("bp_cs: Instrumented Command");
            }
        }
        
        function main()
        {
            registerMsgListener(onClickBP);
            setupCommand(g_doc, onClickComm);
            BP_DLL.onClickComm = onClickComm;
            BP_DLL.onDllLoad = onDllLoad;
        }

        return Object.freeze(
        {
            main: main,
            showPanelAsync: showPanelAsync
        });
    }());
    
    MOD_CS.main();
    console.log("loaded CS");    
}(window));


