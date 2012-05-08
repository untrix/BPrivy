/**********************************************************\

  Auto-generated BPrivyAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"
#include "global/config.h"
#include <boost/filesystem.hpp>
#include <APITypes.h>
#include <iostream>
#include <DOM/Window.h>

#include "BPrivyAPI.h"
#include <sstream>

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
		std::string p = e.path1().string();
		je << QUOTE << JsonFriendly(p) << QUOTE << ":{";
		je << "\"name\":" << e.path1().filename();
		if (e.path1().has_extension())
		{
			je << ",\"ex\":" << e.path1().extension();
			if (e.path1().has_stem())
			{
				je << ",\"st\":" << e.path1().stem();
			}
		}
		je << ",\"msg\":" << QUOTE << JsonFriendly(std::string(e.what())) << QUOTE;
		je << ",\"code\":" << e.code().value();
		je << CLOSEB;
	}
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

bool BPrivyAPI::lsDir(std::string dirPath, FB::JSObjectPtr p)
{
	try {
		bfs::path path(dirPath);
		bfs::file_status stts = bfs::status(path);

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

		if (!bfs::exists(stts))
		{
			CONSOLE_LOG(dirPath + " does not exist");
			p->SetProperty("error", "PathNotExist");
		}
		else if (bfs::is_regular_file(stts))
		{
			p->SetProperty("error","PathNotADir");
		}
		else if (bfs::is_directory(stts))
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
		else
		{
			p->SetProperty("error","PathNotADir");
		}

		jf << CLOSEB;
		jd << CLOSEB;
		jo << CLOSEB;
		je << CLOSEB;

		j << OPENB;
		{
			unsigned int i = i_f + i_d + i_o + i_e;
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
		}
		j << CLOSEB;

		p->SetProperty(std::string("ls"), j.str());
		return rVal;
	} 
	catch (const bfs::filesystem_error& e)
	{
		FB::VariantMap m;
		m.insert(VT("msg", e.what()));
		m.insert(VT("code", e.code().value()));
		m.insert(VT("path", e.path1().string()));
		p->SetProperty("error", FB::variant(m));
		return false;
	}
	catch (const std::system_error& e)
	{
		FB::VariantMap m;
		m.insert(VT("msg", e.what()));
		m.insert(VT("code", e.code().value()));
		p->SetProperty("error", FB::variant(m));
		return false;
	}
	catch (const std::exception& e)
	{
		FB::VariantMap m;
		m.insert(VT("msg", e.what()));
		p->SetProperty("error", FB::variant(m));
		return false;
	}
	catch (...)
	{
		p->SetProperty("error", "Unknown");
		return false;
	}
}