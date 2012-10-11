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
        indexOf = IMPORT(m.indexOf),
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
        fn_pass = IMPORT(m.fn_pass),        // Represents data-type password
        fn_btn  = IMPORT(m.fn_btn);        // Submit button
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
            data_pair = 'pair',
            data_btn  = 'btn',
            g_bInited, g_bScanned,
            g_uSel = 'input[type="text"],input:not([type]),input[type="email"],input[type="tel"],input[type="number"]',
            g_uReg2= /(log|sign)(in|on)|signup|(user|account)(id|name|number|email)|^(id|user|uid|uname)$|identity|authentication/i,
            g_uSel2 =  "[name=id],[name=uid],#id,#uid,[name=user],[name=uname],#user,#uname," +
                        "[name*=login],[name*=identity],[name*=accountname],[name*=signin]," +
                        "[name*=username],[name*=userid],[name*=logon],[name*=signon],[name*=signup]," +
                        "[id*=login],[id*=identity],[id*=accountname],[id*=signin]," +
                        "[id*=username],[id*=userid],[id*=logon],[id*=signon],[id*=signup]",
            // g_uSel3 = "[name*=email],[name*=phone],[name*=number],[name*=account],[name*=auth],"+
                      // "[id*=email],[id*=phone],[id*=number],[id*=account],[id*=auth]",            g_uSel3 = 'input[type="email"],input[type="tel"],input[type="number"]',
            g_uReg3 = /mail|phone|number|account|auth/i,
            g_uPatt = {'log_in':'login', 'log-in':'login', 'log_on':'logon', 'log-on':'logon',
                       'sign-on':'signon', 'sign_on':'signon', 'user_name':'username', 'user_id':'userid'},
            g_fSel2= "[name*=signin],[name=auth],[name*=login],[name*=account],[name*=register],"+
                     "[name*=registration],[name*=signon],[name*=regform],"+
                     "[id*=signin],#auth,[id*=login],[id*=account],[id*=register],[id*=signon],[id*=regform]",
            g_fReg2 = /(log|sign)(in|on)|^(auth)$|register|registration|authentication|enroll|join|ssoform|regform|(create)(user|account)/i,
            g_fSel3= "[name=create],[name*=auth],#create,[id*=auth]",
            g_fReg3= /^create$|auth|sso|account/i,
            g_fSel1_2= "[name*=enroll],[name*=createaccount],[name*=createuser],"+
                      "[id*=createaccount],[id*=createuser],[id*=enroll]",
            g_uselessForms = ['aspnetForm'];
            // g_uEl = g_doc.createElement('input').setAttribute('type','text'),
            // $g_uEl= $(g_uEl);

            // var g_uIdSel2 = "input[name=id i],input[name=uid i],input[name=user i],input[name=uname i],input[id=id i],input[id=uid i],input[id=user i],input[id=uname i]";
            // var g_uPattSel2="input[name*=login i],input[name*=identity i],input[name*=accountname i],input[name*=signin i]," +
                            // "input[name*=username i],input[name*=user_name i],input[name*=email i],input[name*=userid i],input[name*=logon i]," +
                            // "input[id*=login i],input[id*=identity i],input[id*=accountname i],input[id*=signin i]," +
                            // "input[id*=username i],input[id*=user_name i],input[id*=email i],input[id*=userid i],input[id*=logon i]";

        function FormInfo(form, us, ps, buddys)
        {
            Object.defineProperties(this,
            {
                // form DOM element. Could be a non-form element if the form was artificially put together.
                'form':   {value:form, writable:true, enumerable:true},
                // The DOM container of all form-fields. May or may-not be same as the form element above.
                'cntnr':  {writable:true, enumerable:true},
                // An array or jQuery object of userid field DOM elements.
                'us':     {value: us || [], writable:true, enumerable:true},
                // An array or jQuery object of password field DOM elements
                'ps':     {value: ps || [], writable:true, enumerable:true},
                'buddys': {value: buddys || [], writable:true, enumerable:true},
                // Array of pontential submit buttons. Ideally there should only be one.
                'btns':  {writable:true, enumerable:true},
                'tabIndex':{writable:true, enumerable:true}, // similiar to tabIndex IDL attrib of elements.
                'k':      {value: {us:[], ps:[]}}
            });
        }
        //
        // GLOBAL FUNCS GLOBAL FUNCS GLOBAL FUNCS GLOBAL FUNCS GLOBAL FUNCS GLOBAL FUNCS
        // 
        FormInfo.getVal = function(els)
        {
            var val;
            iterArray2(els, null, function(el)
            {
                if (el.value && (el.value !== el.defaultValue)) {
                    val = el.value;
                    return true;
                }
            });

            return val;
        };
        FormInfo.onSubmit = function(ev)
        {
            BP_MOD_ERROR.log("FormInfo.onSubmit: entered");
            if (ev.currentTarget!==ev.target) {
                BP_MOD_ERROR.log("FormInfo.onSubmit: current target and target are different");
            }
            var fInfo = $(ev.target).data(data_finfo);
            if (fInfo) {
                fInfo.onSubmit(20);
            }
        };
        FormInfo.onClick = function(ev)
        {
            BP_MOD_ERROR.log("Click event received");
            if (ev.currentTarget!==ev.target) {
                BP_MOD_ERROR.log("onClick: current target and target are different");
            }
        };
        FormInfo.onMousedown = function(ev)
        {
            if (ev.button!==0) {
                return;
            }
            BP_MOD_ERROR.log("Primary Mouse Button Depressed");
            if (ev.currentTarget!==ev.target) {
                BP_MOD_ERROR.log("onMousedown: current target and target are different");
            }
        };
        FormInfo.onEnter = function(ev)
        {
            if ((ev.key==='Enter') || (ev.keyCode===13)) {
                BP_MOD_ERROR.log("Enter button pressed");
                if (ev.currentTarget!==ev.target) {
                    BP_MOD_ERROR.log("onEnter: current target and target are different");
                }
            }
        };
        FormInfo.isSubmitEl = function (el)
        {
            var cnfdnc = $(el).data(data_btn);
            if (cnfdnc) {
                return Number(cnfdnc);
            }
            return 0;
        };
        //
        // PROTOTYPE PROTOTYPE PROTOTYPE PROTOTYPE PROTOTYPE PROTOTYPE
        //
        FormInfo.prototype.onSubmit = function (c)
        {
            BP_MOD_ERROR.alert("FormInfo.prototype.submit invoked with c = " + c);
        };
        FormInfo.prototype.pushEl = function (el, fn, merge)
        {
            var ar;
            if (fn===fn_userid) {ar = this.us;}
            else if (fn===fn_pass) {ar = this.ps;}
            else if (fn===fn_btn) {ar = this.btns;}
            if (ar && (!merge || (ar.indexOf(el)===-1))) {ar.push(el);}
        };
        FormInfo.prototype.mergeEl = function (el, fn)
        {
            this.pushEl(el, fn, true);
        };
        FormInfo.prototype.pushEls = function (els, fn, merge)
        {
            iterArray2(els, this, function(el)
            {
                this.pushEl(el, fn, merge);
            });
        };
        FormInfo.prototype.mergeEls = function (els, fn) { this.pushEls(els, fn, true); };
        FormInfo.prototype.merge = function (fInfo, rel)
        {   
            rel = rel || FormInfo.SUBSET;
            if (rel === FormInfo.SUBSET) {
                // this is SUBSET of fInfo
                this.form = fInfo.form;
                this.cntnr= fInfo.cntnr;
            }
            if (!this.k.us.length) {
                // No e-records here.
                if (fInfo.k.us.length) {
                    this.us = fInfo.us;
                }
                else {
                    this.mergeEls(fInfo.us, fn_userid);
                }
            }
            if (!this.k.ps.length) {
                // No e-records here.
                if (fInfo.k.ps.length) {
                    this.ps = fInfo.ps;
                }
                else {
                    this.mergeEls(fInfo.ps, fn_pass);
                }
            }
            this.mergeEls(fInfo.btns, fn_btn);
        };
        FormInfo.prototype.isEmpty = function ()
        {
            return (!this.form) && (!this.us.length) && (!this.ps.length) && (!this.btns.length);
        };
        FormInfo.prototype.hasEl = function (el, fn)
        {
            if (fn===fn_userid) {
                return (this.us.indexOf(el) !== -1);
            }
            else if (fn===fn_pass) {
                return (this.ps.indexOf(el) !== -1);
            }
            else if (fn===fn_btn) {
                return (this.btns.indexOf(el) !== -1);
            }
        };
        FormInfo.prototype.isContainerOf = function (el, fn)
        {
            if (!this.form) { return false; }
            else if (!this.cntnr) {
                return isAncestor(this.form, el) || (indexOf(this.form.elements, el) !== -1);
            }
            else {
                return isAncestor(this.cntnr, el) || (indexOf(this.form.elements, el) !== -1);
            }
        };
        FormInfo.DISJOINT = -1;
        FormInfo.UNDEFINED = 0;
        FormInfo.EQUAL = 1;
        FormInfo.SUPERSET = 2;
        FormInfo.SUBSET = 3;
        FormInfo.prototype.intersect = function(fInfo)
        {
            var cmp, rval;
            if ((!fInfo.form) || (!this.form)) {rval = FormInfo.DISJOINT;}
            else if (this.form===fInfo.form) {rval = FormInfo.EQUAL;}
            else if ((!this.cntnr) || (!fInfo.cntnr)) {rval = FormInfo.DISJOINT;}
            else {
                cmp = fInfo.cntnr.compareDocumentPosition(this.cntnr);
            
                if (cmp & fInfo.cntnr.DOCUMENT_POSITION_CONTAINS) {
                    rval = FormInfo.SUPERSET;
                }
                else if (cmp & fInfo.cntnr.DOCUMENT_POSITION_CONTAINED_BY) {
                    rval = FormInfo.SUBSET;
                }
                else {
                    rval = FormInfo.DISJOINT;
                }
            }
            return rval;
        };
        FormInfo.prototype.getIntersecting = function (fInfo)
        {
            var cmp = this.intersect(fInfo);
            return (cmp !== FormInfo.DISJOINT) ? {fInfo:this, cmp:cmp} : null;
        };
        FormInfo.prototype.count = function ()
        {
            return ( (this.form && this.form.elements) ? (this.form.elements.length||0) : 
                     ((this.us?(this.us.length||0):0) + (this.ps?(this.ps.length||0):0)) );
        };
        FormInfo.prototype.updtCntnr = function ()
        {
            var tEl, $p, off;

            if (!this.form) {return;}
            
            this.cntnr = null;

            if (this.form.localName === 'form') 
            {
                if ((this.ps.length || this.us.length) &&
                    (isAncestor(this.form, this.ps[0] || this.us[0]))) 
                {
                    this.cntnr = this.form;
                }
            }
            else {
                this.cntnr = this.form; // this.form is a DOM-ancestor of the fields
                console.log("FromInfo.form is not a form element");
            }
            
            tEl = this.getVisibleEl();
            if (tEl) {
                $p = $(tEl).offsetParent();
            }
            if (!this.cntnr)
            {
                if ($p.length)
                {   // this.form is a form element that is not an ancestor of its fields. There
                    // is an offset parent though that should work most of the time.
                    // TODO: need to disregard this value if it matches the root element.
                    this.cntnr = $p[0];
                }
                else {
                    this.cntnr = getAncestor(this.us[0] || this.ps[0], 5, this.us.length+this.ps.length+this.btns.length);
                }
            }
            
            if (!this.cntnr) {
                BP_MOD_ERROR.alert("Could not find a form-container");
                this.cntnr = g_doc.body || g_doc.documentElement || g_doc; // just to prevent referencing errors.
            }

            if ($p.length) {
                off = $p.offset();
                this.top = off.top;
                this.left= off.left;
                this.h = $p.outerHeight();
                this.w = $p.outerWidth();
            }
            else {
                this.top = this.left = this.h = this.w = 0;
            }
        };
        FormInfo.prototype.hookForm = function ()
        {
            var $sub;
            if (!this.form) {return;}
            $(this.form).data(data_finfo, this);
            
            if (this.form.localName === 'form') {
                addEventListener(this.form, 'submit', FormInfo.onSubmit);
            }            
        };
        FormInfo.prototype.hook = function ()
        {
            // Listen for change events for auto-capture.
            var doneFields = false;
            iterArray2(this.buddys, this, function(pair)
            {
                var $el;
                
                // We only want input from visible pairs
                // if ( (!$(pair.u).is(':visible')) && (!$(pair.p).is(':visible')) ) {
                    // return;
                // }
                $el = $(pair.u);
                // make sure to use a static function in order to allow repeatedly calling
                // the below without adding multiple event listeners.
                //addEventListener(pair.u, 'change', MOD_FILL.onChange);
                $el.data(data_finfo, this);
                $el.data(data_pair, pair);
                $el.data(data_fn, fn_userid);
                $el.css({'background-color':'#e3f1ff'});
                pair.u.dataset[data_fn] = fn_userid;

                $el = $(pair.p);
                //addEventListener(pair.p, 'change', MOD_FILL.onChange);
                $el.data(data_finfo, this);
                $el.data(data_pair, pair);
                $el.data(data_fn, fn_pass);
                $el.css({'background-color':'#e3f144'});
                pair.p.dataset[data_fn] = fn_pass;
                
                doneFields = true;
                return true;
            });
            if (!this.buddys.length && !doneFields) 
            {
                iterArray2(this.us, this, function(u)
                {   // no Pass case
                    var $el = $(u);
                    //addEventListener(u, 'change', MOD_FILL.onChange);
                    $el.data(data_finfo, this);
                    $el.data(data_fn, fn_userid);
                    $el.css({'background-color':'#e3f1ff'});
                    u.dataset[data_fn] = fn_userid;
                    doneFields = true;                    
                });
            }
            if (!this.buddys.length && !doneFields)
            {
                iterArray2(this.ps, this, function(p)
                {   // no User case
                    var $el = $(p);
                    //addEventListener(p, 'change', MOD_FILL.onChange);
                    $el.data(data_finfo, this);
                    $el.data(data_fn, fn_pass);
                    $el.css({'background-color':'#e3f144'});
                    p.dataset[data_fn] = fn_pass;
                });                
            }
            if (doneFields)
            {
                this.hookForm();
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
            //return ($(this.form).is(':visible') || ($(this.us).filter(':visible').length) || ($(this.ps).filter(':visible').length) );
            return (($(this.us).filter(':visible').length) || ($(this.ps).filter(':visible').length) );
        };
        FormInfo.prototype.getVisibleEl = function ()
        {
            return $(this.ps).filter(':visible')[0] || $(this.us).filter(':visible')[0];
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
        /**
         * Be careful when using this method. It won't guarantee tree-order
         * sort order. It merely pushes the item to the end of the list. 
         */
        Forms.prototype.push = function (info) {this._a.push(info);};
        Forms.prototype.getFInfo = function (form)
        {   // returns fInfo or null
            var rInfo = null;
            if (!form) {return null;}
            
            this._a.some(function(fInfo)
            {
                if (fInfo.form===form) 
                {
                    rInfo = fInfo;
                    return true;
                }
            });
            
            return rInfo;
        };
        Forms.prototype.getFInfoE = function (el, fn)
        {
            var rInfo = null;
            this._a.some(function(fInfo)
            {
                if (fInfo.hasEl(el, fn)) {
                    rInfo = fInfo;
                    return true;
                }
            });
            
            return rInfo;
        };
        
        /**
         * Inserts fInfo in tree order into the collection. Does not check for
         * intersection. Only checks if the form is not already present.
         */
        Forms.prototype.insertForm = function (form) 
        {
            var i, n, cmp, done=false, rInfo, tInfo;
            if (!form) {return;}

            for (i=0, n=this._a.length-1; i<n; i++) 
            {
                if (this._a[i].form === form) {
                    done = true;
                    rInfo = this._a[i];
                    break;
                }
                else if (isBefore(form, this._a[i].form)) {
                    tInfo = new FormInfo(form);
                    this._a.splice(i,0, tInfo);
                    done = true;
                    rInfo = tInfo;
                    break;
                }
            }

            if (!done) {
                tInfo = new FormInfo(form);
                this._a.push(tInfo);
                rInfo = tInfo;
            }
            
            return rInfo;
        };
        /**
         * Inserts fInfo in tree-order unless it intersects with an
         * already present form, in which case the two will get merged.
         * Returns true if insertion was successful, false otherwise.
         */
        Forms.prototype.mergeInsert = function (fInfo) 
        {
            var i, n, cmp, done=false, rInfo;
            if (!fInfo.form) {
                throw BP_MOD_ERROR.BPError("fInfo insert attempted without a form", "Diag", "InternalError");
            }
            for (i=0, n=this._a.length-1; i<n; i++) 
            {
                cmp = this._a[i].intersect(fInfo);
                if ((cmp===FormInfo.EQUAL) || (cmp===FormInfo.SUBSET)) {
                    this._a[i].merge(fInfo, cmp);
                    done = true;
                    rInfo = this._a[i];
                    break;
                }
                else if (cmp===FormInfo.SUPERSET) {
                    // fInfo could be a superset of the next item as well. Therefore,
                    // remove the current element and merge it into fInfo. Then check
                    // fInfo against the next element.
                    fInfo.merge(this._a.splice(i,1),cmp);
                    // We decremented index of the following elements by 1. Hence
                    // decrement i.
                    i--;
                    continue;
                }
                else if (isBefore(fInfo.form, this._a[i].form)) {
                    this._a.splice(i,0,fInfo);
                    done = true;
                    rInfo = fInfo;
                    break;
                }
            }

            if (!done) {
                this._a.push(fInfo);
                rInfo = fInfo;
            }
            
            return rInfo;
        };
        Forms.prototype.some = function (func)
        {
            iterArray2(this._a, this, function(fInfo)
            {
                func.apply(fInfo);
            });
        };
        /**
         * Inserts elements of forms into this collection in tree-order. 
         */
        Forms.prototype.merge = function (fInfos)
        {
            var host = this;
            if (fInfos)
            {
                fInfos.some(function()
                {
                    host.mergeInsert(this);
                });
            }
        };
        Forms.prototype.insertForms = function (forms)
        {
            var host = this;
            if (forms)
            {
                iterArray2(forms, null, function(form)
                {
                    host.insertForm(form);
                });
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
        Forms.prototype.getFirstFocussed = function ()
        {
            var first, focussable=[], t, t1;
            if (this.length())
            {
                // The array should be always kept sorted in tree-order in order to
                // ensure that the first element of the array is the first one in
                // sequential navigation unless overridden by positive tab-index values
                // on some elements.
                iterArray2(this._a, null, function(item)
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
        Forms.prototype.getClicked = function (ev)
        {
            var x = ev.clientX,
                y = ev.clientY,
                found;
                
            this.some(function()
            {
                var x1 = this.left, y1 = this.top, h = this.h, w = this.w;
                
                if (!h || !w) { return false; }
                
                if ((x>=x1) && (x<=(x1+w)) && (y>=y1) && (y<=(y1+w))) {
                    found = this;
                    return true; // exit the loop
                }
            });
            
            return found;
        };
        Forms.prototype.getContainerOf = function(el, fn)
        {
            var fInfo;
            this.some(function()
            {
                if (this.isContainerOf(el, fn)) {
                    fInfo = this;
                    return true;
                }
            });

            return fInfo;
        };
        Forms.prototype.getIntersecting = function(fInfo)
        {
            var rVal;
            this.some(function(f)
            {
                rVal = f.getIntersecting(fInfo);
                return rVal;
            });

            return rVal;
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
                signup: {value: new Forms()},
                scraped:{value: {all: new Forms()}},
                k:      {value: {bScanned:false}} // Holds knowledge information
            });
        }
        FillInfo.prototype.clearAll = function ()
        {
            this.signin.clear();
            this.signup.clear();
            BP_MOD_COMMON.delProps(this.scraped);
            this.scraped.all = new Forms();
            BP_MOD_COMMON.delProps(this.k);
            this.k.bScanned = false;
        };
        FillInfo.prototype.clearAssignment = function ()
        {
            this.signin.clear();
            this.signup.clear();
        };
        FillInfo.prototype.done = function ()
        {
            return (this.signin.length() && this.signup.length());
        };
        FillInfo.prototype.getFInfo = function (form)
        {   // returns fInfo or null
            if (this.k.fmInfo && (this.k.fmInfo.form === form)) {
                return this.k.fmInfo;
            }
            // else if (this.k.fmInfo2 && (this.k.fmInfo2.form === form)) {
                // return this.k.fmInfo2;
            // }
            else {
                return this.scraped.all.getFInfo(form);
            }
        };
        FillInfo.prototype.getContainerOf = function (el, fn)
        {
            var rval;
            if (this.k.fmInfo && this.k.fmInfo.isContainerOf(el, fn)) {
                rval = this.k.fmInfo;
            }
            // else if (this.k.fmInfo2 && this.k.fmInfo2.isContainerOf(el, fn)) {
                // rval = this.k.fmInfo2;
            // }
            else {
                rval = this.scraped.all.getContainerOf(el, fn);
            }
            return rval;
        };
        FillInfo.prototype.getFInfoE = function (el, fn)
        {
            if (this.k.fmInfo && this.k.fmInfo.hasEl(el, fn)) { return this.k.fmInfo; }
            //if (this.k.fmInfo2 && this.k.fmInfo2.hasEl(el, fn)) { return this.k.fmInfo2; }
            return this.scraped.all.getFInfoE(el, fn);
        };
        FillInfo.prototype.getIntersecting = function (fInfo)
        {
            return (this.k.fmInfo? this.k.fmInfo.getIntersecting(fInfo):null) || this.scraped.all.getIntersecting(fInfo);
        };
        FillInfo.prototype.dontHave = function (forms)
        {
            var i, n, out=[];
            for (i=0, n=forms.length; i<n; ++i)
            {
                if (!this.getFInfo(forms[i])) {
                    out.push(forms[i]);
                }
            }
            return out;
        };
        FillInfo.prototype.autoFillable = function ()
        {
            return (this.signin.length()>0) && this.signin.get(0).isVisible();
        };
        FillInfo.prototype.hook = function ()
        {
            this.signin.some(FormInfo.prototype.hook);
            this.signup.some(FormInfo.prototype.hook);
        };
        FillInfo.prototype.getClicked = function (ev)
        {
            var fInfo = m_info.signin.getClicked(ev);
            if (!fInfo) {
                fInfo = m_info.signup.getClicked(ev);
            }

            return fInfo;
        };

        var m_info = new FillInfo();

        function info() {return m_info;}
        
        function onSubmit(ev)
        {
            if (!g_bScanned) {scan();}

            var form = ev.target, fInfo;
            if ((fInfo=m_info.getFInfo(form))) {
                // A relevant form was submited
                fInfo.onSubmit(10);
            }
        }
        function onClick(ev)
        {
            if (ev.button!==0) { // We only care about primary button clicks
                return;
            }

            var go, href, fInfo, cnfdnc,
                el = ev.target,
                $el = $(el).closest(':submit,button:not([type]),input[type=image],a')

            if ($el.length)
            {
                el = $el[0]; go = true;
            }

            if (!go) {return;}

            if (!g_bScanned) {scan();}

            fInfo = m_info.getClicked(ev);
            if (!fInfo) {
                return;
            }
            cnfdnc=FormInfo.isSubmitEl(el);
            if (cnfdnc) {
                fInfo.onSubmit(cnfdnc);
            }
        }
        
        function onChange(ev)
        {
            var $this = $(ev.target),//.closest('input'),
                fInfo = $this.data(data_finfo),
                fn, pair, uid = null, pass = null,
                uEl, pEl;
            
            if (!fInfo) {return;}

            fn = $this.data(data_fn);
            pair = $this.data(data_pair);

            if (fn === fn_userid)
            {
                uEl = $this[0];
                pEl = pair ? pair.p : null;
            }
            else if (fn === fn_pass)
            {
                uEl = pair ? pair.u : null;
                pEl = $this[0];
            }

            if (uEl && (uEl.value !== uEl.defaultValue)) {
                // Fields sometimes have non-empty default values. We don't want those.
                uid = uEl.value; //TODO: getUid needs improvement
            }
            if (pEl && (pEl.value !== pEl.defaultValue)) {
                // Fields sometimes have non-empty default values. We don't want those.
                pass = encrypt(pEl.value); //TODO: getPass needs improvement
            }
            
            if (pair) 
            {
                if (!uid || !pass) {
                    console.log("partial user input received");
                    return;
                }
                else // both uid and pass are available
                {
                    if (MOD_DB.has(uid)) {
                        console.log("Update, autofill or assert of uid " + uid);
                    }
                    else {
                        console.log("New userid (and password) was input: " + uid + "/" + encrypt(pass));
                    }
                }
            }
            else 
            {
                if (uid)
                {
                    if (!MOD_DB.has(uid)) {
                        console.log("New userid was input without password: " + uid);
                    }
                    else {
                        console.log("Existing userid was input without password: " + uid);
                    }
                }
                else if (pass)
                {
                    console.log("A password was entered without userid. Saving it: " + encrypt(pass));
                }
            }
        }

        function getAncestor(el, levels, numInp, visibleOnly)
        {
            var p, i, p2, num;

            for (i=0, p=el.parentElement; (i<levels)&&p; i++, p=p.parentElement)
            {
                if (visibleOnly) {
                    num = $('input,button,a', p).filter(':visible').length;
                }
                else {
                    num = $('input,button,a', p).length;
                }
                if (num>=numInp) {
                    break;
                }
            }
            
            return p || g_doc.body || g_doc.documentElement || g_doc;
        }
        
        function isUselessForm(form, field)
        {
            var isUseless = true;
            if (form && (form.localName==='form'))
            {
                if ((g_uselessForms.indexOf(form.id) !== -1) ||
                    (isAncestor(form, field) && ($(field).parentsUntil(form) >= 5)) ) 
                {
                    isUseless = true;
                }
                else {
                    isUseless = false;
                }
            }
            
            return isUseless;
        }        
        /**
         *  Returns ancestor of input element that wraps input elements in the neighborhood
         *  of el. The returned element itself may not be a form element (such is the case
         *  with about 2-5% websites tested).
         */
        function formAncestor(el, fn, stage)
        {
            var i, topEls, tF, tE
                fInfo = new FormInfo();

            if (el.form)
            {   
                tF = el.form
                if (!isUselessForm(tF, el)) {
                    fInfo.form = tF;
                    if (isAncestor(tF, el)) {
                        fInfo.cntnr = tF;
                    }
                }
            }
            
            tE = el;
            while ((!fInfo.cntnr) && $(tE).is(':visible')) 
            {
                // el is visible. Find its positioned ancestor.
                tF = $(tE).offsetParent()[0];
                
                if (tF)
                {
                    if ((tF===g_doc.body) || (tF===g_doc.documentElement) || (tF===g_doc)) {
                        break; // exit the loop.
                    }
                    else if ($('input', tF).length<=1) {
                        // We didn't grab any more input elements. So this is be too
                        // narrow a selection.
                        tE = tF;
                    }
                    else {
                        fInfo.cntnr = tF;
                        if (!fInfo.form) {fInfo.form = tF;}
                        break;
                    }
                }
                else {
                    break;
                }
            }
            
            if (!fInfo.cntnr) 
            {
                // Return ancestor upto 5 levels above, containing at least 2 visible input elements.
                fInfo.cntnr = getAncestor(el, 5, 2, true);
                if (!fInfo.form) {fInfo.form = fInfo.cntnr;}
            }

            fInfo.pushEl(el, fn);
            
            return fInfo;
        }
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
        
        function normalize(name)
        {
            return name.toLowerCase().replace(/[\-_]/g,"");
        }
        /**
         * Apply case-insensitive filter to $el1 assuming these are all input[type=text]
         * elements. Selector should be all lower-case. Assumed that only id and text
         * properties are matched against.
         * 
         * DO NOT CHANGE the order of the supplied elements.
         */
        /*function uFilter($el1, sel)
        {
            var $el, els=[];

            // try case-insensitive filtering
            $el1.each(function(index)
            {
                var id = this.id? normalize(this.id) : "",
                    nm = this.name? normalize(this.name) : "",
                    found = false;
                    //copy = g_doc.createElement('input'),
                    //$copy = $(copy).attr({type:'text', 'id':id, 'name':nm});
                
                $g_uEl.attr({type:'text', 'id':id, 'name':nm});
                if ($g_uEl.is(sel))
                {
                    // Make sure we maintain element order.
                    els.push(this);
                }
            });
            
            return $(els);
        }*/

        // Returns a jQuery object containing matching fn_userid elements within cntxt.
        // @param cntxt can be a form element or a container/ancestor element. If it is a
        // non-form element, search will be performed on its descendents. If it is a form
        // element then form.elements set will be searched for matches (not their descendents).
        // If hasPass is true then it will be more lax in matching unless more than one
        // element is found. This is useful in cases where there was only one text field
        // besides the password field in a form (e.g. type===email) in which case, that
        // is probably the username field.
        // @param stage Unused for now.
        // IMPORTANT: Results must be sorted in tree-order.
        //
        //function uCandidates(cntxt, passEl, form)
        function uCandidates(cntxt, stage)
        {
            var $el, rval, $el1, fInfo;
            
            if (cntxt instanceof FormInfo) {
                fInfo = cntxt;
                cntxt = fInfo.form || fInfo.cntnr || g_doc;
            }
            
            if (cntxt instanceof HTMLFormElement) { // cntxt is a form element
                $el1 = $(cntxt.elements).filter(function(){return this.webkitMatchesSelector(g_uSel);}).filter(':visible');
            }
            else {
                $el1 = $(g_uSel, $(cntxt)).filter(':visible');
            }
            
            if (!fInfo || fInfo.isEmpty()) {
                // Apply a strict filter.
                // Note: container may be the entire document itself.
                $el = $(nameMatch($el1, g_uReg2));
            }
            else // !fInfo.isEmpty()
            {   
                if (fInfo.ps.length) {
                    // Filter out elements that come after the password element in the
                    // form. Username always preceeds password.
                    $el1 = getElsBefore(getFirstEl(fInfo.ps), $el1);
                }
                
                // Container form has a password field, therefore we can be more lax
                // in the comparison. Try varying levels of strictness and pick the strickest
                // possible one.
                if ($el1.length>1) // We have more than one candidate username fields
                {   // Try and see if further filtration helps.
                    //$el = uFilter($el1, g_uSel2); // strickest filter
                    $el = $(nameMatch($el1, g_uReg2)); // strickest filter
                    if ($el.length===0) {
                        // Nope, further filtering erased the entire set.
                        // Try including all email and phone fields now.
                        //$el = uFilter($el1, g_uSel3); // search for some other fields
                        $el = $el1.filter(function(){return this.webkitMatchesSelector(g_uSel3);}).add(nameMatch($el1, g_uReg3));
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

            if (fInfo) {
                fInfo.mergeEls($el, fn_userid);
            }
            return $el;
        }

        // Returns a jQuery object containing matching fn_pass elements within cntxt.
        // IMPORTANT NOTE: Results must be sorted in tree-order.
        // @param cntxt can be a cntxt-Element, a form-element or a FormInfo element.
        //        If it is a FormInfo element, then the found pCandidates will be added
        //        to it.
        // @param stage Unused for now.
        //
        function pCandidates(cntxt, stage)
        {
            var $candids, $try, fInfo, form, cntnr;
            
            if (cntxt instanceof FormInfo) {
                fInfo = cntxt;
                cntxt = fInfo.form || fInfo.cntnr;
            }

            if (!cntxt) {
                cntnr = g_doc;
            }
            else if (cntxt instanceof HTMLFormElement) {
                if (cntxt.elements) {
                    form = cntxt;
                }
                else {
                    cntnr = cntxt;
                }
            }
            else {
                cntnr = cntxt;
            }

            if (cntnr) {
                $candids = $('input[type="password"]', cntnr);//.filter(':visible');
            }
            else if (form) {
                $candids = $(form.elements).filter(':password');//.filter(':visible');
            }

            // In second and subsequent stages we can take advantage of knowledge gathered
            // thus far.
            if ((!fInfo) || fInfo.isEmpty()) {
                // We are either not in context of an fInfo or the fInfo is empty :(
                $candids = $candids.filter(':visible');
            }
            else { // This is known to be a signin or signup form. Hence we can be lax here.
                if ($candids.length)
                {
                    if (fInfo.us.length) {
                        $candids = getElsAfter(getLastEl(fInfo.us), $candids);
                    }

                    $try = $candids.filter(':visible');
                    if ($try.length || ($(fInfo.ps).filter(':visible').length)) {
                        // There are other visible password fields. Hence all password
                        // fields should be visible
                        $candids = $try;
                    }
                    // else $candids = $candids
                    // case: http://www.ibm.com/us/en/
                    // All our password fields are hidden, but since we do know that this is
                    // a legit form, we'll assume that those password fields will be made visible
                    // later. So we'll keep the hidden password fields.
                }
            }

            if (fInfo) {
                fInfo.mergeEls($candids, fn_pass);
            }

            return $candids;
        }

        /**
         * Find forms inside the context element and return them in tree order. Only
         * finds visible forms in stage-1 (the only stage this func is invoked in as of now).
         * This function should ensure that it returns a list of unique and non-intersecting
         * forms that do not intersect with m_info as well . Leave m_info untouched though,
         * do not push elements or merge forms into it.
         * 
         * Note that since some of the fInfos detected below may not have their cntnr fields
         * populated it is too early to find out whether these forms intersect. Only after
         * their constituent field are discovered can their cntnr field be found and only after
         * that we can perform true intersection. That will happen at the end of stage 2.
         * At this stage we'll be only eliminating duplicate form elements for such fInfos.
         */
        function findForms(ctxEl, stage)
        {
            var $forms, $candids, forms, tInfos, fInfos = new Forms();

            ctxEl = ctxEl || g_doc;
            forms = ctxEl.forms || $(ctxEl).find('form');

            if ($forms.length)
            {
                forms = nameMatch($forms, g_fReg2);
                forms = m_info.dontHave(forms);
                fInfos.insertForms(forms);
            }

            // Fetch enclosing forms around each candidate field.
            // NOTE: Strict filters will be applied by *Candidates.
            // We're assuming that this is stage-1 and that m_info.scraped
            // is empty.
            uCandidates(ctxEl, 1).each(function()
            {
                processField.apply(this, [this, fn_userid]);
            });
            pCandidates(ctxEl, 1).each(function()
            {
                processField.apply(this, [this, fn_pass]);
            });

            /**
             * Helper function 
             */
            function processField(el, fn)
            {
                var f, fInfo, t;

                if ((t = fInfos.getContainerOf(el, fn))) {
                    // this input element is a descendant or element of a known form.
                    t.pushEl(el, fn);
                    return;
                }
                else if (m_info.getContainerOf(el, fn)) {
                    // t === m_info.k.fmInfo because at this stage m_info.scraped is empty.
                    // Ignore this element since it is already included in the signin form.
                    // Signin form will be scraped separately, so don't bother pushing this
                    // element into it now.
                    return;
                }
                else 
                {
                    fInfo = formAncestor(el, fn, 1);
                    if (!m_info.getIntersecting(fInfo)) {
                        fInfos.mergeInsert(fInfo);
                    }

                    return;
                }
            }
            
            return fInfos;
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
        function isAncestor(cntnr, el)
        {
            return (el.compareDocumentPosition(cntnr) & el.DOCUMENT_POSITION_CONTAINS);
        }
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
        /**
         * From the provided collection $el, return elements (as jQuery object) that lie
         * before el in sequential navigation order. Returned elements are sorted in the
         * same order in which they were present in $el.
         */
        function getElsBefore(el, $el)
        {
            var out = [];
            $el.each(function(i)
            {
                if (isBefore(this, el)) {
                    out.push(this);
                }
            });
            
            return $(out);
        }

        /**
         * Returns first element in tabbing order. 
         */
        function getFirstEl(els)
        {
            var first = els[0];
            iterArray2(els, null, function(el)
            {
                if (isBefore(el, first)) {
                    first = el;
                }
            });
            
            return first;
        }        /**
         * From the provided collection $el, return elements (as jQuery object) that lie
         * after el in sequential navigation (tabbing) order. Returned elements are sorted
         * in the same order in which they were present in $el.
         */
        function getElsAfter(el, $el)
        {
            var out = [];
            $el.each(function(i)
            {
                if (isAfter(this, el)) {
                    out.push(this);
                }
            });
            
            return $(out);
        }

        /**
         * Returns last element in tabbing order. 
         */
        function getLastEl(els)
        {
            var last = els[0];
            iterArray2(els, null, function(el)
            {
                if (isAfter(el, last)) {
                    last = el;
                }
            });
            
            return last;
        }

        // @param fn Field-Type to find.
        // @param el The element that has been found.
        // finds visible username peers or visible and invisible password peers
        function findPeers(fn, el, fInfo)
        {
            var peers = [],
                buddy,
                $peers,
                //form = _form || formAncestor(el, fn),
                //tabIndex = el.tabIndex,
                $el = $(el),
                pos, pos2, h, w;

            if (fInfo)
            {
                if (fn === fn_userid) {
                    // $peers is sorted in tree order
                    $peers = $(uCandidates(fInfo, el)); // gets only visible fields.
                }
                else if (fn === fn_pass) {
                    // $peers is sorted in tree order
                    $peers = $(pCandidates(fInfo)); // may return invisible fields in addition to visible
                }
                
                if ($peers && ($peers.length > 0))
                {
                    if ($peers.length>1)
                    {
                        $peers.each(function(i)
                        {
                            if (fn===fn_userid)
                            {
                                //if (isBefore(this, el)) {
                                peers.push(this);
                                //}
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
            return $(eRec.t + (eRec.id?('#'+eRec.id):'') + (eRec.n?('[name="'+eRec.n+'"]'):'') + (eRec.y? ('[type='+eRec.y+']') : ''), $ctx)[0];
        }
        
        /**
         * Find submit buttons and populate fmInfo appropriately. 
         */
        function findSubmitBtns(fmInfo)
        {
            var $sub, $a, tEl;
            if (!fmInfo.form || !fmInfo.cntnr) {return;}
            
            // Now parse form/container for a submit button.
            if (fmInfo.form.localName === 'form') 
            {   // Look for submit buttons or just buttons
                //jQuery filter is case-sensitive, hence preferring :submit over [type=submit]
                $sub = $(fmInfo.form.elements).filter(':submit:visible');
                $sub = $sub.add($('input:visible[type=image]', fmInfo.cntnr));
                if (!$sub.length) {
                    $sub = $(fmInfo.form.elements).filter('button:not([type]):visible');
                }
            }
            else
            {
                $sub = $(':visible[type=submit],input[type=image]:visible', fmInfo.cntnr);
                if (!$sub.length) {
                    $sub = $('button:not([type]):visible', fmInfo.cntnr);
                }
            }

            $sub = getElsAfter(getLastEl(fmInfo.ps), $sub);
            if ($sub.length>1) 
            {
                $sub.data(data_btn,5); // Flagging all buttons as potential submit buttons (confidence=5/10)
                tEl = getFirstEl($sub);
                $(tEl).data(data_btn, 10); // Possibly *the* submit button.
                $sub[0].dataset['untrix_btn'] = 10;
            }
            else if ($sub.length===1) {
                $sub.data(data_btn, 10); // The submit button
                $sub[0].dataset['untrix_btn'] = 10;
            }
            else { //if ($sub.length===0)
                // Look for anchor based buttons.
                $a = $('a', fmInfo.cntnr);
                $sub = $a.filter(function(el)
                    {
                        return (!this.href) || (this.href==='#') || (this.href===this.baseURI) || (this.href===this.baseURI+'#');
                    }).filter(':visible');
                $sub.data(data_btn,5); // confidence = 5/10
            }

            if ($sub.length) {
                $sub.data(data_finfo, fmInfo);
                fmInfo.btns = $sub.toArray();
            }        
        }
        
        function scrapeForms(ctxEl)
        {
            var fInfos,//forms
                onePass = new Forms(),
                multiPass = new Forms(),
                noPass = new Forms(),
                noUser = new Forms(),
                tabbed=new Forms(),
                visible =new Forms(),
                all = new Forms();

            if (ctxEl && (ctxEl.localName === 'form')) {
                //forms = [ctxEl];
                fInfos = new Forms();
                fInfos.insertForms([ctxEl]);                
            }
            else {
                //forms = findForms(g_doc);
                fInfos = findForms(ctxEl, 1);
            }

            iterArray2(fInfos, null, function (fmInfo)
            {
                var $p, $u, o;

                $p = pCandidates(fmInfo, 2);
                //fmInfo = new FormInfo(form);

                if ($p.length>0)
                {
                    // fmInfo.ps = $p.toArray();
                    // One or more password fields found inside this form.
                    // Loop through password fields and collect all peer userid fields.
                    iterArray2($p, null, function(p)
                    {
                        o = findPeers(fn_userid, p, form);// only visible userid fields.
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
                    $u = uCandidates(form);
                    if ($u.length>0)
                    {
                        fmInfo.us = $u.toArray();
                        noPass.push(fmInfo);
                        all.push(fmInfo);
                    }
                }
                
                fmInfo.updtCntnr();
                // if (fmInfo.cntnr) {
                    // addEventListener(fmInfo.cntnr, 'keydown', FormInfo.onEnter);
                    // addEventListeners(fmInfo.cntnr, 'mousedown', FormInfo.onMousedown);
                // }
                findSubmitBtns(fmInfo);
            });
            if (m_info.scraped.onePass) {
                m_info.scraped.onePass.merge(onePass);
            }
            else {
                m_info.scraped.onePass = onePass;
            }
            if (m_info.scraped.multiPass) {
                m_info.scraped.multiPass.merge(multiPass);
            }
            else {
                m_info.scraped.multiPass = multiPass;
            }
            if (m_info.scraped.noPass) {
                m_info.scraped.noPass.merge(noPass);
            }
            else {
                m_info.scraped.noPass = noPass;
            }
            if (m_info.scraped.noUser) {
                m_info.scraped.noUser.merge(noUser);
            }
            else {
                m_info.scraped.noUser = noUser;
            }
            if (m_info.scraped.all) {
                m_info.scraped.all.merge(all);
            }
            else {
                m_info.scraped.all = all;
            }
            
            return m_info.scraped;
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
                        // one could also get the smallest form, but this works better.
                         signin = visible.getFirstFocussed();
                    }
                    else
                    {
                        // The onePass forms are not visible. Try to see if there is
                        // a visible noPass form. If yes, then that becomes the signin
                        // form, otherwise we won't label any because we don't want to
                        // autoFill invisible forms. That would be confusing to the user.
                        visible = formScan.noPass.getVisible();
                        if (visible.length()>1) {
                            signin = visible.getFirstFocussed();
                        }
                        else if (visible.length()===1) {
                            signin = visible.get(0);
                        }
                        else
                        {
                            visible = formScan.noUser.getVisible();
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
                                // Try multi-pass now. We risk labelling a sign-up form
                                // as sign-in, however we expect the user to not hit
                                // the auto-fill button if this was a signup form. 
                                visible = formScan.multiPass.getVisible();
                                if (visible.length()===1)
                                {
                                    signin = visible.get(0);
                                }
                                else if (visible.length()>1)
                                {
                                     signin = visible.getFirstFocussed();
                                }
                            }
                        }
                    }
                    
                    if (signin) {
                        m_info.signin.push(signin);
                    }
                }

                // Save the remaining forms for auto-capture
                m_info.signup.merge(formScan.all);
                if (signin) {
                    m_info.signup.rm(signin);
                }
            }
        }

        /**
         * Reads knowledge records, searches for corresponding forms on page and reports
         * ones that are visible.
         */
        function scanKnowledge(ctxEl)
        {
            var i, j, l, uEl, uEl2, pEl, pEl2, eRecsMap, uer, per, uer2, per2,
                loc = BP_MOD_CONNECT.newL(g_loc, dt_eRecord);
            
            if (MOD_DB.eRecsMapArray.length)
            {
                // Cycle through eRecords starting with the best URL matching node.
                // By assumption, there can be at the most one signin form and one signup
                // form in a frame. Therefore, by design, we capture at most one set of
                // signin eRecords and at most one set of signup eRecords. These assumptions
                // are embodied in the following code.
                l = MOD_DB.eRecsMapArray.length;
                for (i=0, j=l-1; (i<l) && ((!uEl && !pEl) || (!uEl2 && !pEl2)); ++i, j--)
                {
                    eRecsMap = MOD_DB.eRecsMapArray[j];

                    if ((!m_info.k.fmInfo) && (!uEl) && (!pEl))
                    {
                        if (eRecsMap[fn_userid]) { uer = eRecsMap[fn_userid].curr;}
                        if (eRecsMap[fn_pass]) {per = eRecsMap[fn_pass].curr;}

                        if (uer)
                        {
                            uEl = findEl(uer, ctxEl);
                        }
                        if (per)
                        {
                            pEl = findEl(per, ctxEl);
                        }
                    }

                    if ((!m_info.k.fmInfo2) && (!uEl2) && (!pEl2))
                    {
                        if (eRecsMap[fn_userid2]) { uer2 = eRecsMap[fn_userid2].curr;}
                        if (eRecsMap[fn_pass2]) {per2 = eRecsMap[fn_pass2].curr;}

                        if (uer2)
                        {
                            uEl2 = findEl(uer2, ctxEl);
                        }
                        if (per2)
                        {
                            pEl2 = findEl(per2, ctxEl);
                        }
                    }
                }
            }

            var o;
                        
            if (uEl || pEl)
            {   // Pick elements only if they are visible. Implication is that corresponding forms will be
                // visible too. Assumption is made that if the fields are not visible then
                // their forms are hidden as well and therefore we should ignore those forms - they will
                // get picked when they become visible.
                if (uEl && pEl) {
                    if ($(uEl).is(':visible') || $(pEl).is(':visible')) {
                        m_info.k.fmInfo = new FormInfo(formAncestor(uEl), [uEl], [pEl], [{u:uEl, p:pEl}]);
                    }
                }
                else if (uEl && (!pEl)) {
                    if ($(uEl).is(':visible')) {
                        // NOTE: findPeers will catch invisible password fields as well. But many times, the
                        // password field is hidden until the user clicks on it. Hence we need to catch invisible
                        // password fields too - as long as the form is visible overall. This is most likely a
                        // username only form or one where auto-detection of password works - otherwise the user
                        // would've trained both uEl and pEl.
                        o = findPeers(fn_pass, uEl);
                        m_info.k.fmInfo = new FormInfo(formAncestor(uEl), [uEl], o.peers, [{u:uEl, p:o.buddy}]);
                    }
                }
                else if (pEl && (!uEl)) {
                    if ($(pEl).is(':visible')) {
                        // NOTE: findPeers will catch only visible username fields. This is what we want because
                        // normally the username field is visible and the password field is not. Hence it is
                        // save to assume that if the password field is visible then the username field should be
                        // too. This is most likely a password only form or where the auto-detection of username
                        // is adequate - otherwise the user would've trained both uEl and pEl.
                        o = findPeers(fn_userid, pEl);
                        m_info.k.fmInfo = new FormInfo(formAncestor(pEl), o.peers, [pEl], [{u:o.buddy, p:pEl}]);
                    }
                }
            }
            
            if (uEl2 || pEl2)
            {
                if (uEl2 && pEl2) {
                    m_info.k.fmInfo2 = new FormInfo(formAncestor(uEl2), [uEl2], [pEl2], [{u:uEl2, p:pEl2}]);
                }
                else if (uEl2 && (!pEl2)) {
                    o = findPeers(fn_pass, uEl2);
                    m_info.k.fmInfo2 = new FormInfo(formAncestor(uEl2), [uEl2], o.peers, [{u:uEl2, p:o.buddy}]);
                }
                else if (pEl2 && (!uEl2)) {
                    o = findPeers(fn_userid, pEl2);
                    m_info.k.fmInfo2 = new FormInfo(formAncestor(pEl2), o.peers, [pEl2], [{u:o.buddy, p:pEl2}]);
                }
            }
            
            // Mutations may cause the page to change, therfore we never set bScanned to true.
            //m_info.k.bScanned = true;
        }
        
        /**
         * @param ctxEl optional. If present, should be an HTMLElement object. 
         */
        function scan(ctxEl)
        {
            m_info.clearAll();            if (ctxEl && (ctxEl.localName==='input')) {
                ctxEl = ctxEl.parentElement;
            }
            if (!m_info.k.bScanned) {
                scanKnowledge(ctxEl);
            }

            if (m_info.k.fmInfo)
            {
                m_info.signin.push(m_info.k.fmInfo);
            }

            if (m_info.k.fmInfo2)
            {
                m_info.signup.push(m_info.k.fmInfo2);
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
            //$(inp).val(val);
            inp.value = val;
            trigger(inp, 'input');
            inp.blur();
            // trigger(inp, 'change');
        }
        
        function autoFill(userid, pass)
        {
            var u, p, pRecsMap, fInfo;

            if (m_info.signin.length())
            {
                fInfo = m_info.signin.get(0);
                if (fInfo.isVisible()) 
                {
                    if (fInfo.buddys.length) 
                    {   // userPass and multiPass cases.
                        // We'll try all pairs. Only one pair should be visible
                        // and so only one will get filled eventually. If this was
                        // a signup form, then it woudl get filled as well :(
                        iterArray2(fInfo.buddys, this, function(pair)
                        {
                            if (!$([pair.u,pair.p]).filter(':visible').length) {
                                return;
                            }
                            fill(pair.u, userid);
                            fill(pair.p, pass);
                        });
                    }
                    else 
                    {   // buddies not identified, but 
                        if (fInfo.us.length) {
                            // noPass case
                            fill(fInfo.us[0], userid);
                        }
                        if (fInfo.ps.length) {
                            // noUser case
                            fill(fInfo.ps[0], pass);
                        }
                    }
                }
            }        }
        function init()
        {
            if (!g_bInited) {try
            {
                BP_MOD_BOOT.observe(g_doc, MOD_CS.onMutation, {bRemoved:true});
                addEventListener(g_doc, 'change', onChange);
                addEventListener(g_doc, 'click', onClick);
                g_bInited = true;
            }
            catch (ex)
            {
                BP_MOD_ERROR.logwarn(ex);
            }}
        }
        
        return Object.freeze(
        {
            'g_uSel':g_uSel,
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
             var tagName = el.localName, rval = false;
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
             if (el.localName !== 'input') {return false;}
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
                                          ((form&&form.getAttribute('id'))? form.getAttribute('id') : undefined),
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

        function setupDNDWatchers(ctx)
        {
            var $el;
            $el = $(ctx).filter(function(){return this.webkitMatchesSelector(MOD_FILL.g_uSel+",input[type=password]");});
            //$el = $el.add($(ctx).filter(':password'));
            $el = $el.add($(MOD_FILL.g_uSel+",input[type=password]", ctx));

            $el.each(function(i, el)
            {
                var w = w$set(el);

                addEventListener(el, "dragenter", dragoverHandler);
                addEventListener(el, "dragover", dragoverHandler);
                addEventListener(el, "drop", dropHandler);
                //addEventListener(el, "input", function(e){console.log("Watching Input event");});
                //addEventListener(el, "change", function(e){console.log("Waching Change event");});
                if (this.type==='password') {
                    w.ct = CT_BP_PASS;
                    el.dataset[data_ct] = CT_BP_PASS;
                }
                else {
                    w.ct = CT_BP_USERID;
                    el.dataset[data_ct] = CT_BP_USERID;
                }
            }); 
        }

        function onMutation(mutations, observers)
        {
            Array.prototype.forEach.apply(mutations, [function(mutation)
            {
                setupDNDWatchers($(mutation.addedNodes));
            }]);
        }
        
        function init()
        {
            if (!g_bInited) {try
            {
                setupDNDWatchers();
                BP_MOD_BOOT.observe(g_doc, onMutation, {tagName:'input', filterMutes:true});
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
        var m_panel, m_id_panel, m_bUserClosed = false;
        
        function close()
        {
            if (m_id_panel && m_panel /*(panel = w$get('#'+m_id_panel))*/ ) 
            {
                m_panel.destroy();
                m_id_panel = null;
                m_panel = null;
                return true;
            }
            
            return false;          
        }
        
        function destroy()
        {
            if (close()) 
            {
                // Remember to not keep any data lingering around ! Delete data the moment we're done
                // using it. Data should not be stored in the CS if it is not visible to the user.
                MOD_DB.rmData();
                return true;
            }
            
            return false;
        }
        /**
         * Invoked by panel when closed directly from its UI. Not invoke when panel.destroy()
         * is called.
         */
        function onClosed()
        {
            m_panel = null;
            m_id_panel = null;
            m_bUserClosed = true;
            panelClosed(g_loc);
        }

        function create()
        {
            close();
            m_bUserClosed = false;
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
        
        function userClosed()
        {return m_bUserClosed;}
        
        return Object.freeze(
        {
            get: get,
            getc: getc,
            create: create,
            destroy: destroy,
            onClosed: onClosed,
            userClosed: userClosed
        });
    }());
      
    MOD_CS = (function()
    {
        /*
         * Show panel using the dbInfo returned in the response.
         */
        function cbackShowPanel (resp, bConditional)
        {
            try
            {// failure here shouldn't prevent from showing the panel.
                if (resp.result===true)
                {
                    var db = resp.db;
                    console.info("cbackShowPanel@bp_cs.js received DB-Records\n"/* + JSON.stringify(db)*/);
                    try { // failure here shouldn't block rest of the call-flow
                        MOD_DB.ingest(resp.db, resp.dbInfo);
                    } 
                    catch (err) {
                        BP_MOD_ERROR.logwarn(err);
                    }
                }
                else 
                {
                    MOD_DB.clear(); // Just to be on the safe side
                    BP_MOD_ERROR.logdebug(resp.err);
                }
    
                try { // failure here shouldn't block rest of the call-flow 
                    MOD_FILL.scan();
                }
                catch (err) {
                    BP_MOD_ERROR.logwarn(err);
                }
            }
            catch (err) 
            {
                BP_MOD_ERROR.logwarn(err);
            }

            if ((!bConditional) || MOD_FILL.info().autoFillable()) {
                MOD_PANEL.create();
            }
        }

        function cbackShowPanelConditional (resp)
        {
            cbackShowPanel(resp, true);
        }
        
        function showPanelAsync(bConditional)
        {
            if (bConditional) {
                getRecs(g_loc, cbackShowPanelConditional);
            }
            else {
                getRecs(g_loc, cbackShowPanel);
            }
        }
        
        /**
         *  Invoked when a mutation event is received. 
         */
        function onMutation(mutations, observer)
        {
            MOD_FILL.scan(g_doc);
            if ((!MOD_PANEL.get()) && (!MOD_PANEL.userClosed()) && MOD_FILL.info().autoFillable()) {
                MOD_PANEL.create();
            }
        }
        
        /**
         * Invoked by bp_cs_boot when it detects a possible signin/up form on the page.
         */
        function onDllLoad ()
        {
            MOD_FILL.init(); // init only if not already done
            MOD_DND.init(); // init only if not already done
            showPanelAsync(true);
        }

        /**
         * Invoked upon receipt of a click message from bp_main.
         */
        function onClickBP (request, _ /*sender*/, sendResponse)
        {
            onClickComm();
            sendResponse({ack:true});
        }
    
        /**
         * Invoked when bp-command is activated.
         */
        function onClickComm (/*ev*/)
        {
            MOD_FILL.init(); // init only if not already done
            MOD_DND.init(); // init only if not already done
            
            if (!MOD_PANEL.destroy()) // destroy returns true if a panel existed and was destroyed
            {
                //MOD_FILL.info().clearAll();
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
            BP_DLL.onClickBP = onClickBP;
        }

        return Object.freeze(
        {
            main: main,
            showPanelAsync: showPanelAsync,
            onMutation: onMutation
        });
    }());
    
    MOD_CS.main();
    console.log("loaded CS");    
}(window));


