Following thirdparty software is needed:
1. nodejs (get from nodejs.org)
2. npm (package manager for node)
3. Recess node-module should be locally installed in this directory (npm install recess).
   Is already checked in, but needs updating once in a while.
4. node-inspector (npm install node-inspector -g) is needed if you want to debug buildcss.js
5. npm install -S fs.extra
6. npm install rimraf
7. npm install uglify-js

Run buildcss.js as follows:
a. Run buildcss.cmd on windows
    OR
b. node buildcss.js ..

buildcss.js will build bp.css in both Dev and Prod folders. 
