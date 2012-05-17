//Includes Required by FireBreath
#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"
#include "global/config.h"
#include <APITypes.h>
#include <DOM/Window.h>

//BPrivy Includes
#include "../BPrivyAPI.h"
#include "../ErrorHandling.h"
#include "../Utils.h"
#include <string>
#include <Windows.h>
#include <stdlib.h>
#include <malloc.h>
#include <system_error>

using namespace bp;
using namespace std;
namespace bfs = boost::filesystem;
namespace bs = boost::system;
namespace bse = boost::system::errc;
typedef FB::VariantMap::value_type VT;

// cond is a boolean condition. path is bfs::path
#define THROW_IF(cond) if (cond) {ThrowLastSystemError();}
#define THROW_IF2(cond, path) if (cond) {ThrowLastSystemError(path);}
#define THROW_IF3(cond, path1, path2) if (cond) {ThrowLastSystemError(path1, path2);}


namespace bp {

const std::string SCodeToSCode(std::uint32_t err)
{
	switch (err)
	{
	// User Error: Insufficient Access Rights
	case ERROR_ACCESS_DENIED:
		return "ERROR_ACCESS_DENIED";
	case ERROR_INVALID_ACCESS:
		return "ERROR_INVALID_ACCESS";
	//The requested files operation failed because the storage policy blocks that type of file.
	// For more information, contact your system administrator
	case ERROR_CONTENT_BLOCKED: return "ERROR_CONTENT_BLOCKED";
	case ERROR_FILE_READ_ONLY: return "ERROR_FILE_READ_ONLY"; //The specified file is read only
	// User Error: Insufficient Network Access Rights
	case ERROR_NETWORK_ACCESS_DENIED: return "ERROR_NETWORK_ACCESS_DENIED";
	case ERROR_INVALID_PASSWORD: return "ERROR_INVALID_PASSWORD"; //The specified network password is not correct
	// Resource Locked
	// System Or User Error: Try Again After Sometime
	case ERROR_SHARING_VIOLATION: return "ERROR_SHARING_VIOLATION";
	case ERROR_LOCK_VIOLATION: return "ERROR_LOCK_VIOLATION";
	case ERROR_SHARING_BUFFER_EXCEEDED: return "ERROR_SHARING_BUFFER_EXCEEDED"; // Too many files opened for sharing.
	case ERROR_DRIVE_LOCKED: return "ERROR_DRIVE_LOCKED"; //The disk is in use or locked by another process.
	case ERROR_PATH_BUSY: return "ERROR_PATH_BUSY"; //The path specified cannot be used at this time
	case ERROR_LOCK_FAILED: return "ERROR_LOCK_FAILED"; //Unable to lock a region of a file
	case ERROR_BUSY: return "ERROR_BUSY"; //The requested resource is in use.
	case ERROR_DELETE_PENDING: return "ERROR_DELETE_PENDING"; //The file cannot be opened because it is in the process of being deleted
	// User Error: Bad Path Supplied For Read
	case ERROR_BAD_NETPATH: return "ERROR_BAD_NETPATH";//The network path was not found
	case ERROR_REM_NOT_LIST: return "ERROR_REM_NOT_LIST"; //Windows cannot find the network path
	case ERROR_BAD_PATHNAME: return "ERROR_BAD_PATHNAME"; //The specified path is invalid
	case ERROR_NETNAME_DELETED: return "ERROR_NETNAME_DELETED"; //The specified network name is no longer available
	case ERROR_OPEN_FAILED: return "ERROR_OPEN_FAILED"; //The system cannot open the device or file specified
	// User Or Client Error: Bad path for creates or moves
	case ERROR_ALREADY_EXISTS: return "ERROR_ALREADY_EXISTS";//Cannot create a file when that file already exists
	case ERROR_FILE_EXISTS: return "ERROR_FILE_EXISTS"; //The file exists
	// User Or Client Error: Bad pathname syntax for creates or moves
	case ERROR_DIRECTORY: return "ERROR_DIRECTORY"; //The directory name is invalid.
	case ERROR_INVALID_NAME: return "ERROR_INVALID_NAME"; //The filename, directory name, or volume label syntax is incorrect
	case ERROR_FILENAME_EXCED_RANGE: return "ERROR_FILENAME_EXCED_RANGE";//The filename or extension is too long
	case ERROR_META_EXPANSION_TOO_LONG: return "ERROR_META_EXPANSION_TOO_LONG";//The global filename characters, * or ?, are entered 
										//incorrectly or too many global filename characters are specified
	// System Issues : Try Again after issue is resolved
	case ERROR_NETWORK_BUSY: return "ERROR_NETWORK_BUSY";//The network is busy.
	case ERROR_DEV_NOT_EXIST: return "ERROR_DEV_NOT_EXIST"; // The specified network resource or device is no longer available.
	case ERROR_SHARING_PAUSED: return "ERROR_SHARING_PAUSED"; // The remote server has been paused or is in the process of being started
	case ERROR_UNEXP_NET_ERR: return "ERROR_UNEXP_NET_ERR"; //An unexpected network error occurred
	case ERROR_REQ_NOT_ACCEP: return "ERROR_REQ_NOT_ACCEP"; //No more connections can be made to this remote computer at this time
							  //because there are already as many connections as the computer can accept
	case ERROR_NO_MORE_SEARCH_HANDLES: return "ERROR_NO_MORE_SEARCH_HANDLES"; //No more internal file identifiers available
	case ERROR_DISK_TOO_FRAGMENTED: return "ERROR_DISK_TOO_FRAGMENTED";//The volume is too fragmented to complete this operation
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs. The data has been lost.
	// This error may be caused by a failure of your computer hardware or network connection.
	// Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA: return "ERROR_LOST_WRITEBEHIND_DATA";
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused by network connectivity issues. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED: return "ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED";
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error was returned by the server on which the file exists. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR: return "ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR";
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused if the device has been removed or the media is write-protected
	case ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR: return "ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR";
	case ERROR_FILE_INVALID: return "ERROR_FILE_INVALID";//The volume for a file has been externally altered so that the opened file is no longer valid
	// The requested file operation failed because the storage quota was exceeded. To free up disk space, move files to a
	// different location or delete unnecessary files. For more information, contact your system administrator
	case ERROR_DISK_QUOTA_EXCEEDED: return "ERROR_DISK_QUOTA_EXCEEDED";
	case ERROR_FILE_OFFLINE: return "ERROR_FILE_OFFLINE";//The file is currently not available for use on this computer
	case ERROR_HANDLE_DISK_FULL: return "ERROR_HANDLE_DISK_FULL";//The disk is full
	case ERROR_DISK_FULL: return "ERROR_DISK_FULL"; //There is not enough space on the disk
	case ERROR_NET_WRITE_FAULT: return "ERROR_NET_WRITE_FAULT"; //A write fault occurred on the network
	case ERROR_CANNOT_MAKE: return "ERROR_CANNOT_MAKE"; //The directory or file cannot be created

	// Recoverable Client Issues
	case ERROR_DIR_NOT_EMPTY: return "ERROR_DIR_NOT_EMPTY"; //The directory is not empty
	case ERROR_NOT_LOCKED: return "ERROR_NOT_LOCKED";//The segment is already unlocked
	case ERROR_CANCEL_VIOLATION: return "ERROR_CANCEL_VIOLATION";//A lock request was not outstanding for the supplied cancel region
	case ERROR_INVALID_LOCK_RANGE: return "ERROR_INVALID_LOCK_RANGE"; //A requested file lock operation cannot be processed due to an invalid
								   //byte range

		// Unrecoverable System issues
	case ERROR_FILE_TOO_LARGE: return "ERROR_FILE_TOO_LARGE";//The file size exceeds the limit allowed and cannot be saved
	case ERROR_HANDLE_EOF: return "ERROR_HANDLE_EOF";//Reached the end of the file

	default:
		return std::to_string((unsigned long long)err);
	}
}

const std::string& SCodeToACode(std::uint32_t err)
{
	switch (err)
	{
	// User Error: Insufficient Access Rights
	case ERROR_ACCESS_DENIED:
	case ERROR_INVALID_ACCESS:
	//The requested files operation failed because the storage policy blocks that type of file.
	// For more information, contact your system administrator
	case ERROR_CONTENT_BLOCKED: //The requested files operation failed because the storage
								//policy blocks that type of file. For more information, contact your system administrator
	case ERROR_FILE_READ_ONLY: //The specified file is read only
	// User Error: Insufficient Network Access Rights
	case ERROR_NETWORK_ACCESS_DENIED:
	case ERROR_INVALID_PASSWORD: //The specified network password is not correct
		return ACODE_ACCESS_DENIED;
		break;

	// Resource Locked
	// System Or User Error: Try Again After Sometime
	case ERROR_SHARING_VIOLATION:
	case ERROR_LOCK_VIOLATION:
	case ERROR_SHARING_BUFFER_EXCEEDED: // Too many files opened for sharing.
	case ERROR_DRIVE_LOCKED: //The disk is in use or locked by another process.
	case ERROR_PATH_BUSY: //The path specified cannot be used at this time
	case ERROR_LOCK_FAILED: //Unable to lock a region of a file
	case ERROR_BUSY: //The requested resource is in use.
	case ERROR_DELETE_PENDING: //The file cannot be opened because it is in the process of being deleted
		return ACODE_RESOURCE_LOCKED;
		break;

	// User Error: Bad Path Supplied For Read
	case ERROR_BAD_NETPATH://The network path was not found
	case ERROR_REM_NOT_LIST: //Windows cannot find the network path
	case ERROR_BAD_PATHNAME: //The specified path is invalid
	case ERROR_NETNAME_DELETED: //The specified network name is no longer available
	case ERROR_OPEN_FAILED: //The system cannot open the device or file specified
	// User Or Client Error: Bad path for creates or moves
	case ERROR_ALREADY_EXISTS://Cannot create a file when that file already exists
	case ERROR_FILE_EXISTS: //The file exists
		return ACODE_BAD_PATH_ARGUMENT;
		break;

	// User Or Client Error: Bad pathname syntax for creates or moves
	case ERROR_DIRECTORY: //The directory name is invalid.
	case ERROR_INVALID_NAME: //The filename, directory name, or volume label syntax is incorrect
	case ERROR_FILENAME_EXCED_RANGE://The filename or extension is too long
	case ERROR_META_EXPANSION_TOO_LONG://The global filename characters, * or ?, are entered 
										//incorrectly or too many global filename characters are specified
		return ACODE_INVALID_PATHNAME;
		break;

	// System Issues : User to try again after issue is resolved
	case ERROR_NETWORK_BUSY://The network is busy.
	case ERROR_DEV_NOT_EXIST: // The specified network resource or device is no longer available.
	case ERROR_SHARING_PAUSED: // The remote server has been paused or is in the process of being started
	case ERROR_UNEXP_NET_ERR: //An unexpected network error occurred
	case ERROR_REQ_NOT_ACCEP: //No more connections can be made to this remote computer at this time
							  //because there are already as many connections as the computer can accept
	case ERROR_NO_MORE_SEARCH_HANDLES: //No more internal file identifiers available
	case ERROR_DISK_TOO_FRAGMENTED://The volume is too fragmented to complete this operation
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs. The data has been lost.
	// This error may be caused by a failure of your computer hardware or network connection.
	// Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA:
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused by network connectivity issues. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED:
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error was returned by the server on which the file exists. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR:
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused if the device has been removed or the media is write-protected
	case ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR:
	case ERROR_FILE_INVALID://The volume for a file has been externally altered so that the opened file is no longer valid
	// The requested file operation failed because the storage quota was exceeded. To free up disk space, move files to a
	// different location or delete unnecessary files. For more information, contact your system administrator
	case ERROR_DISK_QUOTA_EXCEEDED:
	case ERROR_FILE_OFFLINE://The file is currently not available for use on this computer
	case ERROR_HANDLE_DISK_FULL://The disk is full
	case ERROR_DISK_FULL: //There is not enough space on the disk
	case ERROR_NET_WRITE_FAULT: //A write fault occurred on the network
	case ERROR_CANNOT_MAKE: //The directory or file cannot be created
		return ACODE_RESOURCE_UNAVAILABLE;
		break;

	// Recoverable Client Issues
	case ERROR_NOT_LOCKED://The segment is already unlocked
	case ERROR_CANCEL_VIOLATION://A lock request was not outstanding for the supplied cancel region
	case ERROR_INVALID_LOCK_RANGE: //A requested file lock operation cannot be processed due to an invalid
								   //byte range
		return ACODE_AUTORETRY;
		break;

	// Unrecoverable System issues
	case ERROR_DIR_NOT_EMPTY: //The directory is not empty
	case ERROR_FILE_TOO_LARGE://The file size exceeds the limit allowed and cannot be saved
	case ERROR_HANDLE_EOF://Reached the end of the file
		return ACODE_CANT_PROCEED;
		break;

	default:
		return ACODE_UNMAPPED;
		break;
	}
}

} // end namespace bp

void ThrowLastSystemError()
{
	// Note: std::error_code or std::system_error does not convert
	// system-codes to GENERIC-codes on Windows. Hence using the boost
	// versions (which don't do a very good job either, hence I've 
	// written my own mapping in SCodeToACode).
	//bs::error_code ec(err, boost::system::system_category());
	throw bs::system_error(::GetLastError(), bs::system_category());
}

void ThrowLastSystemError(const bfs::path& pth)
{
	// Note: std::error_code or std::system_error does not convert
	// system-codes to GENERIC-codes on Windows. Hence using the boost
	// versions (which don't do a very good job either, hence I've 
	// written my own mapping in SCodeToACode).
	bs::error_code ec(::GetLastError(), boost::system::system_category());
	throw bfs::filesystem_error("", pth, ec);
}

void ThrowLastSystemError(const bfs::path& pth1, const bfs::path& pth2)
{
	// Note: std::error_code or std::system_error does not convert
	// system-codes to GENERIC-codes on Windows. Hence using the boost
	// versions (which don't do a very good job either, hence I've 
	// written my own mapping in SCodeToACode).
	bs::error_code ec(::GetLastError(), boost::system::system_category());
	throw bfs::filesystem_error("", pth1, pth2, ec);
}

class HANDLEGuard
{
public:
	// throws if handle is invalid
	HANDLEGuard(HANDLE h) : m_Handle(h), m_Locked(false)
				{if (h==INVALID_HANDLE_VALUE) ThrowLastSystemError();}
	HANDLEGuard(HANDLE h, bfs::path& pth) : m_Handle(h), m_Locked(false), m_Path(pth)
				{if (h==INVALID_HANDLE_VALUE) ThrowLastSystemError();}
	virtual ~HANDLEGuard()
	{
		if (m_Locked) 
		{ 
			UnlockFile(m_Handle, m_LkPos1, m_LkPos2, m_LkSiz, 0);
		}

		CloseHandle(m_Handle);
	}

	void PrepareForAppend(const msize32_t siz) // throws
	{
		CHECK((!m_Locked))

		LONG end2 = 0;
		DWORD end = SetFilePointer(m_Handle, 0, &end2, FILE_END);
		THROW_IF(end == INVALID_SET_FILE_POINTER);
		BOOL st = LockFile(m_Handle, end, end2, siz, 0);
		THROW_IF (!st)

		m_LkPos1 = end;
		m_LkPos2 = end2;
		m_LkSiz = siz;
		m_Locked = true;
	}

	void PrepareForRead(const fsize64_t beg, const msize32_t siz) // throws
	{
		CHECK((!m_Locked))

		LARGE_INTEGER li;
		li.QuadPart = beg;
		LONG beg1 = li.LowPart;
		LONG beg2 = li.HighPart;

		DWORD rval = SetFilePointer(m_Handle, beg1, &beg2, FILE_BEGIN);
		THROW_IF (rval == INVALID_SET_FILE_POINTER) ;
		ASSERT((rval == beg1))

		OVERLAPPED ov;
		ov.Internal = 0;
		ov.InternalHigh = 0;
		ov.Offset = beg1;
		ov.OffsetHigh = beg2;
		ov.hEvent = 0;
		rval = LockFileEx(m_Handle, LOCKFILE_FAIL_IMMEDIATELY, 0, siz, 0, &ov);
		THROW_IF (rval == 0)

		m_LkPos1 = beg1;
		m_LkPos2 = beg2;
		m_LkSiz = siz;
		m_Locked = true;
	}

	void PrepareForRename()
	{
		CHECK((!m_Locked));

		LARGE_INTEGER fsiz;
		BOOL rval = GetFileSizeEx(m_Handle, &fsiz);
		THROW_IF (rval == 0);
		fsiz.QuadPart += 1; // we'll lock beyond the file's end in case someone was appending to it.

		rval = LockFile(m_Handle, 0, 0, fsiz.LowPart, fsiz.HighPart);
		THROW_IF2 ((rval==0), m_Path);
	}

	const	HANDLE	m_Handle;
	const bfs::path m_Path;

private:
	// Prevent compiler from generating constructors
	HANDLEGuard();
	HANDLEGuard(const HANDLEGuard&);
	HANDLEGuard operator=(const HANDLEGuard&);

	bool	m_Locked;
	DWORD	m_LkPos1;
	DWORD	m_LkPos2;
	DWORD	m_LkSiz;
};


bool BPrivyAPI::appendFile(const std::string& pth, const std::string& data, FB::JSObjectPtr out)
{
	// NOTE: FireBreath plugin is compiled with the /D_UNICODE flag. This means that
	// the unicode character set is used for all strings, both wchar_t and char_t. This
	// implies that char_t strings are encoded in UTF8 (since that is the unicode encoding
	// for 8bit character strings). Encoding conversion routines such as mbstowcs translate
	// from unicode to unicode encodings such as UTF8 to UCS32 (no encoding) and back.

	// NOTE: FireBreath ensures that <data> will be in UTF-8 format. Therefore
	// we're dealing with the files in BINARY mode and no the OS will not perform
	// the following translations that it would otherwise:
	// 1. WideChar (Unicode) to UTF8 translation when writing to file - NOT PERFORMED
	// 2. UTF8 to WideChar (Unicode) translation when reading from file - NOT PERFORMED
	// 3. LF to CRLF translation when writing to file and vice-versa - NOT PERFORMED
	// All the above conversions are available through C Runtime API (fopen or _sopen etc.)
	// but we're not using that API at the moment. We're using Win32 API instead.
	try
	{
		CONSOLE_LOG("In appendFile");

		bfs::path path(pth);
		path.make_preferred();
		string path_s(path.string());

		// Open file in exclusive mode for appending.
		// If file doesn't exist then create it as a normal file. We could've
		// created it as a HIDDEN file, but that won't really work for Mac or
		// Linux, therefore we'll create a normal file.
		// In Windows, the file is opened in shared-read mode because we do not
		// gain anything by exclusively locking it. Especially since this feature
		// won't work across NFS shares. The only thing that will probably work
		// across different file systems is advisory file-locking. In Windows
		// we'll use LockFile, while in GENERIC we'll use fcntl. Both provide
		// ability to lock regions of the file including regions beyond the file's
		// current size. We'll use that technique to exclusive lock the region beyond
		// the file's current size where we intend to write <data> to. This will
		// ensure that concurrent processes will be able to read all existing bytes
		// but not the bytes that we will be appending to the file. Read the
		// example 'Appending One File to Another File' in MSDN-help.
		HANDLEGuard h( CreateFile(path.c_str(), 
									FILE_GENERIC_WRITE, // GENERIC_READ | WRITE required by LockFile
									FILE_SHARE_READ, 
									NULL, 
									OPEN_ALWAYS, 
									FILE_ATTRIBUTE_NORMAL | FILE_FLAG_WRITE_THROUGH, 
									NULL) );
		
		// OPEN_ALWAYS
		// 4 Opens a file, always.
		// If the specified file exists, the function succeeds and the last-error code is set to ERROR_ALREADY_EXISTS (183).
		// If the specified file does not exist and is a valid path to a writable location, the function creates a file and
		// the last-error code is set to zero.
		if (0 == GetLastError()) { // Implies new file created.
			SetInfoMsg(BPCODE_NEW_FILE_CREATED, out);
		}

		msize32_t siz = data.size();
		// No need to proceed if there is nothing to append. In that case the end-affect of this call would be
		// file creation.
		if (siz == 0) {return true;}

		// Seek Pointer and Lock File.
		h.PrepareForAppend(siz);

		DWORD n;
		BOOL st = WriteFile(h.m_Handle, data.c_str(), data.size(), &n, NULL);
		THROW_IF ((!st) || (n!=data.size()))
			
		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(out)
	
	return false;
}

bool BPrivyAPI::readFile(const std::string& pth, FB::JSObjectPtr out, const boost::optional<unsigned long long> o_pos)
{
	try
	{
		CONSOLE_LOG("In readFile");

		const fsize64_t pos = o_pos.get_value_or(0);

		bfs::path path(pth);
		path.make_preferred();
		string path_s(path.string());

		HANDLEGuard h( CreateFile(path.c_str(), 
									FILE_GENERIC_READ, // GENERIC_READ | WRITE required by LockFile
									FILE_SHARE_WRITE | FILE_SHARE_READ,
									NULL, 
									OPEN_EXISTING, 
									FILE_ATTRIBUTE_NORMAL | FILE_FLAG_SEQUENTIAL_SCAN, 
									NULL) );
		
		
		LARGE_INTEGER fsiz;
		BOOL rval = GetFileSizeEx(h.m_Handle, &fsiz);
		THROW_IF (rval == 0)

		msize32_t siz = ((fsiz.QuadPart-pos) > bp::MAX_READ_BYTES) ? bp::MAX_READ_BYTES : static_cast<msize32_t>(fsiz.QuadPart);

		MemGuard buf(siz); // Allocates memory

		h.PrepareForRead(pos, siz); // throws

		DWORD nread=0;
		rval = ReadFile(h.m_Handle, buf.m_P, siz, &nread, NULL);
		THROW_IF (rval==0); // throws
		CHECK((siz==nread)); // throws

		buf.NullTerm(siz);
		FB::VariantMap m;
		m.insert(VT(PROP_DATA, static_cast<char*>(buf.m_P)));
		m.insert(VT(PROP_FILESIZE, siz));
		out->SetProperty(PROP_READFILE, m);
		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(out)
	
	return false;
}

bool BPrivyAPI::renameFile(bfs::path& o_path, bfs::path& n_path, FB::JSObjectPtr& out, bool nexists)
{
	try
	{
		CONSOLE_LOG("In renameFile");

		// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
		HANDLEGuard h1( CreateFile(o_path.c_str(),
									GENERIC_READ, // GENERIC_READ | WRITE required by LockFile
									FILE_SHARE_DELETE,
									NULL, 
									OPEN_EXISTING, 
									FILE_ATTRIBUTE_NORMAL | FILE_FLAG_WRITE_THROUGH, 
									NULL), o_path );
		h1.PrepareForRename();

		if (nexists)
		{
			// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
			HANDLEGuard h2( CreateFile(n_path.c_str(),
										GENERIC_READ, // GENERIC_READ | WRITE required by LockFile
										FILE_SHARE_DELETE,
										NULL, 
										OPEN_EXISTING, 
										FILE_ATTRIBUTE_NORMAL | FILE_FLAG_WRITE_THROUGH, 
										NULL), n_path );
			h2.PrepareForRename();
		}

		BOOL rval = MoveFileEx(o_path.c_str(), n_path.c_str(), MOVEFILE_REPLACE_EXISTING);
		THROW_IF3(!rval, o_path, n_path);
		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(out);
	return false;
}

//void SetLastErrorMsg(FB::JSObjectPtr out)
//{
//	DWORD err = GetLastError();
//	LPTSTR lpMsgBuf;
//
//	FormatMessage(
//          FORMAT_MESSAGE_ALLOCATE_BUFFER | 
//          FORMAT_MESSAGE_FROM_SYSTEM |
//          FORMAT_MESSAGE_IGNORE_INSERTS,
//          NULL,
//          err,
//          MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
//          (LPTSTR) &lpMsgBuf,
//		  0, NULL );
//
//	FB::VariantMap m;
//
//	m.insert(VT(PROP_SYSTEM_MESSAGE, static_cast<LPCTSTR>(lpMsgBuf)));
//	m.insert(VT(PROP_SYSTEM_CODE, SCodeToSCode(err)));
//	m.insert(VT(PROP_GENERIC_CODE, SCodeToPCode(err)));
//
//	out->SetProperty(PROP_ERROR, m);
//
//	LocalFree(lpMsgBuf);
//}
