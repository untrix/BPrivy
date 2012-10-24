The following software is required to build the BPrivy plugin:
1. Download firebreath into BPrivy/Plugin/firebreath1.7: git git://github.com/firebreath/FireBreath.git -b firebreath1.7 firebreath1.7
2. MS Visual C++ 2010 Express
3. Windows Driver Kit 7.1.0 (WDK) http://msdn.microsoft.com/en-us/windows/hardware/hh852361
4. CMake (v2.8.8 being used today) from www.cmake.org. Install in default location.
5. Python 2.6 or above (2.7.3 being used today). Install it in the default location.
6. Get boost 1.49 from www.boost.org. Download source and build and install it into BPrivy/boost.
7. Build the boost libraries:
	1. Unzip into - say - $Boost_Build_Dir
	2. cd $Boost_Build_Dir
	3. .\bootstrap
	4. .\bjam link=static threading=multi runtime-link=shared runtime-link=static
	5. .\b2 install
	6. .\b2 install-proper
		This will install into C:\Boost
	7. cd C:\Boost\lib
8. Eventhough FireBreath documentation says that you can use system-boost libs by supplying "-D WITH_SYSTEM_BOOST=1", that doesn't actually work. CMake simply ignores all the command-line variables supplied. Supplying the variables inside a 'cmake initial-cache file' worked, so I've used that technique. The following more intrusive techniques also worked but are not necessary. But I'm keeping them below in case we'll need those for other build environments.

	Hence these will need to be set inside firebreath1.7\CMakeLists.txt file. At the top somewhere add the line:
	option(WITH_SYSTEM_BOOST "Build with system Boost" ON)
	This overrides a similar line (but with value OFF) inside firebreath1.7\cmake\options.cmake. We could've instead changed that option line to 'ON' and that would've worked as well, but modifyin the CMakeLists.txt appears more robust since that file is guaranteed to be present in any CMake based build system but options.cmake may get removed tomorrow. Doing this will force CMake to look for system boost files. Now, normally it requires the variable BOOST_DIR and a bunch of other variables supplied on the command line - but for some reason it is ignoring all those in reality. Probably due to the way FireBreath sets it up. Right now just turning the option to 'ON' is working so we'll leave it at that.
	We can also achieve the override by first building the project once (next step) and then going and changing the WITH_SYSTEM-BOOST option in plugin-win-build/CMakeCache.txt file to 'ON' instead of 'OFF'. But that would require creating the project first with the internal boost libraries that come with FireBreath.
8.2. Download and install Wix 3.5 (not 3.6). Get it from the BPrivy downloads DVD or download from http://wixtoolset.org (be sure to only install v3.5, later versions won't work). WiX has a MPL type license. NOTE: This must be done before the next step, otherwise the installer project won't be generated.
9. After all the above is done then run the firebreath\prep2010.cmd in the Windows PowerShell ISE in order to make the build directory:
	.\firebreath1.7\prep2010.cmd .\plugin-win-src .\plugin-win-build-static -C C:\Dev\BPrivy\Plugin\plugin-win-src\BPrivy\CMakeInitialCache_Win32_Static.txt
	.\firebreath1.7\prep2010.cmd .\plugin-win-src .\plugin-win-build-dynamic -C C:\Dev\BPrivy\Plugin\plugin-win-src\BPrivy\CMakeInitialCache_Win32_Dynamic.txt
	This will build plugin-win-build\FireBreath.sln. Some error is printed regarding not being able to process initial cache, but the project gets build with the system-boost libs anyway.
10. Open FireBreath.sln in VC++ Express 2010. Verify (Right-Click BPrivy then Properties) that the libs in C:\Boost are being linked-  thread, system, date_time and filesystem.
11.	Build the project called "ALL_BUILD". If you get an error saying that the PCH heap limit is exceeded and that you should use supply a higher /Zm value then do as recommended. (e.g. provide 'Additional Option' /Zm170 under C/C++->Command Line of the failed project)
12. Windows Platform Support - XP and above (WINVER, _WIN32_WINNT, NTDDI_VERSION >= 0x0501). See win_targetver.h.
	Requires: Kernel32.dll (for filesystem api), Comdlg32.lib (for GetOpenFilename for chooseFileXP), Ole32.lib and Shell32.lib (for SHBrowseForFolderW for chooseFolderXP), Ole32.lib (for OleInitialize, CoCreateInstance etc. for CommonItemDialog for BPrivyAPI::_choose)