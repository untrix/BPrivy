#include <libscrypt.h>
#include "CryptCtx.h"
#include "CryptUtils.h"
#include "CryptError.h"
#include "CryptFormat.h"
//#include <cstdio> // for sprintf
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
	const wstring Error::CODE_FEATURE_NOT_SUPPORTED = L"FeatureNotSupported";
	const wstring Error::MSG_EMPTY = L"";
	const wstring Error::CODE_BAD_FILE = L"FileCorrupted";
	const wstring Error::CODE_BAD_DATA = L"DataCorrupted";

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
	Error::Assert(bool cond, const wstring& c, const wstring& m)
	{
		if (!cond) {
			throw Error(c, m);
		}
	}

	wstring
	Error::PrintMsg() const
	{
		return gcode + L":" + gmsg + L":" + std::to_wstring((unsigned long long)errc);
	}

	/*****************************************************************/
	/*************************** CryptCtx ****************************/
	/*****************************************************************/
	CryptCtx::map CryptCtx::s_ctxMap;
	//unsigned int CryptCtx::s_lastHandle = 0;

	CryptCtx::CryptCtx(const Buf<uint8_t>& cryptInfo) : m_info(cryptInfo)
	{}
	CryptCtx::CryptCtx(CipherEnum cipher, unsigned int keyLen) : 
		m_info(cipher, keyLen)
	{}
	void
	CryptCtx::zero()
	{
		m_dk.zero();
	}
	/*const CryptCtx& CryptCtx::Get(unsigned int handle)
	{
		if (handle==0) {throw Error(Error::CODE_BAD_PARAM);}
		else try {
			CryptCtx* p = s_ctxMap.at(handle);
			if (p) {return *p;}
			else {throw Error(Error::CODE_BAD_PARAM, L"Internal Error");}
		} catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
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
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}*/

	bool CryptCtx::Exists(const ucs& handle)
	{
		try
		{
			CryptCtx* p = s_ctxMap.at(handle);
			if (p) {return true;}
			else {return false;}
		} catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}

	const CryptCtx& CryptCtx::Get(const ucs& handle)
	{
		try
		{
			const CryptCtx* p = GetP(handle);
			if (p) {return *p;}
			else {throw Error(Error::CODE_BAD_PARAM, L"Internal Error");}
		} catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}

	void CryptCtx::Destroy(const ucs& handle)
	{
		try {
			CryptCtx* p = s_ctxMap.at(handle);
			if (p) {delete p;}
			CryptCtx::s_ctxMap.erase(handle);
		}
		catch (std::exception& e) {
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}
	void
	CryptCtx::Create(const ucs& handle, Buf<char>& $, CipherEnum cipher, unsigned int key_len)
	{
		//unsigned int handle = 0;
		Error::Assert(Exists(handle), Error::CODE_BAD_PARAM, L"CryptCtx::Create. Handle already exists");

		CryptCtx* pCtx = new CryptCtx(cipher, key_len);
		if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

		const CryptInfo& info = pCtx->m_info;
		if (!deriveKey($, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt)) {
			throw Error(Error::CODE_OS_ERROR, L"Could not derive key");
		}
		$.zero();
		// Generate random key that will be used for data encryption.
		ByteBuf key(pCtx->m_info.m_keyLen);
		RAND_bytes(static_cast<unsigned char*>((uint8_t*)key), key.capacityBytes());
		key.setFull();
		pCtx->m_randKey = std::move(key);

		// Now encrypt the random key and insert it into cryptInfo for saving.
		pCtx->EncryptImpl(pCtx->m_randKey, pCtx->m_info.m_randKey, pCtx->m_dk);

		//handle = CryptCtx::MakeHandle();
		s_ctxMap.insert(CryptCtx::map::value_type(handle, pCtx));

		//return handle;
	}
	void
	CryptCtx::Load(const ucs& handle, Buf<char>& $, const Buf<uint8_t>& cryptInfo)
	{
		//unsigned int handle = 0;
		Error::Assert(Exists(handle), Error::CODE_BAD_PARAM, L"CryptCtx::Load. Handle already exists");

		CryptCtx* pCtx = new CryptCtx(cryptInfo);
		if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

		const CryptInfo& info = pCtx->m_info;
		deriveKey($, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt);
		// zero out passwd
		$.zero();
		//CryptInfoFormat1::Verify(cryptInfo, *pCtx);

		// Now decrypt cryptInfo.m_randKey to get pCtx->m_randKey
		pCtx->DecryptImpl(std::move(pCtx->m_info.m_randKey), pCtx->m_randKey, pCtx->m_dk);

		//handle = CryptCtx::MakeHandle();
		s_ctxMap.insert(CryptCtx::map::value_type(handle, pCtx));

		//return handle;
	}
	void
	CryptCtx::EncryptImpl(const Buf<uint8_t>& in, ByteBuf& out, const uint8_t* pKey) const
	{
		EVP_CIPHER_CTX ctx;
		EVP_CIPHER_CTX_init(&ctx);

		try
		{
			size_t ivLength = EVP_CIPHER_iv_length(m_info.m_EVP_CIPHER);
			BufHeap<uint8_t> iv(ivLength, ivLength);
			RAND_bytes(static_cast<unsigned char*>(iv), ivLength);
			EVP_EncryptInit_ex(&ctx, m_info.m_EVP_CIPHER, NULL, NULL, NULL);
			EVP_CIPHER_CTX_set_key_length(&ctx, m_info.m_keyLen);
			EVP_EncryptInit_ex(&ctx, NULL, NULL, pKey ? pKey : m_randKey, iv);

			CipherBlob cText(std::move(iv), in.dataNum() + m_info.m_blkSize);
			uint8_t* dataBuf = cText.getCiText();

			int outlen = 0;
			if(!EVP_EncryptUpdate(&ctx, dataBuf, &outlen,
								  (const unsigned char*)(const uint8_t*)in,
								  in.dataNum()))
			{
				Error::ThrowOpensslError();
			}

			int finlen = 0;
			if(!EVP_EncryptFinal_ex(&ctx, &(dataBuf[outlen]), &finlen))
			{
				Error::ThrowOpensslError();
			}

			outlen += finlen;
			EVP_CIPHER_CTX_cleanup(&ctx);

			//cText.putCiTextSize(outlen);
			cText.finalize(outlen);
			out = cText.removeBuf();
		}
		catch (...)
		{
			EVP_CIPHER_CTX_cleanup(&ctx);
			throw;
		}
	}
	void
	CryptCtx::DecryptImpl(ByteBuf&& in, ByteBuf& out, const uint8_t* pKey) const
	{
		size_t totalBytes = in.dataNum();
		out.reInit(totalBytes);
		CipherBlob ciBlob(std::forward<ByteBuf>(in)); // in-buf is parsed here.
		for ( size_t processed=0, count=0; processed < totalBytes; )
		{
			ciBlob.seek(count); // in-buf is parsed again at position <count>
			count = DecryptOne(ciBlob, out, pKey);
			processed += count;
		}
	}
	size_t
	CryptCtx::DecryptOne(CipherBlob& ciBlob, ByteBuf& out, const uint8_t* pKey) const
	{
		EVP_CIPHER_CTX ctx;
		EVP_CIPHER_CTX_init(&ctx);

		try
		{
			EVP_DecryptInit_ex(&ctx, m_info.m_EVP_CIPHER, NULL, NULL, NULL);
			EVP_CIPHER_CTX_set_key_length(&ctx, m_info.m_keyLen);
			EVP_DecryptInit_ex(&ctx, NULL, NULL, pKey ? pKey : m_randKey, ciBlob.getIV());

			ByteBuf textBuf(ciBlob.getCiTextSize());
			int outlen = 0;
			if (!EVP_DecryptUpdate(&ctx, textBuf, &outlen, ciBlob.getCiText(), ciBlob.getCiTextSize()))
			{
				Error::ThrowOpensslError();
			}

			int finlen = 0;
			if (!EVP_DecryptFinal_ex(&ctx, &(textBuf[outlen]), &finlen))
			{
				Error::ThrowOpensslError();
			}
			EVP_CIPHER_CTX_cleanup(&ctx);

			textBuf.setDataNum(outlen+finlen);
			out.append(textBuf, outlen+finlen);
			return ciBlob.getTotalSize();
		}
		catch (...)
		{
			EVP_CIPHER_CTX_cleanup(&ctx);
			throw;
		}
	}
	void
	CryptCtx::serializeInfo(BufHeap<uint8_t>& outBuf) const
	{
		BufHeap<uint8_t> tempBuf(CryptInfoFormat1::FMT_TOTAL_FIXED_SIZE + m_info.m_randKey.dataNum());
		CryptInfoFormat1::serialize(m_info, tempBuf, *this);
		outBuf = std::move(tempBuf);
	}
}