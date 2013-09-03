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
#include "utf8_tools.h"
#include <Shlobj.h>
#include <Shobjidl.h>
#include <Objbase.h>

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
#define FILE_SHARE_PROMISCUOUS (FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE)

namespace bp {

const bp::ustring SCodeToSCodeW(std::uint32_t err)
{
	switch (err)
	{
	// User Error: Insufficient Access Rights
	case ERROR_ACCESS_DENIED:
		return bp::ustring(L"ERROR_ACCESS_DENIED");
	case ERROR_INVALID_ACCESS:
		return bp::ustring(L"ERROR_INVALID_ACCESS");
	//The requested files operation failed because the storage policy blocks that type of file.
	// For more information, contact your system administrator
	case ERROR_CONTENT_BLOCKED: return bp::ustring(L"ERROR_CONTENT_BLOCKED");
	case ERROR_FILE_READ_ONLY: return bp::ustring(L"ERROR_FILE_READ_ONLY"); //The specified file is read only
	// User Error: Insufficient Network Access Rights
	case ERROR_NETWORK_ACCESS_DENIED: return bp::ustring(L"ERROR_NETWORK_ACCESS_DENIED");
	case ERROR_INVALID_PASSWORD: return bp::ustring(L"ERROR_INVALID_PASSWORD"); //The specified network password is not correct
	// Resource Locked
	// System Or User Error: Try Again After Sometime
	case ERROR_SHARING_VIOLATION: return bp::ustring(L"ERROR_SHARING_VIOLATION");
	case ERROR_LOCK_VIOLATION: return bp::ustring(L"ERROR_LOCK_VIOLATION");
	case ERROR_SHARING_BUFFER_EXCEEDED: return bp::ustring(L"ERROR_SHARING_BUFFER_EXCEEDED"); // Too many files opened for sharing.
	case ERROR_DRIVE_LOCKED: return bp::ustring(L"ERROR_DRIVE_LOCKED"); //The disk is in use or locked by another process.
	case ERROR_PATH_BUSY: return bp::ustring(L"ERROR_PATH_BUSY"); //The path specified cannot be used at this time
	case ERROR_LOCK_FAILED: return bp::ustring(L"ERROR_LOCK_FAILED"); //Unable to lock a region of a file
	case ERROR_BUSY: return bp::ustring(L"ERROR_BUSY"); //The requested resource is in use.
	case ERROR_DELETE_PENDING: return bp::ustring(L"ERROR_DELETE_PENDING"); //The file cannot be opened because it is in the process of being deleted

	// User Error: Bad Path Supplied For Read
	case ERROR_FILE_NOT_FOUND:
	case ERROR_PATH_NOT_FOUND:	case ERROR_BAD_NETPATH: return bp::ustring(L"ERROR_BAD_NETPATH");//The network path was not found
	case ERROR_REM_NOT_LIST: return bp::ustring(L"ERROR_REM_NOT_LIST"); //Windows cannot find the network path
	case ERROR_BAD_PATHNAME: return bp::ustring(L"ERROR_BAD_PATHNAME"); //The specified path is invalid
	case ERROR_NETNAME_DELETED: return bp::ustring(L"ERROR_NETNAME_DELETED"); //The specified network name is no longer available
	case ERROR_OPEN_FAILED: return bp::ustring(L"ERROR_OPEN_FAILED"); //The system cannot open the device or file specified
	// User Or Client Error: Bad path for creates or moves
	case ERROR_ALREADY_EXISTS: return bp::ustring(L"ERROR_ALREADY_EXISTS");//Cannot create a file when that file already exists
	case ERROR_FILE_EXISTS: return bp::ustring(L"ERROR_FILE_EXISTS"); //The file exists
	// User Or Client Error: Bad pathname syntax for creates or moves
	case ERROR_DIRECTORY: return bp::ustring(L"ERROR_DIRECTORY"); //The directory name is invalid.
	case ERROR_INVALID_NAME: return bp::ustring(L"ERROR_INVALID_NAME"); //The filename, directory name, or volume label syntax is incorrect
	case ERROR_FILENAME_EXCED_RANGE: return bp::ustring(L"ERROR_FILENAME_EXCED_RANGE");//The filename or extension is too long
	case ERROR_META_EXPANSION_TOO_LONG: return bp::ustring(L"ERROR_META_EXPANSION_TOO_LONG");//The global filename characters, * or ?, are entered 
										//incorrectly or too many global filename characters are specified
	// System Issues : Try Again after issue is resolved
	case ERROR_NETWORK_BUSY: return bp::ustring(L"ERROR_NETWORK_BUSY");//The network is busy.
	case ERROR_DEV_NOT_EXIST: return bp::ustring(L"ERROR_DEV_NOT_EXIST"); // The specified network resource or device is no longer available.
	case ERROR_SHARING_PAUSED: return bp::ustring(L"ERROR_SHARING_PAUSED"); // The remote server has been paused or is in the process of being started
	case ERROR_UNEXP_NET_ERR: return bp::ustring(L"ERROR_UNEXP_NET_ERR"); //An unexpected network error occurred
	case ERROR_REQ_NOT_ACCEP: return bp::ustring(L"ERROR_REQ_NOT_ACCEP"); //No more connections can be made to this remote computer at this time
							  //because there are already as many connections as the computer can accept
	case ERROR_NO_MORE_SEARCH_HANDLES: return bp::ustring(L"ERROR_NO_MORE_SEARCH_HANDLES"); //No more internal file identifiers available
	case ERROR_DISK_TOO_FRAGMENTED: return bp::ustring(L"ERROR_DISK_TOO_FRAGMENTED");//The volume is too fragmented to complete this operation
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs. The data has been lost.
	// This error may be caused by a failure of your computer hardware or network connection.
	// Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA: return bp::ustring(L"ERROR_LOST_WRITEBEHIND_DATA");
	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused by network connectivity issues. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED: return bp::ustring(L"ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED");
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error was returned by the server on which the file exists. Please try to save this file elsewhere
	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR: return bp::ustring(L"ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR");
	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
	// This error may be caused if the device has been removed or the media is write-protected
	case ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR: return bp::ustring(L"ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR");
	case ERROR_FILE_INVALID: return bp::ustring(L"ERROR_FILE_INVALID");//The volume for a file has been externally altered so that the opened file is no longer valid
	// The requested file operation failed because the storage quota was exceeded. To free up disk space, move files to a
	// different location or delete unnecessary files. For more information, contact your system administrator
	case ERROR_DISK_QUOTA_EXCEEDED: return bp::ustring(L"ERROR_DISK_QUOTA_EXCEEDED");
	case ERROR_FILE_OFFLINE: return bp::ustring(L"ERROR_FILE_OFFLINE");//The file is currently not available for use on this computer
	case ERROR_HANDLE_DISK_FULL: return bp::ustring(L"ERROR_HANDLE_DISK_FULL");//The disk is full
	case ERROR_DISK_FULL: return bp::ustring(L"ERROR_DISK_FULL"); //There is not enough space on the disk
	case ERROR_NET_WRITE_FAULT: return bp::ustring(L"ERROR_NET_WRITE_FAULT"); //A write fault occurred on the network
	case ERROR_CANNOT_MAKE: return bp::ustring(L"ERROR_CANNOT_MAKE"); //The directory or file cannot be created

	// Recoverable Client Issues
	case ERROR_DIR_NOT_EMPTY: return bp::ustring(L"ERROR_DIR_NOT_EMPTY"); //The directory is not empty
	case ERROR_NOT_LOCKED: return bp::ustring(L"ERROR_NOT_LOCKED");//The segment is already unlocked
	case ERROR_CANCEL_VIOLATION: return bp::ustring(L"ERROR_CANCEL_VIOLATION");//A lock request was not outstanding for the supplied cancel region
	case ERROR_INVALID_LOCK_RANGE: return bp::ustring(L"ERROR_INVALID_LOCK_RANGE"); //A requested file lock operation cannot be processed due to an invalid
								   //byte range

		// Unrecoverable System issues
	case ERROR_FILE_TOO_LARGE: return bp::ustring(L"ERROR_FILE_TOO_LARGE");//The file size exceeds the limit allowed and cannot be saved
	case ERROR_HANDLE_EOF: return bp::ustring(L"ERROR_HANDLE_EOF");//Reached the end of the file

	default:
		return std::to_wstring((unsigned long long)err);
	}
}

const bp::ustring& SCodeToACodeW(std::uint32_t err)
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
	case ERROR_FILE_NOT_FOUND:
	case ERROR_PATH_NOT_FOUND:
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
					HANDLEGuard			(HANDLE h, const bfs::path& pth)
		: m_Handle(h), m_Locked(false), m_Path(pth)
		{if (h==INVALID_HANDLE_VALUE) ThrowLastSystemError();}

	virtual			~HANDLEGuard		()	{close();}
	virtual void	close				();

	void			PrepareForAppend	(msize32_t siz); // throws
	void			PrepareForRead		(); // throws
	void			ReadLock			();
	void			WriteLock			(msize32_t append_siz = 0);
	HANDLE			GetHandle			() {return m_Handle;}

	static HANDLE	OpenFileForDeleteOrRenameLocking	(const bfs::path& pth);
	static HANDLE	OpenFileForAppend					(const bfs::path& pth, 
														 bp::JSObject* inOut);
	static HANDLE	OpenFileForRead						(const bfs::path& pth);
	static HANDLE	OpenFileForCopyOutLocking			(const bfs::path& pth);
	static HANDLE	OpenFileForCopyInLocking			(const bfs::path& pth);
	static HANDLE	OpenFileForOverwrite				(const bfs::path& pth, 
														 bool exists, 
														 bp::JSObject* inOut);

private:
	HANDLE	m_Handle;
	const bfs::path& m_Path;

private:
	// Prevent compiler from generating constructors
	HANDLEGuard();
	HANDLEGuard(const HANDLEGuard&);
	HANDLEGuard operator=(const HANDLEGuard&);

	bool	m_Locked;
	DWORD	m_LkPos1;
	DWORD	m_LkPos2;
	LARGE_INTEGER	m_LkSiz;
};

HANDLE
HANDLEGuard::OpenFileForRead(const bfs::path& path)
{
	return CreateFileW(path.c_str(), 
			GENERIC_READ, // GENERIC_READ or GENERIC_WRITE required by LockFile
			FILE_SHARE_READ, // Read Lock. Allow readers,
				// but not writers/deleters/renamers.
			NULL, 
			OPEN_EXISTING, // fails if the file does not exist.
			FILE_FLAG_SEQUENTIAL_SCAN, 
			NULL);
}

HANDLE HANDLEGuard::OpenFileForDeleteOrRenameLocking(const bfs::path& pth)
{
	return CreateFileW(pth.c_str(),
				GENERIC_READ, // GENERIC_READ | WRITE required by LockFile
				// DELETE sharing is needed for allowing deletes and renames later.
				FILE_SHARE_DELETE, // File is being opened for locking only. Actual
					// work will be done by Delete and Move calls. These require
					// FILE_SHARE_DELETE access. We'll keep other readers/writers at
					// bay by write-locking the entire file plus a few bytes beyond
					// that.
				NULL, 
				OPEN_EXISTING, // fails if the file does not exist.
				FILE_ATTRIBUTE_NORMAL, 
				NULL);
}

HANDLE HANDLEGuard::OpenFileForCopyOutLocking(const bfs::path& pth)
{
	return CreateFileW(pth.c_str(),
				GENERIC_READ, // GENERIC_READ or GENERIC_WRITE required by LockFile
				// READ sharing is needed later by CopyFileW.
				//FILE_SHARE_PROMISCUOUS,
				FILE_SHARE_READ, // Opening a file for locking purposes only. We
					// don't intend to use the handle for reading/writing. However,
					// we'll invoke CopyFile later which will need to read the file.
					// Therefore FILE_SHARE_READ is necessary. However, we'll also
					// read-lock the entire file before calling CopyFile and that will
					// ensure that there are no existing or future writers.
				NULL, 
				OPEN_EXISTING, // fails if the file does not exist.
				FILE_ATTRIBUTE_NORMAL, 
				NULL);
}

HANDLE HANDLEGuard::OpenFileForCopyInLocking(const bfs::path& pth)
{
	return CreateFileW(pth.c_str(),
				GENERIC_READ, // GENERIC_READ or GENERIC_WRITE required by LockFile
				FILE_SHARE_WRITE,       // Opening file for locking purpose only. We
					// don't intend to use the handle for reading or writing. However,
					// while the handle is open, we'll call CopyFile function, which
					// requires write access. Hence FILE_SHARE_WRITE is needed. Also,
					// we'll write-lock the entire file before calling CopyFile. This will
					// ensure that there are no existing or future readers or writers
					// other than this thread.
				NULL, 
				OPEN_EXISTING, // fails if the file does not exist.
				FILE_ATTRIBUTE_NORMAL, 
				NULL);
}

DWORD GetFileAttribHidden(bp::JSObject* inOut, DWORD defaultVal = 0)
{
    DWORD attrib_hidden = defaultVal;
    bool bVal;

    if (inOut && inOut->GetProperty(PROP_HIDDEN, bVal)) {
        if (bVal) {
            attrib_hidden = FILE_ATTRIBUTE_HIDDEN;
        }
        else {
            attrib_hidden = 0;
        }
    }

    return attrib_hidden;
}

HANDLE HANDLEGuard::OpenFileForOverwrite(const bfs::path& pth, bool exists, bp::JSObject* inOut)
{
    DWORD attrib_hidden = GetFileAttribHidden(inOut, 0);
	HANDLE h= CreateFileW(pth.c_str(),
		// Windows documentation advises using GENERIC_READ | GENERIC_WRITE over just
		// GENERIC_WRITE. They say it works better and faster for remote (SMB) file-systems.
		// Hence we'll use GENERIC_READ | GENERIC_WRITE instead of just GENERIC_WRITE.
		GENERIC_READ | GENERIC_WRITE, // GENERIC_READ or GENERIC_WRITE required by LockFile
		0, // Exclusive/Write Lock
		NULL, 
		// We maybe creating a file here and we prefer to keep it un-hidden unless overridden. Note that,
		// as per Windows documentation, (on XP and Win 2003) if you specify CREATE_ALWAYS 
		// on an already existing file (even if only for reading) you'll need to supply
		// FILE_ATTRIBUTE_HIDDEN along with that, otherwise the call will fail with
		// ERROR_ACCESS_DENIED. This maybe a problem (not sure) if the file is created on - say
		// Linux or MacOS and won't have the hidden attribute when it is transferred to Windows.
		// Update: Keeping FILE_ATTRIBUTE_HIDDEN anyway. Will use filenames starting
		// with a dot (.) so that files stay hidden on Linux and OSX.
		(exists ? TRUNCATE_EXISTING // file must exist and will be truncated.
				: CREATE_NEW),	   // file must not already exist. new one will be created.
		attrib_hidden | FILE_FLAG_WRITE_THROUGH,
		NULL);

	if ((h != INVALID_HANDLE_VALUE) && exists && (0 == GetLastError())) {
		// Implies new file created.
		SetInfoMsg(BPCODE_NEW_FILE_CREATED, inOut);
	}

	return h;
}

HANDLE HANDLEGuard::OpenFileForAppend(const bfs::path& path, bp::JSObject* inOut)
{
    DWORD attrib_hidden = GetFileAttribHidden(inOut, 0);
	// Open file in exclusive mode for appending.
	// If file doesn't exist then create it as a normal file.
	// In Windows, the file is opened using limited share-modes. However,
	// that feature won't work across all NFS shares. The only thing that will probably work
	// across different file systems is advisory file-locking (but sky-drives may
	// not honor those either). Hence we have to use all the available mechanisms at
	// out disposal. So, in addition to share-modes in Windows we'll use LockFile,
	// while in POSIX we'll use fcntl. Both provide the ability to lock regions of the 
	// file including regions beyond the file's current size. We'll use that technique
	// to exclusive lock the region beyond  the file's current size where we intend to 
	// write <data> to. This will ensure that concurrent BP instances as well as sky-drives
	// will be able to read all existing bytes but not the bytes that are being written. 
	// Read the code example 'Appending One File to Another File' in MSDN-help.
	HANDLE h= CreateFileW(path.c_str(),
		GENERIC_READ | GENERIC_WRITE, // GENERIC_READ or WRITE are required by
			// LockFile otherwise FILE_APPEND_DATA would have sufficed
		0,// Exclusive/Write Lock
		NULL,
		OPEN_ALWAYS,
		attrib_hidden | FILE_FLAG_WRITE_THROUGH,
		NULL);
		
	// OPEN_ALWAYS
	// Opens a file, always.
	// If the specified file exists, the function succeeds and the last-error code is set to ERROR_ALREADY_EXISTS (183).
	// If the specified file does not exist and is a valid path to a writable location, the function creates a file and
	// the last-error code is set to zero.
	if ((h != INVALID_HANDLE_VALUE) && (0 == GetLastError())) {
		// Implies new file created.
		SetInfoMsg(BPCODE_NEW_FILE_CREATED, inOut);
	}

	return h;
}

void HANDLEGuard::close()
{
	if (m_Locked) 
	{ 
		UnlockFile(m_Handle, m_LkPos1, m_LkPos2, m_LkSiz.LowPart, m_LkSiz.HighPart);
	}

	if (m_Handle != INVALID_HANDLE_VALUE) {
		CloseHandle(m_Handle);
		m_Handle = INVALID_HANDLE_VALUE;
	}
}

void HANDLEGuard::PrepareForAppend(msize32_t siz) // throws
{
	CHECK((!m_Locked));

	LONG end2 = 0;
	DWORD end1 = SetFilePointer(m_Handle, 0, &end2, FILE_END);
	THROW_IF2((end1 == INVALID_SET_FILE_POINTER) && (GetLastError() != NO_ERROR), m_Path);

	WriteLock(siz);
}

void HANDLEGuard::PrepareForRead() // throws
{
	CHECK((!m_Locked))

	//LARGE_INTEGER li;
	//li.QuadPart = 0;
	//LONG beg1 = li.LowPart;
	LONG beg2 = 0; //li.HighPart;

	//DWORD rval = SetFilePointer(m_Handle, beg1, &beg2, FILE_BEGIN);
	DWORD rval = SetFilePointer(m_Handle, 0, &beg2, FILE_BEGIN);
	THROW_IF2 ((rval == INVALID_SET_FILE_POINTER) && (GetLastError() != NO_ERROR), m_Path);
	ASSERT((rval == 0));

	ReadLock();
}

/**
	* Get a read-lock on the entire current size of the file.
	* This implies that:
	* 1) Someone could already be reading the file (e.g. Sky-Drive or another 3P instance)
	* 2) No-one is already writing or appending to the file.
	* 3) Allow future readers (requires FILE_SHARE_READ dwDesiredAccess parameter 
	*	  to CreateFile.
	* 4) Barr future writers or appenders as long as we're working on the file.
	*
	* If the FS is an NFS, then this may not do anything. We hope that it will at least
	* transform into advisory locking and that other readers/writers (esp. Sky-Drives)
	* will honor the advisory locking.
	*/
void HANDLEGuard::ReadLock()
{
	CHECK((!m_Locked));

	// Get a read-lock on the entire file. If the FS is an NFS, we hope that
	// this would translate into an advisory lock.
	LARGE_INTEGER fsiz;
	BOOL rval = GetFileSizeEx(m_Handle, &fsiz);
	THROW_IF2 ((rval == 0), m_Path);
	OVERLAPPED ov;
	ov.Internal = 0;
	ov.InternalHigh = 0;
	ov.Offset = 0;
	ov.OffsetHigh = 0;
	ov.hEvent = 0;

	rval = LockFileEx(m_Handle, LOCKFILE_FAIL_IMMEDIATELY, 0, 
						fsiz.LowPart, fsiz.HighPart, &ov);
	THROW_IF2 ((rval==0), m_Path);		

	m_LkPos1 = 0;
	m_LkPos2 = 0;
	m_LkSiz = fsiz;
	m_Locked = true;
}

/**
	* Get a write-lock on the entire current size of the file plus 1.
	* This will ensure that:
	* 1) No-one is already reading the file (e.g. Sky-Drive or another 3P instance)
	* 2) No-one is already writing or appending to the file.
	* 3) Barr future readers as long as we're working on the file. (Caveat: per Win32
	*	  docs., memory mapped files will not be prevented. However, we hope to prevent
	*	  those through FILE_SHARE_NULL (0) dwDesiredAccess parameter to CreateFile.
	* 4) Barr future writers or appenders as long as we're working on the file.
	*
	* If the FS is an NFS, then this may not do anything. We hope that it will at least
	* transform into advisory locking and that other readers/writers (esp. Sky-Drives)
	* will honor the advisory locking.
	*/
void HANDLEGuard::WriteLock(msize32_t append_size)
{
	CHECK((!m_Locked));

	LARGE_INTEGER fsiz;
	BOOL rval = GetFileSizeEx(m_Handle, &fsiz);
	THROW_IF2 ((rval == 0), m_Path);
	fsiz.QuadPart += ((append_size>0) ? append_size : 1);

	rval = LockFile(m_Handle, 0, 0, fsiz.LowPart, fsiz.HighPart);
	THROW_IF2 ((rval==0), m_Path);

	m_LkPos1 = 0;
	m_LkPos2 = 0;
	m_LkSiz = fsiz;
	m_Locked = true;
}

bool GetDataProperty(bp::JSObject* p, const bp::ustring& name, bp::utf8& val)
{
	if (p && p->HasProperty(name))
	try {
		FB::variant t_var = p->GetProperty(name);
		val = t_var.convert_cast<bp::utf8>();
		return true;	
	} catch (...) {}

	return false;
}

bool BPrivyAPI::_appendFile(const bfs::path& db_path, bfs::path& path, 
							const std::string& data, bp::JSObject* inOut)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3am", ".3at", ""};

	// NOTE: FireBreath plugin is compiled with the /D_UNICODE flag.

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

		//bfs::path path(pth);
		securityCheck(path, allowedExt);
		//path.make_preferred();

		msize32_t siz = data.size();
		// No need to proceed if there is no data to append. Prefix and suffix are applied only
		// if there was non-zero data. In that case the end-affect of this call would be
		// file creation.
		if (siz == 0) {return true;}

		// Prepare the buffer if needed.
		msize32_t bsiz = 0;
		bp::utf8 pfx, sfx;
		GetDataProperty(inOut, PROP_PREFIX, pfx);
		GetDataProperty(inOut, PROP_SUFFIX, sfx);
		bsiz = siz + pfx.length() + sfx.length();

		const crypt::CryptCtx* pCtx = crypt::CryptCtx::Get(db_path.wstring());

		if (pCtx  || (bsiz > siz))
		{
			//MemGuard<char> buf((bsiz));// Allocates memory for bsiz UTF8 bytes
			//buf.Copy(0, pfx.data(), pfx.length());
			//buf.Copy(pfx.length(), data.c_str(), siz);
			//buf.Copy(siz+pfx.length(), sfx.data(), sfx.length());
			crypt::ByteBuf buf((bsiz));// Allocates memory for bsiz UTF8 bytes
			buf.append((const uint8_t*)pfx.data(), pfx.length());
			buf.append((const uint8_t*)data.c_str(), siz);
			buf.append((const uint8_t*)sfx.data(), sfx.length());

			if (pCtx)
			{
				crypt::ByteBuf bufOut;
				pCtx->Encrypt(buf, bufOut);
				buf = std::move(bufOut);
				bsiz = buf.dataBytes();
			}

			HANDLEGuard h (HANDLEGuard::OpenFileForAppend(path, inOut), path);
			// Seek Pointer and Lock File.
			h.PrepareForAppend(bsiz);

			DWORD n;
			BOOL st = WriteFile(h.GetHandle(), buf, bsiz, &n, NULL);
			THROW_IF2( ((!st) || (n!=bsiz)), path);
		}
		else // No need to create buffer. Write directly from data.c_str()
		{
			HANDLEGuard h (HANDLEGuard::OpenFileForAppend(path, inOut), path);
			// Seek Pointer and Lock File.
			h.PrepareForAppend(siz);

			DWORD n;
			BOOL st = WriteFile(h.GetHandle(), data.c_str(), siz, &n, NULL);
			THROW_IF2( ((!st) || (n!=siz)), path);
		}
			
		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(inOut)
	
	return false;
}

bool BPrivyAPI::_readFile(const bfs::path& db_path, bfs::path& path, 
						  bp::JSObject* inOut, crypt::ByteBuf* pOutBuf)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3am", ".3at", ".csv", ""};

	try
	{
		CONSOLE_LOG("In readFile");

		securityCheck(path, allowedExt);

		HANDLEGuard h(  HANDLEGuard::OpenFileForRead(path), path );
		
		LARGE_INTEGER fsiz;
		BOOL rval = GetFileSizeEx(h.GetHandle(), &fsiz);
		THROW_IF2( (rval == 0), path);

		bp::utf8 pfx, sfx;
		msize32_t bsiz = 0, siz = 0, dsiz = 0;

		if ((fsiz.QuadPart) > bp::MAX_READ_BYTES)
		{
			//siz = bp::MAX_READ_BYTES;
			throw BPError(ACODE_UNSUPPORTED, BPCODE_FILE_TOO_BIG);
		}
		else 
		{
			siz = static_cast<msize32_t>(fsiz.QuadPart);
			GetDataProperty(inOut, PROP_PREFIX, pfx);
			GetDataProperty(inOut, PROP_SUFFIX, sfx);
			bsiz = siz + (pfx.length() + sfx.length());
		}

		// Set file pointer and lock for read.
		h.PrepareForRead(); // throws

		// Allocates memory for UTF8 bytes plus null-terminator.
		//MemGuard<char> buf((bsiz+1));
		crypt::ByteBuf buf;

		//ucs dbPath;
		const crypt::CryptCtx* pCtx = crypt::CryptCtx::Get(db_path.wstring());

		if (pCtx)
		{
			crypt::ByteBuf inBuf(siz);
			DWORD nread=0;
			rval = ReadFile(h.GetHandle(), inBuf, siz, &nread, NULL);
			inBuf.setDataNum(nread);
			THROW_IF2( (rval==0), path); // throws
			CHECK((siz==nread)); // throws

			h.close();

			crypt::ByteBuf outBuf(bsiz + 1);
			outBuf.append((const uint8_t*)pfx.data(), pfx.length());
			outBuf.seek(pfx.length());

            // if Decrypt returns false, but doesn't throw an exception, then it
            // means that only part of the data was successfully decrypted. However,
            // that part of usable, hence we will return true.
			if (!pCtx->Decrypt(std::move(inBuf), outBuf)) {
                SetInfoMsg(BPCODE_BAD_FILE, inOut, L"Decryption Error in: " + path.wstring());
            }

			buf = std::move(outBuf);
			buf.rewind();
		}
		else
		{
			crypt::ByteBuf inBuf(bsiz+1);
			DWORD nread=0;
			inBuf.append((const uint8_t*)pfx.data(), pfx.length());
			inBuf.seek(pfx.length());
			rval = ReadFile(h.GetHandle(), inBuf, siz, &nread, NULL);
			inBuf.setDataNum(nread);
			THROW_IF2( (rval==0), path); // throws
			CHECK((siz==nread)); // throws

			h.close();

			buf = std::move(inBuf);
			buf.rewind();
		}

		//buf.Copy(0, pfx.data(), pfx.length());
		//buf.Copy(siz+pfx.length(), sfx.data(), sfx.length());
		buf.append((const uint8_t*)sfx.data(), sfx.length());
		//buf.NullTerm(bsiz);
		//FB::VariantMap m;
		//m.insert(VT(PROP_DATA, static_cast<char*>(buf.m_P)));
		//m.insert(VT(PROP_DATASIZE, siz));
		//out->SetProperty(PROP_READFILE, m);
		dsiz = buf.dataNum();
		if (pOutBuf)
		{
			// No null termination because this is a byte buffer.
			*pOutBuf = std::move(buf);
		}
		else
		{
			buf.append(0); // null terminate because data is transported to the browser
						   // as a string.
			inOut->SetProperty(PROP_DATA, buf);
			inOut->SetProperty(PROP_DATASIZE, dsiz);
		}
		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(inOut)
	
	return false;
}

bool BPrivyAPI::renameFile(const bfs::path& db_path1, bfs::path& o_path, 
						   const bfs::path& db_path2, bfs::path& n_path, 
						   bool nexists)
{
	CONSOLE_LOG("In renameFile");

	// We don't yet have code to move files across DBs (ABs), each of which may be encrypted
	// differently.
	BPError::Assert((db_path1==db_path2), ACODE_CANT_PROCEED, BPCODE_INTERNAL_ERROR,
					L"Cannot move a file across stores");

	// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
	HANDLEGuard h1( HANDLEGuard::OpenFileForDeleteOrRenameLocking(o_path), o_path );
	h1.WriteLock();

	if (nexists)
	{
		// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
		HANDLEGuard h2( HANDLEGuard::OpenFileForDeleteOrRenameLocking(n_path), n_path );
		h2.WriteLock();
	}

	BOOL rval = MoveFileExW(o_path.c_str(), n_path.c_str(), MOVEFILE_REPLACE_EXISTING);
	THROW_IF3(!rval, o_path, n_path);
	return true;
}

bool writeFileInt(HANDLEGuard& h, const bfs::path& path, crypt::ByteBuf& buf)
{
	h.WriteLock();
	DWORD n;
	BOOL st = WriteFile(h.GetHandle(), static_cast<const uint8_t*>(buf), buf.dataBytes(), &n, NULL);
	THROW_IF2 ((!st) || (n!= buf.dataBytes()), path);

	return true;
}

bool BPrivyAPI::createFileNE(const bfs::path& path, crypt::ByteBuf& buf, bp::JSObject* inOut)
{
    CONSOLE_LOG("In createFileNE");

	HANDLEGuard h( HANDLEGuard::OpenFileForOverwrite(path, false, inOut), path );
    return writeFileInt(h, path, buf);
	/*h.WriteLock();
	DWORD n;
	BOOL st = WriteFile(h.GetHandle(), static_cast<const uint8_t*>(buf), buf.dataBytes(), &n, NULL);
	THROW_IF2 ((!st) || (n!= buf.dataBytes()), path);

	return true;*/
}

bool BPrivyAPI::overwriteFileNE(const bfs::path& path, 
							    crypt::ByteBuf& buf,
                                bp::JSObject* inOut)
{
    CONSOLE_LOG("In overwriteFileNE");

    HANDLEGuard h( HANDLEGuard::OpenFileForOverwrite(path, true, inOut), path );
    return writeFileInt(h, path, buf);
	/*h.WriteLock();
	DWORD n;
	BOOL st = WriteFile(h.GetHandle(), static_cast<const uint8_t*>(buf), buf.dataBytes(), &n, NULL);
	THROW_IF2 ((!st) || (n!= buf.dataBytes()), path);

	return true;*/
}

bool BPrivyAPI::overwriteFile(const bfs::path& db_path, const bfs::path& path, 
							  crypt::ByteBuf& text, bool exists, bp::JSObject* inOut)
{
	CONSOLE_LOG("In overwriteFile");

	const crypt::CryptCtx* pCtx = crypt::CryptCtx::Get(db_path.wstring());

	crypt::ByteBuf buf;
	if (pCtx)
	{
		crypt::ByteBuf bufOut;
		pCtx->Encrypt(text, bufOut);
		buf = std::move(bufOut);
	}
	else {
		buf = std::move(text);
	}
	
	HANDLEGuard h( HANDLEGuard::OpenFileForOverwrite(path, exists, inOut), path );
    return writeFileInt(h, path, buf);
	/*h.WriteLock();
	DWORD n;
	BOOL st = WriteFile(h.GetHandle(), static_cast<const uint8_t*>(buf), buf.dataBytes(), &n, NULL);
	THROW_IF2 ((!st) || (n!= buf.dataBytes()), path);

	return true;*/
}

bool BPrivyAPI::copyFile(bfs::path& o_path, bfs::path& n_path, bool nexists)
{
	CONSOLE_LOG("In copyFile");

	// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
	HANDLEGuard h1( HANDLEGuard::OpenFileForCopyOutLocking(o_path), o_path );
	h1.ReadLock();

	if (nexists)
	{
		// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
		HANDLEGuard h2( HANDLEGuard::OpenFileForCopyInLocking(n_path), n_path );
		h2.WriteLock();
	}

	BOOL rval = CopyFileW(o_path.c_str(), n_path.c_str(), FALSE);
	THROW_IF3(!rval, o_path, n_path);
	return true;
}

bool BPrivyAPI::removeFile(bfs::path& pth)
{
	CONSOLE_LOG("In removeFile");

	// Ensure that no-one else has this file open for anything. Hence we'll need to lock it.
	HANDLEGuard h( HANDLEGuard::OpenFileForDeleteOrRenameLocking(pth), pth );
	h.WriteLock();

	BOOL rval = DeleteFileW(pth.c_str());
	THROW_IF2((!rval), pth);
	return true;
}


unsigned BPrivyAPI::lsDrives(bp::VariantMap& m)
{
	DWORD drives = GetLogicalDrives();
	DWORD mask = 1;
	wchar_t drive[3]; drive[1] = L':'; drive[2] = 0;
	unsigned n; char i;
	for (i=0, n=0; i < 26; i++, mask <<= 1)
	{
		if (drives & mask)
		{
			//if ((n++)>0) {json << COMMA;}
			n++;
			// This is already utf-8 so no unicode conversion necessary
			drive[0] = (wchar_t)(L'A' + i);
			m.insert(drive);
		}
	}

	return n;
}

bool GetDialogTitle(bp::JSObject* p, wstring& prop)
{
	if (p->HasProperty(PROP_DIALOG_TITLE))
	try {
		FB::variant t_var = p->GetProperty(PROP_DIALOG_TITLE);
		prop = t_var.convert_cast<std::wstring>();
		return true;	
	} catch (...) {}

	return false;
}

bool GetDialogButtonTitle(bp::JSObject* p, wstring& prop)
{
	if (p->HasProperty(PROP_DIALOG_BUTTON))
	try {
		FB::variant t_var = p->GetProperty(PROP_DIALOG_BUTTON);
		prop = t_var.convert_cast<std::wstring>();
		return true;	
	} catch (...) {}

	return false;
}
/** @requires Comdlg32.dll/lib */
bool BPrivyAPI::_chooseFileXP(bp::JSObject* p)
{
	OPENFILENAMEW ofn;       // common dialog box structure
	WCHAR szFile[2048];       // buffer for file name
	//HWND hwnd;              // owner window
	//HANDLE hf;              // file handle

	// Initialize OPENFILENAME
	ZeroMemory(&ofn, sizeof(ofn));
	ofn.lStructSize = sizeof(ofn);
	//ofn.hwndOwner = hwnd;
	// Set lpstrFile[0] to '\0' so that GetOpenFileName does not 
	// use the contents of szFile to initialize itself.
	ofn.lpstrFile = szFile; // buffer required.
	ofn.lpstrFile[0] = '\0';
	ofn.nMaxFile = sizeof(szFile);
	ofn.lpstrFilter = L"All\0*.*\0Text\0*.TXT\0";
	ofn.nFilterIndex = 1;
	ofn.lpstrFileTitle = NULL;
	ofn.nMaxFileTitle = 0;
	ofn.lpstrInitialDir = NULL; // We're not specifying any initial directory. Let the system decide. See below.
/*
	lpstrInitialDir
LPCTSTR
The initial directory. The algorithm for selecting the initial directory varies on different platforms.

Windows 7:

If lpstrInitialDir has the same value as was passed the first time the application used an Open or Save As dialog box, the path most recently selected by the user is used as the initial directory. 
Otherwise, if lpstrFile contains a path, that path is the initial directory. 
Otherwise, if lpstrInitialDir is not NULL, it specifies the initial directory. 
If lpstrInitialDir is NULL and the current directory contains any files of the specified filter types, the initial directory is the current directory. 
Otherwise, the initial directory is the personal files directory of the current user.
Otherwise, the initial directory is the Desktop folder.

Windows 2000/XP/Vista:

If lpstrFile contains a path, that path is the initial directory. 
Otherwise, lpstrInitialDir specifies the initial directory. 
Otherwise, if the application has used an Open or Save As dialog box in the past, the path most recently used is selected as the initial directory. However, if an application is not run for a long time, its saved selected path is discarded. 
If lpstrInitialDir is NULL and the current directory contains any files of the specified filter types, the initial directory is the current directory. 
Otherwise, the initial directory is the personal files directory of the current user.
Otherwise, the initial directory is the Desktop folder.
*/
	ofn.Flags = OFN_PATHMUSTEXIST | OFN_FILEMUSTEXIST | OFN_HIDEREADONLY | OFN_LONGNAMES | OFN_SHAREAWARE | OFN_DONTADDTORECENT;
	std::wstring filter;
	std::wstring title;

	try {
		if (p->HasProperty(PROP_FILE_FILTER))
		{
			FB::variant t_var = p->GetProperty(PROP_FILE_FILTER);
			std::vector<wstring> extn = t_var.convert_cast<std::vector<wstring> >();
			if (extn.size() > 0)
			{
				for (std::vector<wstring>::iterator it = extn.begin(); it != extn.end(); it++) {
					filter.append(it->c_str()); filter.append(1, 0);
				}
				filter.append(1, 0);
				ofn.lpstrFilter = filter.data();
			}
		}
		if (p->HasProperty(PROP_DIALOG_TITLE))
		{
			FB::variant t_var = p->GetProperty(PROP_DIALOG_TITLE);
			title = t_var.convert_cast<std::wstring>();
			ofn.lpstrTitle = title.c_str();
		}
	}
	catch (...)
	{}

	// Display the Open dialog box. 

	//CONSOLE_LOG("Going to call GetOpenFileName");
	BOOL rval = GetOpenFileName(&ofn);
	//CONSOLE_LOG("GetOpenFileName returned");
	if (rval==TRUE) {
		SetChosenPath(p, szFile, ENT_FILE);
		//p->SetProperty(PROP_PATH, szFile);
		return true;
	}
	else return false;
}

// Requires Ole32.lib and Shell32.lib
bool BPrivyAPI::_chooseFolderXP(bp::JSObject* p)
{
	//typedef struct _browseinfo {
	//  HWND              hwndOwner;
	//  PCIDLIST_ABSOLUTE pidlRoot;
	//  LPTSTR            pszDisplayName;
	//  LPCTSTR           lpszTitle;
	//  UINT              ulFlags;
	//  BFFCALLBACK       lpfn;
	//  LPARAM            lParam;
	//  int               iImage;
	//} BROWSEINFO, *PBROWSEINFO, *LPBROWSEINFO;

	std::wstring title;
	BROWSEINFOW bi;
	wchar_t name[MAX_PATH];
	ZeroMemory(&bi, sizeof(bi));
	bi.pidlRoot = NULL; // // We're not specifying any initial directory. A value of null specifies that the namespace root (the Desktop folder) is used..
	bi.pszDisplayName = name;
	if (p->HasProperty(PROP_DIALOG_TITLE))
	try {
		FB::variant t_var = p->GetProperty(PROP_DIALOG_TITLE);
		title = t_var.convert_cast<std::wstring>();
		bi.lpszTitle = title.c_str();
	} catch (...) {}
	bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE  | BIF_EDITBOX | BIF_USENEWUI | BIF_SHAREABLE ;
	PIDLIST_ABSOLUTE pidl = SHBrowseForFolderW(&bi);
	if (pidl)
	{
		name[MAX_PATH-1] = 0;
		p->SetProperty(PROP_FILENAME, name);
		wchar_t path[ MAX_PATH + 1 ]; path[0] = 0; // returned name is in unicode.
		if (SHGetPathFromIDList(pidl, path )) {
			SetChosenPath(p, path, ENT_DIR);
			//p->SetProperty(PROP_PATH, path);
		}

		return true;
	}
	else { return false; }
}

// Ole32.lib
bool BPrivyAPI::_choose(bp::JSObject* p, bool chooseFile)
{
	bool rval = false;
	// CoCreate the File Open Dialog object.
	IFileDialog *pfd = NULL;
	HRESULT hr = CoCreateInstance(CLSID_FileOpenDialog, 
		NULL, 
		CLSCTX_INPROC_SERVER, 
		IID_PPV_ARGS(&pfd));
	if (!SUCCEEDED(hr))
	{
		if (chooseFile) {return _chooseFileXP(p);}
		else {return _chooseFolderXP(p);}
	}
	else
	{
		FILEOPENDIALOGOPTIONS dwFlags;

		// Before setting, always get the options first in order 
		// not to override existing options.
		hr = pfd->GetOptions(&dwFlags);
		if (SUCCEEDED(hr))
		{
			// In this case, get shell items only for file system items.
			dwFlags |= (FOS_FORCEFILESYSTEM | FOS_PATHMUSTEXIST | FOS_FILEMUSTEXIST | FOS_DONTADDTORECENT |
						FOS_PICKFOLDERS | FOS_STRICTFILETYPES);
			if (chooseFile) {dwFlags &= (~FOS_PICKFOLDERS );}

			hr = pfd->SetOptions(dwFlags);

			if (SUCCEEDED(hr))
			{
				if (p->HasProperty(PROP_CLEAR_HISTORY))
				{
					pfd->ClearClientData();
				}
				
				std::wstring prop;
				if (p->HasProperty(PROP_FILE_FILTER))
				try {
					FB::variant t_var = p->GetProperty(PROP_FILE_FILTER);
					std::vector<wstring> extn = t_var.convert_cast<std::vector<wstring> >();
					if (extn.size() > 0)
					{
						COMDLG_FILTERSPEC rgSpec[MAX_EXT_LIST];
						int i; std::vector<wstring>::iterator it;
						for ( i=0, it= extn.begin(); (it != extn.end()) && (i<20); i++,it++) 
						{
							rgSpec[i].pszName = it->c_str();
							// Advance to next item in the list
							++it;
							rgSpec[i].pszSpec = it->c_str();
						}
						pfd->SetFileTypes(i, rgSpec);
					}
				} catch (...) {}

				if (GetDialogTitle(p, prop)) {
					pfd->SetTitle(prop.c_str());
				}
				if (GetDialogButtonTitle(p, prop)) {
					pfd->SetOkButtonLabel(prop.c_str());
				}

				// Show the dialog
				hr = pfd->Show(NULL);
				if (SUCCEEDED(hr))
				{
					// Obtain the result once the user clicks 
					// the 'Open' button.
					// The result is an IShellItem object.
					IShellItem *psiResult;
					hr = pfd->GetResult(&psiResult);
					if (SUCCEEDED(hr))
					{
						PWSTR pszFilePath = NULL;
						hr = psiResult->GetDisplayName(SIGDN_FILESYSPATH, &pszFilePath);
						if (SUCCEEDED(hr))
						{
							SetChosenPath(p, pszFilePath, chooseFile? ENT_FILE : ENT_DIR);
							CoTaskMemFree(pszFilePath);
							rval = true;
						}
						psiResult->Release();
					}
				}
			}
		}
		pfd->Release();
	}

	return rval;
}

#ifdef DEBUG
// API used for testing purposes
unsigned long long BPrivyAPI::_appendLock(bfs::path& path, bp::JSObject* out)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3am", ".3at", ""};

	try
	{
		CONSOLE_LOG("In writeLock");

		securityCheck(path, allowedExt);

		HANDLE h= CreateFileW(path.c_str(),
			// Windows documentation advises using GENERIC_READ | GENERIC_WRITE over just
			// GENERIC_WRITE. They say it works better and faster for remote (SMB) file-systems.
			// Hence we'll use GENERIC_READ | GENERIC_WRITE instead of just GENERIC_WRITE.
			GENERIC_READ | GENERIC_WRITE, // GENERIC_READ or GENERIC_WRITE required by LockFile
			FILE_SHARE_PROMISCUOUS, // This method is only used for debugging purposes hence
				// we're being lax with the FILE_SHARE mode here.
			NULL, 
			OPEN_EXISTING, // fails if the file does not exist.
			FILE_ATTRIBUTE_NORMAL | FILE_FLAG_WRITE_THROUGH, 
			NULL);
		THROW_IF2((h==INVALID_HANDLE_VALUE), path);

		// Copied from PrepareForAppend
		{
			LONG end2 = 0;
			DWORD end1 = SetFilePointer(h, 0, &end2, FILE_END);
			THROW_IF2((end1 == INVALID_SET_FILE_POINTER) && (GetLastError() != NO_ERROR), path);
			BOOL st = LockFile(h, end1, end2, 100, 0);
			THROW_IF2 ((!st), path);
		}
		return (unsigned long long) h; // now the file is locked and we're returning without closing or unlocking it.
	}
	CATCH_FILESYSTEM_EXCEPTIONS(out);
	return 0;
}

unsigned long long BPrivyAPI::_readLock(bfs::path& path, bp::JSObject* out)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3am", ".3at", ""};

	try
	{
		CONSOLE_LOG("In readLock");

		const fsize64_t pos = 0;

		securityCheck(path, allowedExt);

		HANDLE h= CreateFileW(path.c_str(), 
			GENERIC_READ, // GENERIC_READ | WRITE required by LockFile
			//FILE_SHARE_WRITE | FILE_SHARE_READ,
			FILE_SHARE_PROMISCUOUS, // This method is only used for debugging purposes hence
				// we're being lax with the FILE_SHARE mode here.
			NULL, 
			OPEN_EXISTING, // fails if the file does not exist.
			FILE_ATTRIBUTE_NORMAL | FILE_FLAG_SEQUENTIAL_SCAN, 
			NULL);
		THROW_IF2((h==INVALID_HANDLE_VALUE), path);
		
		LARGE_INTEGER fsiz;
		BOOL rval = GetFileSizeEx(h, &fsiz);
		THROW_IF2 ((rval == 0), path);

		msize32_t siz = static_cast<msize32_t>(fsiz.QuadPart);

		// Copied from PrepareForRead(pos, siz); // throws
		{
			OVERLAPPED ov;
			ov.Internal = 0;
			ov.InternalHigh = 0;
			ov.Offset = 0;
			ov.OffsetHigh = 0;
			ov.hEvent = 0;
			rval = LockFileEx(h, LOCKFILE_FAIL_IMMEDIATELY, 0, siz, 0, &ov);
			THROW_IF2 ((rval == 0), path);
		}
		return (unsigned long long) h;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(out)
	
	return 0;
}
#endif // DEBUG
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

//************* NOTE: All strings must be utf8/unicode********************
//const std::string SCodeToSCode(std::uint32_t err)
//{
//	switch (err)
//	{
//	// User Error: Insufficient Access Rights
//	case ERROR_ACCESS_DENIED:
//		return bp::ustring("ERROR_ACCESS_DENIED");
//	case ERROR_INVALID_ACCESS:
//		return bp::ustring("ERROR_INVALID_ACCESS");
//	//The requested files operation failed because the storage policy blocks that type of file.
//	// For more information, contact your system administrator
//	case ERROR_CONTENT_BLOCKED: return bp::ustring("ERROR_CONTENT_BLOCKED");
//	case ERROR_FILE_READ_ONLY: return bp::ustring("ERROR_FILE_READ_ONLY"); //The specified file is read only
//	// User Error: Insufficient Network Access Rights
//	case ERROR_NETWORK_ACCESS_DENIED: return bp::ustring("ERROR_NETWORK_ACCESS_DENIED");
//	case ERROR_INVALID_PASSWORD: return bp::ustring("ERROR_INVALID_PASSWORD"); //The specified network password is not correct
//	// Resource Locked
//	// System Or User Error: Try Again After Sometime
//	case ERROR_SHARING_VIOLATION: return bp::ustring("ERROR_SHARING_VIOLATION");
//	case ERROR_LOCK_VIOLATION: return bp::ustring("ERROR_LOCK_VIOLATION");
//	case ERROR_SHARING_BUFFER_EXCEEDED: return bp::ustring("ERROR_SHARING_BUFFER_EXCEEDED"); // Too many files opened for sharing.
//	case ERROR_DRIVE_LOCKED: return bp::ustring("ERROR_DRIVE_LOCKED"); //The disk is in use or locked by another process.
//	case ERROR_PATH_BUSY: return bp::ustring("ERROR_PATH_BUSY"); //The path specified cannot be used at this time
//	case ERROR_LOCK_FAILED: return bp::ustring("ERROR_LOCK_FAILED"); //Unable to lock a region of a file
//	case ERROR_BUSY: return bp::ustring("ERROR_BUSY"); //The requested resource is in use.
//	case ERROR_DELETE_PENDING: return bp::ustring("ERROR_DELETE_PENDING"); //The file cannot be opened because it is in the process of being deleted
//
//	// User Error: Bad Path Supplied For Read
//	case ERROR_FILE_NOT_FOUND:
//	case ERROR_PATH_NOT_FOUND:	case ERROR_BAD_NETPATH: return bp::ustring("ERROR_BAD_NETPATH");//The network path was not found
//	case ERROR_REM_NOT_LIST: return bp::ustring("ERROR_REM_NOT_LIST"); //Windows cannot find the network path
//	case ERROR_BAD_PATHNAME: return bp::ustring("ERROR_BAD_PATHNAME"); //The specified path is invalid
//	case ERROR_NETNAME_DELETED: return bp::ustring("ERROR_NETNAME_DELETED"); //The specified network name is no longer available
//	case ERROR_OPEN_FAILED: return bp::ustring("ERROR_OPEN_FAILED"); //The system cannot open the device or file specified
//	// User Or Client Error: Bad path for creates or moves
//	case ERROR_ALREADY_EXISTS: return bp::ustring("ERROR_ALREADY_EXISTS");//Cannot create a file when that file already exists
//	case ERROR_FILE_EXISTS: return bp::ustring("ERROR_FILE_EXISTS"); //The file exists
//	// User Or Client Error: Bad pathname syntax for creates or moves
//	case ERROR_DIRECTORY: return bp::ustring("ERROR_DIRECTORY"); //The directory name is invalid.
//	case ERROR_INVALID_NAME: return bp::ustring("ERROR_INVALID_NAME"); //The filename, directory name, or volume label syntax is incorrect
//	case ERROR_FILENAME_EXCED_RANGE: return bp::ustring("ERROR_FILENAME_EXCED_RANGE");//The filename or extension is too long
//	case ERROR_META_EXPANSION_TOO_LONG: return bp::ustring("ERROR_META_EXPANSION_TOO_LONG");//The global filename characters, * or ?, are entered 
//										//incorrectly or too many global filename characters are specified
//	// System Issues : Try Again after issue is resolved
//	case ERROR_NETWORK_BUSY: return bp::ustring("ERROR_NETWORK_BUSY");//The network is busy.
//	case ERROR_DEV_NOT_EXIST: return bp::ustring("ERROR_DEV_NOT_EXIST"); // The specified network resource or device is no longer available.
//	case ERROR_SHARING_PAUSED: return bp::ustring("ERROR_SHARING_PAUSED"); // The remote server has been paused or is in the process of being started
//	case ERROR_UNEXP_NET_ERR: return bp::ustring("ERROR_UNEXP_NET_ERR"); //An unexpected network error occurred
//	case ERROR_REQ_NOT_ACCEP: return bp::ustring("ERROR_REQ_NOT_ACCEP"); //No more connections can be made to this remote computer at this time
//							  //because there are already as many connections as the computer can accept
//	case ERROR_NO_MORE_SEARCH_HANDLES: return bp::ustring("ERROR_NO_MORE_SEARCH_HANDLES"); //No more internal file identifiers available
//	case ERROR_DISK_TOO_FRAGMENTED: return bp::ustring("ERROR_DISK_TOO_FRAGMENTED");//The volume is too fragmented to complete this operation
//	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs. The data has been lost.
//	// This error may be caused by a failure of your computer hardware or network connection.
//	// Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA: return bp::ustring("ERROR_LOST_WRITEBEHIND_DATA");
//	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error may be caused by network connectivity issues. Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED: return bp::ustring("ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED");
//	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error was returned by the server on which the file exists. Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR: return bp::ustring("ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR");
//	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error may be caused if the device has been removed or the media is write-protected
//	case ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR: return bp::ustring("ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR");
//	case ERROR_FILE_INVALID: return bp::ustring("ERROR_FILE_INVALID");//The volume for a file has been externally altered so that the opened file is no longer valid
//	// The requested file operation failed because the storage quota was exceeded. To free up disk space, move files to a
//	// different location or delete unnecessary files. For more information, contact your system administrator
//	case ERROR_DISK_QUOTA_EXCEEDED: return bp::ustring("ERROR_DISK_QUOTA_EXCEEDED");
//	case ERROR_FILE_OFFLINE: return bp::ustring("ERROR_FILE_OFFLINE");//The file is currently not available for use on this computer
//	case ERROR_HANDLE_DISK_FULL: return bp::ustring("ERROR_HANDLE_DISK_FULL");//The disk is full
//	case ERROR_DISK_FULL: return bp::ustring("ERROR_DISK_FULL"); //There is not enough space on the disk
//	case ERROR_NET_WRITE_FAULT: return bp::ustring("ERROR_NET_WRITE_FAULT"); //A write fault occurred on the network
//	case ERROR_CANNOT_MAKE: return bp::ustring("ERROR_CANNOT_MAKE"); //The directory or file cannot be created
//
//	// Recoverable Client Issues
//	case ERROR_DIR_NOT_EMPTY: return bp::ustring("ERROR_DIR_NOT_EMPTY"); //The directory is not empty
//	case ERROR_NOT_LOCKED: return bp::ustring("ERROR_NOT_LOCKED");//The segment is already unlocked
//	case ERROR_CANCEL_VIOLATION: return bp::ustring("ERROR_CANCEL_VIOLATION");//A lock request was not outstanding for the supplied cancel region
//	case ERROR_INVALID_LOCK_RANGE: return bp::ustring("ERROR_INVALID_LOCK_RANGE"); //A requested file lock operation cannot be processed due to an invalid
//								   //byte range
//
//		// Unrecoverable System issues
//	case ERROR_FILE_TOO_LARGE: return bp::ustring("ERROR_FILE_TOO_LARGE");//The file size exceeds the limit allowed and cannot be saved
//	case ERROR_HANDLE_EOF: return bp::ustring("ERROR_HANDLE_EOF");//Reached the end of the file
//
//	default:
//		return std::to_string((unsigned long long)err);
//	}
//}

//const bp::ustring& SCodeToACode(std::uint32_t err)
//{
//	switch (err)
//	{
//	// User Error: Insufficient Access Rights
//	case ERROR_ACCESS_DENIED:
//	case ERROR_INVALID_ACCESS:
//	//The requested files operation failed because the storage policy blocks that type of file.
//	// For more information, contact your system administrator
//	case ERROR_CONTENT_BLOCKED: //The requested files operation failed because the storage
//								//policy blocks that type of file. For more information, contact your system administrator
//	case ERROR_FILE_READ_ONLY: //The specified file is read only
//	// User Error: Insufficient Network Access Rights
//	case ERROR_NETWORK_ACCESS_DENIED:
//	case ERROR_INVALID_PASSWORD: //The specified network password is not correct
//		return Acode.utf8(ACODE_ACCESS_DENIED);
//		break;
//
//	// Resource Locked
//	// System Or User Error: Try Again After Sometime
//	case ERROR_SHARING_VIOLATION:
//	case ERROR_LOCK_VIOLATION:
//	case ERROR_SHARING_BUFFER_EXCEEDED: // Too many files opened for sharing.
//	case ERROR_DRIVE_LOCKED: //The disk is in use or locked by another process.
//	case ERROR_PATH_BUSY: //The path specified cannot be used at this time
//	case ERROR_LOCK_FAILED: //Unable to lock a region of a file
//	case ERROR_BUSY: //The requested resource is in use.
//	case ERROR_DELETE_PENDING: //The file cannot be opened because it is in the process of being deleted
//		return Acode.utf8(ACODE_RESOURCE_LOCKED);
//		break;
//
//	// User Error: Bad Path Supplied For Read
//	case ERROR_FILE_NOT_FOUND:
//	case ERROR_PATH_NOT_FOUND:
//	case ERROR_BAD_NETPATH://The network path was not found
//	case ERROR_REM_NOT_LIST: //Windows cannot find the network path
//	case ERROR_BAD_PATHNAME: //The specified path is invalid
//	case ERROR_NETNAME_DELETED: //The specified network name is no longer available
//	case ERROR_OPEN_FAILED: //The system cannot open the device or file specified
//	// User Or Client Error: Bad path for creates or moves
//	case ERROR_ALREADY_EXISTS://Cannot create a file when that file already exists
//	case ERROR_FILE_EXISTS: //The file exists
//		return Acode.utf8(ACODE_BAD_PATH_ARGUMENT);
//		break;
//
//	// User Or Client Error: Bad pathname syntax for creates or moves
//	case ERROR_DIRECTORY: //The directory name is invalid.
//	case ERROR_INVALID_NAME: //The filename, directory name, or volume label syntax is incorrect
//	case ERROR_FILENAME_EXCED_RANGE://The filename or extension is too long
//	case ERROR_META_EXPANSION_TOO_LONG://The global filename characters, * or ?, are entered 
//										//incorrectly or too many global filename characters are specified
//		return Acode.utf8(ACODE_INVALID_PATHNAME);
//		break;
//
//	// System Issues : User to try again after issue is resolved
//	case ERROR_NETWORK_BUSY://The network is busy.
//	case ERROR_DEV_NOT_EXIST: // The specified network resource or device is no longer available.
//	case ERROR_SHARING_PAUSED: // The remote server has been paused or is in the process of being started
//	case ERROR_UNEXP_NET_ERR: //An unexpected network error occurred
//	case ERROR_REQ_NOT_ACCEP: //No more connections can be made to this remote computer at this time
//							  //because there are already as many connections as the computer can accept
//	case ERROR_NO_MORE_SEARCH_HANDLES: //No more internal file identifiers available
//	case ERROR_DISK_TOO_FRAGMENTED://The volume is too fragmented to complete this operation
//	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs. The data has been lost.
//	// This error may be caused by a failure of your computer hardware or network connection.
//	// Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA:
//	//{Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error may be caused by network connectivity issues. Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_DISCONNECTED:
//	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error was returned by the server on which the file exists. Please try to save this file elsewhere
//	case ERROR_LOST_WRITEBEHIND_DATA_NETWORK_SERVER_ERROR:
//	// {Delayed Write Failed} Windows was unable to save all the data for the file %hs; the data has been lost.
//	// This error may be caused if the device has been removed or the media is write-protected
//	case ERROR_LOST_WRITEBEHIND_DATA_LOCAL_DISK_ERROR:
//	case ERROR_FILE_INVALID://The volume for a file has been externally altered so that the opened file is no longer valid
//	// The requested file operation failed because the storage quota was exceeded. To free up disk space, move files to a
//	// different location or delete unnecessary files. For more information, contact your system administrator
//	case ERROR_DISK_QUOTA_EXCEEDED:
//	case ERROR_FILE_OFFLINE://The file is currently not available for use on this computer
//	case ERROR_HANDLE_DISK_FULL://The disk is full
//	case ERROR_DISK_FULL: //There is not enough space on the disk
//	case ERROR_NET_WRITE_FAULT: //A write fault occurred on the network
//	case ERROR_CANNOT_MAKE: //The directory or file cannot be created
//		return Acode.utf8(ACODE_RESOURCE_UNAVAILABLE);
//		break;
//
//	// Recoverable Client Issues
//	case ERROR_NOT_LOCKED://The segment is already unlocked
//	case ERROR_CANCEL_VIOLATION://A lock request was not outstanding for the supplied cancel region
//	case ERROR_INVALID_LOCK_RANGE: //A requested file lock operation cannot be processed due to an invalid
//								   //byte range
//		return Acode.utf8(ACODE_AUTORETRY);
//		break;
//
//	// Unrecoverable System issues
//	case ERROR_DIR_NOT_EMPTY: //The directory is not empty
//	case ERROR_FILE_TOO_LARGE://The file size exceeds the limit allowed and cannot be saved
//	case ERROR_HANDLE_EOF://Reached the end of the file
//		return Acode.utf8(ACODE_CANT_PROCEED);
//		break;
//
//	default:
//		return Acode.utf8(ACODE_UNMAPPED);
//		break;
//	}
//}
