Setting Up BPrivy Dev Environment.

Apart from cloning the git repository, do the following:
1. Create a directory called Dev
2. Clone the BPrivy git repository into Dev/BPrivy.
3. Create a directory called Dev/Thirdparty and downlaod the following:
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
	   only need this if you want to upgrade it (which is a good thing to do from time to time).
	k. json2.js from Douglas Crockford. It is a JSON object polyfill.
	All these may also be copied from the bprivy dev-environment CD/DVD (but it is a good idea to
	upgrade bootstrap in the least).
4. Thirdparty software used in the product (besides those for the plugin):
	a. LESS (less.org) for generating CSS files.
	b. twitter/bootstrap libs for styling.
	c. jquery and jquery-UI
	d. firebreath, boost and VC++ for plugin development on Windows.
	e. For build-env (plugin): python, cmake, VC++ (Windows).
	f. Build-env HTML/CSS/Javascript parts: Aptana, JSLint (included in aptana), nodejs, recess (less compiler from twitter).