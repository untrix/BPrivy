#ifndef H_BP_Utils
#define H_BP_Utils

#include <cstdint> // for uint64_t and uint32_t
#include <string> // for std::string

#ifdef DEBUG
#define IF_DEBUG(f, a) f(a)
#else
#define IF_DEBUG(f, a)
#endif

namespace bp
{
	typedef	uint64_t	fsize64_t;	// Used for file lengths (size, position)
	typedef uint32_t	msize32_t;	// Used for memory buffer lengths.
	typedef enum
	{
		ENT_OTHER = 0,
		ENT_FILE = 1,
		ENT_DIR = 2
	} ENT_TYPE;

	template <typename T>
	class MemGuard
	{
	public:
					MemGuard	(bp::msize32_t siz);
		virtual		~MemGuard	();
		void		NullTerm	(bp::msize32_t siz);
		operator T* ()	{
			return m_P;
		}
		T*					m_P;
		bp::msize32_t		m_Siz;
	};

	template <typename T>
	MemGuard<T>::MemGuard(msize32_t siz)
	{
		std::nothrow_t x;
		m_P = new(x) T[siz];
		if (!m_P) {
			throw BPError(ACODE_RESOURCE_UNAVAILABLE, BPCODE_NO_MEM);
		}
		else {
			m_Siz = siz;
		}
	}

	template <typename T>
	MemGuard<T>::~MemGuard	()
	{delete[](m_P);}

	template <typename T> void
	MemGuard<T>::NullTerm(msize32_t siz)
	{
		m_P[siz>=m_Siz?m_Siz-1:siz] = 0;
	}
	//std::string& JsonFriendly(std::string&& s);
	//std::string RandomPassword(int length);
} // end namespace bp
#endif // H_BP_Utils