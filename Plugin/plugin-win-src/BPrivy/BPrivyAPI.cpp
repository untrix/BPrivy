//FireBreath Includes
#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"
#include "global/config.h"
#include <APITypes.h>
#include <DOM/Window.h>

//BPrivy Includes
#include "BPrivyAPI.h"
#include "ErrorHandling.h"
#include "Utils.h"
#include <sstream>  // For stringstream
#include <process.h>// For getpid
#include <stdlib.h> // For malloc
#include <malloc.h> // For malloc

using namespace bp;
using namespace std;

typedef FB::VariantMap::value_type	VT;

/*
#include <boost/filesystem/fstream.hpp>
#include <boost/interprocess/sync/file_lock.hpp>
#include <boost/interprocess/sync/scoped_lock.hpp>
#include <boost/interprocess/sync/sharable_lock.hpp>
#include <boost/interprocess/sync/named_mutex.hpp>
#include <boost/interprocess/creation_tags.hpp>
#include <time.h>
namespace bpt = boost::GENERIC_time;
namespace bip = boost::interprocess;
*/

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
#ifdef WIN32
	return _getpid();
#else
	return getpid();
#endif
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

		m.insert(VT(PROP_FILESIZE, file_size(path)));
		if (path.has_extension()) {
			m.insert(VT(PROP_FILEEXT, path.extension().string()));
			if (path.has_stem()) {
				m.insert(VT(PROP_FILESTEM, path.stem().string()));
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

void securityCheck(const bfs::path& path)
{
	static const std::string ext[] = {".3ab", ".3ad", ".3ao", ".3ac", ".3am"};

}

bool BPrivyAPI::ls(const std::string& dirPath, FB::JSObjectPtr p)
{
	try 
	{
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
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST);
		}
		else if (bfs::is_regular_file(ResolveSymlinks(path, stat)))
		{
			FB::VariantMap v, v_e;
			fileToVariant(path, v, v_e);
			if (!v.empty())
			{
				p->SetProperty(PROP_FILESTAT, v);
			}
			if (!v_e.empty())
			{
				p->SetProperty(PROP_ERROR, v_e);
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
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_REPARSE_POINT);
		}
		else
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WRONG_FILETYPE);
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
			p->SetProperty(PROP_LSDIR, j.str());
		}
		
		return rVal;
	} 
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool BPrivyAPI::createDir(const std::string& s_path, FB::JSObjectPtr p)
{
	try
	{
		CONSOLE_LOG("In createDir");

		bfs::path path(s_path);
		securityCheck(path);

		if (!bfs::create_directory(path)) {ThrowLastSystemError(path);}

		bfs::permissions(path, bfs::others_read | bfs::others_write);

		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool BPrivyAPI::rm(const std::string& s_path, FB::JSObjectPtr p)
{
	try
	{
		CONSOLE_LOG("In rmDir");

		bfs::path path(s_path);
		securityCheck(path);

		bfs::file_status stat = bfs::symlink_status(path);

		if (!bfs::exists(stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST);
		}
		else if (bfs::is_directory(stat))
		{
			bfs::remove_all(path);
			return true;
		}
		else if (bfs::is_regular_file(stat))
		{
			//bfs::remove(path);
			//return true;
			return removeFile(path);
		}
		else if (stat.type() == bfs::reparse_file)
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_REPARSE_POINT);
		}
		else if (bfs::is_symlink(stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_IS_SYMLINK);
		}
		else
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WRONG_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool
BPrivyAPI::rename(const std::string& old_p, const std::string& new_p, FB::JSObjectPtr p, const boost::optional<bool> o_clob)
{
	try
	{
		CONSOLE_LOG("In rename");

		bfs::path n_path(new_p);
		bfs::path o_path(old_p);
		securityCheck(n_path, o_path);

		bfs::file_status n_stat = bfs::symlink_status(n_path);

		bool clob = o_clob.get_value_or(false);
		bool nexists = bfs::exists(n_stat);
		if ((!clob) && nexists)
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WOULD_CLOBBER);
		}


		bfs::file_status o_stat = bfs::symlink_status(o_path);
		if (!bfs::exists(o_stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST, o_path.string());
		}
		if (bfs::is_directory(o_stat))
		{
			// Don't allow clobbering of directories.
			if (nexists) {
				throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WOULD_CLOBBER);
			}
			
			bfs::rename(o_path, n_path);
			return true;
		}
		else if (bfs::is_regular_file(o_stat))
		{
			if ((nexists) && (!bfs::is_regular_file(n_stat))) {
				throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WRONG_FILETYPE);
			}
			return renameFile(o_path, n_path, nexists);
		}
		else
		{
			throw BPError(BPCODE_WRONG_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;	
}

bool
BPrivyAPI::copy(const std::string& old_p, const std::string& new_p, FB::JSObjectPtr p, const boost::optional<bool> o_clob)
{
	try
	{
		CONSOLE_LOG("In copy");

		bfs::path n_path(new_p);
		bfs::path o_path(old_p);
		securityCheck(old_p, new_p);

		bfs::file_status n_stat = bfs::symlink_status(n_path);
		bfs::file_status o_stat = bfs::symlink_status(o_path);

		if (!bfs::exists(o_stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST, o_path.string());
		}

		bool clob = o_clob.get_value_or(false);
		bool nexists = bfs::exists(n_stat);
		if ((!clob) && nexists)
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WOULD_CLOBBER);
		}

		if (bfs::is_directory(o_stat) | bfs::is_directory(n_stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WRONG_FILETYPE);
		}

		if (bfs::is_regular_file(o_stat))
		{
			if ((nexists) && (!bfs::is_regular_file(n_stat))) {
				throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WRONG_FILETYPE);
			}
			return copyFile(o_path, n_path, nexists);
		}
		else
		{
			throw BPError(BPCODE_WRONG_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;	
}


//bool BPrivyAPI::writeFile(const std::string& pth, const std::string& data, FB::JSObjectPtr out)
//{
//	try
//	{
//		if (data.empty()) { return true; }
//
//		bfs::path filePath(pth);
//		filePath.make_preferred();
//
//		//bfs::filebuf buf;
//		//buf.open(pth, ios_base::app);
//
//		//if (!exists(pth))
//		//{
//		//	// Create the file. A new file will only get created if openmode
//		//	// is out or trunc.
//		//	if (!buf.open(pth, ios_base::out))
//		//	{
//		//		CONSOLE_LOG("File " + pth + " could not be created.");
//		//		return false;
//		//	}
//		//	perms(pth, bfs::all_all);
//		//	buf.pubsync();
//		//	buf.close();
//		//	CONSOLE_LOG("File " + pth + " created.");
//		//}
//		
//		bfs::ofstream fs(filePath, ios_base::app);
//
//		if (!fs.is_open())
//		{
//			CONSOLE_LOG("Could Not open or create file " + filePath.string());
//			return false;
//		}
//
//		//bfs::path lckPath(filePath.string() + ".lck");
//		{
//			//bfs::filebuf lckb;
//			//if (!bfs::exists(lckPath)
//			//{
//			//	// create the lock file
//			//	lckb.open(lckPath, ios_base::trunc);
//			//}
//
//			//if (!lckb.is_open())
//			//{
//			//	CONSOLE_LOG("Could Not open or create lock file " + filePath.string());
//			//	return false;
//			//}
//		}
//		
//		{
//			CONSOLE_LOG("File Opened ! : " + filePath.string());
//			//bdt::ptime t(second_clock::universal_time + 5);
//			//string lkf(filePath.string() + ".lck");
//			std::string mutex_name = filePath.generic_string();
//			const char* mutex_name_c = mutex_name.c_str();
//			bip::named_mutex flk(bip::open_or_create, mutex_name_c);
//			//flk.timed_lock(bpt::from_time_t(time(&t) + 5));
//			bip::scoped_lock<bip::named_mutex> slk(flk);
//			//buf.sputn(data.c_str());
//			//buf.pubsync();
//			fs.write(data.c_str(), data.length());
//			fs.flush();
//			if (fs.bad())
//			{
//				CONSOLE_LOG("Couldn't write to file : " + fs.rdstate());
//			}
//			//flk.unlock();
//			//buf.close();
//			fs.close();
//			return true;
//		}
//	}
//	CATCH_FILESYSTEM_EXCEPTIONS(out)
//	return false;
//}

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