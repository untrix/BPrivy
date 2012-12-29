#include <stdint.h>
#include <stdio.h>
#include <CryptUtils.h>
#include <CryptError.h>
#include "libscrypt.h"

extern "C" {
#include <crypto_scrypt.h>
#include <sysendian.h>
#include <sha256.h>
}
#include <string>
#include <sstream>

namespace crypt {

bool 
deriveKey(const Buf<char>& passwd, uint8_t logN, uint32_t r, uint32_t p,
		  Buf<uint8_t>& dkBuf, const Buf<uint8_t>& salt)
{
	//uint8_t hbuf[32];
	//uint8_t salt[32];
	//uint8_t dk[64];
	//uint8_t header[96];
	//size_t headerBufLen = 512;
	uint64_t N = (uint64_t)(1) << logN;
	size_t passwdLen = passwd.capacityNum();
	BufHeap<uint8_t> passwdBytes(passwdLen);
	//SHA256_CTX ctx;
	//uint8_t * key_hmac = &dk[32];
	//HMAC_SHA256_CTX hctx;
	size_t i,j;

	if (passwdLen > SCRYPT_MAX_PASSWD_LEN) {
		throw Error(Error::CODE_BAD_PARAM, L"Password too long");
	}

	for (i=0, j=0; (i < passwdLen); i++,j++)
	{
		//be32enc(&passwdBytes[j], static_cast<uint32_t>(passwd[i]));
		passwdBytes[i] = static_cast<uint8_t>(passwd[i]);
	}

	/* Generate the derived keys. */
	if (crypto_scrypt(passwdBytes, passwdLen, salt, salt.capacityBytes(), N, r, p, dkBuf, dkBuf.capacityBytes())) {
		printf("crypto_scrypt failed\n");
		return false;
	}
	//else {
	//	dkBuf.assign(dk, SCRYPT_DK_SIZE);
	//}

	/* Construct the file header. */
	//memcpy(header, "scrypt", 6);
	//header[6] = 0;
	//header[7] = logN;
	//be32enc(&header[8], r);
	//be32enc(&header[12], p);
	//memcpy(&header[16], salt, 32);

	///* Add header checksum. */
	//SHA256_Init(&ctx);
	//SHA256_Update(&ctx, header, 48);
	//SHA256_Final(hbuf, &ctx);
	//memcpy(&header[48], hbuf, 16);

	///* Add header signature (used for verifying password). */
	//HMAC_SHA256_Init(&hctx, key_hmac, 32);
	//HMAC_SHA256_Update(&hctx, header, 64);
	//HMAC_SHA256_Final(hbuf, &hctx);
	//memcpy(&header[64], hbuf, 32);

	//return byteToHexStr(header, 96, headerStr);

	/*wchar_t dkStr[512];
	size_t dkStrLen = 512;
	if (CryptBinaryToStringW(dk, 64, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF , dkStr, &dkStrLen))
	{
		dkStr[dkStrLen-1]=0;
		printf("Derived Key is: %d:%S\n", dkStrLen, dkStr);
	}
	else {
		printf("CryptBinaryToString failed. DK length = %d\n", dkStrLen);
	}

	if (CryptBinaryToStringA(header, 96, CRYPT_STRING_HEX | CRYPT_STRING_NOCRLF, headerBuf, &headerBufLen)) {
		return true;
	}
	else {
		return false;
	}*/

	return true;
}

} // namespace scrypt