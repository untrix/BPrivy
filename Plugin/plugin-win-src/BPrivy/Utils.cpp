#include "Utils.h"
#include "ErrorHandling.h"
#include <string>
#include <boost/random/random_device.hpp>
#include <boost/random/uniform_int_distribution.hpp>

using namespace std;

namespace bp
{
	// *** Value MUST be less than 4GiB since msize32_t is uint32_t
	const msize32_t MAX_READ_BYTES = 10485760; // = 10MB

	bool direntToVariant(const bfs::path& path, bp::VariantMap& v, bp::VariantMap& v_e,
					 ENT_TYPE type)
	{
		bool rval = false;
		try 
		{
			if (type == ENT_FILE) {
				v.insert(PROP_FILESIZE, file_size(path));
				v.insert(PROP_MTIME, last_write_time(path));
			}
			if (path.has_extension()) {
				v.insert(PROP_FILEEXT, path.extension());
				if (path.has_stem()) {
					v.insert(PROP_FILESTEM, path.stem());
				}
			}

			rval = true;
		}
		catch (const bfs::filesystem_error& e) {
			v.clear(); // clear incompelte data
			MakeErrorEntry(e, v_e);
		}
		catch (...)	{
			v.clear(); // clear incompelte data
			HandleUnknownException(v_e);
		}

		return rval;
	}

	void SetChosenPath(bp::JSObject* p, const wchar_t* path_s, ENT_TYPE entType)
	{
		bfs::path path(path_s);
		p->SetProperty(PROP_PATH, path);
		bp::VariantMap m, me;
		direntToVariant(path, m, me, entType);
		if (!m.empty()) {
			p->SetProperty(PROP_LSFILE, m);
		}
		if (!me.empty()) {
			p->SetProperty(PROP_ERROR, me);
		}
	}


/*	std::string RandomPassword(unsigned len) 
	{
		std::string chars(
			"abcdefghijklmnopqrstuvwxyz"
			"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
			"1234567890"
			"!@#$%^&*()"
			"`~-_=+[{]{\\|;:'\",<.>/? ");
		len = (len>0)?len:10;
		std::ostringstream pass;

		boost::random::random_device rng;
		boost::random::uniform_int_distribution<> index_dist(0, chars.size() - 1);

		for(unsigned int i = 0; i < len; ++i) 
		{
			pass << chars[index_dist(rng)];
		}

		return pass.str();
	}*/

} // end namespace bp
