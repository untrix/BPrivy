#include <string>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "BPrivy.h"
#include <boost/filesystem.hpp>


#ifndef H_BPrivyAPI
#define H_BPrivyAPI

namespace bfs = boost::filesystem;

class BPrivyAPI : public FB::JSAPIAuto
{
public:
	////////////////////////////////////////////////////////////////////////////
	/// @fn BPrivyAPI::BPrivyAPI(const BPrivyPtr& plugin, const FB::BrowserHostPtr host)
	///
	/// @brief  Constructor for your JSAPI object.
	///         You should register your methods, properties, and events
	///         that should be accessible to Javascript from here.
	///
	/// @see FB::JSAPIAuto::registerMethod
	/// @see FB::JSAPIAuto::registerProperty
	/// @see FB::JSAPIAuto::registerEvent
	////////////////////////////////////////////////////////////////////////////
	BPrivyAPI(const BPrivyPtr& plugin, const FB::BrowserHostPtr& host);

	///////////////////////////////////////////////////////////////////////////////
    /// @fn BPrivyAPI::~BPrivyAPI()
    ///
    /// @brief  Destructor.  Remember that this object will not be released until
    ///         the browser is done with it; this will almost definitely be after
    ///         the plugin is released.
    ///////////////////////////////////////////////////////////////////////////////
    virtual ~BPrivyAPI() {};

    BPrivyPtr getPlugin();

    // Read/Write property ${PROPERTY.ident}
    std::string get_testString();
    void set_testString(const std::string& val);

    // Read-only property ${PROPERTY.ident}
    std::string get_version();

    // Event helpers
    FB_JSAPI_EVENT(test, 0, ());
    FB_JSAPI_EVENT(echo, 2, (const FB::variant&, const int));

    // Method test-event
    void testEvent();

	// API Methods
	//FB::VariantMap ls2(std::string dirPath);
	unsigned int getpid() const;
	/**
	 *	Lists the directory or filename indicated by the path argument. Results and errors are stored
	 *	in the out parameter and converted to a JS object eventually. Returns true or false.
	 *	If the path argument was an empty string, then it lists all browsable drives in the system
	 *  instead.
	 */
	bool ls(const std::string& dirPath, FB::JSObjectPtr out);
	bool appendFile(const std::string& path, const std::string& data, FB::JSObjectPtr out);
	bool readFile(const std::string& path, FB::JSObjectPtr out, boost::optional<unsigned long long> pos);
	bool createDir(const std::string& path, FB::JSObjectPtr);
	bool rm(const std::string& path, FB::JSObjectPtr out);
	// Note: rename will not clobber directories. For files, it will iff 'fclobber' was true.
	// If the renaming is for files, then it will obtain write locks on both files and ensure that no one is
	// reading or writing to either. Also, no locking is performed when renaming directories.
	bool rename(const std::string& old_p, const std::string& new_p, FB::JSObjectPtr out, const boost::optional<bool> clobber);
	// Copies files only.
	bool copy(const std::string& old_p, const std::string& new_p, FB::JSObjectPtr out, const boost::optional<bool> clobber);
	bool chooseFile(FB::JSObjectPtr p);
#ifdef DEBUG
	// Locks the file for write and returns without unlocking or closing it. This is to be used for lock testing only.
	unsigned long long BPrivyAPI::appendLock(const std::string& pth, FB::JSObjectPtr out);
	unsigned long long BPrivyAPI::readLock(const std::string& pth, FB::JSObjectPtr out);
#endif // DEBUG
private:
	// Platform specific rename operation.
	bool renameFile(bfs::path& o_path, bfs::path& n_path, bool nexists);
	bool copyFile(bfs::path& o_path, bfs::path& n_path, bool nexists);
	bool removeFile(bfs::path&);

private:
	void BPrivyAPI::AAAInit(FB::JSObjectPtr io);
	void securityCheck(const bfs::path& path, const std::string allowedExt[] );
	void securityCheck(const bfs::path& path, const bfs::path& path2, const std::string allowedExt[] );
	unsigned BPrivyAPI::lsDrives(std::ostringstream& jd);
	bfs::path m_dbPath;
	std::string m_aclToken;

    BPrivyWeakPtr m_plugin;
    FB::BrowserHostPtr m_host;

    std::string m_testString;
};

#endif // H_BPrivyAPI
