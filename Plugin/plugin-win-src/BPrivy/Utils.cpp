#include "Utils.h"
#include "ErrorHandling.h"
#include <string>

using namespace std;

namespace bp
{
	// *** Value MUST be less than 4GiB since msize32_t is uint32_t
	const msize32_t MAX_READ_BYTES = 1048576; // = 1MB

	const std::string QUOTE						("\"");
	const std::string COMMA						(",");
	const std::string OPENB						("{");
	const std::string CLOSEB					("}");

	MemGuard::MemGuard(msize32_t siz)
	{
		m_P = malloc(siz);
		if (!m_P) {
			throw std::runtime_error(BPCODE_NO_MEM);
		}
		else {
			m_Siz = siz;
		}
	}

	MemGuard::~MemGuard	()
	{free(m_P);}

	void 
	MemGuard::NullTerm(msize32_t siz)
	{
		((char*)m_P)[siz>=m_Siz?m_Siz-1:siz] = 0;
	}

	std::string& JsonFriendly(std::string&& s)
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

} // end namespace bp
