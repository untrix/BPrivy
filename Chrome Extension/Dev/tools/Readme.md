## Following thirdparty software is needed:

1. nodejs (get from nodejs.org)
2. npm (package manager for node)
3. Recess node-module should be locally installed in this directory (npm install recess).
   Is already checked in, but needs updating once in a while.
4. node-inspector (npm install node-inspector -g) is needed if you want to debug buildcss.js
5. npm install -S fs.extra
6. npm install rimraf
7. npm install uglify-js

### Run build.js on Windows as follows:

	build.cmd [all] [force]

buildcss.js will build bp.css in Dev as well as build folders. 
