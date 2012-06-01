#ifndef H_BP_Utils
#define H_BP_Utils

#include <cstdint> // for uint64_t and uint32_t
#include <string> // for std::string

#ifdef DEBUG
#define CONSOLE_LOG(s) m_host->htmlLog(std::string("BPlugin: ") + (s))
#define IF_DEBUG(f, a) f(a)
#else
#define CONSOLE_LOG(s)
#define IF_DEBUG(f, a)
#endif

namespace bp
{
	typedef	uint64_t	fsize64_t;	// Used for file lengths (size, position)
	typedef uint32_t	msize32_t;	// Used for memory buffer lengths.

	class MemGuard
	{
	public:
					MemGuard	(bp::msize32_t siz);
		virtual		~MemGuard	();
		void		NullTerm	(bp::msize32_t siz);
		operator void* ()
		{
			return m_P;
		}
		void*				m_P;
		bp::msize32_t		m_Siz;
	};

	std::string& JsonFriendly(std::string&& s);
	//std::string RandomPassword(int length);

} // end namespace bp
#endif // H_BP_Utils