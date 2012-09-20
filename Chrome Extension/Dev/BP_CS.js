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
        encrypt = IMPORT(m.encrypt),
        decrypt = IMPORT(m.decrypt),
        stopPropagation = IMPORT(m.stopPropagation),
        preventDefault = IMPORT(m.preventDefault);
    /** @import-module-begin CSPlatform */
    m = BP_MOD_CS_PLAT;
    var registerMsgListener = IMPORT(m.registerMsgListener);
    var addEventListener = IMPORT(m.addEventListener), // Compatibility function
        trigger = IMPORT(m.trigger);
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
        dt_eRecord = IMPORT(m.dt_eRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_userid2= IMPORT(m.fn_userid2),
        fn_pass2 = IMPORT(m.fn_pass2),
        fn_pass = IMPORT(m.fn_pass);        // Represents data-type password
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs),
        deleteRecord = IMPORT(m.deleteRecord),
        saveRecord = IMPORT(m.saveRecord),
        newERecord = IMPORT(m.newERecord),
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
        function FormInfo(form, us, ps)
        {
            Object.defineProperties(this,
            {
                'form': {value:form, writable:true, enumerable:true},// form DOM element
                'us': {value:us, writable:true, enumerable:true}, // array-like collection of userid field DOM elements
                'ps': {value:ps, writable:true, enumerable:true}, // array-like collection of password field DOM elements
            });
        }
        FormInfo.prototype.count = function ()
        {
            if (this.form) {return this.form.elements.length;}
            else {return (this.us?this.us.length:0) + (this.ps?this.ps.length:0);}
        };
        
        function FillInfo()
        {
            Object.defineProperties(this,
            {
                autoFillable: {writable:true, enumerable:true},
                signin: {writable:true, enumerable:true}, // object of type FormInfo
                signup: {writable:true, enumerable:true} // object of type FormInfo
            });
        }
        FillInfo.prototype.clear = function ()
        {
            this.autoFillable = undefined;
            this.signin = undefined;
            this.signup = undefined;
        };
        FillInfo.prototype.done = function ()
        {
            return (this.signin && this.signup);
        };
        FillInfo.prototype.contains = function (form)
        {
            return ((this.signin && (this.signin.form===form)) ||
                    (this.signup && (this.signup.form===form))  );
        };
        
        var g_bInited,
            g_uElSel =  "[name=userid],[name=username],#userid,#username,[name=id],[name=uid],#id,#uid,[name=user],[name=uname],#user,#uname," +
                        "[name*=login],[name*=identity],[name*=accountname],[name*=signin]," +
                        "[name*=username],[name*=user_name],[name*=userid],[name*=logon],[name*=user_id]," +
                        "[id*=login],[id*=identity],[id*=accountname],[id*=signin]," +
                        "[id*=username],[id*=user_name],[id*=userid],[id*=logon],[id*=user_id]",

            // var g_uIdSel2 = "input[name=id i],input[name=uid i],input[name=user i],input[name=uname i],input[id=id i],input[id=uid i],input[id=user i],input[id=uname i]";
            // var g_uPattSel2="input[name*=login i],input[name*=identity i],input[name*=accountname i],input[name*=signin i]," +
                            // "input[name*=username i],input[name*=user_name i],input[name*=email i],input[name*=userid i],input[name*=logon i]," +
                            // "input[id*=login i],input[id*=identity i],input[id*=accountname i],input[id*=signin i]," +
                            // "input[id*=username i],input[id*=user_name i],input[id*=email i],input[id*=userid i],input[id*=logon i]";

            m_info = new FillInfo();

        function info() {return m_info;}
        
        function onChange(ev)
        {
            var el = ev.currentTarget, //= this
                $u, fn = el.dataset[data_fn],
                u, actn, p;

            if (fn === fn_pass)
            {   // Find the accompanying userid element
                if (el.form)
                {
                    //$u = $('input[type="text"],input[type="email"],input[type="tel"],input[type="number"]', el.form.elements);
                    // TODO: Take tabindex into account when looking for peer element
                    // TODO: Implement a findPeerElement method that will find the peer element based
                    // TODO: on tabindex in addition to other clues. tabindex seems to be a very reliable
                    // TODO: hint. It may even be used during the initial scan.
                    $u = $('[data-untrix_fn=u]', el.form);
                    if ($u.length === 1)
                    {
                        u = $u[0].value;
                        actn = MOD_DB.pRecsMap[u];
                        
                        if (!actn) {
                            console.log("New userid " + u + " entered");
                            MOD_PANEL.getc().tempRecord(u, el.value);
                        }
                        else {
                            p = actn.curr.p;
                            if (p !== encrypt(el.value)) {
                                console.log("Password changed for userid " + u);
                                MOD_PANEL.getc().editRecord(u, el.value);
                            }
                        }
                    }
                    else
                    {
                        console.log("Password field changed inside form with no userid");
                    }
                }
                else 
                {
                    console.log("Password field changed without form");
                }
            }
            else if (fn === fn_userid)
            {
                // TODO: In some cases the password may get filled first and then the username
                // TODO: example, if the user mistyped the username, filled in the password
                // TODO: but then went back to change the username. In this case, the password
                // TODO: peer element will need to be discovered and the tempRecord updated.
                // TODO: Also bear in mind that in many cases page training may not exist
                // TODO: since the user would be populating the password into BP for the first
                // TODO: time.
                // findPeerElement(el, fn);
                console.log("Username changed to " + el.value);
                MOD_PANEL.getc().tempRecord(el.value);
            }
        }

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
            // $uel = $('input[type="text"],input[type=email],input[type="tel"],input[type="number"]').filter(g_uElSel);//.filter(':visible');
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
                    // if ($copy.is(g_uElSel))
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
        
        function getCntnr(el, n)
        {
            var i, 
            p = $(el).offsetParent();

            if (p) {
                return p;
            }
            // Return ancestor n levels above
            for (i=0, p=el.parentElement; (i<n)&&p; i++, p=el.parentElement)
            {
                el = p;
            }
            
            return el;
        }
        
        // Returns a jQuery object containing matching fn_userid elements within cntnr
        function uCandidates(cntxt, bStrict)
        {
            var $el, rval, els=[], $el1;
            //$el = 
            if (cntxt.elements) {
                $el1 = $(cntxt.elements).filter('input[type="text"],input[type="email"],input[type="tel"],input[type="number"]');
            }
            else {
                $el1 = $('input[type="text"],input[type="email"],input[type="tel"],input[type="number"]', $(cntxt));//.filter(':visible');
            }
            
            if (bStrict) {
                $el = $el1.filter(g_uElSel);
            }
            else { $el = $el1; }
            
            if (!$el.length)
            {
                // try case-insensitive filtering
                $el1.each(function(index)
                {
                    var id = this.id? this.id.toLowerCase() : "",
                        nm = this.name? this.name.toLowerCase() : "",
                        found = false,
                        copy = g_doc.createElement('input'),
                        $copy = $(copy).attr({type:'text', 'id':id, 'name':nm});
                        
                    if ($copy.is(g_uElSel))
                    {
                        els.push(this);
                    }
                });
                
                $el = $(els);
            }
            
            return $el;
        }

        // Returns a jQuery object containing matching fn_pass elements within cntnr
        function pCandidates(cntxt)
        {
            if (cntxt.elements) {
                return $(cntxt.elements || cntxt).filter('input[type=password]');
            }
            else {
                return $('input[type=password]', $(cntxt));//.filter(':visible');
            }
        }

        // return true if pos1/w1 is above pos2/w2 in the same column
        function isAbove(pos1, w1, pos2, w2)
        {
            return ((pos1.left===pos2.left) &&
                    (w1===w2) &&
                    (pos1.top < pos2.top));
        }
        
        function isBelow(pos1, w1, pos2, w2)
        {
            return isAbove(pos2, w2, pos1, w1);
        }
        
        function onLeft(pos1, h1, pos2, h2)
        {
            return ((pos1.top===pos2.top) &&
                    (pos1.left < pos2.left) &&
                    (h1===h2));
        }
        
        function onRight(pos1, h1, pos2, h2)
        {
            return onLeft(pos2, h2, pos1, h1);
        }
        
        function findPeers(fn, el)
        {
            var peers = [], $peers, 
                cntnr = el.form || getCntnr(el,6),
                tabIndex = el.tabIndex,
                $el = $(el),
                pos, pos2, h, w;
            if (cntnr)
            {
                if (fn === fn_userid) {
                    $peers = $(uCandidates(cntnr));
                }
                else if (fn === fn_pass) {
                    $peers = $(pCandidates(cntnr));
                }
                
                if ($peers && ($peers.length > 0))
                {
                    if ($peers.length>1)
                    {
                        pos = $el.position();
                        h = $el.outerHeight();
                        w = $el.outerWidth();
                        $peers.each(function(i)
                        {
                            if (tabIndex) 
                            {
                                if (fn===fn_userid) {
                                    if (this.tabIndex < tabIndex) {
                                        peers.push(this);
                                    }
                                }
                                else if (fn===fn_pass) {
                                    if (this.tabIndex > tabIndex) {
                                        peers.push(this);
                                    }
                                }
                            }
                            else 
                            { 
                                // no tabIndex
                                pos2 = $(this).position();
                                if (fn===fn_userid) 
                                {
                                    if ((isAbove(pos2, $(this).outerWidth(), pos, w)) ||
                                        (onLeft(pos2, $(this).outerHeight(), pos, h)))
                                    {
                                        // this and el are positioned in a column and this is above el
                                        peers.push(this);
                                    }
                                }
                                else if (fn===fn_pass)
                                {
                                    if ((isBelow(pos2, $(this).outerWidth(), pos, w)) ||
                                        (onRight(pos2, $(this).outerHeight(), pos, h)))
                                    {
                                        // this and el are positioned in a column and this is above el
                                        peers.push(this);
                                    }                                    
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
            
            return peers;
        }
        
        function findEl(eRec)
        {
            var $form = $((eRec.fid?('#'+eRec.fid):'') + (eRec.fnm?('[name='+eRec.fnm+']'):'') );
            return $(eRec.t + (eRec.id?('#'+eRec.id):'') + (eRec.n?('[name='+eRec.n+']'):'') + (eRec.y? ('[type='+eRec.y+']') : ''), $form)[0];
        }
        
        function isSignUp(cntnr, $u, $p)
        {
            // TODO: Add pattern match of form name (cntnr.name)
            return ($p.length>1); // 2 password fields expected in a sign-up form.
        }
        
        function scanHeuristic()
        {
            var cntnrs = g_doc.forms,
                info1 = [], // forms with one or more password fields 
                info2 = []; // forms without any password fields
            
            if (m_info.done()) {return;}
            
            //if (!cntnrs) {cntnrs = [g_doc];}
            MOD_COMMON.iterArray2(cntnrs, null, function (cntnr)
            {
                var $p = pCandidates(cntnr), $u,
                    fmInfo = new FormInfo(cntnr);
                
                // Skip the form if its already been seen before.
                if (!m_info.contains(cntnr))
                {
                    if ($p.length>0) 
                    {
                        fmInfo.ps = $p;
                        // Multiple password fields found inside this form.
                        // Loop through password fields and collect all peer userid fields.
                        MOD_COMMON.iterArray2($p, null, function(p)
                        {
                            var $u2 = $(findPeers(fn_userid, p));
                            if ($u2.length)
                            {
                                fmInfo.us = $u2.add(fmInfo.us); // union of the two sets.
                            }
                        });
                        info1.push(fmInfo);
                    }
                    else 
                    {   // No password fields found inside this form. Do a strict match for userid fields.
                        // Strict matching will leave out email fields though. We pick only one of the
                        // matched fields.
                        $u = uCandidates(cntnr, true);
                        if ($u.length>0)
                        {
                            fmInfo.us = $u;
                            info2.push(fmInfo);
                        }
                    }
                }
            });
            
            if (info1.length || info2.length)
            {
                var req = (m_info.signin?0:1) + (m_info.signup?0:1),
                    sel1, i,
                    info;
                    
                if (req)
                {
                    if (req===1) // One form has already been assigned
                    {
                        // In this situation info1 and info2 combined should have at the 
                        // most one form between them. So we go with that assumption and
                        // check info1 first because it has password fields, while info2
                        // doesn't.
                        sel1 = info1.length? info1[0] : info2[0];
                        if (!m_info.signin) {m_info.signin = sel1;}
                        else if (!m_info.signup) {m_info.signup = sel1;}
                    }
                    else if (req===2) // both form types remain to be assigned
                    {
                        info = info1.concat(info2);
                        // In this situation info1 and info2 combined should normally have
                        // at the most two forms. That is we expect (tot<=2). But of course
                        // make sure to not error-out if tot>2.
                        if (info.length>1)
                        {   // There are two or more matching forms on the page.

                            // We assume that (info.length <= 2)
                            i = (info[0].count() > info[1].count()) ? 1 : 0;
                            m_info.signin = info[i];  // form with lesser fields of the two
                            m_info.signup = info[1-i];// from with more fields of the two
                        }
                        else if (info.length===1)
                        {   // There is only one matching form on the page. We need to
                            // categorize it either as a signin or a signup form.

                            // We assume that a signup form will have two password fields
                            // and a sign-in form will have only one password field. However
                            // that may not be always true. And in those cases we'll depend
                            // on eRecords being either generated by the user or pre-canned
                            // by us.
                            // In at least one sign-in form I've seen two password
                            // fields (the second one was for pin number). But mostly
                            // only signup froms have two passwords on them. However,
                            // on Facebook's signup form, there is only one password field.
                            if (info[0].ps.length>1) {
                                m_info.signup = info[0];
                            }
                            else {
                                m_info.signin = info[0];
                            }
                        }
                    }
                }
            }
        }

        function scan()
        {
            var i, j, l, uEl, uEl2, pEl, pEl2, eRecsMap, uer, per, uer2, per2,
                loc = BP_MOD_CONNECT.newL(g_loc, dt_eRecord);
            m_info.clear();
            
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

                    if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                    if (eRecsMap[fn_userid2]) { uer2 = eRecsMap[fn_userid2].curr;}
                    if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}
                    if (eRecsMap[fn_pass2]) {per2 = eRecsMap[fn_pass2].curr;}
                    if ((!uEl)&&(!pEl))
                    {
                        if (uer)
                        {
                            uEl = findEl(uer);
                            if (!uEl && (i===0) && loc.equal(uer.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(uer); // TODO: implement deleteRecord
                            }
                        }
                        if (per)
                        {
                            pEl = findEl(per);
                            if (!pEl && (i===0) && loc.equal(per.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(per); // TODO: implement deleteRecord
                            }
                        }
                    }

                    if ((!uEl2) && (!pEl2))
                    {
                        if (uer2)
                        {
                            uEl2 = findEl(uer2);
                            if (!uEl2 && (i===0) && loc.equal(uer2.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(uer2); // TODO: implement deleteRecord
                            }
                        }
                        if (per2)
                        {
                            pEl2 = findEl(per2);
                            if (!pEl2 && (i===0) && loc.equal(per2.l)) {
                                // The data in the E-Record was an exact URL match
                                // yet, it has been shown to be not useful.
                                // Therefore purge it from the K-DB.
                                deleteRecord(per2); // TODO: implement deleteRecord
                            }
                        }
                    }
                }
            }

            if (uEl && (!pEl)) {
                pEl = findPeers(fn_pass, uEl)[0];
            }
            else if (pEl && (!uEl)) {
                uEl = findPeers(fn_userid, pEl)[0];
            }
            
            if (uEl2 && (!pEl2)) {
                pEl2 = findPeers(fn_pass, uEl2)[0];
            }
            else if (pEl2 && (!uEl2)) {
                uEl2 = findPeers(fn_userid, pEl2)[0];
            }
                
            if (uEl || pEl) 
            {
                m_info.signin = new FormInfo(uEl.form, [uEl], [pEl]);//{form:uEl.form, 'us':[uEl], 'ps':[pEl] };
            }
            if (uEl2 || pEl2)
            {
                m_info.signup = new FormInfo(uEl2.form, [uEl2], [pEl2]);//{form:uEl2.form, 'us':[uEl2], 'ps':[pEl2]};
            }
            
            if ( !((uEl || pEl) && (uEl2 || pEl2)) )
            {
                scanHeuristic();
            }
            
            m_info.autoFillable = Boolean(m_info.signin);
        }
        
        // Assumes input element and fills it
        function fill(inps, val)
        {
            // NOTE: IE supposedly throws error if you focus hidden fields. If we encounter
            // that, then remove the focus() call from below.
            MOD_COMMON.iterArray2(inps, null, function(inp)
            {
                inp.focus();
                inp.click();
                $(inp).val(val);
                trigger(inp, 'input');
                trigger(inp, 'change');
            });
        }
        
        function autoFill(userid, pass)
        {
            var u, p, pRecsMap;

            if (m_info.signin)
            {
                if (m_info.signin.us) {fill(m_info.signin.us, userid);}
                if (m_info.signin.ps) {fill(m_info.signin.ps, decrypt(pass));}
            }        }

        function init()
        {
            if (!g_bInited) {try
            {
                scan();
                g_bInited = true;
            }
            catch (ex)
            {
                BP_MOD_ERROR.logwarn(ex);
            }}
        }
        
        return Object.freeze(
        {
            info: info,
            autoFill: autoFill,
            init: init
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
                                          form&&form.id? form.id : undefined,
                                          form&&form.name? form.name:undefined);
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
                autoFill: (MOD_FILL.info().autoFillable?MOD_FILL.autoFill:undefined), 
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


