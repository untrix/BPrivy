#include <libscrypt.h>
#include "CryptCtx.h"
#include "Utils.h"
#include "Error.h"
#include "Format.h"
#include <cstdio> // for sprintf
#include <openssl/rand.h>
#include <openssl/err.h>

namespace crypt
{
	using std::wstring;
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

	/*****************************************************************/
	/***************************** Error *****************************/
	/*****************************************************************/
	const wstring Error::CODE_BAD_PARAM = L"BadParameter";
	const wstring Error::CODE_NO_MEM = L"NoMemory";
	const wstring Error::CODE_OS_ERROR = L"OSError";
	const wstring Error::CODE_CRYPTO_ERROR = L"CryptoError";
	const wstring Error::CODE_INTERNAL_ERROR = L"InternalError";
	const wstring Error::CODE_NO_CSP = L"NoCSP";
	const wstring Error::CODE_BAD_FMT = L"WrongFormatVer";

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

	void
	Error::Assert(bool cond)
	{
		if (!cond) {
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
			BufHeap<wchar_t> buf(n);//throws
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

	/*****************************************************************/
	/************************** CryptInfo ****************************/
	/*****************************************************************/

	CryptInfo::CryptInfo(CipherEnum cipher, size_t keyLen) :
		m_logN(LOGN), m_r(R), m_p(P),
		m_cipher(cipher), m_keyLen(keyLen)
	{
		RAND_bytes(static_cast<unsigned char*>(m_salt), m_salt.size());
		ConstructCommon(m_cipher);
	}
	CryptInfo::CryptInfo(const std::string& cryptInfo)
	{
		FormatCryptInfo1::Unmarshall(*this, cryptInfo);
		ConstructCommon(m_cipher);
	}
	void
	CryptInfo::ConstructCommon(CipherEnum cipher)
	{
		switch(cipher)
		{
		case CIPHER_AES_CBC:
			m_EVP_CIPHER = EVP_aes_256_cbc();
			break;
		case CIPHER_BF_CBC:
			m_EVP_CIPHER = EVP_bf_cbc();
			break;
		default:
			throw Error(Error::CODE_BAD_PARAM, L"Cipher name not supplied");
		}
		m_ivLen = EVP_CIPHER_iv_length(m_EVP_CIPHER);
		m_blkSize = EVP_CIPHER_block_size(m_EVP_CIPHER);
	}

	void
	CryptInfo::zero()
	{
		m_logN = m_r = m_p = m_keyLen = 0;
		m_cipher = CPHR_NULL;
		m_salt.zero();
		m_signature.zero();
	}
	
	/*****************************************************************/
	/*************************** CryptCtx ****************************/
	/*****************************************************************/
	CryptCtx::map CryptCtx::s_ctxMap;
	unsigned int CryptCtx::s_lastHandle = 0;

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
		FormatCryptInfo1::Verify(cryptInfo, *pCtx);

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
			BufHeap<uint8_t> iv(ivLength);
			EVP_EncryptInit_ex(&ctx, m_info.m_EVP_CIPHER, NULL, m_dk, iv);
			int outlen = 0;

			BufHeap<uint8_t> outbuf(in.size() + m_info.m_blkSize);
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
			PutHeader(out, outbuf, outlen);
			// out.assign((const char*) ((const uint8_t*) outbuf), outlen);
		}
		catch (...)
		{
			EVP_CIPHER_CTX_cleanup(&ctx);
			throw;
		}
	}

	void
	CryptCtx::PutHeader(std::string& out, Buf<uint8_t>& outbuf,
						size_t dataSize)
	{

	}
}