Setting Up BPrivy Dev Environment.

Apart from cloning the git repository, do the following:
1. Create a directory called Dev
2. Clone the BPrivy git repository into Dev/BPrivy.
3. Create a directory called Dev/Thirdparty and downlaod the following. All these should be acknowledged on the website
	and product description.
	a. nodejs from nodejs.org. Install it per instructions from nodejs.org.
	b. install twitter/recess by executing "npm install recess -g" in the command prompt.
	c. boost_1_49_0 (see BPrivy/Plugin/README)
	d. cmake-2.8.8 or latest (see BPrivy/Plugin/README)
	e. firebreath1.7 (see BPrivy/Plugin/README)
	f. GIT-1.7.10 or latest. This should install GIT-bash and GIT GUI (I mostly use GIT GUI).
	g. GitHub software for your platform (from github.com) if you so desire. (I don't use it mostly).
	h. jquery 1.7 or later.
	i. python 2.7.3 or later.
	j. latest bootstrap from twitter/github. The version in use is already copied to Dev/BPrivy so you
	   only need this if you want to upgrade it (which is a good thing to do from time to time). Copy
	   bootstrap.css and bootstrap-responsive.css from the downloaded bundle to Extension/Dev directory where all
	   the other extension files reside, rename their extensions from ".css" to ".less" and wrap the file contents
	   with a #com-bprivy-panel{} block. This will limit all twitter styling to within the bprivy panel element.
	   Run build/buildcss.cmd which will generate bp.css for consumption by the extension.
	   i. bootstrap bundles icons called 'halflings' from Glyphicons. These do not need to be separately
		  downloaded, but it is a good idea to acknowledge their use via. bootstrap toolkit. Include a link
		  to the license page: http://creativecommons.org/licenses/by/3.0/
	k. json2.js from Douglas Crockford. It is a JSON object polyfill.
	l. Get the etld list from www.publicsuffix.org and insert into Chrome Extension/Dev/data and rename it to etld.txt. Then run the build_tools.html and hit build ETLD.
	All these may also be copied from the bprivy dev-environment CD/DVD (but it is a good idea to
	upgrade bootstrap in the least).
4. Thirdparty software used in the product (see additional under the plugin directory):
	a. LESS (less.org) for generating CSS files.
	b. twitter/bootstrap libs for styling.
	c. jquery, jquery-UI, json2 (polyfill by Douglas Crockford)
	d. firebreath, boost and VC++ for plugin development on Windows.
	e. For build-env (plugin): python, cmake, VC++ (Windows).
	f. Build-env HTML/CSS/Javascript parts: Aptana, JSLint (included in aptana), nodejs,
	   recess (less compiler from twitter), node-inspector (npm install node-inspector -g)
