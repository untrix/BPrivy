#ifndef H_BP_i18n
#define H_BP_i18n

#include <cstdint> // for uint64_t and uint32_t
#include <string> // for std::string
#include "APITypes.h"
#include "utf8_tools.h"
#include <boost/filesystem.hpp>


// NOTE: ALL INTERACTIONS WITH FIREBREATH/JSON MUST BE IN UNICODE WIDESTRING OR
// UTF8. ONLY UNICODE-WSTRINGS MUST BE INPUT FROM FIREBREATH AND ONLY
// UTF8 MUST BE PUT BACK INTO FIREBREATH (unfortunately firebreath is not very accepting
// of widestrings as return values). THIS IS SO BECAUSE FIREBREATH/
// JAVASCRIPT ASSUME THAT ALL STRINGS ARE UNICODE BUT OPERATING SYSTEMS DON'T
// MAKE THAT SAME ASSUMPITON IF THE STRING IS A (NARROW) CHARACTER STRING. ON THE
// OTHER HAND ALL OSs ASSUME UNICODE WHEN IT COMES TO WIDE-STRINGS. THEREFORE IT IS
// SAFER TO KEEP ALL UNICODE STRINGS IN WIDECHAR FORMAT when possible. OPERATING SYSTEMS WILL 
// CONVERT SBC AND MBC STRINGS FROM CURRENT LOCALE TO UNICODE WHEN CONVERTING STRINGS
// TO WIDECHAR. HOWEVER, due to practical reasons we do not want to convert all strings to
// wchar_t - because it would require more conversions (for e.g. htmlLog only takes char.
// FB does not easily support map with string as key). So we've decided to keep strings in
// native char format and convert to UTF8/UNICODE when interfacing with firebreath. So below
// is the strategy:
// 1. All strings received from FB shall be wstrings. This will ensure that when converting
//    to narrow-char, Windows will treat the wstring as UNICODE eventhough the locale maybe a
//    non-unicode codepage (say german.xyz). Similarly when converting back from char to wchar_t
//    windows will apply the correct codepage (if environment is properly setup).
// 2. GetLString will convert Unicode widestrings to Locale-specific narrow-strings if needed. For
//    windows, however I'm assuming that any converstion from wchar_t to char_t will do the right
//    thing automatically, hence the GetLString function for Windows will be a no-op. If this
//    turns out to be a wrong assumption then the fix should only be necessary within BPi18n.h and
//    BPi18n.cpp. All other code should call the GetUString and GetLString functions
//    judiciously even if the functions maybe be no-ops today.
// 3. All strings going back to FB must be utf8 strings. This is done at the point of
//    FB::VariantMap.insert calls. If the string is already known to be UTF-8 - e.g. hard-coded
//    error-codes, then there is no need to call GetUString. However, if the string is known to be
//    in the locale-dependent codepage, then the conversion must be performed by calling GetUString.
//    For e.g. path strings and system error messages that coul've been localized.


namespace bp
{
	// ustring and uwstring are being defined to alert the programmer that the string
	// data within is unicode. This is needed in Windows, where unicode is only supported
	// in wide-strings. Therefore one has to convert a regular mbcs-string to utf8 before
	// passing it in as a ustring parameter and vice-versa. The compiler of course will
	// not flag an error.
	typedef std::wstring uwstring;	// In Windows Unicode is only supported in wstring
									// std::string don't support unicode (i.e. utf-8)
									// Also, in general unicode is the only wide-character
									// in the world. Therefore it is safer to keep all
									// unicode data in wide-char instead of in utf-8.
	typedef std::string	ustring;
	typedef std::wstring uwstring;
	typedef std::map<uwstring, FB::variant> VariantMapW;

	ustring GetUString(const std::string& s);
	inline ustring GetUString(const char* p) 
	{
		return GetUString(ustring(p));
	}
	inline ustring GetUString(const boost::filesystem::path& path)
	{
		return FB::wstring_to_utf8(path.wstring());
		//return path.wstring();
	}
	inline std::wstring& GetLString(std::wstring& ws) { return ws; }
}// end namespace bp
#endif // H_BP_i18n