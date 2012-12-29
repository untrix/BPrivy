#ifndef _LIBCRYPT_ERROR_H_
#define _LIBCRYPT_ERROR_H_
#include <string>

namespace crypt
{
	using std::wstring;
	using std::string;

	string		UnicodeToLocale(const std::wstring&);
	wstring		LocaleToUnicode(const std::string&);

	class Error
	{
	public:
		Error(const wstring& c) : gcode(c), errc(0) {}
		Error(unsigned int c) : gcode(CODE_OS_ERROR), errc(c) {}
		Error(const wstring& c, const wstring& msg) : gcode(c), gmsg(msg), errc(0) {}
		Error(const wstring& c, const std::string& msg) 
			: gcode(c), gmsg(LocaleToUnicode(msg)), errc(0) {}
		wstring PrintMsg () const;

		wstring gcode;
		wstring gmsg;
		wstring acode;
		unsigned int errc;

		static void		ThrowOpensslError();
		static void		Assert(bool cond, 
							   const wstring& c = CODE_INTERNAL_ERROR,
							   const wstring& msg = MSG_EMPTY);

		// Error Codes
		static const wstring	CODE_BAD_PARAM;
		static const wstring	CODE_NO_MEM;
		static const wstring	CODE_OS_ERROR;
		static const wstring	CODE_CRYPTO_ERROR;
		static const wstring	CODE_INTERNAL_ERROR;
		static const wstring	CODE_NO_CSP;
		static const wstring	CODE_BAD_FMT;
		static const wstring	CODE_FEATURE_NOT_SUPPORTED;
		static const wstring	CODE_BAD_FILE;

		static const wstring	MSG_EMPTY;
	};
}

#endif // !_LIBCRYPT_ERROR_H_