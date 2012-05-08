/**********************************************************\

  Auto-generated BPrivyAPI.h

\**********************************************************/

#include <string>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "BPrivy.h"

#ifndef H_BPrivyAPI
#define H_BPrivyAPI

#ifdef DEBUG
#define CONSOLE_LOG(s) m_host->htmlLog(std::string("BPlugin: ") + (s))
#else
#define CONSOLE_LOG(s)
#endif

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
        registerMethod("echo",      make_method(this, &BPrivyAPI::echo));
        registerMethod("testEvent", make_method(this, &BPrivyAPI::testEvent));
		registerMethod("lsDir", make_method(this, &BPrivyAPI::lsDir));
        
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

    // Method echo
    FB::variant echo(const FB::variant& msg);
    
    // Event helpers
    FB_JSAPI_EVENT(test, 0, ());
    FB_JSAPI_EVENT(echo, 2, (const FB::variant&, const int));

    // Method test-event
    void testEvent();

	// Method ls
	//FB::VariantMap ls2(std::string dirPath);
	bool lsDir(std::string dirPath, FB::JSObjectPtr p);

private:
    BPrivyWeakPtr m_plugin;
    FB::BrowserHostPtr m_host;

    std::string m_testString;
};

#endif // H_BPrivyAPI

