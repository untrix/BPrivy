/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document */

// The following pattern defines a module, all who's contents are encolsed inside a
// anonymous function scope. The returned object holds references to the public
// interface of the module. The remaining functions and variables are private to the module.
//var bpModule3db = (function () {
/*ModuleBegin */

/*ModuleInterfaceGetter 3db */
function getModuleInterface(url) 
{
	// Fields of an event-record
	var fields = ['username', 'password', 'url', 'tag'];
	
	var saveRecord = function(o)
	{
		if (o && o.url && o.username)
		{
			var url = sanitizeUrl(o.url);
			eRecords[url][o.username] = o;
			return true;
		}
		else
			return false;
	}
	
	var getRecord = function(url, username)
	{
		if (url && username)
			return eRecords[url][username];
	}

	return {"saveRecord": saveRecord,
			"getRecord": getRecord};
}


var bpModule3db = getModuleInterface();
/*ModuleEnd */
//return getModuleInterface();}());