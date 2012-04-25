/**
 * @preserve
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document com_bprivy_GetModule_CSPlatform*/
/*jslint browser:true, devel:true */
/** @remove Only used in debug builds */
"use strict";

/**
 * @ModuleBegin 3eb
 * 3EB = 3P (Personal, Portable, Protected) + Events + Base
 */
/*
 * 3EB Storage features:
 * 1. File System Interface
 *  1. Data is stored in a regular file-folder chosen by the end-user. Gives 
 *     user control of their data.
 *  2. The data may be stored on any file-system, on local hard drive or
 *     networked file-system (e.g. windows share, mac file share) or a cloud
 *     drive (like Google Cloud Drive, Microsoft Sky Drive or DropBox).
 *  3. iOS and Android software will be available that will make the data
 *     available as a shared network drive as well. When that happens, data
 *     on the phone maybe directly plugged into the browser as well.
 *  4. Very basic and file-system features are relied upon. Files are read
 *     completely and only appended to - never written in the middle. File
 *     sizes are maintained to be small enough to easily read an entire file
 *     over the internet. This is different from other client-only DBs like
 *     sqlite, berkeley-DB which won't work well over - say - a cloud drive.
 *  5. Many operations are performed at filesystem level.
 *     For e.g. DB merging may be performed entirely by copying or
 *     concatenating files without making any changes to them. This makes the
 *     job of 'syncing' DBs trivial and it can be trivially done across the
 *     internet as well. Secondly, a lot of the DB metadata is stored in
 *     file names as well as in file-system hierarchy. This makes it possible
 *     to leverage file-system features instead of developing one's own.
 *     Another example is that what corresponds to a DB 'Page' translates to a
 *     single file - this allows 3EB to leverage the filesystems the structure
 *     structure instead of implementing a page table.
 * 2. Portable: The DB is meant to be moved about. It is meant to be stored on
 *    a thumb-drive and used across various devices.
 * 3. Protected. Data is encrypted using state of the art encryption technology.
 * 4. Distributed. This is related to the Portability feature of 3EB.
 *    New data is meant to be generated concurrently on different EBs and can be
 *    very quickly and easily merged and reconciled with zero duplicates. This
 *    is a very strong feature of this DB that makes it stand apart from any
 *    other.
 * 5. Concurrent Access. This feature is related to the 'distributed' nature
 *    of 3EB. The EB can be accessed concurrently by different clients with
 *    no need for file-locking. Some aspects of the distributed design are
 *    utilized in order to provide this feature (they are two sides of the same
 *    coin).
 * 6. Read Often Change Less: This DB is optimized for more reads than edits.
 *    New data maybe freely added, however editing or deleting existing data
 *    will lead to data bloat which will need to be cleaned up from time to
 *    time. It is ideally suited for carrying personal portable data like
 *    passwords, bookmarks etc. which don't change that often.
 *
 * Notes on 3EB storage design:
 * 1. All 3EB data is stored as files in a file-system like hierarchical
 *      structure. 3EB is a collection of event-records. Each event-record
 *      represents an event on the timeline. Each set of event-records
 *      belongs to a Journal. The Journal represents an underlying data-dictionary.
 *      The dictionary is obtained by replaying all the events of a journal in
 *      chronological order. This is done once when the client process loads a
 *      journal into memory. Needless to say, the journal should be small enough
 *      in size to be comfortably loaded into memory all at once. This is a
 *      valid assumption to make for applications such as a personal password
 *      store. Each node of the dictionary - called data-record - has the followng
 *      components:
 *      1) a data-type, 2) a URL forming initial part of its key, 3) a data-key
 *      forming the second part of its key and 3) a set of values.
 *      Correspondingly, each event-record maps on to a single data-record.
 *      Multiple event-records will map to a given data-record. Each
 *      event-record is a JSON object having the following components:
 *      1) a timestamp indicating when it was generated, 2) components of its
 *      corresponding data-record. At this time, now two Journals are envisioned:
 *      1) PJournal - Passwords  and 2) KJournal - Learnt Knowledge.
 *      Each Journal is expected to contain event-records of the same data type,
 *      however that is not mandatory and may change in the future. Records of
 *      the PDB are called P-Records and of KDB, K-Records. Note that unlike an
 *      RDBMS, there is no restriction on the structure of JSON objects of a
 *      Journal, even if they had the same data-type property. Also, JSON
 *      objects of different data-types may all be thrown into the same Journal
 *      if the application chooses to do so. The 3EB semantics is only concerned
 *      with managing data access,  merging and cleanup operations; it doesn't
 *      care about the values carried in each event-record.
 * 2. The root folder has the suffix '.3eb'. The name of the root directory
 *      has the format <EB Name>.3eb. Where <EB Name> is a user-friendly
 *      name given to the DB. This should allow multiple EBs to exist
 *      side-by-side on the same file-system. The EB Name is chosen by
 *      the end-user and if it happens to have charactes not allowed by the
 *      file-system, then the EB name is derived by converting the given name
 *      - for e.g. by url/percent-encoding the disallowed characters. The name
 *      is only used as a folder-name. It has no semantic value. In particular
 *      you could merge two EBs with different names - as long as you had
 *      the password for each.
 * 3. Merge2Sync: 3EB is an event base. Its atomic fundamental concept is an 
 *      event-record. It is a collection of event-records. Everytime the EB is
 *      'opened' by a client-device, all events are 'replayed' and reconciled.
 *      If there are multiple records with the same URL and data-key, then
 *      values from the most recent one will be picked up and the remaining ones
 *      will stay as historical records (in case the user wanted to cycle
 *      through the values). This makes it possible to mix events generated by
 *      different devices. This is the cornerstone of the Merge2Sync concept.
 *      Event-records of different EBs can just be thrown together in order to
 *      achieve a merging of the EBs. Later, when a client reconciles the
 *      records, for reading the most values will automatically bubble up to the
 *      top as already described. No syncing is necessary ! It is also a good
 *      practice to keep historical records in case the user may want to revisit
 *      those. If the number of historical records bloats too much, then one
 *      can always clean-up the EB by:
 *      1. Removing dead records (deleted data-values).
 *      2. Pruning the history to a set number of values per data-record or by 
 *          aging out the historical values that had been out-of-commission
 *          longer than a set period.
 * 4.   Inside the root folder there are various files each with a well
 *      known suffix. Each suffix indicates a file-type.
 *      1. File suffix '.3eo': This suffix indicates an event-file that is open
 *          for appends. This is a journal-file that contains a list of event
 *          records. New records may be appended to such file. Each Journal in
 *          the EB shall have at the most one .3eo file, into wich all new
 *          records of the Journal shall be appended. After a .3eo file reaches
 *          a certain size or age, it is'closed' by renaming it like a .3ec file
 *          (see below). Its filename has the following format:
 *          Journal-Name.<UID>.3eo. Journal-Name at this time can either be
 *          K (Knowledge) or P (Passwords). <UID> is a unique-identifier
 *          generated by the client to avoid file-name clashes in case the date
 *          and timestamp matched. There should normally be only one .3eo file
 *          per EB instance. If one is not found, then the client will create
 *          it. If more than one is found, then the client will pick the last
 *          modified one and close the remaining ones (i.e. convert them to .3ec
 *          files).
 *      2. File suffix '.3ec': This suffix indicates a 'closed' journal-file.
 *          This is a journal-file that contains a list of event-records
 *          New records may not be appended to such file. However, while
 *          'cleaning up' the EB, dead event records may be removed from
 *          such files. These event records would be ones that represent data
 *          that was later removed or changed - as evidenced by a delete
 *          event record further down the time-line in either the same file or a
 *          different file. A .3ec file name has the following format:
 *          Journal-Name.<Date&Time>.<UID>.3ec. <Date&Time> is the <Date&Time>
 *          of creation (not modification) - this will allow easy sorting of
 *          events in chronological order. It will also make it very unlikely
 *          for files generated by two independant devices to have a name
 *          clash. Journal-Name at this time can either be K (Knowledge) or P
 *          (Passwords). <UID> is a unique-identifier generated by the client
 *          to allow multiple 3ec files to exist in an EB - including the case
 *          where the files were generated by different devices.
 *      3. More about event (.3eo and .3ec) files:
 *          These are JSON files containing a list of event-records in JSON
 *          syntax. The contents of the file are a JSON array of JSON objects. 
 *          Each object represents an event-record (dt: P-Record or 
 *          dt: K-Record). In the case of 3eo files, the closing ']' will be
 *          absent and will need to be appended before the file is fed to
 *          JSON.parse. On the other hand content of 3ec files can be directly
 *          fed to JSON.parse. TBD: Encryption.
 *      4. File Suffix '.3em': This is a JSON file generated by converting
 *          the in-memory Data-Dictionary into JSON text. This file will be
 *          loaded by the client instead of replaying the event-files, if no
 *          3ec files were added after generation of this file. The filename
 *          follows the format <Journal Name>.3ed.
 * 5. All the files pertaining to a given dictionary are kept inside a subfolder
 *          of the root called <Dictionary Name>.3ed. This is the dictionary's
 *          root folder. This folder contains all the .3eo, .3em and .3ec files
 *          pertaining to its dictionary/journal. At the time of this writing
 *          there are expected to be the folders K.3ed and P.3ed.
 * 6. All other files are kept in the root folder.
 * 7. Drag and Merge Feature:
 *          In some cases, merging may be obtained simply by dragging and 
 *          dropping 'DB' folder of one EB onto the DB folder of the other and 
 *          selecting
 *          the option to not overwrite any 3ec files. The result of this is
 *          that the target folder will get all 3ec files and, no files
 *          will be clobbered. Since each 3ec file has a <UUID> in it, having a
 *          filename clash implies a repeat merge operation i.e. the two EBs
 *          had been merged perviously. Therefore one can rest assured that
 *          if the filenames are same, then that data is the same because 3ec
 *          files are unchanging. If however, there was a clash of 3eo
 *          filenames, then the largest one must be kept since that certainly
 *          has newer data (3eo files are never pruned). However, the two EBs
 *          may need to be encrypted with the same password for things to
 *          work. Encryption feature is still TBD, so I'm not sure at this point.
 *          These reasons make it difficult to provide merging through a
 *          simple DragAndDrop gesture. The following is the correct merge
 *          procedure:
 *          0. Assume merging from EB1 to EB2.
 *          1. If necessary, ensure that the two EBs use the same password.
 *          2. Close all 3eo files in EB1 and EB2.
 *              2.1 Alternatively, concatenate all .3eo files in EB1 and EB2
 *              combined into a single file (with new name). Remove all the 
 *              old .3eo files. Optionally compact the concatenated .3eo file.
 *              Copy the resulting 3eo file to both sides.
 *          3. Copy all 3ec files of EB1 not known to EB2 into EB2.
 *          4. Copy all 3ec files of EB2 not known to EB1 into EB1.
 *          The above steps while not as trivial as Drag And Drop, can be all
 *          accomplished by using simple filesystem operations without having
 *          to look into the files except to ensure same password. Furthermore,
 *          since previously merged 3ec files won't be copied this will ensure
 *          that only new data is copied over from one filesystem to the other.
 *          This is important if the two filesystems are geographically diverse
 *          - e.g. if one of them is a cloud-drive and the other local. Also,
 *          as noted above, 3eo files are converted to 3ec files after a certain
 *          age. This ensures even more efficient future merges. Additionally,
 *          the following steps may be performed in order to compact the EBs
 *          if the number of files had grown beyond a certain threshold.
 *          5. Close EB2 and clean-up. That is, remove dead records, prune
 *              history and concatenate 3ec files (renaming them appropriately).
 *          6. Overwrite EB1 with EB2 completely. That is, remove all contents
 *              of EB1 and then copy all contents of EB2 into it.
 *              (i.e. rm -rf EB1.3eb/\*; cp EB2.3eb/\* EB1.3eb)
 */
function com_bprivy_GetModule_3eb() {
    // 'enumerated' values used internally only. We need these here in order
    // to be able to use the same values consistently across modules.
    /** @constant */
    var dt_userid = "dt_userid";   // Represents data-type userid
    /** @constant */
    var dt_pass = "dt_pass";        // Represents data-type password
    /** @constant */
    var dt_eRecord = "E-Rec";  // Represents a E-Record (html-element record)
    /** @constant */
    var dt_pRecord = "P-Rec";  // Represents a P-Record (password record)
    /** @constant */
   var cm_getDB = "cm_getDB"; // Represents a getDB command
    /** @constant */
    var PROTO_HTTP = "http:";
    /** @constant */
    var PROTO_HTTPS = "https:";
    /** 
     * Holds knowledge records inside a D-Node.
     * @constant
     * K_EB is a property name that should never
     * clash withe a URL segment. Hence the bracket
     * characters are being used because they are
     * excluded in rfc 3986.
     */ 
    var K_EB = "{keb}";
    //var K_EB2 = "{keb2}";
    /** 
     * Holds username/password records inside a D-Node.
     * @constant
     * P_EB is a property name that should never
     * clash withe a URL segment. Hence the bracket
     * characters are being used because they are
     * excluded in rfc 3986.
     */
    var P_EB = "{peb}";
        
    var postMsgToMothership = com_bprivy_GetModule_CSPlatform().postMsgToMothership;
    var rpcToMothership = com_bprivy_GetModule_CSPlatform().rpcToMothership;
   
    function ERecord() 
    {
        var descriptor = {writable: true, enumerable: true, configurable: true};
        var descriptor2 = {writable: true, enumerable: true, configurable: false};
        Object.defineProperties(this, 
        {
            dt: {value: dt_eRecord, writable: false, enumerable: true, configurable: false},
            loc: descriptor,
            fieldType: descriptor2,
            tagName: descriptor2,
            id: descriptor2,
            name: descriptor2,
            type: descriptor2
        });
        Object.preventExtensions(this);
    }
    ERecord.prototype.toJson = function ()
    {
        return JSON.stringify(this, null, 2);
    };
    function constructERecord() {
        return new ERecord();    
    }

    function PRecord() 
    {
        Object.defineProperties(this,
            {
                dt: {value: dt_pRecord, writable: false, enumerable: true, configurable: false},
                loc: {writable: true, enumerable: true, configurable: true},
                userid: {writable: true, enumerable: true, configurable: false},
                pass: {writable: true, enumerable: true, configurable: false}
            }
        );
        Object.preventExtensions(this);
    }
    function constructPRecord()
    {
        return new PRecord();
    }
    /** 
     * Dissects document.location into URL segment array suitable for
     * insertion into a DNode.
     */
    function newUrla (l)
    {
        var ha, pa, qa, pr, pn, urla = [], i, s;

        // Split hostname into an array of strings.
        ha = l.hostname.split('.');
        ha.reverse();
        
        // Split pathname into path segments.
        // First remove leading slashes
        s = l.pathname.replace(/^\/+/,'');
        // Now split into an array of strings.
        pa = s.split('/');

        qa = l.search.split('&');
        if (l.protocol) {
            pr = l.protocol.toLowerCase();
        }
        
        if (l.port) {
            i = Number(l.port);
            switch(pr) {
                case PROTO_HTTP:
                    if(i !== 80) {pn = i;}
                break;
                case PROTO_HTTPS:
                    if(i !== 443) {pn = i;}
                break;
                default:
                    pn = i;
            }
        }
        
        // Construct the url segment array
                // if (pr) {
            // switch(pr) {
               // case PROTO_HTTP:
                    // urla.push('{s}http');
                    // break;
                // case PROTO_HTTPS:
                    // urla.push('{s}https');
                    // break;
                // default:
                    // urla.push('{s}' + pr);           
            // }
        // }

        if (ha) {
            for (i=0; i<ha.length; i++) {
                if (i===0) {
                    // Top-Level Domain. Doesn't account for TLDs like 'co.in' though.
                    urla.push('{t}' + ha[i].toLowerCase());
                }
                else if (i === (ha.length-1)) {
                    // Host name
                    urla.push('{h}' + ha[i].toLowerCase());
                }
                else {
                    // Second level domain
                    urla.push('{d}' + ha[i].toLowerCase());
                }
            }
        }
        if (pn) {urla.push('{o}' + pn);}
        if (pa) {
            for (i=0; i<pa.length; i++) {
                if (pa[i] !== '') {
                    urla.push('{p}' + pa[i]);
                }
            }
        }
        
        return urla;
    }

    /** ModuleInterfaceGetter 3db */
    function getModuleInterface(url)
    {
        var saveRecord = function (eRec)
        {
            postMsgToMothership(eRec);
        };
        
        var deleteRecord = function (erec)
        {
            console.warning('Deleting Record ' + JSON.stringify(erec));
        };
        
        var getDB = function(loc, callback)
        {
            return rpcToMothership({dt:cm_getDB, loc: loc}, callback);
        };

        var recKey = function(rec)
        {
            if (rec.dt === dt_eRecord) {
                return rec.fieldType;
            }
            else if (rec.dt === dt_pRecord) {
                return rec.userid;
            }
        };
        
        //Assemble the interface    
        var iface = {};
        Object.defineProperties(iface, 
        {
            dt_userid: {value: dt_userid},
            dt_pass: {value: dt_pass},
            dt_eRecord: {value: dt_eRecord},
            dt_pRecord: {value: dt_pRecord},
            cm_getDB: {value: cm_getDB},
            K_EB: {value: K_EB},
            //K_EB2: {value: K_EB2},
            P_EB: {value: P_EB},
            saveRecord: {value: saveRecord},
            deleteRecord: {value: deleteRecord},
            constructERecord: {value: constructERecord},
            constructPRecord: {value: constructPRecord},
            getDB: {value: getDB},
            newUrla: {value: newUrla},
            recKey: {value: recKey}
        });
        Object.freeze(iface);

        return iface;
    }
    
    var bp_3eb = getModuleInterface();

return bp_3eb;}
/** @ModuleEnd */