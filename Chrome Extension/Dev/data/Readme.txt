* Download eTLD/public-suffix list from
	1. http://mxr.mozilla.org/mozilla-central/source/netwerk/dns/effective_tld_names.dat?raw=1
	or
	2. publicsuffix.org/list
* Name it etld.txt
* Load ../tools.html and press the button Build ETLD, select the file (etld.txt).
  It will create and write a file called etld.json which will eventually get loaded into the extension
  at runtime.