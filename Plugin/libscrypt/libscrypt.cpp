#include <stdint.h>
#include <stdio.h>
extern "C" {
#include <crypto_scrypt.h>
#include <sysendian.h>
#include <sha256.h>
}
#include <string>
#include <sstream>

char nibbleToHex[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
uint8_t hexToNibbles[71] ={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 16
						   0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 32
						   0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 48
						   0,1,2,3,4,5,6,7,8,9,0,0,0,0,0,0, // 64
						   0,10,11,12,13,14,15};

static bool
hexToNibble(char hex, uint8_t* nibble)
{
	if (hex>47) {
		if (hex<58) {
			*nibble = (hex - 48);
			return true; // success
		}
		else if ((hex > 64) && (hex < 71)) {
			*nibble = (hex - 65);
			return true; // success
		}
	}

	return false; // failed
}

static bool
byteToHexStr(const uint8_t* binBuf, size_t binBufLen, std::string& hexStr)
{
	size_t i;

	if (!binBuf) {
		return false; // hex buffer is too small
	}

	for (i=0; i<binBufLen; i++)
	{
		hexStr.push_back(nibbleToHex[(binBuf[i] & 0xF0) >> 4]);
		hexStr.push_back(nibbleToHex[(binBuf[i] & 0x0F)]);
		//sprintf(&hexBuf[2*i], "%02x", binBuf[i]);
	}

	return true;
}

static bool
hexToByteBuf(const char* hexBuf, size_t hexBufLen, uint8_t* binBuf, size_t binBufLen)
{
	size_t i, j;
	uint8_t left, right;

	if (((hexBufLen) > (binBufLen*2)) || (!binBuf) || (!hexBuf)) {
		return false; // bin buffer is too small
	}

	if (((hexBufLen)/2)*2 != (hexBufLen)) {
		return false; // hex buffer is not a multiple of two
	}

	for (j=0,i=0; i<hexBufLen; j++)
	{
		left = hexBuf[i++];
		right = hexBuf[i++];
		if ((left==0) && (right==0)) {
			binBuf[j] = ( (left<<4) | right );
		}
		else {
			return false;
		}
	}

	return true;
}

bool 
deriveKey(const std::wstring& passwd, uint8_t logN, uint32_t r, uint32_t p,
		  std::basic_string<uint8_t>& dkBuf, std::ostringstream& headerStr)
{
	uint8_t salt[32];
	uint8_t hbuf[32];
	uint8_t dk[64];
	uint8_t header[96];
	size_t headerBufLen = 512;
	uint64_t N = (uint64_t)(1) << logN;
	uint8_t passwdInt[256];
	SHA256_CTX ctx;
	uint8_t * key_hmac = &dk[32];
	HMAC_SHA256_CTX hctx;
	size_t passwdLen = passwd.length();
	size_t i;
	for (i=0; (i < passwdLen); i++)
	{
		passwdInt[i] = (uint8_t)(passwd[i]);
	}

	//initSalt(salt, 32);

	/* Generate the derived keys. */
	if (crypto_scrypt(passwdInt, passwdLen, salt, 32, N, r, p, dk, 64)) {
		printf("crypto_scrypt failed\n");
		return false;
	}
	else {
		dkBuf.assign(dk, 64);
	}

	/* Construct the file header. */
	headerStr.str("");
	headerStr.seekp(0, std::ios_base::end);
	headerStr << "scrypt:";
	headerStr << logN;
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

	return byteToHex(header, 96, );
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