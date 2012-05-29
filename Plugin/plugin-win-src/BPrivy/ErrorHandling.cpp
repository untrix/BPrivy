//Includes Required by FireBreath
#include "JSObject.h"
//#include "variant_list.h"
//#include "DOM/Document.h"
//#include "global/config.h"
//#include <APITypes.h>
//#include <DOM/Window.h>

#include "BPrivyAPI.h"
#include "ErrorHandling.h"
#include "Utils.h"

#include <sstream>  // For stringstream
#include <boost/system/error_code.hpp>

using namespace bp;
using namespace std;
namespace bs = boost::system;

typedef FB::VariantMap::value_type	VT;
namespace bp
{
	// Error properties (names) returned to javascript. These represent an interface
	// with javascript and therefore are unchangeable.
	const std::string PROP_ERROR				("err");
	const std::string PROP_SYSTEM_MESSAGE		("smsg");
	const std::string PROP_GENERIC_MESSAGE		("gmsg");
	const std::string PROP_SYSTEM_CODE			("scode");
	const std::string PROP_GENERIC_CODE			("gcode");
	const std::string PROP_A_CODE				("acode");
	const std::string PROP_PATH					("path");
	const std::string PROP_PATH2				("path2");

	const std::string PROP_INFO					("inf");
	const std::string PROP_LSDIR				("lsd");
	const std::string PROP_FILESTAT				("lsf");
	const std::string PROP_READFILE				("rdf");
	const std::string PROP_FILENAME				("fnm");
	const std::string PROP_FILEEXT				("ext");
	const std::string PROP_FILESTEM				("stm");
	const std::string PROP_FILESIZE				("siz");
	const std::string PROP_DATA					("dat");

	const std::string ACODE_UNMAPPED			("Unmapped");
	const std::string ACODE_CANT_PROCEED		("CantProceed");
	const std::string ACODE_AUTORETRY			("AutoRetry");
	const std::string ACODE_RESOURCE_UNAVAILABLE("ResourceUnavailable");
	const std::string ACODE_INVALID_PATHNAME	("InvalidPathname");
	const std::string ACODE_BAD_PATH_ARGUMENT	("BadPathArgument");
	const std::string ACODE_RESOURCE_LOCKED		("ResourceLocked");
	const std::string ACODE_ACCESS_DENIED		("AccessDenied");

	const std::string BPCODE_NEW_FILE_CREATED	("NewFileCreated");
	const std::string BPCODE_NO_MEM				("NoMem");
	const std::string BPCODE_ASSERT_FAILED		("AssertFailed");
	const std::string BPCODE_PATH_EXISTS		("PathAlreadyExists");
	const std::string BPCODE_WRONG_FILETYPE		("WrongFileType");
	const std::string BPCODE_REPARSE_POINT		("PathIsReparsePoint");
	const std::string BPCODE_IS_SYMLINK			("PathIsSymlink");
	// Action would've resulted in clobbering
	const std::string BPCODE_WOULD_CLOBBER		("WouldClobber");
	const std::string BPCODE_PATH_NOT_EXIST		("PathNotExist");

	const std::string PCodeToPCode(int ev)
	{
		switch(ev)
		{
		case 0: return "SUCCESS";
		case EAFNOSUPPORT: return "EAFNOSUPPORT";
		case EADDRINUSE: return "EADDRINUSE";
		case EADDRNOTAVAIL: return "EADDRNOTAVAIL";
		case EISCONN: return "EISCONN";
		case E2BIG: return "E2BIG";
		case EDOM: return "EDOM";
		case EFAULT: return "EFAULT";
		case EBADF: return "EBADF";
		case EBADMSG: return "EBADMSG";
		case EPIPE: return "EPIPE";
		case ECONNABORTED: return "ECONNABORTED";
		case EALREADY: return "EALREADY";
		case ECONNREFUSED: return "ECONNREFUSED";
		case ECONNRESET: return "ECONNRESET";
		case EXDEV: return "EXDEV";
		case EDESTADDRREQ: return "EDESTADDRREQ";
		case EBUSY: return "EBUSY";
		case ENOTEMPTY: return "ENOTEMPTY";
		case ENOEXEC: return "ENOEXEC";
		case EEXIST: return "EEXIST";
		case EFBIG: return "EFBIG";
		case ENAMETOOLONG: return "ENAMETOOLONG";
		case ENOSYS: return "ENOSYS";
		case EHOSTUNREACH: return "EHOSTUNREACH";
		case EIDRM: return "EIDRM";
		case EILSEQ: return "EILSEQ";
		case ENOTTY: return "ENOTTY";
		case EINTR: return "EINTR";
		case EINVAL: return "EINVAL";
		case ESPIPE: return "ESPIPE";
		case EIO: return "EIO";
		case EISDIR: return "EISDIR";
		case EMSGSIZE: return "EMSGSIZE";
		case ENETDOWN: return "ENETDOWN";
		case ENETRESET: return "ENETRESET";
		case ENETUNREACH: return "ENETUNREACH";
		case ENOBUFS: return "ENOBUFS";
		case ECHILD: return "ECHILD";
		case ENOLINK: return "ENOLINK";
		case ENOLCK: return "ENOLCK";
		case ENODATA: return "ENODATA";
		case ENOMSG: return "ENOMSG";
		case ENOPROTOOPT: return "ENOPROTOOPT";
		case ENOSPC: return "ENOSPC";
		case ENOSR: return "ENOSR";
		case ENXIO: return "ENXIO";
		case ENODEV: return "ENODEV";
		case ENOENT: return "ENOENT";
		case ESRCH: return "ESRCH";
		case ENOTDIR: return "ENOTDIR";
		case ENOTSOCK: return "ENOTSOCK";
		case ENOSTR: return "ENOSTR";
		case ENOTCONN: return "ENOTCONN";
		case ENOMEM: return "ENOMEM";
		case ENOTSUP: return "ENOTSUP";
		case ECANCELED: return "ECANCELED";
		case EINPROGRESS: return "EINPROGRESS";
		case EPERM: return "EPERM";
		case EOPNOTSUPP: return "EOPNOTSUPP";
		case EWOULDBLOCK: return "EWOULDBLOCK";
		case EOWNERDEAD: return "EOWNERDEAD";
		case EACCES: return "EACCES";
		case EPROTO: return "EPROTO";
		case EPROTONOSUPPORT: return "EPROTONOSUPPORT";
		case EROFS: return "EROFS";
		case EDEADLK: return "EDEADLK";
		case EAGAIN: return "EAGAIN";
		case ERANGE: return "ERANGE";
		case ENOTRECOVERABLE: return "ENOTRECOVERABLE";
		case ETIME: return "ETIME";
		case ETXTBSY: return "ETXTBSY";
		case ETIMEDOUT: return "ETIMEDOUT";
		case ENFILE: return "ENFILE";
		case EMFILE: return "EMFILE";
		case EMLINK: return "EMLINK";
		case ELOOP: return "ELOOP";
		case EOVERFLOW: return "EOVERFLOW";
		case EPROTOTYPE: return "EPROTOTYPE";
		default:
			return std::to_string((unsigned long long)ev);
		}
	}

	const std::string& PCodeToACode(int ev)
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
		case EEXIST: return BPCODE_PATH_EXISTS;
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

	void MakeErrorEntry(const bfs::filesystem_error& e, std::ostringstream& je)
	{
		if (!e.path1().empty())
		{
			//std::string s();
			je << QUOTE << JsonFriendly(string(e.path1().string())) << QUOTE << ":{";
			je << "\"name\":" << e.path1().filename();
			if (e.path1().has_extension())
			{
				je << ",\"ex\":" << e.path1().extension();
				if (e.path1().has_stem())
				{
					je << ",\"st\":" << e.path1().stem();
				}
			}

			int ev = e.code().value();
			bs::error_code ec = e.code();
			//je << ",\"" << PROP_GENERIC_MESSAGE << "\":" << QUOTE << JsonFriendly(ec.default_error_condition().message()) << QUOTE;
			//je << ",\"" << PROP_GENERIC_CODE << "\":" << QUOTE <<PCodeToPCode(ec.default_error_condition().value()) << QUOTE;
			je << ",\""<< PROP_SYSTEM_MESSAGE<< "\":" << QUOTE << JsonFriendly(ec.message()) << QUOTE;
			je << ",\""<< PROP_SYSTEM_CODE << "\":" << QUOTE << SCodeToSCode(ev) << QUOTE;

			// Map from SCode to BPCode if possible
			if (SCodeToACode(ev) != ACODE_UNMAPPED) {
				je << ",\"" << PROP_A_CODE << "\":" << QUOTE << SCodeToACode(ev) << QUOTE;
			}
			else {
				ev = e.code().default_error_condition().value();
				je << ",\"" << PROP_A_CODE << "\":" << QUOTE << PCodeToACode(ev) << QUOTE;
			}
			je << CLOSEB;
		}
	}

	void MakeErrorEntry(const bfs::filesystem_error& e, FB::VariantMap& m)
	{
		if (!e.path1().empty())
		{
			m.insert(VT(PROP_PATH, e.path1().string()));
			m.insert(VT(PROP_FILENAME, e.path1().filename().string()));
			if (e.path1().has_extension())
			{
				m.insert(VT(PROP_FILEEXT, e.path1().extension().string()));
				if (e.path1().has_stem())
				{
					m.insert(VT(PROP_FILESTEM, e.path1().stem().string()));
				}
			}
		}

		ParseSystemException(e, m);
	}

	void SetInfoMsg(const string& s_code, FB::JSObjectPtr& js)
	{
		FB::VariantMap m;
		m.insert(VT(PROP_GENERIC_CODE, s_code));
		js->SetProperty(PROP_INFO, m);
	}

	//void SetErrorMsg(const std::string& s_code, FB::JSObjectPtr& out)
	//{
	//	FB::VariantMap m;
	//	m.insert(VT(PROP_GENERIC_CODE, s_code));
	//	out->SetProperty(PROP_ERROR, m);
	//}

	void ParseSystemException(const bs::system_error& e, FB::VariantMap& m)
	{
		int ev = e.code().value();
		bs::error_code ec = e.code();
		m.insert(VT(PROP_SYSTEM_MESSAGE, ec.message()));
		m.insert(VT(PROP_SYSTEM_CODE, SCodeToSCode(ev)));
		//m.insert(VT(PROP_GENERIC_MESSAGE, ec.default_error_condition().message()));
		//m.insert(VT(PROP_GENERIC_CODE, bp::PCodeToPCode(ec.default_error_condition().value())));
		
		// Map from SCode to ACode if possible
		if (SCodeToACode(ev) != ACODE_UNMAPPED) {
			m.insert(VT(PROP_A_CODE, SCodeToACode(ev)));
		}
		else {
			ev = ec.default_error_condition().value();
			// POSIX codes are pretty much useless. On top of that Boost's mapping from system codes to
			// POSIX codes is dubious. Therefore this mapping from gcode to ACode is not very useful.
			m.insert(VT(PROP_A_CODE, PCodeToACode(ev)));
		}
	}

	void HandleFilesystemException (const bfs::filesystem_error& e, FB::JSObjectPtr& p)
	{
		FB::VariantMap m;
		ParseSystemException(e, m);
		if (!e.path1().empty()) {m.insert(VT(PROP_PATH, e.path1().string()));}
		if (!e.path2().empty()) {m.insert(VT(PROP_PATH2, e.path2().string()));}
		p->SetProperty(PROP_ERROR, FB::variant(m));
	}

	void HandleSystemException(const bs::system_error& e, FB::JSObjectPtr& p)
	{
		FB::VariantMap m;
		ParseSystemException(e, m);
		p->SetProperty(PROP_ERROR, FB::variant(m));
	}

	void HandleStdException(const std::exception& e, FB::JSObjectPtr& p)
	{		
		FB::VariantMap m;
		m.insert(VT(PROP_SYSTEM_MESSAGE, e.what()));
		p->SetProperty(PROP_ERROR, FB::variant(m));
	}

	void HandleUnknownException (FB::JSObjectPtr& p)
	{
		p->SetProperty(PROP_ERROR, "Unknown");
	}

	void HandleBPError(const BPError& e, FB::JSObjectPtr& p)
	{
		FB::VariantMap m;
		m.insert(VT(PROP_A_CODE, e.acode));
		if (!e.gcode.empty()) {
			m.insert(VT(PROP_GENERIC_CODE, e.gcode));
		}
		if (!e.path.empty()) {
			m.insert(VT(PROP_PATH, e.path));
		}
		p->SetProperty(PROP_ERROR, FB::variant(m));
	}

	//const std::string SCodeToPCode(std::uint32_t err)
	//{
	//	boost::system::error_code ec(err, boost::system::system_category());
	//	bs::error_condition econd = ec.default_error_condition();
	//	int ev = econd.value();
	//	return bp::PCodeToPCode(ev);
	//}


}// End namespace bp