#include <cstdlib>
#include "BPi18n.h"
#include "Utils.h"
#include "BPrivyAPI.h"
#include "ErrorHandling.h"
#ifdef WIN32
#include <mbctype.h>
#endif


namespace bp 
{
#if 0 
	// Not being used at this time.
	void i18n() 
	{
		// Assume that the locale is set correctly automatically.
		// Make the multibyte codepage same as the locale codepage so that
		// all conversion routines (whether local routines or multibyte routines)
		// will perform the same conversions.
		_setmbcp(_MB_CP_LOCALE);
	}
#endif

	utf8 i18n::LocaleToUtf8(const char* s)
	{
		static const char* conv_err = "BPError: could not convert error string to wcs";
		// Convert from locale charset to UNICODE by converting to wchar_t.
		size_t n = mbstowcs(NULL, s, 0);
		if (n) 
		{
			n++; // Add one for null terminator
			MemGuard<wchar_t> buf(n);//throws
			size_t r = mbstowcs((wchar_t*)buf, s, n);
			if (r == (size_t)-1) {
				return conv_err;
			}
			else {
				return FB::wstring_to_utf8((wchar_t*)buf);
			}
		}
		else {
			return conv_err;
		}
	}

	ustring i18n::LocaleToUnicode(const std::string& str)
	{
		static const wchar_t conv_err[] = L"BPError: could not convert error string to wcs";
		// Convert from locale charset to UNICODE by converting to wchar_t.
		const char* s = str.c_str();
		size_t n = mbstowcs(NULL, s, 0);
		if (n) 
		{
			n++; // Add one for null terminator
			MemGuard<wchar_t> buf(n);//throws
			size_t r = mbstowcs((wchar_t*)buf, s, n);
			if (r == (size_t)-1) {
				return conv_err;
			}
			else {
				return (wchar_t*)buf;
			}
		}
		else {
			return conv_err;
		}
	}
}// end namespace bp

/*******************************************************************************************************/
/************* API INGRES POINTS. ENSURE THAT WE'RE ONLY INJECTING UNICODE INTO THE SYSTEM *************/
/*******************************************************************************************************/

bool BPrivyAPI::ls(const bp::ucs& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	return _ls(path, &bp::JSObject(out));
}

bool BPrivyAPI::exists(const bp::ucs& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	return _exists(path, &bp::JSObject(out));
}

bool BPrivyAPI::appendFile(const bp::ucs& path_s, const std::string& data, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	bp::JSObject o(out);
	return _appendFile(path, data, &o);
}

bool BPrivyAPI::readFile(const bp::ucs& path_s, FB::JSObjectPtr out, const boost::optional<unsigned long long> pos)
{
	bfs::path path(path_s); path.make_preferred();
	return _readFile(path, &bp::JSObject(out), pos);
}

bool BPrivyAPI::createDir(const bp::ucs& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	bp::JSObject o(out);
	return _createDir(path, &o);
}

bool BPrivyAPI::rm(const bp::ucs& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	bp::JSObject o(out);
	return _rm(path, &o);
}
bool BPrivyAPI::rename(const bp::ucs& old_p, const bp::ucs& new_p, FB::JSObjectPtr out, const boost::optional<bool> clobber)
{
	bfs::path o_path(old_p); o_path.make_preferred();
	bfs::path n_path(new_p); n_path.make_preferred();
	bp::JSObject o(out);
	return _rename(o_path, n_path, &o, clobber);
}

bool BPrivyAPI::copy(const bp::ucs& old_p, const bp::ucs& new_p, FB::JSObjectPtr out, const boost::optional<bool> clobber)
{
	bfs::path o_path(old_p); o_path.make_preferred();
	bfs::path n_path(new_p); n_path.make_preferred();
	bp::JSObject o(out);
	return _copy(o_path, n_path, &o, clobber);
}
bool BPrivyAPI::chooseFile(FB::JSObjectPtr out)
{
	bp::JSObject o(out);
	//return _chooseFileXP(&o);
	return _choose(&o, true);
}
bool BPrivyAPI::chooseFolder(FB::JSObjectPtr out)
{
	bp::JSObject o(out);
	//return _chooseFolderXP(&o);
	return _choose(&o, false);
}
#ifdef DEBUG
bool BPrivyAPI::chooseFileXP(FB::JSObjectPtr out)
{
	bp::JSObject o(out);
	return _chooseFileXP(&o);
}
bool BPrivyAPI::chooseFolderXP(FB::JSObjectPtr out)
{
	bp::JSObject o(out);
	return _chooseFolderXP(&o);
}
unsigned long long BPrivyAPI::appendLock(const std::wstring& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	bp::JSObject o(out);
	return _appendLock(path, &o);
}

unsigned long long BPrivyAPI::readLock(const std::wstring& path_s, FB::JSObjectPtr out)
{
	bfs::path path(path_s); path.make_preferred();
	bp::JSObject o(out);
	return _readLock(path, &o);
}
#endif // DEBUG
/////////////////////////  DEAD CODE BELOW THIS POINT ////////////////////////////////////
//	const ACodes Acode;
//	template <>
//	Codes<ACODE, ACODE_NUM, ACODE_UNMAPPED>::Codes()
//	{
//		_utf8[ACODE_UNMAPPED]			= "Unmapped";
//		_ucs[ACODE_UNMAPPED]			= L"Unmapped";
//		_utf8[ACODE_CANT_PROCEED]		= "CantProceed";
//		_ucs[ACODE_CANT_PROCEED]			= L"CantProceed";
//		_utf8[ACODE_AUTORETRY]			= "AutoRetry";
//		_ucs[ACODE_AUTORETRY]			= L"AutoRetry";
//		_utf8[ACODE_RESOURCE_UNAVAILABLE]= "ResourceUnavailable";
//		_ucs[ACODE_RESOURCE_UNAVAILABLE]	= L"ResourceUnavailable";
//		_utf8[ACODE_INVALID_PATHNAME]	= "InvalidPathname";
//		_ucs[ACODE_INVALID_PATHNAME]		= L"InvalidPathname";
//		_utf8[ACODE_BAD_PATH_ARGUMENT]	= "BadPathArgument";
//		_ucs[ACODE_BAD_PATH_ARGUMENT]	= L"BadPathArgument";
//		_utf8[ACODE_RESOURCE_LOCKED]		= "ResourceLocked";
//		_ucs[ACODE_RESOURCE_LOCKED]		= L"ResourceLocked";
//		_utf8[ACODE_ACCESS_DENIED]		= "AccessDenied";
//		_ucs[ACODE_ACCESS_DENIED]		= L"AccessDenied";
//	}
//
//#define MAP_CODE(P, C, V) _ucs[ P ## _ ## C ] =  L#V
//#define MAP_BPCODE(C,V) MAP_CODE(BPCODE, C, V)
//
//	const BPCodes BPcode;
//	template <>
//	Codes<BPCODE, BPCODE_NUM, BPCODE_UNMAPPED>::Codes()
//	{
//		MAP_BPCODE(UNAUTHORIZED_CLIENT, L"UnauthorizedClient");
//		MAP_BPCODE(WRONG_PASS, L"WrongPass");
//		MAP_BPCODE(NEW_FILE_CREATED, L"NewFileCreated");
//		MAP_BPCODE(NO_MEM, L"NoMem");
//		MAP_BPCODE(ASSERT_FAILED, L"AssertFailed");
//		MAP_BPCODE(PATH_EXISTS, L"PathAlreadyExists");
//		MAP_BPCODE(BAD_FILETYPE, L"BadFileType");
//		MAP_BPCODE(REPARSE_POINT, L"PathIsReparsePoint");
//		MAP_BPCODE(IS_SYMLINK, L"PathIsSymlink");
//		MAP_BPCODE(WOULD_CLOBBER, L"WouldClobber");
//		MAP_BPCODE(PATH_NOT_EXIST, L"PathNotExist");
//	}