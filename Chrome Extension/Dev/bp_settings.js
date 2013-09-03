/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012-2013 Untix Inc
 * All Rights Reserved
 */

/**
 * @ModuleBegin BP_SETTINGS
 * Manages get/put of all localStorage Settings except those in bp_wallet_form.
 * BP_WALLET_FORM.SETTINGS should eventually get rolled into this.
 */
var BP_GET_SETTINGS = function(g)
{
    "use strict";
    var window = null, document = null, console = null, $ = g.$, jQuery = g.jQuery,
        g_win = g.g_win,
        g_doc = g_win.document;
    /** @import-module-begin **/
    var BP_COMMON = IMPORT(g.BP_COMMON),
        BP_ERROR = IMPORT(g.BP_ERROR);
    /** @import-module-end **/

    /** @globals-begin */
    var exports,
        prop_main_inited = "m.inited",
        prop_prefix_dbPath = 'db.path.';
    /** @globals-end */

    /**
     * This function is only to be used for cases where the setting-props are not
     * known upfront - e.g. DB-Names because those are set by the user. All such
     * variable prop-names should be prefixed by a fixed prefix so that they won't
     * overlap with prop-names used somewhere else. Examples prefixes are 'db.path.'
     * and 'db.masterkey.'.
     *
     */
    function construct(propPrefix)
    {
        var o = {},
            n = propPrefix.length;

        BP_COMMON.iterObj(localStorage, localStorage, function(key, value)
        {
            if (key.indexOf(propPrefix) === 0) {
                o[key.slice(n)] = value;
            }
        });

        return o;
    }

    /**
     * At this time only used inside BP_WALLET_FORM
     *
     * Erases all variable properties with the supplied name-prefix.
     */
    // function eraseProps(propPrefix)
    // {
        // BP_COMMON.iterObj(localStorage, localStorage, function(key)
        // {
            // if (key.indexOf(propPrefix) === 0) {
                // delete localStorage[key];
            // }
        // });
    // }

    function hasDBPaths ()
    {
        var ret = Object.keys(construct(prop_prefix_dbPath)).length > 0;
        return ret;
    }

    /**
     * App inited or not.
     */
    function getInited()
    {
        return localStorage[prop_main_inited];
    }

    /**
     * App inited
     */
    function setInited()
    {
        return localStorage[prop_main_inited] = true;
    }

    return exports = Object.freeze(
    {
        getInited: getInited,
        setInited: setInited,
        hasDBPaths: hasDBPaths
    });
};
