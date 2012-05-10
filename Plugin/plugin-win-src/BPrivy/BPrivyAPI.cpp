/**********************************************************\

  Auto-generated BPrivyAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"
#include "global/config.h"
#include <APITypes.h>
#include <iostream>
#include <DOM/Window.h>

#include "BPrivyAPI.h"
#include <sstream>
#include <process.h>
#include <boost/filesystem.hpp>
#include <boost/filesystem/fstream.hpp>
#include <boost/interprocess/sync/file_lock.hpp>


namespace bfs = boost::filesystem;
using namespace std;
typedef FB::VariantMap::value_type	VT;

///////////////////////////////////////////////////////////////////////////////
/// @fn FB::variant BPrivyAPI::echo(const FB::variant& msg)
///
/// @brief  Echos whatever is passed from Javascript.
///         Go ahead and change it. See what happens!
///////////////////////////////////////////////////////////////////////////////
FB::variant BPrivyAPI::echo(const FB::variant& msg)
{
    static int n(0);
    fire_echo("So far, you clicked this many times: ", n++);

    // return "foobar";
    return msg;
}

///////////////////////////////////////////////////////////////////////////////
/// @fn BPrivyPtr BPrivyAPI::getPlugin()
///
/// @brief  Gets a reference to the plugin that was passed in when the object
///         was created.  If the plugin has already been released then this
///         will throw a FB::script_error that will be translated into a
///         javascript exception in the page.
///////////////////////////////////////////////////////////////////////////////
BPrivyPtr BPrivyAPI::getPlugin()
{
    BPrivyPtr plugin(m_plugin.lock());
    if (!plugin) {
        throw FB::script_error("The plugin is invalid");
    }
    return plugin;
}

// Read/Write property testString
std::string BPrivyAPI::get_testString()
{
    return m_testString;
}

void BPrivyAPI::set_testString(const std::string& val)
{
    m_testString = val;
}

// Read-only property version
std::string BPrivyAPI::get_version()
{
    return FBSTRING_PLUGIN_VERSION;
}

void BPrivyAPI::testEvent()
{
    fire_test();
}

unsigned int BPrivyAPI::getpid() const
{
	return _getpid();
}
/*
FB::VariantMap BPrivyAPI::ls2(std::string dirPath)
{
	bfs::path path(dirPath);
	FB::VariantMap m, m2;
	typedef FB::VariantMap::value_type	VT;

	m2.insert(VT(path.directory_string(), "nested value"));
	//m.insert(VT(path.directory_string(), "value"));
	//m.insert(VT("test", "test value"));
	m.insert(VT("m2", FB::variant(m2)));

	if ( (!bfs::exists(path)) || (!bfs::is_directory(path)) )
	{
		cout << path << " is not a directory" << endl;
		return m;
	}
	else 
	{
		cout << path << " is a directory" << endl;
		return m;
	}
}
*/

#define QUOTE ("\"")
#define COMMA (",")
#define OPENB ("{")
#define CLOSEB ("}")
#define CATCH_FILESYSTEM_EXCEPTIONS \
	catch (const bfs::filesystem_error& e)\
	{\
		HandleFilesystemException(e, p);\
	}\
	catch (const std::system_error& e)\
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

void HandleFilesystemException (const bfs::filesystem_error& e, FB::JSObjectPtr p)
{
	FB::VariantMap m;
	m.insert(VT("msg", e.code().message()));
	m.insert(VT("code", e.code().value()));
	m.insert(VT("gmsg", e.code().default_error_condition().message()));
	m.insert(VT("gcode", e.code().default_error_condition().value()));
	m.insert(VT("path", e.path1().string()));
	p->SetProperty("error", FB::variant(m));
}

void HandleSystemException(const std::system_error& e, FB::JSObjectPtr p)
{
	FB::VariantMap m;
	m.insert(VT("msg", e.code().message()));
	m.insert(VT("code", e.code().value()));
	m.insert(VT("gmsg", e.code().default_error_condition().message()));
	m.insert(VT("gcode", e.code().default_error_condition().value()));
	p->SetProperty("error", FB::variant(m));
}

void HandleStdException(const std::exception& e, FB::JSObjectPtr p)
{		
	FB::VariantMap m;
	m.insert(VT("msg", e.what()));
	p->SetProperty("error", FB::variant(m));
}

void HandleUnknownException (FB::JSObjectPtr p)
{

	p->SetProperty("error", "Unknown");
}

std::string& JsonFriendly(std::string& s)
{
	for (string::iterator it=s.begin(); it != s.end(); it++)
	{
		if ((*it) == '"')
		{ *it = '\'';}
		else if ((*it) == '\\')
		{ *it = '/'; }
	}

	return s;
}

void MakeErrorEntry(const bfs::filesystem_error& e, std::ostringstream& je)
{
	if (!e.path1().empty())
	{
		std::string s(e.path1().string());
		je << QUOTE << JsonFriendly(s) << QUOTE << ":{";
		je << "\"name\":" << e.path1().filename();
		if (e.path1().has_extension())
		{
			je << ",\"ex\":" << e.path1().extension();
			if (e.path1().has_stem())
			{
				je << ",\"st\":" << e.path1().stem();
			}
		}
		je << ",\"gmsg\":" << QUOTE << JsonFriendly(s = e.code().default_error_condition().message()) << QUOTE;
		je << ",\"gcode\":" << e.code().default_error_condition().value();
		je << ",\"msg\":" << QUOTE << JsonFriendly(s = e.code().message()) << QUOTE;
		je << ",\"code\":" << e.code().value();
		je << CLOSEB;
	}
}

void MakeErrorEntry(const bfs::filesystem_error& e, FB::VariantMap& m)
{
	if (!e.path1().empty())
	{
		m.insert(VT("path", e.path1().string()));
		m.insert(VT("name", e.path1().filename().string()));
		if (e.path1().has_extension())
		{
			m.insert(VT("ex", e.path1().extension().string()));
			if (e.path1().has_stem())
			{
				m.insert(VT("st", e.path1().stem().string()));
			}
		}
	}
	m.insert(VT("gmsg", e.code().default_error_condition().message()));
	m.insert(VT("gcode", e.code().default_error_condition().value()));
	m.insert(VT("msg", e.code().message()));
	m.insert(VT("code", e.code().value()));
}

void fileToJson(const bfs::path& path, std::ostringstream& json, std::ostringstream& je)
{
	try 
	{
		json << QUOTE << path.filename().string() << "\":{";
		json << "\"sz\":" << std::to_string(file_size(path));
		if (path.has_extension()) {
			json << ",\"ex\":" << QUOTE << path.extension().string() << QUOTE;
			if (path.has_stem()) {
				json << ",\"st\":" << QUOTE << path.stem().string() << QUOTE;
			}
		}
		json << CLOSEB;
	}
	catch (const bfs::filesystem_error& e)
	{
		json.str(string()); // clear incompelte data
		MakeErrorEntry(e, je);
	}
	catch (...)
	{
		json.str(string()); // clear incompelte data
	}
}

void fileToVariant(const bfs::path& path, FB::VariantMap& v, FB::VariantMap& v_e)
{
	try 
	{
		FB::VariantMap m;

		m.insert(VT("sz", file_size(path)));
		if (path.has_extension()) {
			m.insert(VT("ex", path.extension().string()));
			if (path.has_stem()) {
				m.insert(VT("st", path.stem().string()));
			}
		}
		v.insert(VT(path.filename().string(), m));
	}
	catch (const bfs::filesystem_error& e)
	{
		v.clear(); // clear incompelte data
		MakeErrorEntry(e, v_e);
	}
	catch (...)
	{
		v.clear(); // clear incompelte data
	}
}

void dirToJson(const bfs::path& path, std::ostringstream& json, std::ostringstream& je)
{
	try
	{
		json << QUOTE << path.filename().string() << "\":{";
		if (path.has_extension()) 
		{
			json << "\"ex\":" << QUOTE << path.extension().string() << QUOTE;
			if (path.has_stem()) {
				json << ",\"st\":" << QUOTE << path.stem().string() << QUOTE;
			}
		}
		json << CLOSEB;
	}
	catch (const bfs::filesystem_error& e)
	{
		json.str(string()); // clear incompelte data
		MakeErrorEntry(e, je);
	}
	catch (...)
	{
		json.str(string()); // clear incompelte data
	}
}

void otherToJson(const bfs::path& path, std::ostringstream& json, std::ostringstream& je)
{
	try
	{
		json << QUOTE << path.filename().string() << "\":{";
		if (path.has_extension()) {
			json << "\"ex\":" << QUOTE << path.extension().string() << QUOTE;
			if (path.has_stem()) {
				json << ",\"st\":" << QUOTE << path.stem().string() << QUOTE;
			}
		}
		json << CLOSEB;
	}
	catch (const bfs::filesystem_error& e)
	{
		json.str(string()); // clear incompelte data
		MakeErrorEntry(e, je);
	}
	catch (...)
	{
		json.str(string()); // clear incompelte data
	}
}

bfs::file_status& ResolveSymlinks(bfs::path& p, bfs::file_status& s)
{
	while (bfs::is_symlink(s))
	{
		p = bfs::read_symlink(p);
		s = bfs::status(p);
	}

	return s;
}

bool BPrivyAPI::ls(std::string& dirPath, FB::JSObjectPtr p)
{
	try {
		bfs::path path(dirPath);
		bfs::file_status stat = bfs::status(path);

		//FB::VariantMap m, m2, m3;
		//m3.insert(VT("m3-prop", "m3-val"));
		//m2.insert(VT("m3", FB::variant(m3)));
		//m.insert(VT("m2", FB::variant(m2)));
		//p->SetProperty("m", FB::variant(m));

		std::ostringstream j, jf, jd, jo, je;
		unsigned int i_f=0, i_d=0, i_o=0, i_e=0;
		bool rVal = false;

		jf << OPENB;
		jd << OPENB;
		jo << OPENB;
		je << OPENB;

		if (!bfs::exists(stat))
		{
			CONSOLE_LOG(dirPath + " does not exist");
			FB::VariantMap m;
			m.insert(VT("gcode", "PathNotExist"));
			p->SetProperty("error", FB::variant(m));
		}
		else if (bfs::is_regular_file(ResolveSymlinks(path, stat)))
		{
			FB::VariantMap v, v_e;
			fileToVariant(path, v, v_e);
			if (!v.empty())
			{
				p->SetProperty("lsFile", v);
			}
			if (!v_e.empty())
			{
				p->SetProperty("error", v_e);
			}
			rVal = true;
		}
		else if (bfs::is_directory(stat))
		{
			CONSOLE_LOG(dirPath + " is a directory");
			const bfs::directory_iterator it_end;
			bfs::directory_iterator it(path);
			for (i_f=0, i_d=0, i_o=0, i_e=0; it != it_end; it++)
			{
				std::ostringstream t_j, t_je;
				unsigned int dummy_i; unsigned int *p_i = &dummy_i; //Assign to dummy to avoid null-pointer
				ostringstream dummy_strm; 
				ostringstream *p_j = &dummy_strm;//Assign to dummy to avoid null-pointer

				if (bfs::is_directory(it->status())) 
				{
					p_i = &i_d;
					p_j = &jd;
					dirToJson(it->path(), t_j, t_je);
				}
				else if (bfs::is_regular_file(it->status())) 
				{
					p_i = &i_f;
					p_j = &jf;
					fileToJson(it->path(), t_j, t_je);
				}
				else 
				{
					p_i = &i_o;
					p_j = &jo;
					otherToJson(it->path(), t_j, t_je);
				}

				if (t_j.tellp())
				{
					if (*p_i>0) {(*p_j) << COMMA;}
					(*p_j) << t_j.str();
					(*p_i)++;
				}
				if (t_je.tellp())
				{
					if (i_e > 0) {je << COMMA;}
					je << t_je.str();
					i_e ++;
				}
			}
			rVal = true;
		}
		else if (stat.type() == bfs::reparse_file)
		{
			FB::VariantMap m;
			m.insert(VT("gcode", "PathIsReparsePoint"));
			p->SetProperty("error", FB::variant(m));
		}
		else
		{
			FB::VariantMap m;
			m.insert(VT("gcode", "PathNotADir"));
			p->SetProperty("error", FB::variant(m));
		}

		jf << CLOSEB;
		jd << CLOSEB;
		jo << CLOSEB;
		je << CLOSEB;

		unsigned int i = i_f + i_d + i_o + i_e;
		if (i > 0) 
		{
			j << OPENB;
			if (i_f > 0) {
				j << "\"f\":" << jf.str();
				if ((i -= i_f) > 0) {j << COMMA;}
			}
			if (i_d > 0) {
				j << "\"d\":" << jd.str();
				if ((i -= i_d) > 0) {j << COMMA;}
			}
			if (i_o > 0) {
				j << "\"o\":" << jo.str();
				if ((i -= i_o) > 0) {j << COMMA;}
			}
			if (i_e > 0) {
				j << "\"e\":" << je.str();
			}
			j << CLOSEB;
			p->SetProperty(std::string("lsDir"), j.str());
		}
		
		return rVal;
	} 
	CATCH_FILESYSTEM_EXCEPTIONS
	return false;
}

unsigned int BPrivyAPI::createFile(std::string& path, FB::JSObjectPtr p)
{
	try
	{
		CONSOLE_LOG("Entered CreateFile");
		bfs::filebuf buf;

		buf.open(path, ios_base::out);

		if (!buf.is_open())
		{
			CONSOLE_LOG("Could Not open file " + path);
		}
		else
		{
			CONSOLE_LOG("File Opened ! : " + path);
			boost::interprocess::file_lock flock(path.c_str());
			CONSOLE_LOG("File Locked !");
			flock.unlock();
		}
		return 0;
	}
	CATCH_FILESYSTEM_EXCEPTIONS
	return 0;
}