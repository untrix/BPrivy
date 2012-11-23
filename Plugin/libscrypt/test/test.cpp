// test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <libscrypt.h>
extern "C" {
	#include <sysendian.h>
	#include <sha256.h>
}
#include <Wincrypt.h>

const uint32_t i = 1;
#define is_bigendian() ( (*(char*)&i) == 0 )

void initSalt(uint8_t* salt, size_t len)
{
	memset(salt, 0, len * sizeof(uint8_t));
}

int _tmain(int argc, _TCHAR* argv[])
{
	printf("Hello World!\n");

	if (argc != 2) {
		printf("Usage: %S <password> \n", argv[0]);
		return 1;
	}

	uint8_t salt[32];
	uint8_t hbuf[32];
	uint8_t logN = 16;
	uint64_t N = (uint64_t)(1) << logN;
	uint32_t r = 8, p = 1;
	uint8_t passwdInt[32];
	uint8_t dk[64];
	SHA256_CTX ctx;
	uint8_t * key_hmac = &dk[32];
	HMAC_SHA256_CTX hctx;
	const wchar_t *passwd = argv[1];
	size_t passwdLen = wcslen(passwd);

	for (size_t i=0; (i < passwdLen); i++)
	{
		passwdInt[i] = static_cast<uint8_t>(passwd[i]);
	}

	initSalt(salt, 32);

	/* Generate the derived keys. */
	if (crypto_scrypt(passwdInt, passwdLen, salt, 32, N, r, p, dk, 64)) {
		printf("crypto_scrypt failed\n");
		return (1);
	}

	uint8_t header[96];
	/* Construct the file header. */
	memcpy(header, "scrypt", 6);
	header[6] = 0;
	header[7] = logN;
	be32enc(&header[8], r);
	be32enc(&header[12], p);
	memcpy(&header[16], salt, 32);

	/* Add header checksum. */
	SHA256_Init(&ctx);
	SHA256_Update(&ctx, header, 48);
	SHA256_Final(hbuf, &ctx);
	memcpy(&header[48], hbuf, 16);

	/* Add header signature (used for verifying password). */
	HMAC_SHA256_Init(&hctx, key_hmac, 32);
	HMAC_SHA256_Update(&hctx, header, 64);
	HMAC_SHA256_Final(hbuf, &hctx);
	memcpy(&header[64], hbuf, 32);

	wchar_t dkStr[512];
	DWORD dkStrLen = 512;
	if (CryptBinaryToStringW(dk, 64, CRYPT_STRING_BASE64 | CRYPT_STRING_NOCRLF , dkStr, &dkStrLen))
	{
		dkStr[dkStrLen-1]=0;
		printf("Derived Key is: %d:%S\n", dkStrLen, dkStr);
		return 0;
	}
	else {
		printf("CryptBinaryToString failed. DK length = %d\n", dkStrLen);
		return 1;
	}
}

