/**
 * @author Sumeet Singh
 * @mail sumeet@untrix.com
 * @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
 */
/* Global declaration for JSLint */
/*global document */

Function.prototype.defineMethod = function (name, value)
{
	this.prototype[name] = value;
	return this;
}
