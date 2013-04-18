* Download eTLD/public-suffix list from
	1. http://mxr.mozilla.org/mozilla-central/source/netwerk/dns/effective_tld_names.dat?raw=1
	or
	2. publicsuffix.org/list
* Name it etld.txt
* Note, if there are any additions to make to the downloaded etld list, then put those into bp_etld_overrides.txt
  before you execute the next step.
* Load ../tools.html and press the button Build ETLD, select the file (etld.txt).
  It will create and write a file called etld.json.
* Copy etld.json into the ../data folder. It will eventually get loaded into the extension at runtime.
