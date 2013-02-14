#ifndef H_BP_ErrorHandling
#define H_BP_ErrorHandling

#include <string> // for std::string
#include <cstdint> // for uint64_t and uint32_t
#include <boost/filesystem.hpp>
#include "Utils.h"
#include "BPi18n.h"
#include <CryptError.h>

// Error Handling Stuff
namespace bp
{
	const bp::ustring& SCodeToACodeW(std::uint32_t err);
	const bp::ustring SCodeToSCodeW(std::uint32_t err);
	const bp::ustring& PCodeToACodeW(int ev);
	//const bp::ustring&& PCodeToPCodeW(int ev);
	//const std::string SCodeToPCode(std::uint32_t err);

	// String Constants (make sure they're all UTF8 encoded)
	extern const bp::ustring PROP_ERRNAME;
	extern const bp::ustring PROP_SYSTEM_MESSAGE;
	extern const bp::ustring PROP_GENERIC_MESSAGE;
	extern const bp::ustring PROP_SYSTEM_CODE;
	extern const bp::ustring PROP_GENERIC_CODE;
	extern const bp::ustring PROP_A_CODE;
	extern const bp::ustring PROP_ERROR;
	extern const bp::ustring PROP_INFO;
	extern const bp::ustring PROP_LSFILE;
	extern const bp::ustring PROP_LSDIR;
	extern const bp::ustring PROP_FILES;
	extern const bp::ustring PROP_DIRS;
	extern const bp::ustring PROP_OTHERS;
	extern const bp::ustring PROP_ERRORS;
	extern const bp::ustring PROP_PATH;
	extern const bp::ustring PROP_PATH2;
	extern const bp::ustring PROP_DB_PATH;
	//extern const bp::ustring PROP_DB_PATH2;
	extern const bp::ustring PROP_FILENAME;
	extern const bp::ustring PROP_FILEEXT;
	extern const bp::ustring PROP_FILESTEM;
	extern const bp::ustring PROP_DATASIZE;
	extern const bp::ustring PROP_MTIME;
	extern const bp::ustring PROP_DATA;
	extern const bp::ustring PROP_READFILE;
	extern const bp::ustring PROP_HIDE;
	extern const bp::ustring PROP_FILE_FILTER;
	extern const bp::ustring PROP_DIALOG_TITLE;
	extern const bp::ustring PROP_DIALOG_BUTTON;
	extern const bp::ustring PROP_CLEAR_HISTORY;
	extern const bp::ustring PROP_PREFIX;
	extern const bp::ustring PROP_SUFFIX;
	extern const bp::ustring PROP_CRYPT_CTX;
	extern const bp::ustring PROP_NULL_CRYPT;
	extern const bp::ustring PROP_SECURE_DELETE;

	///////////// USER RECOVERABLE ERRORS ///////////
	/***** Actionable Codes. GENERIC & System Error Codes are mapped to one of these *****/
    // User informational.
    extern const bp::ustring ACODE_INFO;
 	// User Actionable. User should resolve the situation
 	// and retry.
 	extern const bp::ustring ACODE_ACCESS_DENIED;
 	// User Actionable. Please retry after some
 	// time.
 	extern const bp::ustring ACODE_RESOURCE_LOCKED;
 	// User Actionable. Please supply correct path or retry
 	// after situation is resolved. Bad path for read or
 	// write.
 	extern const bp::ustring ACODE_BAD_PATH_ARGUMENT;
 	// User Or Client Error: Bad pathname syntax for creates or moves
 	// Depending on situation either prompt client to provide a
 	// correct pathname or auto-correct.
 	extern const bp::ustring ACODE_INVALID_PATHNAME;
 	// This is a system/environment problem that can be
 	// observed and are in the user's control. Things
 	// like network drive not available, or disk-full. User
 	// should resolve the situation and retry the operation.
 	extern const bp::ustring ACODE_RESOURCE_UNAVAILABLE;
 	// The situation is not fatal. It occurred owing to
 	// client/system error. Look at the specific code,
 	// autofix and auto-retry without prompting the user.
 	extern const bp::ustring ACODE_AUTORETRY;
	// User supplied bad password or key file. Should retry after
	// correcting the error.
	extern const bp::ustring ACODE_BAD_PASSWD_OR_CRYPTINFO;
	// User provided a bad resource. User should correct the problem
	// and retry.
	extern const bp::ustring ACODE_BAD_CRYPTINFO;

	///////////// NOT USER RECOVERABLE ERRORS ///////////

	// This situation cannot be resolved either through user
 	// intervention or by auto-fix. We don't have an automatic
 	// resolution at this stage. Call customer support.
 	extern const bp::ustring ACODE_CANT_PROCEED;
 	// Unmapped System Code
 	extern const bp::ustring ACODE_UNMAPPED;
	extern const bp::ustring ACODE_UNKNOWN;
	// Indicates that a unsupported feature was trying to be accessed,
	// Or a resource-limit was reached (e.g. unsupported file size).
	// This is not a user actionable scenario. To the user, this is
	// as bad as CANT_PROCEED, but depending on the situation, the DB
	// may still be readable, but not editable.
	extern const bp::ustring ACODE_UNSUPPORTED;

	// Second level codes for providing more information. These manifest as generic-code ('gcd')
	// in the error object ('err') returned to javascript.
	extern const bp::ustring BPCODE_UNAUTHORIZED_CLIENT;// Unauthorized client trying to access the API.
	extern const bp::ustring BPCODE_NEW_FILE_CREATED;// Informational. New File was created.
	extern const bp::ustring BPCODE_NO_MEM;//Could not allocate memory
	extern const bp::ustring BPCODE_INTERNAL_ERROR;//Same semantic as ACODE_CANT_PROCEED.
	extern const bp::ustring BPCODE_PATH_EXISTS;
	extern const bp::ustring BPCODE_PATH_NOT_EXIST;
	extern const bp::ustring BPCODE_BAD_FILETYPE;
	extern const bp::ustring BPCODE_REPARSE_POINT;
	extern const bp::ustring BPCODE_IS_SYMLINK;
	extern const bp::ustring BPCODE_WOULD_CLOBBER;//Exception thrown to prevent clobbering
	extern const bp::ustring BPCODE_FILE_TOO_BIG;
	extern const bp::ustring BPCODE_INVALID_COPY_ARGS;
	extern const bp::ustring BPCODE_BAD_FILE; // Corrupted file
	// Same category as ACODE_CANT_PROCEED.
	extern const bp::ustring BPCODE_CRYPT_ERROR;

	extern const bp::ustring MSG_EMPTY;

	// Integer constants
	extern const msize32_t MAX_READ_BYTES;

	#define CATCH_FILESYSTEM_EXCEPTIONS(p) \
		catch (const bfs::filesystem_error& e)\
		{\
			HandleFilesystemException(e, p);\
		}\
		catch (const bp::BPError& e)\
		{\
			HandleBPError(e, p);\
		}\
		catch (crypt::Error& e)\
		{\
			HandleCryptError(e, p);\
		}\
		catch (const bs::system_error& e)\
		{\
			HandleSystemException(e, p);\
		}\
		catch (const std::exception& e)\
		{\
			HandleStdException(e, p);\
		}\
		catch (...)\
		{\
			HandleUnknownException(p);\
		}

	// JSON related constants
	extern const std::string QUOTE;
	extern const std::string COMMA;
	extern const std::string OPENB;
	extern const std::string CLOSEB;

	namespace bs = boost::system;
	namespace bfs = boost::filesystem;
	using namespace std;

	struct BPError
	{
		BPError(const wstring& ac) : acode(ac) {}
		BPError(const wstring& ac, const wstring& gc) : acode(ac), gcode(gc) {}
		BPError(const wstring& ac, const wstring& gc, const wstring& gmsg)
			: acode(ac), gcode(gc), gmsg(gmsg) {}
		BPError(const wstring& ac, const wstring& gc, const bp::constPathPtr pth)
			: acode(ac), gcode(gc), path(pth->wstring()) {}

		static void		Assert(bool cond,
							   const ustring& ac = ACODE_CANT_PROCEED,
							   const ustring& gc = BPCODE_INTERNAL_ERROR,
							   const ustring& msg = MSG_EMPTY);

		wstring acode;
		wstring gcode;
		bfs::path path;
		wstring gmsg;
	};

	void MakeErrorEntry(const boost::filesystem::filesystem_error& e, bp::VariantMap& m);
	void HandleFilesystemException (const bfs::filesystem_error& e, bp::JSObject* p);
	void HandleSystemException(const bs::system_error& e, bp::JSObject* p);
	void ParseSystemException(const bs::system_error& e, bp::VariantMap& m);
	void HandleStdException(const std::exception& e, bp::JSObject* p);
	void HandleUnknownException (bp::JSObject* p);
	void HandleUnknownException (bp::VariantMap& me);
	void HandleBPError(const BPError&, bp::JSObject*);
	void SetInfoMsg(const bp::ustring& code, bp::JSObject*, const std::wstring& msg = MSG_EMPTY);
	void HandleCryptError(crypt::Error&, bp::JSObject*);

#define CHECK(b) \
	if (!b)\
	{\
		throw BPError(ACODE_CANT_PROCEED, bp::BPCODE_INTERNAL_ERROR);\
	}

#define ASSERT(b) CHECK(b)

} // end namespace bp
// Didn't have time to put everything into namespace bp
void ThrowLastSystemError(const boost::filesystem::path& pth);
#endif // H_BP_ErrorHandling