/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */

/* Global declaration for JSLint */
/*global document */

// The following pattern defines a module, all who's contents are encolsed inside a
// anonymous function scope. The returned object holds references to the public
// functions and variables only. The remaining members are private to the module.
function construct3dbCache(url) 
{
	// Fields of an event-record
	var fields = ['username', 'password', 'url', 'tag', 'tag_id', 'tag_name'];
	
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

