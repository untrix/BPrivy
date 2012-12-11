Open solution: libcrypt.sln and build everything inside it. Firebreath.sln depends on the
output of this.
The following thirdparty libs are needed to build libcrypt.

1. Openssl. Instructions on how to build are located in BPrivy/Plugin/README.win32.txt. Finally,
	openssl needs to be installed into C:\openssl. The Win32 build environment is setup with that
	assumption.
2. Scrypt: The source files are already checked into the SCM and are built from within the MS-VS2010
	solution libcrypt.sln
	However, should you wish to update the version of scrypt (from 1.1.6 to something
	else, then you'll need to copy over the relavent files into BPrivy/Plugin/libcrypt/scrypt
	and make any necessary changes to libscrypt.proj, libcrypt.proj and libcrypt.sln