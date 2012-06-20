#include <cstdlib>
#include "BPi18n.h"
#ifdef WIN32
#include <mbctype.h>
#endif


namespace bp 
{
	// convert a mbcs string to utf8 string.
	ustring GetUString(const std::string& s)
	{
		return s;
	}

#ifdef WIN32
	void i18n()
	{
		// Assume that the locale is set correctly automatically.
		// Make the multibyte codepage same as the locale codepage so that
		// all conversion routines (whether local routines or multibyte routines)
		// will perform the same conversions.
		_setmbcp(_MB_CP_LOCALE);
	}
#else
#endif
}

