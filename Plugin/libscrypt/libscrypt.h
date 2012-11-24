#ifndef _H_LIBSCRYPT_
#define _H_LIBSCRYPT_

#ifndef HAVE_CONFIG_H
#define	HAVE_CONFIG_H 1
#endif
#include <cstdint>
#include <string>
#include <sstream>
bool deriveKey(const wchar_t passwd[256], uint8_t logN, uint32_t r, uint32_t p,
		       std::basic_string<uint8_t>& dkBuf, std::ostringstream& headerStr);

#endif
