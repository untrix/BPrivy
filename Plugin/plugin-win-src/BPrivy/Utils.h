#ifndef H_BP_Utils
#define H_BP_Utils
#include "BPi18n.h"

namespace bp
{
	void SetChosenPath(bp::JSObject* p, const wchar_t* path_s, ENT_TYPE entType);
	bool direntToVariant(const bfs::path& path, bp::VariantMap& v, 
						 bp::VariantMap& v_e, bp::ENT_TYPE type);
	//std::string RandomPassword(int length);
}

#endif // H_BP_Utils