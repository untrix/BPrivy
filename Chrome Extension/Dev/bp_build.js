/**
 * @preserve
 * Copyright (c) 2013. All Rights Reserved, Untrix Inc
 */

//////////// DO NOT HAVE DEPENDENCIES ON ANY BP MODULE OR GLOBAL ///////////////////

if (typeof RELEASE === 'undefined') {
    RELEASE = false;
}

function IMPORT(sym)
{
    "use strict";
    var window = null, document = null; // console = null;
    if(sym===undefined || sym===null)
    {
        if (!RELEASE) {
            throw new ReferenceError("Linker:Symbol Not Found");
        }
        else {
            console.log("Linker:Symbol Not Found");
        }
    }

    return sym;
}

// Dummy function
function IMPORT_LATER() {"use strict";}
