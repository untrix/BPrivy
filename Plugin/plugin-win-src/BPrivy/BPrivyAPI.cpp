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
//#include <sstream>  // For stringstream
#include <process.h>// For getpid
#include <stdlib.h> // For malloc
#include <malloc.h> // For malloc
#include <CryptCtx.h>
#include <boost/filesystem/fstream.hpp>

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
BPrivyAPI::BPrivyAPI(const BPrivyPtr& plugin, const FB::BrowserHostPtr& host) :
    m_plugin(plugin), m_host(host)
{
	CONSOLE_LOG("In BPrivyAPI::constructor");

	registerMethod("testEvent", make_method(this, &BPrivyAPI::testEvent));
	registerMethod("ls", make_method(this, &BPrivyAPI::ls));
	registerMethod("exists", make_method(this, &BPrivyAPI::exists));
	registerMethod("getpid", make_method(this, &BPrivyAPI::getpid));
	registerMethod("appendFile", make_method(this, &BPrivyAPI::appendFile));
	registerMethod("readFile", make_method(this, &BPrivyAPI::readFile));
	registerMethod("createDir", make_method(this, &BPrivyAPI::createDir));
	registerMethod("rm", make_method(this, &BPrivyAPI::rm));
	registerMethod("rename", make_method(this, &BPrivyAPI::rename));
	registerMethod("copy", make_method(this, &BPrivyAPI::copy));
	registerMethod("chooseFile", make_method(this, &BPrivyAPI::chooseFile));
	registerMethod("chooseFolder", make_method(this, &BPrivyAPI::chooseFolder));
	registerMethod("pathSeparator", make_method(this, &BPrivyAPI::pathSeparator));
	registerMethod("createCryptCtx", make_method(this, &BPrivyAPI::createCryptCtx));
	registerMethod("loadCryptCtx", make_method(this, &BPrivyAPI::loadCryptCtx));
#ifdef DEBUG
	registerMethod("chooseFileXP", make_method(this, &BPrivyAPI::chooseFileXP));
	registerMethod("chooseFolderXP", make_method(this, &BPrivyAPI::chooseFolderXP));
	registerMethod("appendLock", make_method(this, &BPrivyAPI::appendLock));
	registerMethod("readLock", make_method(this, &BPrivyAPI::readLock));
#endif

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

bfs::file_status& ResolveSymlinks(bfs::path& p, bfs::file_status& s)
{
	while (bfs::is_symlink(s))
	{
		p = bfs::read_symlink(p);
		s = bfs::status(p);
	}

	return s;
}

void BPrivyAPI::securityCheck(const bfs::path& path, const bfs::path& path2, const std::string allowedExt[])
{
	securityCheck(path, allowedExt);
	securityCheck(path2, allowedExt);
}

/*
o: {//Object returned by the plugin
    path: // sanitizes and echo's back path parameter
    path2: // The second path-parameter if any.
    err: {
        acode: "Actionable (BP) Code",
        gcode: "BP Code (More Specific than A-Code)",
        scode: "System Specific Code",
        gmsg: "Generic/BP Message",
        smsg: "System Message",
        path: "Path 1",
        path2: "Path 2"
    },
}
o: {
    path: // sanitizes and echo's back path parameter
    lsd: { //Output of list-dir
        d: { //Listing of directories
            dir1.ex1: {
                ex: ex1, //filename extension if applicable
                st: dir1 //filename stem if applicable
            },
            dir2: {},
            ...
        },
        f: {//Listing of regular files
            file1.ex1: {
                sz: 55,  //file size - mandatory
                ex: ex1, //filename extension if applicable 
                st:      //filename stem if applicable
            },
            file2: {sz: 60}, // No extension or stem here
            ...
        },
        o: {//entries that are neither normal files nor directories. e.g. Windows Reparse Points that are not symlinks
            "Documents and Settings": {}
        },
        e: {//Those directory entries where errors were encountered
            Drive:/absolutepath: {
                //Can have all properties of the err object shown above
                acode: ...,
                scode: ...,
                smsg: ...,
                name: stem.ext, // Filename
                ex: ext, // file extension
                st: filestem, // file stem
            },
            C:/hiberfil.sys: {
                acode: "ResourceLocked"
                ex: ".sys"
                name: "hiberfil.sys"
                scode: "ERROR_SHARING_VIOLATION"
                smsg: "The process cannot access the file because it is being used by another process"
                st: "hiberfil"
            },
            C:/pagefile.sys: {
                acode: "ResourceLocked"
                ex: ".sys"
                name: "pagefile.sys"
                scode: "ERROR_SHARING_VIOLATION"
                smsg: "The process cannot access the file because it is being used by another process"
                st: "pagefile"
            },
            ...
        },
    },
}
o: {
    // No path property since empty string that was supplied.
    lsd: {// Output of list-drives. For this mode the path argument should be an empty string.
        "C:": null,
        "D:": null,
        "Q:": null
    }        
}
o: {
    path: // sanitizes and echo's back path parameter
    lsf: {//Output of list-file. one file only
        filename.ext: {
            // Same as file entry in directory listing
        }
    }
}
 */

#ifdef DEBUG
void BPrivyAPI::CONSOLE_LOG(const std::string& s) 
{
	m_host->htmlLog(std::string("BPlugin: ") + (s));
}
void BPrivyAPI::CONSOLE_LOG(const std::wstring& s)
{
	std::wstring temp(L"BPlugin: ");
	m_host->htmlLog(FB::wstring_to_utf8(temp.append(s)));
}

#else
void BPrivyAPI::CONSOLE_LOG(const std::string& s){}
void BPrivyAPI::CONSOLE_LOG(const std::wstring& s) {}
#endif

bool BPrivyAPI::_exists(bfs::path& path, bp::JSObject* p)
{
	static const std::string allowedExt[] = {".3ab", ".3ad", ".3ao", ".3ac", ".3am", ".3at", ".csv", ""};
	try
	{
		securityCheck(path, allowedExt);
		return bfs::exists(path);
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool BPrivyAPI::_ls(bfs::path& path, bp::JSObject* p)
{
	try 
	{
		//bfs::path path(dirPath);
		bfs::file_status stat;
		if (!path.empty()) {
			stat = bfs::status(path);
			p->SetProperty(PROP_PATH, path);
		}

		bp::VariantMap m, mf, md, mo, me;

		//unsigned int i_f=0, i_d=0, i_o=0, i_e=0;
		bool rVal = false;

		if (path.empty())
		{
			if (lsDrives(md)>0)
			{
				m.insert(PROP_DIRS, md);
				p->SetProperty(PROP_LSDIR, m);
			}
			rVal = true;
		}
		else if (!bfs::exists(stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST);
		}
		else if (bfs::is_regular_file(ResolveSymlinks(path, stat)))
		{
			bp::VariantMap v, v_e;
			direntToVariant(path, v, v_e, ENT_FILE);
			if (!v.empty()) {
				p->SetProperty(PROP_LSFILE, v);
			}
			if (!v_e.empty()) {
				p->SetProperty(PROP_ERROR, v_e);
			}
			rVal = true;
		}
		else if (bfs::is_directory(stat))
		{
			//CONSOLE_LOG(path.wstring() + L" is a directory");
			const bfs::directory_iterator it_end;
			bool hide = false; // By default we list hidden files
			if (p->HasProperty(PROP_HIDE)) try
			{
				FB::variant t_var = p->GetProperty(PROP_HIDE);
				hide = t_var.convert_cast<bool>();
			}
			catch (...)
			{}

			for (bfs::directory_iterator it(path); it != it_end; it++)
			{
				// convert filenanme to utf8.
				// TODO: I18N
				bfs::path fname = it->path().filename();
				bfs::path pth = it->path();//TODO: Unnecessary copy
				bp::VariantMap m, e;

				if (hide && (it->status().hidden() == bfs::yes)) {
					continue;
				}
				else if (bfs::is_directory(it->status())) {
					if (direntToVariant(pth, m, e, ENT_DIR)) {
						md.insert(fname, m);
					}
				}
				else if (bfs::is_regular_file(it->status())) {
					if (direntToVariant(pth, m, e, ENT_FILE)) {
						mf.insert(fname, m);
					}
				}
				else {
					if (direntToVariant(pth, m, e, ENT_OTHER)) {
						mo.insert(fname, m);
					}
				}

				if (!e.empty()) {
					me.insert(fname, e);
				}
			}
			rVal = true;

			if (!mf.empty()) {
				m.insert(PROP_FILES, mf);
			}
			if (!md.empty()) {
				m.insert(PROP_DIRS, md);
			}
			if (!mo.empty()) {
				m.insert(PROP_OTHERS, mo);
			}
			if (!me.empty()) {
				m.insert(PROP_ERRORS, me);
			}
			p->SetProperty(PROP_LSDIR, m);
		}
		else if (stat.type() == bfs::reparse_file)
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_REPARSE_POINT);
		}
		else
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
		}
	
		return rVal;
	} 
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool BPrivyAPI::_createDir(bfs::path& path, bp::JSObject* p)
{
	static const std::string allowedExt[] = {".3ad", ""};

	try
	{
		CONSOLE_LOG("In createDir");

		securityCheck(path, allowedExt);

		if (!bfs::create_directory(path)) {ThrowLastSystemError(path);}

		bfs::permissions(path, bfs::others_read | bfs::others_write);

		return true;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool BPrivyAPI::_rm(bfs::path& path, bp::JSObject* p)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3am", ".3at", ""};

	try
	{
		CONSOLE_LOG("In rm");

		securityCheck(path, allowedExt);

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
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;
}

bool
BPrivyAPI::_rename(bfs::path& o_path, bfs::path& n_path, bp::JSObject* p, const boost::optional<bool> o_clob)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3at", ""};

	try
	{
		CONSOLE_LOG("In rename");

		securityCheck(n_path, o_path, allowedExt);

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
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST, o_path);
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
				throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
			}
			return renameFile(o_path, n_path, nexists);
		}
		else
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;	
}

bool
BPrivyAPI::_copy(bfs::path& o_path, bfs::path& n_path, bp::JSObject* p, const boost::optional<bool> o_clob)
{
	static const std::string allowedExt[] = {".3ao", ".3ac", ".3at", ""};

	try
	{
		CONSOLE_LOG("In copy");

		securityCheck(o_path, n_path, allowedExt);

		bfs::file_status n_stat = bfs::symlink_status(n_path);
		bfs::file_status o_stat = bfs::symlink_status(o_path);

		if (!bfs::exists(o_stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_PATH_NOT_EXIST, o_path);
		}

		bool clob = o_clob.get_value_or(false);
		bool nexists = bfs::exists(n_stat);
		if ((!clob) && nexists)
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_WOULD_CLOBBER);
		}

		if (bfs::is_directory(o_stat) | bfs::is_directory(n_stat))
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
		}

		if (bfs::is_regular_file(o_stat))
		{
			if ((nexists) && (!bfs::is_regular_file(n_stat))) {
				throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
			}
			return copyFile(o_path, n_path, nexists);
		}
		else
		{
			throw BPError(ACODE_BAD_PATH_ARGUMENT, BPCODE_BAD_FILETYPE);
		}
	}
	CATCH_FILESYSTEM_EXCEPTIONS(p)
	return false;	
}

std::wstring BPrivyAPI::pathSeparator()
{
	bfs::path path(L"/");
	path.make_preferred();
	return path.wstring();
}

void BPrivyAPI::securityCheck(const bfs::path& path, const std::string allowedExt[])
{
	//// We require path to be absolute. Also, filename must have an extension.
	//if ((!path.is_absolute()) || (! path.has_extension())) {
	//	throw BPError(ACODE_ACCESS_DENIED, BPCODE_UNAUTHORIZED_CLIENT);
	//}

	//// Extension must be one of those supplied
	//bool good_ext = false;
	//for (int i=0; !allowedExt[i].empty(); i++)
	//{
	//	if (path.extension() == allowedExt[i]) {
	//		good_ext = true;
	//		break;
	//	}
	//}
	//if (!good_ext)
	//	{throw BPError(ACODE_ACCESS_DENIED, BPCODE_UNAUTHORIZED_CLIENT);}

	//bool  isUnder3ab = false;
	//// The path should lie inside or at a .3ab directory
	//if (path.extension() != ".3ab")
	//{
	//	for (bfs::path::const_iterator it = path.begin(); it != path.end(); it++)
	//	{
	//		if (it->extension() == ".3ab") {
	//			isUnder3ab = true;
	//			break;
	//		}
	//	}
	//}
	//else {
	//	isUnder3ab = true;
	//}
	//if (!isUnder3ab) {
	//	throw BPError(ACODE_ACCESS_DENIED, BPCODE_UNAUTHORIZED_CLIENT);
	//}
}

unsigned int BPrivyAPI::_createCryptCtx(const bp::utf8& $, const bfs::path& cryptInfoFilePath, bp::JSObject* in_out)
{
	try
	{
		unsigned int ctxHandle = 0;
		crypt::BufHeap<char> pass($.c_str());
		ctxHandle = crypt::CryptCtx::Create(pass);
		crypt::ByteBuf outBuf;
		const crypt::CryptCtx& ctx = crypt::CryptCtx::Get(ctxHandle);
		ctx.serializeInfo(outBuf);

		bfs::basic_ofstream<uint8_t> fStream(cryptInfoFilePath, std::ios_base::out | std::ios_base::binary | std::ios_base::trunc);
		fStream.write(outBuf, outBuf.dataNum());
		fStream.flush();
		fStream.close();
		return ctxHandle;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(in_out)
	return 0;
}
unsigned int BPrivyAPI::_loadCryptCtx(const bp::utf8& $, const bfs::path& cryptInfoFilePath, bp::JSObject* in_out)
{
	try
	{
		unsigned int ctxHandle = 0;
		crypt::BufHeap<uint8_t> inBuf(bfs::file_size(cryptInfoFilePath));
		bfs::basic_ifstream<uint8_t> fStream(cryptInfoFilePath, std::ios_base::in | std::ios_base::binary);
		fStream.read(inBuf, inBuf.capacityBytes());
		if (fStream.fail()) {
			throw BPError(ACODE_CANT_PROCEED, BPCODE_BAD_FILE, L"Bad CryptInfo File");
		}
		fStream.close();
		inBuf.setDataNum(inBuf.capacityBytes());
		crypt::BufHeap<char> pass($.c_str());
		ctxHandle = crypt::CryptCtx::Load(pass, inBuf);
		
		return ctxHandle;
	}
	CATCH_FILESYSTEM_EXCEPTIONS(in_out)
	return 0;
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


//void BPrivyAPI::AAAInit(FB::JSObjectPtr io)
//{
//	// Following scenarios are possible:
//	// 1. DB is being freshly created.
//	// 2. An existing DB is opened.
//	//	  Plugin needs to verify caller is not malicious and return a random-token
//	//	  for future calls.
//	// 3. We were invoked a second time during the lifetime of the plugin instance.
//	//    Throw an exception in this case.
//
//	//FB::variant val = io->GetProperty(PROP_TOKEN);
//	//std::string token = val.cast<std::string>();
//
////	if (token.empty() && m_aclToken.empty())
//	{
//		FB::DOM::WindowPtr pWin = m_host->getDOMWindow();
//		std::string loc = pWin->getLocation();
//		CONSOLE_LOG("In AAAInit, loc = " + loc);
//		//m_aclToken = RandomPassword(32);
//
//		//io->SetProperty(PROP_TOKEN, m_aclToken);
//	}
//	//else
//	//{
//	//	//throw BPError(ACODE_ACCESS_DENIED, BP_PROTOCOL_VIOLATION);
//	//}
//}
//

//bool BPrivyAPI::createDB(const std::string& s_path,  FB::JSObjectPtr io)
//{
//	try
//	{
//		securityCheck(s_path, io);
//		// Check that password exists and is at least 10 characters long
//		FB::variant val = io->GetProperty(PROP_PASS);
//		std::string pass = val.cast<std::string>();
//		if (pass.size() < 10) {
//			throw BPError(ACODE_ACCESS_DENIED, BPCODE_WRONG_PASS, "Supplied password is too short.");
//		}
//	}
//	CATCH_FILESYSTEM_EXCEPTIONS(io)
//}
//
//bool BPrivyAPI::openDB(const std::string& s_path,  FB::JSObjectPtr io)
//{
//	AAAInit(io);
//}
