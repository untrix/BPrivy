#include "CryptCtx.h"
#include "Types.h"
#include "Utils.h"
#include <cstdio> // for sprintf
#include <libscrypt.h>
#include <openssl/rand.h>
#include <openssl/err.h>

namespace crypt
{
	const wstring Error::CODE_BAD_PARAM = L"BadParameter";
	const wstring Error::CODE_NO_MEM = L"NoMemory";
	const wstring Error::CODE_OS_ERROR = L"OSError";
	const wstring Error::CODE_CRYPTO_ERROR = L"CryptoError";
	const wstring Error::CODE_INTERNAL_ERROR = L"InternalError";
	const wstring Error::CODE_NO_CSP = L"NoCSP";
	CryptCtx::map CryptCtx::s_ctxMap;
	unsigned int CryptCtx::s_lastHandle = 0;

	void
	initLibcrypt()
	{
		//May hog memory.
		ERR_load_crypto_strings();
	}

	void 
	unloadLibcrypt()
	{
		ERR_free_strings();
	}

	void
	Error::ThrowOpensslError()
	{
		unsigned long err = ERR_peek_last_error();
		ERR_clear_error();
		if (err) {
			throw Error(Error::CODE_CRYPTO_ERROR, ERR_error_string(err, NULL));
		}
		else {
			throw Error(Error::CODE_INTERNAL_ERROR);
		}
	}

	wstring 
	Error::LocaleToUnicode(const std::string& str)
	{
		static const wchar_t conv_err[] = L"BPError: could not convert error string to wcs";
		// Convert from locale charset to UNICODE by converting to wchar_t.
		const char* s = str.c_str();
		size_t n = mbstowcs(NULL, s, 0);
		if (n) 
		{
			n++; // Add one for null terminator
			Buf<wchar_t> buf(n);//throws
			size_t r = mbstowcs((wchar_t*)buf, s, n);
			if (r == (size_t)-1) {
				return conv_err;
			}
			else {
				return (wchar_t*)buf;
			}
		}
		else {
			return conv_err;
		}
	}

	CryptInfo::CryptInfo(uint8_t cipher, uint16_t keyLen) :
		m_logN(LOGN), m_r(R), m_p(P),
		m_cipher(cipher), m_keyLen(keyLen)
	{
		RAND_bytes(static_cast<unsigned char*>(m_salt), m_salt.size());
		ConstructCommon(m_cipher);
	}
	CryptInfo::CryptInfo(const std::string& cryptInfo)
	{
		Unmarshall(cryptInfo);
		ConstructCommon(m_cipher);
	}
	void
	CryptInfo::ConstructCommon(CipherEnum cipher)
	{
		switch(cipher)
		{
		case AES_CBC:
			m_EVP_CIPHER = EVP_aes_256_cbc();
			break;
		case BF_CBC:
			m_EVP_CIPHER = EVP_bf_cbc();
			break;
		default:
			throw Error(Error::CODE_BAD_PARAM, L"Cipher name not supplied");
		}
		m_ivLen = EVP_CIPHER_iv_length(m_EVP_CIPHER);
		m_blkSize = EVP_CIPHER_block_size(m_EVP_CIPHER);
	}
	void
	CryptInfo::Unmarshall(const std::string& cryptInfo)
	{
		if (cryptInfo.size() != BUF_SIZE) {
			throw Error(Error::CODE_BAD_PARAM,
						L"Crypt-info data is corrupted");
		}

		Array<uint8_t, BUF_SIZE> buf;
		hexToByteBuf(cryptInfo, buf, buf.LENGTH);

		size_t count = 0;
		m_logN = buf[count]; count += LOGN_SIZE;
		m_r = be32dec(&buf[count]); count += R_SIZE;
		m_p = be32dec(&buf[count]); count += P_SIZE;
		m_cipher = buf[count]; count += CIPHER_SIZE;
		m_keyLen = buf[count]; count += KEYLEN_SIZE;
		memcpy(m_salt, &buf[count], SALT_SIZE); count+=SALT_SIZE;
		memcpy(m_signature, &buf[count], SIG_SIZE); count += SIG_SIZE;
	}
	bool 
	CryptInfo::Marshall(std::string& cryptInfo)
	{
		Array<uint8_t, BUF_SIZE> buf;

		size_t count = 0;
		buf[count] = m_logN; count += LOGN_SIZE;
		be32enc(&buf[count], m_r); count += R_SIZE;
		be32enc(&buf[count], m_p); count += P_SIZE;
		buf[count] = m_cipher; count += CIPHER_SIZE;
		buf[count] = m_keyLen; count += KEYLEN_SIZE;
		memcpy(&buf[count], m_salt, SCRYPT_SALT_SIZE); count+=SALT_SIZE;
		memcpy(&buf[count], m_signature, SIG_SIZE); count += SIG_SIZE;

		return byteToHexStr(buf, BUF_SIZE, cryptInfo);
	}
	void
	CryptInfo::zero()
	{
		m_logN = m_r = m_p = m_cipher = m_keyLen = 0;
		m_salt.zero();
		m_signature.zero();
	}
	
	CryptCtx::CryptCtx(const std::string& cryptInfo) : m_info(cryptInfo)
	{}
	CryptCtx::CryptCtx(CipherEnum cipher, unsigned int keyLen) : 
		m_info(cipher, keyLen)
	{}

	void
	CryptCtx::zero()
	{
		m_dk.zero();
	}

	const CryptCtx& CryptCtx::Get(unsigned int handle)
	{
		if (handle==0) {throw Error(Error::CODE_BAD_PARAM);}
		else try {
			CryptCtx* p = s_ctxMap.at(handle);
			if (p) {return *p;}
			else {throw Error(Error::CODE_BAD_PARAM, L"Internal Error");}
		} catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, Error::LocaleToUnicode(e.what()));
		}
	}

	void CryptCtx::Destroy(unsigned int handle)
	{
		try {
			CryptCtx* p = s_ctxMap.at(handle);
			if (p) {delete p;}
			CryptCtx::s_ctxMap.erase(handle);
		}
		catch (std::exception& e) {
			throw Error(Error::CODE_BAD_PARAM, Error::LocaleToUnicode(e.what()));
		}
	}

	unsigned int
	CryptCtx::Make(Buf<wchar_t>& $, CipherEnum cipher, unsigned int key_len)
	{
		unsigned int handle = 0;
		CryptCtx* pCtx = new CryptCtx(cipher, key_len);
		if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

		const CryptInfo& info = pCtx->m_info;
		if (!deriveKey($, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt)) {
			throw Error(Error::CODE_OS_ERROR, L"Could not derive key");
		}
		$.zero();

		handle = CryptCtx::MakeHandle();
		s_ctxMap.insert(CryptCtx::map::value_type(handle, pCtx));

		return handle;
	}

	unsigned int
	CryptCtx::Make(Buf<wchar_t>& $, std::string& cryptInfo)
	{
		unsigned int handle = 0;
		std::string headerHex;

		CryptCtx* pCtx = new CryptCtx(cryptInfo);
		if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

		const CryptInfo& info = pCtx->m_info;
		deriveKey($, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt);
		// zero out passwd
		$.zero();
		pCtx->m_info.Verify();

		handle = CryptCtx::MakeHandle();
		s_ctxMap.insert(CryptCtx::map::value_type(handle, pCtx));

		return handle;
	}

	void
	CryptCtx::Encrypt(const std::string& in, std::string& out)
	{
		EVP_CIPHER_CTX ctx;
		EVP_CIPHER_CTX_init(&ctx);

		try
		{
			EVP_CIPHER_CTX_set_key_length(&ctx, m_info.m_keyLen);

			size_t ivLength = EVP_CIPHER_iv_length(m_info.m_EVP_CIPHER);
			Buf<uint8_t> iv(ivLength);
			EVP_EncryptInit_ex(&ctx, m_info.m_EVP_CIPHER, NULL, m_dk, iv);
			int outlen = 0;

			Buf<uint8_t> outbuf(in.size() + m_info.m_blkSize);
			if(!EVP_EncryptUpdate(&ctx, outbuf, &outlen, (const unsigned char*)in.data(), in.size()))
			{
				Error::ThrowOpensslError();
			}
			int finlen = 0;
			if(!EVP_EncryptFinal_ex(&ctx, &(outbuf[outlen]), &finlen))
			{
				Error::ThrowOpensslError();
			}
			outlen += finlen;
			EVP_CIPHER_CTX_cleanup(&ctx);
			// TODO: base64-encode
			// out.assign((const char*) ((const uint8_t*) outbuf), outlen);
		}
		catch (...)
		{
			EVP_CIPHER_CTX_cleanup(&ctx);
			throw;
		}
	}
}