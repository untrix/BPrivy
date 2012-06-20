#include <cstdlib>
#include "BPi18n.h"
#include "Utils.h"
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

	ustring i18n::LocaleToUtf8(const char* s)
	{
		const char* conv_err = "BPError: could not convert error string to wcs";
		// Convert from locale charset to UNICODE by converting to wchar_t.
		size_t n = mbstowcs(NULL, s, 0);
		if (n) 
		{
			n++; // Add one for null terminator
			// buf.m_P below won't be word aligned. Not sure if that will
			// be a problem on Mac/Linux. On Windows this is okay per documentation.
			MemGuard buf(n*sizeof(wchar_t));//throws
			size_t r = mbstowcs((wchar_t*)buf.m_P, s, n);
			if (r == (size_t)-1) {
				return conv_err;
			}
			else {
				return FB::wstring_to_utf8((wchar_t*)buf.m_P);
			}
		}
		else {
			return conv_err;
		}
	}

}// end namespace bp

