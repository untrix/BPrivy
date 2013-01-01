#include "JSObject.h"
#include "BPrivyAPI.h"
#include "ErrorHandling.h"
#include "Utils.h"
#include <boost/system/error_code.hpp>
#include <CryptError.h>

using namespace bp;
using namespace std;
namespace bs = boost::system;

typedef FB::VariantMap::value_type	VT;
namespace bp
{
	//************* NOTE: All strings must be utf8/unicode********************

	// Error properties (names) returned to javascript. These represent an interface
	// with javascript and therefore are unchangeable.
	const bp::ustring PROP_ERROR				(L"err");
	const bp::ustring PROP_ERRNAME				(L"name");
	const bp::ustring PROP_SYSTEM_MESSAGE		(L"smsg");
	const bp::ustring PROP_GENERIC_MESSAGE		(L"gmsg");
	const bp::ustring PROP_SYSTEM_CODE			(L"scode");
	const bp::ustring PROP_GENERIC_CODE			(L"gcode");
	const bp::ustring PROP_A_CODE				(L"acode");
	const bp::ustring PROP_PATH					(L"path");
	const bp::ustring PROP_PATH2				(L"path2");

	const bp::ustring PROP_HIDE					(L"hide");
	const bp::ustring PROP_FILE_FILTER			(L"filter");
	const bp::ustring PROP_DIALOG_TITLE			(L"dtitle");
	const bp::ustring PROP_DIALOG_BUTTON		(L"dbutton");
	const bp::ustring PROP_CLEAR_HISTORY		(L"clrHist");
	const bp::ustring PROP_PREFIX				(L"prefix");
	const bp::ustring PROP_SUFFIX				(L"suffix");
	const bp::ustring PROP_CRYPT_CTX			(L"cryptCtx");

	const bp::ustring PROP_INFO					(L"inf");
	const bp::ustring PROP_LSDIR				(L"lsd");
	const bp::ustring PROP_LSFILE				(L"lsf");
	const bp::ustring PROP_FILES				(L"f");
	const bp::ustring PROP_DIRS					(L"d");
	const bp::ustring PROP_OTHERS				(L"o");
	const bp::ustring PROP_ERRORS				(L"e");
	const bp::ustring PROP_READFILE				(L"rdf");
	const bp::ustring PROP_FILENAME				(L"fnm");
	const bp::ustring PROP_FILEEXT				(L"ext");
	const bp::ustring PROP_FILESTEM				(L"stm");
	const bp::ustring PROP_FILESIZE				(L"siz");
	const bp::ustring PROP_MTIME				(L"mtm");
	const bp::ustring PROP_DATA					(L"dat");
	const bp::ustring PROP_PASS					(L"pass");

	const bp::ustring ACODE_UNKNOWN				(L"Unknown");
 	const bp::ustring ACODE_UNMAPPED			(L"Unmapped");
 	const bp::ustring ACODE_CANT_PROCEED		(L"CantProceed");
 	const bp::ustring ACODE_AUTORETRY			(L"AutoRetry");
 	const bp::ustring ACODE_RESOURCE_UNAVAILABLE(L"ResourceUnavailable");
 	const bp::ustring ACODE_INVALID_PATHNAME	(L"InvalidPathname");
 	const bp::ustring ACODE_BAD_PATH_ARGUMENT	(L"BadPathArgument");
 	const bp::ustring ACODE_RESOURCE_LOCKED		(L"ResourceLocked");
 	const bp::ustring ACODE_ACCESS_DENIED		(L"AccessDenied");
	const bp::ustring ACODE_UNSUPPORTED			(L"Unsupported");
	const bp::ustring ACODE_CRYPT_ERROR			(L"CryptoError");

	const bp::ustring BPCODE_UNAUTHORIZED_CLIENT (L"UnauthorizedClient");
	const bp::ustring BPCODE_WRONG_PASS			(L"WrongPass"); // Password too short or wrong.
	const bp::ustring BPCODE_NEW_FILE_CREATED	(L"NewFileCreated");
	const bp::ustring BPCODE_NO_MEM				(L"NoMem");
	const bp::ustring BPCODE_ASSERT_FAILED		(L"AssertFailed");
	const bp::ustring BPCODE_PATH_EXISTS		(L"PathAlreadyExists");
	const bp::ustring BPCODE_BAD_FILETYPE		(L"BadFileType");
	const bp::ustring BPCODE_REPARSE_POINT		(L"PathIsReparsePoint");
	const bp::ustring BPCODE_IS_SYMLINK			(L"PathIsSymlink");
	// Action would've resulted in clobbering
	const bp::ustring BPCODE_WOULD_CLOBBER		(L"WouldClobber");
	const bp::ustring BPCODE_PATH_NOT_EXIST	(L"PathNotExist");
	const bp::ustring BPCODE_FILE_TOO_BIG		(L"FileTooBig");
	const bp::ustring BPCODE_INVALID_COPY_ARGS	(L"InvalidCopyArgs");
	const bp::ustring BPCODE_BAD_FILE			(L"FileCorrupted");

	const bp::ustring EXCEPTION_NAME			(L"PluginDiags");
	const bp::ustring& PCodeToACodeW(int ev)
	{
		switch(ev)
		{
		case EAFNOSUPPORT: return ACODE_UNMAPPED;
		case EADDRINUSE: return ACODE_RESOURCE_LOCKED;
		case EADDRNOTAVAIL: return ACODE_RESOURCE_UNAVAILABLE;
		case EISCONN: return ACODE_UNMAPPED;
		case E2BIG: return ACODE_UNMAPPED;
		case EDOM: return ACODE_UNMAPPED;
		case EFAULT: return ACODE_RESOURCE_UNAVAILABLE;
		case EBADF: return ACODE_AUTORETRY;
		case EBADMSG: return ACODE_UNMAPPED;
		case EPIPE: return ACODE_UNMAPPED;
		case ECONNABORTED: return ACODE_RESOURCE_UNAVAILABLE;
		case EALREADY: return ACODE_RESOURCE_UNAVAILABLE;
		case ECONNREFUSED: return ACODE_RESOURCE_UNAVAILABLE;
		case ECONNRESET: return ACODE_RESOURCE_UNAVAILABLE;
		case EXDEV: return ACODE_UNMAPPED;
		case EDESTADDRREQ: return ACODE_UNMAPPED;
		case EBUSY: return ACODE_RESOURCE_UNAVAILABLE;
		case ENOTEMPTY: return ACODE_AUTORETRY;
		case ENOEXEC: return ACODE_UNMAPPED;
		case EEXIST: return ACODE_BAD_PATH_ARGUMENT;
		case EFBIG: return ACODE_CANT_PROCEED;
		case ENAMETOOLONG: return ACODE_INVALID_PATHNAME;
		case ENOSYS: return ACODE_UNMAPPED;
		case EHOSTUNREACH: return ACODE_RESOURCE_UNAVAILABLE;
		case EIDRM: return ACODE_RESOURCE_UNAVAILABLE;
		case EILSEQ:
		case ENOTTY: return ACODE_UNMAPPED;
		case EINTR: return ACODE_RESOURCE_UNAVAILABLE;
		case EINVAL: 
		case ESPIPE: return ACODE_UNMAPPED;
		case EIO: return ACODE_RESOURCE_UNAVAILABLE;
		case EISDIR: return ACODE_BAD_PATH_ARGUMENT;
		case EMSGSIZE: return ACODE_UNMAPPED;
		case ENETDOWN: return ACODE_RESOURCE_UNAVAILABLE;
		case ENETRESET: return ACODE_RESOURCE_UNAVAILABLE;
		case ENETUNREACH: return ACODE_RESOURCE_UNAVAILABLE;
		case ENOBUFS: return ACODE_RESOURCE_UNAVAILABLE;
		case ECHILD: 
		case ENOLINK: return ACODE_UNMAPPED;
		case ENOLCK: return ACODE_RESOURCE_LOCKED;
		case ENODATA: 
		case ENOMSG: 
		case ENOPROTOOPT: return ACODE_UNMAPPED;
		case ENOSPC: return ACODE_RESOURCE_UNAVAILABLE;
		case ENOSR: return ACODE_RESOURCE_UNAVAILABLE;
		case ENXIO: return ACODE_BAD_PATH_ARGUMENT;
		case ENODEV: return ACODE_BAD_PATH_ARGUMENT;
		case ENOENT: return ACODE_BAD_PATH_ARGUMENT;
		case ESRCH: return ACODE_UNMAPPED;
		case ENOTDIR: return ACODE_BAD_PATH_ARGUMENT;
		case ENOTSOCK:
		case ENOSTR: return ACODE_UNMAPPED;
		case ENOTCONN: return ACODE_RESOURCE_UNAVAILABLE;
		case ENOMEM: return ACODE_RESOURCE_UNAVAILABLE;
		case ENOTSUP:
		case ECANCELED:
		case EINPROGRESS:
		case EPERM:
		case EOPNOTSUPP:
		case EWOULDBLOCK:
		case EOWNERDEAD: return ACODE_UNMAPPED;
		case EACCES: return ACODE_ACCESS_DENIED;
		case EPROTO:
		case EPROTONOSUPPORT: return ACODE_UNMAPPED;
		case EROFS: return ACODE_RESOURCE_UNAVAILABLE;
		case EDEADLK: return ACODE_RESOURCE_LOCKED;
		case EAGAIN: return ACODE_RESOURCE_UNAVAILABLE;
		case ERANGE:
		case ENOTRECOVERABLE:
		case ETIME: return ACODE_UNMAPPED;
		case ETXTBSY: return ACODE_RESOURCE_LOCKED;
		case ETIMEDOUT: return ACODE_RESOURCE_UNAVAILABLE;
		case ENFILE: return ACODE_RESOURCE_UNAVAILABLE;
		case EMFILE: return ACODE_RESOURCE_UNAVAILABLE;
		case EMLINK: return ACODE_BAD_PATH_ARGUMENT;
		case ELOOP: return ACODE_BAD_PATH_ARGUMENT;
		case EOVERFLOW: 
		case EPROTOTYPE:
		default:
			return ACODE_UNMAPPED;
		}
	}

	void MakeErrorEntry(const bfs::filesystem_error& e, bp::VariantMap& m)
	{
		if (!e.path1().empty())
		{
			m.insert(PROP_PATH, e.path1());
			m.insert(PROP_FILENAME, e.path1().filename());
			if (e.path1().has_extension())
			{
				m.insert(PROP_FILEEXT, e.path1().extension());
				if (e.path1().has_stem())
				{
					m.insert(PROP_FILESTEM, e.path1().stem());
				}
			}
		}

		ParseSystemException(e, m);
	}

	void SetInfoMsg(const ustring& g_code, bp::JSObject* js)
	{
		bp::VariantMap m;
		m.insert(PROP_GENERIC_CODE, g_code);
		js->SetProperty(PROP_INFO, m);
	}

	void ParseSystemException(const bs::system_error& e, bp::VariantMap& m)
	{
		int ev = e.code().value();
		bs::error_code ec = e.code();
		m.insert(PROP_ERRNAME, EXCEPTION_NAME);
		m.insert(PROP_SYSTEM_MESSAGE, ec);
		m.insert(PROP_SYSTEM_CODE, SCodeToSCodeW(ev));
		//m.insert(VT(PROP_GENERIC_MESSAGE, ec.default_error_condition()));
		//m.insert(VT(PROP_GENERIC_CODE, bp::PCodeToPCodeW(ec.default_error_condition().value())));
		
		// Map from SCode to ACode if possible
		if (SCodeToACodeW(ev) != ACODE_UNMAPPED) {
			m.insert(PROP_A_CODE, SCodeToACodeW(ev));
		}
		else {
			ev = ec.default_error_condition().value();
			// POSIX codes are pretty much useless. On top of that Boost's mapping from system codes to
			// POSIX codes is dubious. Therefore this mapping from gcode to ACode is not very useful.
			m.insert(PROP_A_CODE, PCodeToACodeW(ev));
		}
	}

	// NOTE: All strings must be utf8/unicode
	void HandleFilesystemException (const bfs::filesystem_error& e, bp::JSObject* p)
	{
		bp::VariantMap m;
		ParseSystemException(e, m);
		if (!e.path1().empty()) {m.insert(PROP_PATH, e.path1());}
		if (!e.path2().empty()) {m.insert(PROP_PATH2, e.path2());}
		p->SetProperty(PROP_ERROR, m);
	}

	// NOTE: All strings must be utf8/unicode
	void HandleSystemException(const bs::system_error& e, bp::JSObject* p)
	{
		bp::VariantMap m;
		ParseSystemException(e, m);
		p->SetProperty(PROP_ERROR, m);
	}

	// NOTE: All strings must be utf8/unicode
	void HandleStdException(const std::exception& e, bp::JSObject* p)
	{		
		bp::VariantMap m;
		m.insert(PROP_SYSTEM_MESSAGE, e);
		p->SetProperty(PROP_ERROR, m);
	}

	// NOTE: All strings must be utf8/unicode
	void HandleUnknownException (bp::JSObject* p)
	{
		bp::VariantMap m;
		m.insert(PROP_ERRNAME, EXCEPTION_NAME);
		m.insert(PROP_A_CODE, ACODE_UNKNOWN);
		p->SetProperty(PROP_ERROR, m);
	}

	void HandleUnknownException (bp::VariantMap& me)
	{
		bp::VariantMap m;
		m.insert(PROP_ERRNAME, EXCEPTION_NAME);
		m.insert(PROP_A_CODE, ACODE_UNKNOWN);
		me.insert(PROP_ERROR, m);
	}


	// NOTE: All strings must be utf8/unicode
	void HandleBPError(const BPError& e, bp::JSObject* p)
	{
		bp::VariantMap m;
		m.insert(PROP_ERRNAME, EXCEPTION_NAME);
		m.insert(PROP_A_CODE, e.acode);
		if (!e.gcode.empty()) {
			m.insert(PROP_GENERIC_CODE, (e.gcode));
		}
		if (!e.path.empty()) {
			m.insert(PROP_PATH, e.path);
		}
		if (!e.gmsg.empty()) {
			m.insert(PROP_GENERIC_MESSAGE, e.gmsg);
		}
		p->SetProperty(PROP_ERROR, m);
	}

	void HandleCryptError(const crypt::Error& e, bp::JSObject* p)
	{
		bp::VariantMap m;
		m.insert(PROP_ERRNAME, EXCEPTION_NAME);
		m.insert(PROP_A_CODE, e.acode.empty() ? ACODE_CRYPT_ERROR : e.acode);
		if (!e.gcode.empty()) {
			m.insert(PROP_GENERIC_CODE, (e.gcode));
		}
		if (!e.gmsg.empty()) {
			m.insert(PROP_GENERIC_MESSAGE, e.gmsg);
		}
		p->SetProperty(PROP_ERROR, m);
	}

	//const std::string SCodeToPCode(std::uint32_t err)
	//{
	//	boost::system::error_code ec(err, boost::system::system_category());
	//	bs::error_condition econd = ec.default_error_condition();
	//	int ev = econd.value();
	//	return bp::PCodeToPCodeW(ev);
	//}

	//************* NOTE: All strings must be utf8/unicode********************
	/*const std::string&& PCodeToPCodeW(int ev)
	{
		switch(ev)
		{
		case 0: return bp::ustring("SUCCESS");
		case EAFNOSUPPORT: return bp::ustring("EAFNOSUPPORT");
		case EADDRINUSE: return bp::ustring("EADDRINUSE");
		case EADDRNOTAVAIL: return bp::ustring("EADDRNOTAVAIL");
		case EISCONN: return bp::ustring("EISCONN");
		case E2BIG: return bp::ustring("E2BIG");
		case EDOM: return bp::ustring("EDOM");
		case EFAULT: return bp::ustring("EFAULT");
		case EBADF: return bp::ustring("EBADF");
		case EBADMSG: return bp::ustring("EBADMSG");
		case EPIPE: return bp::ustring("EPIPE");
		case ECONNABORTED: return bp::ustring("ECONNABORTED");
		case EALREADY: return bp::ustring("EALREADY");
		case ECONNREFUSED: return bp::ustring("ECONNREFUSED");
		case ECONNRESET: return bp::ustring("ECONNRESET");
		case EXDEV: return bp::ustring("EXDEV");
		case EDESTADDRREQ: return bp::ustring("EDESTADDRREQ");
		case EBUSY: return bp::ustring("EBUSY");
		case ENOTEMPTY: return bp::ustring("ENOTEMPTY");
		case ENOEXEC: return bp::ustring("ENOEXEC");
		case EEXIST: return bp::ustring("EEXIST");
		case EFBIG: return bp::ustring("EFBIG");
		case ENAMETOOLONG: return bp::ustring("ENAMETOOLONG");
		case ENOSYS: return bp::ustring("ENOSYS");
		case EHOSTUNREACH: return bp::ustring("EHOSTUNREACH");
		case EIDRM: return bp::ustring("EIDRM");
		case EILSEQ: return bp::ustring("EILSEQ");
		case ENOTTY: return bp::ustring("ENOTTY");
		case EINTR: return bp::ustring("EINTR");
		case EINVAL: return bp::ustring("EINVAL");
		case ESPIPE: return bp::ustring("ESPIPE");
		case EIO: return bp::ustring("EIO");
		case EISDIR: return bp::ustring("EISDIR");
		case EMSGSIZE: return bp::ustring("EMSGSIZE");
		case ENETDOWN: return bp::ustring("ENETDOWN");
		case ENETRESET: return bp::ustring("ENETRESET");
		case ENETUNREACH: return bp::ustring("ENETUNREACH");
		case ENOBUFS: return bp::ustring("ENOBUFS");
		case ECHILD: return bp::ustring("ECHILD");
		case ENOLINK: return bp::ustring("ENOLINK");
		case ENOLCK: return bp::ustring("ENOLCK");
		case ENODATA: return bp::ustring("ENODATA");
		case ENOMSG: return bp::ustring("ENOMSG");
		case ENOPROTOOPT: return bp::ustring("ENOPROTOOPT");
		case ENOSPC: return bp::ustring("ENOSPC");
		case ENOSR: return bp::ustring("ENOSR");
		case ENXIO: return bp::ustring("ENXIO");
		case ENODEV: return bp::ustring("ENODEV");
		case ENOENT: return bp::ustring("ENOENT");
		case ESRCH: return bp::ustring("ESRCH");
		case ENOTDIR: return bp::ustring("ENOTDIR");
		case ENOTSOCK: return bp::ustring("ENOTSOCK");
		case ENOSTR: return bp::ustring("ENOSTR");
		case ENOTCONN: return bp::ustring("ENOTCONN");
		case ENOMEM: return bp::ustring("ENOMEM");
		case ENOTSUP: return bp::ustring("ENOTSUP");
		case ECANCELED: return bp::ustring("ECANCELED");
		case EINPROGRESS: return bp::ustring("EINPROGRESS");
		case EPERM: return bp::ustring("EPERM");
		case EOPNOTSUPP: return bp::ustring("EOPNOTSUPP");
		case EWOULDBLOCK: return bp::ustring("EWOULDBLOCK");
		case EOWNERDEAD: return bp::ustring("EOWNERDEAD");
		case EACCES: return bp::ustring("EACCES");
		case EPROTO: return bp::ustring("EPROTO");
		case EPROTONOSUPPORT: return bp::ustring("EPROTONOSUPPORT");
		case EROFS: return bp::ustring("EROFS");
		case EDEADLK: return bp::ustring("EDEADLK");
		case EAGAIN: return bp::ustring("EAGAIN");
		case ERANGE: return bp::ustring("ERANGE");
		case ENOTRECOVERABLE: return bp::ustring("ENOTRECOVERABLE");
		case ETIME: return bp::ustring("ETIME");
		case ETXTBSY: return bp::ustring("ETXTBSY");
		case ETIMEDOUT: return bp::ustring("ETIMEDOUT");
		case ENFILE: return bp::ustring("ENFILE");
		case EMFILE: return bp::ustring("EMFILE");
		case EMLINK: return bp::ustring("EMLINK");
		case ELOOP: return bp::ustring("ELOOP");
		case EOVERFLOW: return bp::ustring("EOVERFLOW");
		case EPROTOTYPE: return bp::ustring("EPROTOTYPE");
		default:
			return std::to_string((unsigned long long)ev);
		}
	}*/

	/*const bp::ustring& PCodeToACode(int ev)
	{
		switch(ev)
		{
		case EAFNOSUPPORT: return Acode.utf8(ACODE_UNMAPPED);
		case EADDRINUSE: return Acode.utf8(ACODE_RESOURCE_LOCKED);
		case EADDRNOTAVAIL: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EISCONN: return Acode.utf8(ACODE_UNMAPPED);
		case E2BIG: return Acode.utf8(ACODE_UNMAPPED);
		case EDOM: return Acode.utf8(ACODE_UNMAPPED);
		case EFAULT: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EBADF: return Acode.utf8(ACODE_AUTORETRY);
		case EBADMSG: return Acode.utf8(ACODE_UNMAPPED);
		case EPIPE: return Acode.utf8(ACODE_UNMAPPED);
		case ECONNABORTED: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EALREADY: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ECONNREFUSED: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ECONNRESET: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EXDEV: return Acode.utf8(ACODE_UNMAPPED);
		case EDESTADDRREQ: return Acode.utf8(ACODE_UNMAPPED);
		case EBUSY: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENOTEMPTY: return Acode.utf8(ACODE_AUTORETRY);
		case ENOEXEC: return Acode.utf8(ACODE_UNMAPPED);
		case EEXIST: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case EFBIG: return Acode.utf8(ACODE_CANT_PROCEED);
		case ENAMETOOLONG: return Acode.utf8(ACODE_INVALID_PATHNAME);
		case ENOSYS: return Acode.utf8(ACODE_UNMAPPED);
		case EHOSTUNREACH: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EIDRM: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EILSEQ:
		case ENOTTY: return Acode.utf8(ACODE_UNMAPPED);
		case EINTR: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EINVAL: 
		case ESPIPE: return Acode.utf8(ACODE_UNMAPPED);
		case EIO: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EISDIR: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case EMSGSIZE: return Acode.utf8(ACODE_UNMAPPED);
		case ENETDOWN: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENETRESET: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENETUNREACH: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENOBUFS: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ECHILD: 
		case ENOLINK: return Acode.utf8(ACODE_UNMAPPED);
		case ENOLCK: return Acode.utf8(ACODE_RESOURCE_LOCKED);
		case ENODATA: 
		case ENOMSG: 
		case ENOPROTOOPT: return Acode.utf8(ACODE_UNMAPPED);
		case ENOSPC: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENOSR: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENXIO: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case ENODEV: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case ENOENT: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case ESRCH: return Acode.utf8(ACODE_UNMAPPED);
		case ENOTDIR: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case ENOTSOCK:
		case ENOSTR: return Acode.utf8(ACODE_UNMAPPED);
		case ENOTCONN: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENOMEM: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENOTSUP:
		case ECANCELED:
		case EINPROGRESS:
		case EPERM:
		case EOPNOTSUPP:
		case EWOULDBLOCK:
		case EOWNERDEAD: return Acode.utf8(ACODE_UNMAPPED);
		case EACCES: return Acode.utf8(ACODE_ACCESS_DENIED);
		case EPROTO:
		case EPROTONOSUPPORT: return Acode.utf8(ACODE_UNMAPPED);
		case EROFS: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EDEADLK: return Acode.utf8(ACODE_RESOURCE_LOCKED);
		case EAGAIN: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ERANGE:
		case ENOTRECOVERABLE:
		case ETIME: return Acode.utf8(ACODE_UNMAPPED);
		case ETXTBSY: return Acode.utf8(ACODE_RESOURCE_LOCKED);
		case ETIMEDOUT: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case ENFILE: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EMFILE: return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
		case EMLINK: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case ELOOP: return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
		case EOVERFLOW: 
		case EPROTOTYPE:
		default:
			return Acode.utf8(ACODE_UNMAPPED);
		}
	}*/

}// End namespace bp