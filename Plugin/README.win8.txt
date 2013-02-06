The following software is required to build the BPrivy plugin:
1. Skip this step (Firebreath is already in SCM). Download firebreath into BPrivy/Plugin/firebreath1.7: git git://github.com/firebreath/FireBreath.git -b firebreath1.7 firebreath1.7
2. MS Visual Studio 2010 Express or MS Visual Studio 2010
3. If using MSVS Express, you will need to download and install Windows Driver Kit 7.1.0 (WDK) http://msdn.microsoft.com/en-us/windows/hardware/hh852361. If using full version of MSVS, you don't need the WDK.
4. CMake (v2.8.8 being used today) from www.cmake.org. Install in default location.
5. Python 2.6 or above (2.7.3 being used today). Install it in the default location.
6. Skip this step - we're using Firebreath supplied boost libs. Get boost 1.49 from www.boost.org. Download source and build and install it into BPrivy/boost.
7. Skip this step - we're using Firebreath supplied boost libs. Build the boost libraries:
	1. Unzip into - say - $Boost_Build_Dir
	2. cd $Boost_Build_Dir
	3. .\bootstrap
	4. .\bjam link=static threading=multi runtime-link=shared runtime-link=static
	5. .\b2 install
	6. .\b2 install-proper
		This will install into C:\Boost
	7. cd C:\Boost\lib
7.2 Bulid openssl libraries:
	1. Skip this step because openssl is already available in the SCM. Download and unzip openssl v1.0.0c to - say - $Openssl_Dist. The distribution may alread be in the SCM.
	2. Read $Openssl_Dist/INSTALL.W32
	3. Download and install nasm as instructed in INSTALL.W32 (http://nasm.sourceforge.net/), or form the thirdparty CD. The 'installer' just copies files. You'll need to setup the path environment by hand. Best is to ignore the installer and instead just download the zip file and unzip it into a suitable location and then manually edit the path env. var.
	4. Download and install ActiveState Perl as instructed in INSTALL.w32 (from 	http://www.activestate.com/ActivePerl), or from the thirdparty CD.
	##5. Open a command prompt and make sure that no Unix env. is in the path (e.g. remove cygwin, MinGW etc. from the path).
	6. Open up Visual Studio 2010 and open a command prompt (Tools->Visual Studio Command Prompt). Inside the command prompt execute the rest of the procedure:
		You can also setup the visual studio environment (C:\Program Files (x86)\Microsoft Visual Studio 10\Common7\Tools\vsvars32.bat). But the above is preferrable.
	7. Follow instructions from INSTALL.W32 to build the static libraries with some additional options.
		7.a		perl Configure VC-WIN32 --prefix=c:\openssl no-idea no-mdc2 no-rc5
		Refer to the Configure & README files for a description of these options. In the case of Mac/Linux supply --prefix=/openssl instead of C:\openssl
		7.b		ms\do_nasm
		7.c		nmake -f ms\nt.mak
				nmake -f ms\ntdll.mak
		7.d		nmake -f ms\nt.mak test (Make sure that all tests pass).
				nmake -f ms\ntdll.mak test
		7.e		nmake -f ms\nt.mak install (installs to C:\openssl)
				nmake -f ms\ntdll.mak install
8. 
NOTE: Currently we're using firebreath-provided boost, which will get downloaded when the prep script is run. This step is for documentation purpose only. Skip to next step.

Eventhough FireBreath documentation says that you can use system-boost libs by supplying "-D WITH_SYSTEM_BOOST=1", that doesn't actually work. CMake simply ignores all the command-line variables supplied. Supplying the variables inside a 'cmake initial-cache file' worked, so I've used that technique. The following more intrusive techniques also worked but are not necessary. But I'm keeping them below in case we'll need them for the future.

	Hence these will need to be set inside firebreath1.7\CMakeLists.txt file. At the top somewhere add the line:
	option(WITH_SYSTEM_BOOST "Build with system Boost" ON)
	This overrides a similar line (but with value OFF) inside firebreath1.7\cmake\options.cmake. We could've instead changed that option line to 'ON' and that would've worked as well, but modifyin the CMakeLists.txt appears more robust since that file is guaranteed to be present in any CMake based build system but options.cmake may get removed tomorrow. Doing this will force CMake to look for system boost files. Now, normally it requires the variable BOOST_DIR and a bunch of other variables supplied on the command line - but for some reason it is ignoring all those in reality. Probably due to the way FireBreath sets it up. Right now just turning the option to 'ON' is working so we'll leave it at that.
	We can also achieve the override by first building the project once (next step) and then going and changing the WITH_SYSTEM-BOOST option in plugin-win-build/CMakeCache.txt file to 'ON' instead of 'OFF'. But that would require creating the project first with the internal boost libraries that come with FireBreath.
8.2. Download and install Wix 3.5 or above. Get it from the BPrivy downloads DVD or download from http://wixtoolset.org. If installing Wix 3.6 or 3.7, you'll need to fix the WiX environment variable otherwise cmake won't generate a Wix project. So do this: remove the trainling backslash ('\') from the WiX env. variable's value. WiX has a MPL type license. NOTE: This must be done before the next step, otherwise the installer project won't be generated.
9. After all the above is done then run the firebreath\prep2012.cmd in the Windows PowerShell ISE in order to make the build directory:
	.\firebreath\prep2012.cmd .\plugin-win-src .\plugin-win-build-VS2012 -C D:\Dev\BPrivy\Plugin\plugin-win-src\BPrivy\CMakeInitialCache_Win32_Dynamic.txt

	This will create plugin-win-build-*\FireBreath.sln. Some error is printed regarding not being able to process initial cache, but the project gets build with the system-boost libs anyway.
10. Open FireBreath.sln in VC++ Express 2010. Verify (Right-Click BPrivy then Properties) that the libs in C:\Boost are being linked-  thread, system, date_time and filesystem.
11.	Build the project called "ALL_BUILD". If you get an error saying that the PCH heap limit is exceeded and that you should use supply a higher /Zm value then do as recommended. (e.g. provide 'Additional Option' /Zm170 under C/C++->Command Line of the failed project)
12. Windows Platform Support - XP and above (WINVER, _WIN32_WINNT, NTDDI_VERSION >= 0x0501). See win_targetver.h.
	Requires: Kernel32.dll (for filesystem api), Comdlg32.lib (for GetOpenFilename for chooseFileXP), Ole32.lib and Shell32.lib (for SHBrowseForFolderW for chooseFolderXP), Ole32.lib (for OleInitialize, CoCreateInstance etc. for CommonItemDialog for BPrivyAPI::_choose)
13. NOTE: public domain scrypt source code is also used within the product.