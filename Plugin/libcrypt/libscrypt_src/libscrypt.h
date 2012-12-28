#ifndef _H_LIBCRYPT_
#define _H_LIBCRYPT_

#ifndef HAVE_CONFIG_H
#define	HAVE_CONFIG_H 1
#endif

#include <cstdint>
#include <string>
#include <sstream>
#include <CryptUtils.h>

namespace crypt {

	typedef enum
	{
		SCRYPT_MAX_PASSWD_LEN = 256,
		SCRYPT_DK_SIZE = 64,
		SCRYPT_SALT_SIZE = 32
	} SCRYPT_CONSTANT;

//#define SCRYPT_MAX_PASSWD_LEN 64
//#define SCRYPT_DK_SIZE 64
//#define SCRYPT_SALT_SIZE 32

/* 
 * @param passwd. should be shorter than 64 Unicode characters. Characters may be
 * upto 4 bytes long and in any language, as long as they are unicode characters.
 * Ideally, we should normalize the Unicode character representation, but that's
 * not being implemented yet.
 * @param dkBuf. SCRYPT_DK_SIZE bytes long buffer for the derived key to be returned in.
 * @param salt. SCRYPT_SALT_SIZE bytes buffer with the salt.
 * @returns true/false.
 */
bool deriveKey(const Buf<char>& passwd, uint8_t logN, uint32_t r, uint32_t p,
		       Buf<uint8_t>& dkBuf, const Buf<uint8_t>& salt);
}

#endif
