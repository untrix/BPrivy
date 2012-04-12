/*

 @author Sumeet Singh
 @mail sumeet@untrix.com
 @copyright Copyright (c) 2012. All Right Reserved, Sumeet S Singh
*/
function com_bprivy_GetModule_3db(){function b(){var a={value:void 0,writable:!0,enumerable:!0,configurable:!1};Object.defineProperties(this,{dt:{value:"E-Record",writable:!1,enumerable:!0,configurable:!1},location:a,key:a,tagName:a,id:a,name:a,type:a});Object.preventExtensions(this)}function g(){return new b}function h(a){var c,e,b,d,f=[];c=a.hostname.split(".");c.reverse();e=a.pathname.replace(/^\/+/,"").split("/");a.search.split("&");a.protocol&&(b=a.protocol.toLowerCase());if(a.port)switch(a=
Number(a.port),b){case "http:":80!==a&&(d=a);break;case "https:":443!==a&&(d=a);break;default:d=a}if(c)for(a=0;a<c.length;a++)f.push(c[a]+".");d&&f.push(":"+d);if(e)for(a=0;a<e.length;a++)f.push("/"+e[a]);return f}var i=com_bprivy_GetModule_CSPlatform().postMsgToMothership;b.prototype.toJson=function(){return JSON.stringify(this,null,2)};return function(){var a={};Object.defineProperties(a,{dt_userid:{value:"userid",writable:!1,enumerable:!1,configurable:!1},dt_pass:{value:"pass",writable:!1,enumerable:!1,
configurable:!1},dt_eRecord:{value:"E-Record",writable:!1,enumerable:!1,configurable:!1},dt_kRecord:{value:"K-Record",writable:!1,enumerable:!1,configurable:!1},saveERecord:{value:function(a){i(a)},writable:!1,enumerable:!1,configurable:!1},constructERecord:{value:g,writable:!1,enumerable:!1,configurable:!1},getUrla:{value:h,writable:!1,enumerable:!1,configurable:!1}});Object.seal(a);return a}()};
