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
		Error(const wstring& c) : code(c), errc(0) {}
		Error(unsigned int c) : code(CODE_OS_ERROR), errc(c) {}
		Error(const wstring& c, const wstring& msg) : code(c), msg(msg), errc(0) {}
		Error(const wstring& c, const std::string& msg) 
			: code(c), msg(LocaleToUnicode(msg)), errc(0) {}

		wstring code;
		wstring msg;
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
		static const wstring	MSG_EMPTY;
	};
}

#endif // !_LIBCRYPT_ERROR_H_