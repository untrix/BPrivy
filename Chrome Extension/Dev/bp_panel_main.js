/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* JSLint directives */
/*global $, console, window, BP_MOD_CONNECT, BP_MOD_CS_PLAT, IMPORT, BP_MOD_COMMON,
  BP_MOD_ERROR, BP_MOD_MEMSTORE, BP_MOD_W$, BP_MOD_TRAITS, BP_MOD_WDL */
 
/*jslint browser:true, devel:true, es5:true, maxlen:150, passfail:false, plusplus:true, regexp:true,
  undef:false, vars:true, white:true, continue: true, nomen:true */

/**
 * @ModuleBegin PANEL_MAIN
 */
function BP_GET_PANEL(gg_win)
{
    "use strict";
    var window = null, document = null;
    var m;
    /** @import-module-begin Traits */
    m = IMPORT(BP_MOD_TRAITS);
    var RecsIterator = IMPORT(m.RecsIterator),
        dt_eRecord = IMPORT(m.dt_eRecord),
        dt_pRecord = IMPORT(m.dt_pRecord),
        fn_userid = IMPORT(m.fn_userid),   // Represents data-type userid
        fn_userid2= IMPORT(m.fn_userid2),
        fn_pass2 = IMPORT(m.fn_pass2),
        fn_pass = IMPORT(m.fn_pass),        // Represents data-type password
        fn_btn  = IMPORT(m.fn_btn),
        CT_BP_FN = IMPORT(m.CT_BP_FN),
        CT_TEXT_PLAIN = IMPORT(m.CT_TEXT_PLAIN),
        CT_BP_PREFIX = IMPORT(m.CT_BP_PREFIX),
        CT_BP_USERID = IMPORT(m.CT_BP_USERID),
        CT_BP_PASS = IMPORT(m.CT_BP_PASS);        // Submit button
    /** @import-module-begin Connector */
    m = BP_MOD_CONNECT;
    var getRecs = IMPORT(m.getRecs),
        newERecord = IMPORT(m.newERecord),
        newPRecord = IMPORT(m.newPRecord),
        panelClosed = IMPORT(m.panelClosed);
    /** @import-module-begin */
    m = BP_MOD_WDL;
    var cs_panel_wdt = IMPORT(m.cs_panel_wdt),
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
    var gg_loc = IMPORT(gg_win.location),
        //gg_doc = IMPORT(gg_win.document),
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
    MOD_PANEL = (function()
    {
        var m_panel, m_id_panel, m_bUserClosed = false;
        
        function close()
        {
            if (m_id_panel && m_panel /*(panel = w$get('#'+m_id_panel))*/ ) 
            {
                m_panel.destroy();
                m_id_panel = undefined;
                m_panel = undefined;
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
            m_panel = undefined;
            m_id_panel = undefined;
            m_bUserClosed = true;
            panelClosed(g_loc);
        }

        function create()
        {
            close();
            m_bUserClosed = false;
            var ctx = {
                it: new RecsIterator(MOD_DB.pRecsMap),
                it2: new RecsIterator(MOD_DB.tRecsMap),
                reload:MOD_PANEL.create, // this function
                onClosed:onClosed,
                saveRec: MOD_CS.saveRec,
                delRec: MOD_CS.delRec,
                delTempRec: MOD_CS.delTempRec,
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

            //if ((!bConditional) || MOD_FILL.info().autoFillable() || MOD_DB.numUnsaved) {
            if ((!bConditional) || MOD_DB.numUnsaved) {
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
            MOD_FILL.setMutationScanned();
            if ((!MOD_PANEL.get()) && (!MOD_PANEL.userClosed()) && MOD_DB.numUnsaved) {
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
            if (sendResponse) {sendResponse({ack:true});}
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

        function saveRec (rec, dt, callbackFunc, toTemp)
        {
            var func = toTemp ? BP_MOD_CONNECT.saveTempRec : BP_MOD_CONNECT.saveRecord;
            // We could cache non-TRecs records as well but not needed by use-cases right now
            if (toTemp) {MOD_DB.saveTRec(rec);} // We could do this for non-TRecs as well...
            func(rec, dt, function(resp)
            {
                if (resp.result && resp.recs) {
                    if (!toTemp) {MOD_DB.ingestDT(resp.recs, dt);}
                    else {MOD_DB.ingestT(resp.recs);}
                }
                if (callbackFunc) {
                    callbackFunc(resp);
                }
            });
        }

        function delRec (rec, dt, callbackFunc, toTemp)
        {
            // We could cache non-TRecs records as well but that's not needed by use-cases
            // right now
            if (toTemp) {MOD_DB.delTRec(rec);}
            BP_MOD_CONNECT.sendDelActn(rec, dt, function(resp)
            {
                if (resp.result && resp.recs) {
                    if (!toTemp) {MOD_DB.ingestDT(resp.recs, dt);}
                    else {MOD_DB.ingestT(resp.recs);}
                }
                if (callbackFunc) {
                    callbackFunc(resp);
                }
            }, false, toTemp);
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
            onMutation: onMutation,
            saveRec: function(a,b,c) {saveRec(a,b,c);},
            saveTempRec: function(a,b,c) {saveRec(a,b,c,true);},
            delRec: function(a,b,c) {delRec(a,b,c);},
            delTempRec: function(a,b,c) {delRec(a,b,c,true);},
        });
    }());
    
    MOD_CS.main();
    console.log("loaded CS");    
}