#ifndef H_BP_i18n
#define H_BP_i18n

#include <cstdint> // for uint64_t and uint32_t
#include <string> // for std::string
#include "APITypes.h"
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "utf8_tools.h"
#include <boost/filesystem.hpp>
#include <boost/system/error_code.hpp>
#include "Utils.h"

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
// 3. All strings going back to FB must be utf8 strings. This is done at the point of
//    bp::VariantMap.insert calls. If the string is already known to be UTF-8 - e.g. hard-coded
//    error-codes, then there is no need to call GetUString. However, if the string is known to be
//    in the locale-dependent codepage, then the conversion must be performed by calling LocaleToUtf8.
//    For e.g. system error messages that could've been localized.


namespace bp
{
	namespace bs = boost::system;
	namespace bfs = boost::filesystem;
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
	//class ustring : public std::wstring
	//{
	//public:
	//	ustring (const std::wstring& ws) : std::wstring(ws) {}
	//	ustring (const wchar_t* c_ws) : std::wstring(c_ws) {}
	//	inline std::string utf8() {return FB::wstring_to_utf8(*this);}
	//private:
	//	ustring (const std::string&);//disabled
	//	ustring (const char*);//disabled
	//	ustring& operator= (const std::string&); //disabled
	//	ustring& operator= (const char*); //disabled
	//};
	typedef std::string	ustring;
	class VariantMap;

	// Wrapper class used to prevent implicit conversion of non-path strings
	// to paths and eventually getting inserted into bp::VariantMap and bp::JSObject,
	// when actually the string wasn't a path.
	class constPathPtr
	{
	public:
		constPathPtr(const bfs::path& p) : pathP(&p) {}
		const bfs::path* operator-> () const {return pathP;}

	private:
		const bfs::path* pathP;
		constPathPtr(); // disabled
		constPathPtr(const char*);//disabled
		constPathPtr(const std::string&);//disabled
		constPathPtr& operator= (const char*);//disabled
		constPathPtr& operator= (const std::string&); // disabled 
	};

	class i18n
	{
		friend class bp::VariantMap;

	private:
		inline static ustring GetUString(const bp::constPathPtr path)
		{
			// In Windows wstring is guaranteed to be UNICODE. Boost::Filesystem will perform the MultiByteToWidechar
			// conversion on Windows, this will utilize the codepage in vogue but will ensure that the resulting wide-string
			// is in UNICODE - assuming that the originating string was in the native format to begin with, and I trust that
			// boost::filsystem will take care of that for paths that it obtains from the operating system - especialy since
			// we're providing the /D_UNICODE compile flags. For paths originating at FireBreath, Firebreath guarantees that
			// widestrings will be in unicode (and strings in UTF8). Therefore we import FireBreath strings in wide-char and
			// instantiate bfs::path objects with widestrings. In short the convention is that anything in widechar is encoded
			// in unicode. For MacOSX, the default imbued locale is UTF-8 - per Boost::Filesystem, hence there is no issue
			// there and therefore widechar or char doesn't make any difference. For Linux and POSIX, however, the default
			// locale maybe anything. But I'm going with the assumption that anything in wide-char must be UNICODE and therefore
			// converting strings from wchar_t to char and back using the imbued locale should ensure that we always end-up with
			// wchar_t strings in UNICODE. Therefore any conversion from wchar_t to char_t for use within the operating system
			// must use the imbued locale. On the other hand if the conversion must beget a bp::ustring (utf8) then the conversion
			// must be from UNICODE (wchar_t) to UNICODE (char_t = UTF-8).
			// Hence it is "safe" to assume that whatever comes out as path.wstring() must be UNICODE.
			return FB::wstring_to_utf8(path->wstring());
			//return path.wstring();
		}

		inline static ustring i18n::GetUString(const bs::error_code& ec)
		{
			return LocaleToUtf8(ec.message().c_str());
		}

		inline static ustring i18n::GetUString(const std::exception& e)
		{
			// e.what returns const char*
			return LocaleToUtf8(e.what());
		}
		
		static uwstring LocaleToUnicode(const std::string& str);
	private:
		static ustring LocaleToUtf8(const char* s);
	};

	// Wrapper around VariantMap to help localize all i18n code to one place.
	// Rest of the code will only use UNICODE wide-strings. This code will perform
	// conversion from wide-string to utf8 in order to satisfy FireBreath.
	class VariantMap
	{
	public:
		friend			class JSObject;
		typedef FB::VariantMap::value_type VT;

						VariantMap			() {}

		inline void		insert				(const ustring& name) {
			m_map.insert(VT(name, 0));
		}
		inline void		insert				(const ustring& name, bp::VariantMap& value) {
			m_map.insert(VT(name, value.m_map));
		}
		inline void		insert				(const bp::constPathPtr& path, bp::VariantMap& value) {
			m_map.insert(VT(i18n::GetUString(path), value.m_map));
		}
		inline void		insert				(const ustring& name, const wchar_t* value) {
			m_map.insert(VT(name, value));
		}
		inline void		insert				(const ustring& name, const uwstring& value) {
			m_map.insert(VT(name, value));
		}
		inline void		insert				(const ustring& name, const bs::error_code ec) {
			m_map.insert(VT(name, i18n::GetUString(ec)));
		}
		inline void		insert				(const ustring& name, const std::exception& e) {
			m_map.insert(VT(name, i18n::GetUString(e)));
		}
		inline void		insert				(const ustring& name, const bp::constPathPtr& path) {
			m_map.insert(VT(name, path->wstring()));
		}
		inline void		insert				(const ustring& name, uintmax_t n)	{
			m_map.insert(VT(name, n));
		}
		inline bool		empty				() {return m_map.empty();}
		inline void		clear				() {return m_map.clear();}

	private:
		FB::VariantMap	m_map;
		VariantMap	(const std::string&); //disabled
		VariantMap	(const char*); // disabled
		VariantMap&	operator= (const std::string&);//disabled
		VariantMap& operator= (const char*); // disabled
	};

	// Wrapper around JSObjectPtr to help localize all i18n code to one place.
	// Rest of the code will only use UNICODE wide-strings. This code will perform
	// conversion from wide-string to utf8 in order to satisfy FireBreath.
	class JSObject
	{
	public:
		inline			JSObject			(FB::JSObjectPtr p) : m_p(p) {}
		inline void		SetProperty			(const ustring& name, const bp::VariantMap& val) {
			m_p->SetProperty(name, val.m_map);
		}
		inline void		SetProperty			(const ustring& name, const wchar_t* value)	{
			m_p->SetProperty(name, value);
		}
		inline void	SetProperty			(const ustring& name, const bp::constPathPtr& path) {
			m_p->SetProperty(name, path->wstring());
		}
		inline void SetProperty				(const ustring& name, MemGuard<char>& buf) {
			m_p->SetProperty(name, static_cast<char*>(buf));
		}
		inline void SetProperty				(const ustring& name, uintmax_t n) {
			m_p->SetProperty(name, n);
		}
		inline bool		HasProperty			(const ustring& name) {
			return m_p->HasProperty(name);
		}
		inline FB::variant GetProperty		(const ustring& name) {
			return m_p->GetProperty(name);
		}

	private:
		void		SetProperty	(const ustring& name, const std::string& val);//disabled
		void		SetProperty	(const uwstring& name, const std::string& val);//disabled
		FB::JSObjectPtr	m_p;
	};
}// end namespace bp
#endif // H_BP_i18n