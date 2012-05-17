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
    BPrivyAPI(const BPrivyPtr& plugin, const FB::BrowserHostPtr& host) :
        m_plugin(plugin), m_host(host)
    {
        registerMethod("testEvent", make_method(this, &BPrivyAPI::testEvent));
		registerMethod("ls", make_method(this, &BPrivyAPI::ls));
		registerMethod("getpid", make_method(this, &BPrivyAPI::getpid));
        registerMethod("appendFile", make_method(this, &BPrivyAPI::appendFile));
		registerMethod("readFile", make_method(this, &BPrivyAPI::readFile));
		registerMethod("createDir", make_method(this, &BPrivyAPI::createDir));
		registerMethod("rm", make_method(this, &BPrivyAPI::rm));
		registerMethod("rename", make_method(this, &BPrivyAPI::rename));

        // Read-write property
        registerProperty("testString",
                         make_property(this,
                                       &BPrivyAPI::get_testString,
                                       &BPrivyAPI::set_testString));
        
        // Read-only property
        registerProperty("version",
                         make_property(this,
                                       &BPrivyAPI::get_version));
    }

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
	bool ls(const std::string& dirPath, FB::JSObjectPtr out);
	bool appendFile(const std::string& path, const std::string& data, FB::JSObjectPtr out);
	bool readFile(const std::string& path, FB::JSObjectPtr out, boost::optional<unsigned long long> pos);
	bool createDir(const std::string& path, FB::JSObjectPtr);
	bool rm(const std::string& path, FB::JSObjectPtr out);
	// Note: rename will not clobber directories. For files, it will iff 'fclobber' was true.
	// If the renaming is for files, then it will obtain write locks on both files and ensure that no one is
	// reading or writing to either. Also, no locking is performed when renaming directories.
	bool rename(const std::string& old_p, const std::string& new_p, FB::JSObjectPtr out, const boost::optional<bool> clobber);

private:
	// Platform specific rename operation.
	bool renameFile(bfs::path& o_path, bfs::path& n_path, FB::JSObjectPtr& out, bool nexists);

private:
    BPrivyWeakPtr m_plugin;
    FB::BrowserHostPtr m_host;

    std::string m_testString;
};

#endif // H_BPrivyAPI
