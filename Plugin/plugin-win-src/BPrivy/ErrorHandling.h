#ifndef H_BP_ErrorHandling
#define H_BP_ErrorHandling

#include "APITypes.h"
#include <string> // for std::string
#include <cstdint> // for uint64_t and uint32_t
#include <boost/filesystem.hpp>
#include "Utils.h"

// Error Handling Stuff
namespace bp
{
	//const std::string SCodeToPCode(std::uint32_t err);
	const std::string& SCodeToACode(std::uint32_t err);
	const std::string SCodeToSCode(std::uint32_t err);
	const std::string PCodeToPCode(int ev);
	const std::string& PCodeToACode(int ev);

	// String Constants
	extern const std::string PROP_SYSTEM_MESSAGE;
	extern const std::string PROP_GENERIC_MESSAGE;
	extern const std::string PROP_SYSTEM_CODE;
	extern const std::string PROP_GENERIC_CODE;
	extern const std::string PROP_A_CODE;
	extern const std::string PROP_ERROR;
	extern const std::string PROP_INFO;
	extern const std::string PROP_FILESTAT;
	extern const std::string PROP_PATH;
	extern const std::string PROP_PATH2;
	extern const std::string PROP_FILENAME;
	extern const std::string PROP_FILEEXT;
	extern const std::string PROP_FILESTEM;
	extern const std::string PROP_FILESIZE;
	extern const std::string PROP_DATA;
	extern const std::string PROP_READFILE;
	extern const std::string PROP_LSDIR;

	/***** Actionable Codes. GENERIC & System Error Codes are mapped to one of these *****/

	// User Actionable. User should resolve the situation
	// and retry.
	extern const std::string ACODE_ACCESS_DENIED;
	// User Actionable. Please retry after some
	// time.
	extern const std::string ACODE_RESOURCE_LOCKED;
	// User Actionable. Please supply correct path or retry
	// after situation is resolved. Bad path for read or
	// write.
	extern const std::string ACODE_BAD_PATH_ARGUMENT;
	// User Or Client Error: Bad pathname syntax for creates or moves
	// Depending on situation either prompt client to provide a
	// correct pathname or auto-correct.
	extern const std::string ACODE_INVALID_PATHNAME;
	// This is a system/environment problem that can be
	// observed and are in the user's control. Things
	// like network drive not available, or disk-full. User
	// should resolve the situation and retry the operation.
	extern const std::string ACODE_RESOURCE_UNAVAILABLE;
	// The situation is not fatal. It occurred owing to
	// client/system error. Look at the specific code,
	// autofix and auto-retry without prompting the user.
	extern const std::string ACODE_AUTORETRY;
	// This situation cannot be resolved either through user
	// intervention or by auto-fix. We don't have an automatic
	// resolution at this stage. Call customer support.
	extern const std::string ACODE_CANT_PROCEED;
	// Unmapped System Code
	extern const std::string ACODE_UNMAPPED;

	// Second level codes for providing more information. These manifest as generic-code ('gcd')
	// in the error object ('err') returned to javascript.
	extern const std::string BPCODE_UNAUTHORIZED_CLIENT;// Unauthorized client trying to access the API.
	extern const std::string BPCODE_WRONG_PASS; // Password too short or wrong.
	extern const std::string BPCODE_NEW_FILE_CREATED;// Informational. New File was created.
	extern const std::string BPCODE_NO_MEM;//Could not allocate memory
	extern const std::string BPCODE_ASSERT_FAILED;//Logic Error
	extern const std::string BPCODE_PATH_EXISTS;
	extern const std::string BPCODE_PATH_NOT_EXIST;
	extern const std::string BPCODE_WRONG_FILETYPE;
	extern const std::string BPCODE_REPARSE_POINT;
	extern const std::string BPCODE_IS_SYMLINK;
	extern const std::string BPCODE_WOULD_CLOBBER;//Exception thrown to prevent clobbering

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
		BPError(const string& ac) : acode(ac) {}
		BPError(const string& ac, const string& gc) : acode(ac), gcode(gc) {}
		BPError(const string& ac, const string& gc, const string& gmsg)
			: acode(ac), gcode(gc), gmsg(gmsg) {}
		BPError(const string& ac, const string& gc, const bfs::path& pth)
			: acode(ac), gcode(gc), path(pth.string()) {}
		string acode;
		string gcode;
		string path;
		string gmsg;
	};

	void MakeErrorEntry(const boost::filesystem::filesystem_error& e, std::ostringstream& je);
	void MakeErrorEntry(const boost::filesystem::filesystem_error& e, FB::VariantMap& m);
	void HandleFilesystemException (const bfs::filesystem_error& e, FB::JSObjectPtr& p);
	void HandleSystemException(const bs::system_error& e, FB::JSObjectPtr& p);
	void ParseSystemException(const bs::system_error& e, FB::VariantMap& m);
	void HandleStdException(const std::exception& e, FB::JSObjectPtr& p);
	void HandleUnknownException (FB::JSObjectPtr& p);
	void HandleBPError(const BPError&, FB::JSObjectPtr&);
	void SetInfoMsg(const std::string& code, FB::JSObjectPtr&);
	//void SetErrorMsg(const std::string& code, FB::JSObjectPtr&);

#define CHECK(b) \
	if (!b)\
	{\
		throw BPError(bp::BPCODE_ASSERT_FAILED);\
	}

#define ASSERT(b) CHECK(b)

} // end namespace bp
// Didn't have time to put everything into namespace bp
void ThrowLastSystemError(const boost::filesystem::path& pth);
#endif // H_BP_ErrorHandling