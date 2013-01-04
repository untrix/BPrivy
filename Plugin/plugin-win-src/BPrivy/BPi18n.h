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
#include "BPTypes.h"
#include <CryptUtils.h>

// NOTE: ALL INTERACTIONS WITH FIREBREATH/JSON MUST BE IN UNICODE WIDESTRING OR
// UTF8. ONLY UNICODE-WSTRINGS MUST BE INPUT FROM FIREBREATH AND ONLY
// UTF8/UNICODE MUST BE PUT BACK INTO FIREBREATH (unfortunately firebreath is not very accepting
// of widestrings as properties of variant-map). THIS IS SO BECAUSE FIREBREATH/
// JAVASCRIPT ASSUME THAT ALL STRINGS ARE UNICODE BUT OPERATING SYSTEMS DON'T
// MAKE THAT SAME ASSUMPITON IF THE STRING IS A (NARROW) CHARACTER STRING. ON THE
// OTHER HAND ALL OSs ASSUME UNICODE WHEN IT COMES TO WIDE-STRINGS. THEREFORE IT IS
// SAFER TO KEEP ALL UNICODE STRINGS IN WIDECHAR FORMAT when possible. OPERATING SYSTEMS WILL 
// CONVERT SBC AND MBC STRINGS FROM CURRENT LOCALE TO UNICODE WHEN CONVERTING STRINGS
// TO WIDECHAR.  So below is the strategy:
// 1. All strings received from FB shall be wstrings. This will ensure that when converting
//    to narrow-char, Windows will treat the wstring as UNICODE eventhough the locale maybe a
//    non-unicode codepage (say german.xyz). Similarly when converting back from char to wchar_t
//    windows will apply the correct codepage (if environment is properly setup). This will happen
//	  transparently within bfs::path in those cases where bfs retrieves paths from the operating
//    system - specifically lsDir function.
// 2. All strings generated from within the plugin code MUST BE WIDECHARs and represented suitably
//    as bp::ustrings. bp::uwstrings are legacy and will be phased out eventually.
// 3. All strings going back to FB must be only be coded within BPi18n.h/.cpp. The classes
//    bp::VariantMap and bp::JSObject perform the conversion from wide-char to utf8 if needed.
//    However, the rest of the code must USE ONLY WIDE-CHAR strings.


namespace bp
{
	namespace bs = boost::system;
	namespace bfs = boost::filesystem;

	// In Windows Unicode is only supported in wstring
	// std::string don't support unicode (i.e. utf-8)
	// Also, in general unicode is the only wide-character set
	// in the world. Therefore it is safer to keep all
	// unicode data in wide-char instead of in utf-8. Specifically in Windows,
	/// wchar_t implies unicode, and presumably so in all other operating systems.
	typedef std::wstring ucs;

	class ustring : public std::wstring
	{
	public:
		ustring (const std::wstring& ws) : std::wstring(ws)  {}
		ustring (const wchar_t* c_ws) : std::wstring(c_ws) {}
		inline std::string utf8() const {return FB::wstring_to_utf8(*this);}
		//inline operator const std::wstring& () const {return _ucs;}

	private:
		//std::string _utf8;
		//std::wstring _ucs;
		ustring (const std::string&);//disabled
		ustring (const char*);//disabled
		ustring& operator= (const std::string&); //disabled
		ustring& operator= (const char*); //disabled
	};
	typedef std::string	utf8;
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
		inline static utf8 GetUString(const bp::constPathPtr path)
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
			// must use the imbued locale (and bfs::path does so). On the other hand if the conversion must beget a bp::utf8 
			// (utf8) then the conversion must be from UNICODE (wchar_t) to UNICODE (char_t = UTF-8).
			// Hence it is "safe" to assume that whatever comes out as path.wstring() must be UNICODE.
			return FB::wstring_to_utf8(path->wstring());
		}

		inline static utf8 i18n::GetUString(const bs::error_code& ec)
		{
			return LocaleToUtf8(ec.message().c_str());
		}

		inline static utf8 i18n::GetUString(const std::exception& e)
		{
			// e.what returns const char*
			return LocaleToUtf8(e.what());
		}
		
		static ustring LocaleToUnicode(const std::string& str);
	private:
		static utf8 LocaleToUtf8(const char* s);
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
			m_map.insert(VT(name.utf8(), 0));
		}
		inline void		insert				(const ustring& name, bp::VariantMap& value) {
			m_map.insert(VT(name.utf8(), value.m_map));
		}
		inline void		insert				(const bp::constPathPtr& path, bp::VariantMap& value) {
			m_map.insert(VT(i18n::GetUString(path), value.m_map));
		}
		inline void		insert				(const ustring& name, const wchar_t* value) {
			m_map.insert(VT(name.utf8(), value));
		}
		inline void		insert				(const ustring& name, const ustring& value) {
			m_map.insert(VT(name.utf8(), static_cast<const std::wstring&>(value)));
		}
		inline void		insert				(const ustring& name, const bs::error_code ec) {
			m_map.insert(VT(name.utf8(), i18n::GetUString(ec)));
		}
		inline void		insert				(const ustring& name, const std::exception& e) {
			m_map.insert(VT(name.utf8(), i18n::GetUString(e)));
		}
		inline void		insert				(const ustring& name, const bp::constPathPtr& path) {
			m_map.insert(VT(name.utf8(), path->wstring()));
		}
		inline void		insert				(const ustring& name, uintmax_t n)	{
			m_map.insert(VT(name.utf8(), n));
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
		void			SetProperty			(const ustring& name, const ucs& val) {
			m_p->SetProperty(name, val);
		}
		void			SetProperty			(const ustring& name, const bp::VariantMap& val) {
			m_p->SetProperty(name, val.m_map);
		}
		void			SetProperty			(const ustring& name, const wchar_t* value)	{
			m_p->SetProperty(name, value);
		}
		void			SetProperty			(const ustring& name, const bp::constPathPtr& path) {
			m_p->SetProperty(name, path->wstring());
		}
		void			SetProperty				(const ustring& name, MemGuard<char>& buf) {
			m_p->SetProperty(name, static_cast<char*>(buf));
		}
		void			SetProperty				(const ustring& name, const crypt::ByteBuf& buf) {
			m_p->SetProperty(name, (const char*)static_cast<const uint8_t*>(buf));
		}
		void			SetProperty				(const ustring& name, uintmax_t n) {
			m_p->SetProperty(name, n);
		}
		bool			HasProperty			(const ustring& name) {
			return m_p->HasProperty(name);
		}
		FB::variant		GetProperty		(const ustring& name) {
			return m_p->GetProperty(name);
		}
		template<typename T>
		bool			GetProperty			(const ustring& name, T& outVal);

	private:
		void		SetProperty	(const ustring& name, const std::string& val);//disabled
		void		SetProperty	(const ucs& name, const std::string& val);//disabled
		FB::JSObjectPtr	m_p;
	};

	template<typename T> bool
	JSObject::GetProperty(const ustring& name, T& outVal)
	{
		if (this->HasProperty(name))
		{ try 
			{
				FB::variant t_var = this->GetProperty(name);
				outVal = t_var.convert_cast<T>();
				return true;
			} catch (...) {}
		}
		return false;
	}

}// end namespace bp
#endif // H_BP_i18n