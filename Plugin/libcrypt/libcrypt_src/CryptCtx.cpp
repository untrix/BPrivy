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
	const wstring Error::CODE_FEATURE_NOT_SUPPORTED = L"FeatureNotSupported";
	const wstring Error::MSG_EMPTY = L"";
	const wstring Error::CODE_BAD_DATA = L"DataCorrupted";
	const wstring Error::CODE_CTX_NOT_FOUND = L"CryptCtxNotFound";

	void
	Error::ThrowOpensslError()
	{
		unsigned long err = ERR_peek_last_error();
		ERR_clear_error();
		if (err) {
			Error ex(Error::CODE_CRYPTO_ERROR);
			ex.smsg = LocaleToUnicode(ERR_error_string(err, NULL));
			throw ex;
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
		return L"gcode=" + gcode + L", " + L"gmsg=" + gmsg + L", " + std::to_wstring((unsigned long long)errc);
	}

	/*****************************************************************/
	/*************************** CryptCtx ****************************/
	/*****************************************************************/
	CryptCtx::HandleMap CryptCtx::s_handleMap;
	CryptCtx::CtxMap CryptCtx::s_ctxMap;

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
	bool
	CryptCtx::DecryptImpl(ByteBuf&& in, ByteBuf& out, const uint8_t* pKey, bool bestEffort) const
	{
		size_t totalBytes = in.dataNum(),
               processed, count;

		out.ensureCap(totalBytes);
		CipherBlob ciBlob(std::forward<ByteBuf>(in)); // in-buf is parsed here.
		for ( processed=0, count=0; processed < totalBytes; )
		{
            try {
    			ciBlob.seek(count, (totalBytes-processed)); // in-buf is parsed again at position <count>
            }
            catch (...) {
                if (bestEffort) {
                    // Return data that has been successfully decrypted so far.
                    break;
                }
                else { throw; }
            }

            try {
			    count = DecryptOne(ciBlob, out, pKey);
            }
            catch (...) {
                if (bestEffort) {
                    // Skip to the next blob.
                    continue;
                }
                else { throw; }
            }

			processed += count;
		}

        return (processed == totalBytes);
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
		BufHeap<uint8_t> tempBuf;
		CryptInfoFormat::serialize(m_info, tempBuf);
		outBuf = std::move(tempBuf);
	}

	CryptCtx*
	CryptCtx::CreateCtx(Buf<char>& k, CipherEnum cipher, unsigned int key_len)
	{
		CryptCtx* pCtx = new CryptCtx(cipher, key_len);
		if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

		const CryptInfo& info = pCtx->m_info;
		if (!deriveKey(k, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt)) {
			throw Error(Error::CODE_CRYPTO_ERROR, L"Could not derive key");
		}
		k.zero();
		// Generate random key that will be used for data encryption.
		ByteBuf key(pCtx->m_info.m_keyLen);
		RAND_bytes(static_cast<unsigned char*>((uint8_t*)key), key.capacityBytes());
		key.setFull();
		pCtx->m_randKey = std::move(key);

		// Now encrypt the random key and insert it into cryptInfo for saving.
		pCtx->EncryptImpl(pCtx->m_randKey, pCtx->m_info.m_randKey, pCtx->m_dk);

		return pCtx;
	}

	CryptCtx*
	CryptCtx::LoadCtx(Buf<char>& k, const Buf<uint8_t>& cryptInfo,
				   /* for testing */ bool bKeepKey)
	{
		CryptCtx* pCtx = NULL;

		if (CryptInfoFormat::GetVersion(cryptInfo)) 
		{
			pCtx = new CryptCtx(cryptInfo);

			if (!pCtx) {throw Error(Error::CODE_NO_MEM);}

			const CryptInfo& info = pCtx->m_info;
			deriveKey(k, info.m_logN, info.m_r, info.m_p, pCtx->m_dk, info.m_salt);
			// zero out passwd
			k.zero();

			if (!bKeepKey) 
			{
				// Now decrypt cryptInfo.m_randKey to get pCtx->m_randKey
				pCtx->DecryptImpl(std::move(pCtx->m_info.m_randKey), pCtx->m_randKey, pCtx->m_dk);
			}
			else
			{
				// This is needed for testing purposes only. Ensures that m_info.m_randKey is kept
				// intact.
				ByteBuf tempBuf;
				tempBuf << pCtx->m_info.m_randKey;
				pCtx->DecryptImpl(std::move(tempBuf), pCtx->m_randKey, pCtx->m_dk);
			}
		}
		else {
			// This is a null cryptinfo. Indicates that a cryptCtx should not
			// be created. We still need to create an entry inside s_ctxMap so that
			// CtxExists() will return true.
			pCtx = NULL;
		}

		return pCtx;
	}

	bool CryptCtx::CtxExists(const ucs& ctxId)
	{
		try
		{
			const CryptCtx* p = s_ctxMap.at(ctxId);
			// We got here indicates that the key exists. We can't depend
			// on the return value since it will be NULL for nullCrytpInfo
			// but we still want to return true in that case.
			return true;
		} 
		catch (const std::out_of_range&)
		{
			// The key wasn't found (even a NULL value'd entry wasn't found)
			return false;
		}
		catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}

	CryptCtx* CryptCtx::GetCtx(const ucs& ctxId)
	{
		try {
			// NOTE: Return value maybe NULL even in case of a valid map
			// entry - i.e. in the cryptInfoNull case.
			return s_ctxMap.at(ctxId);
		}
		catch (const std::out_of_range&)
		{
			return NULL;
		}
		catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}

	const CryptCtx*
	CryptCtx::Create(const ucs& handle, 
				   const ucs& ctxId,
					 Buf<char>& k, 
					 CipherEnum cipher,
					 unsigned int key_len)
	{
		// NOTE: We're ensuring that a null-string will never be a valid handle. This makes
		// it possible to supply a null-string handle as a dummy handle in the file-system routines
		// resting assured that no encrypt/decrypt operations will take place.
		Error::Assert( (!handle.empty()) &&  (!ctxId.empty()), 
					   Error::CODE_BAD_PARAM, 
					   L"Empty Key or DB Path" );

		// Do not create a new one if one already exists. Be extra-paranoid here because if a different
        // key with the same ctxId exists (for an existing DB), then we don't want to inadvertently
        // replace it. Doing so would make any new records going into the old DB be completely unintelligible
        // when decrypted by the original key. That would be disaster because these records would be
        // completely unrecoverable.
		Error::Assert( (!Exists(handle))&&(!CtxExists(ctxId))&&(!CtxIdExists(ctxId)), Error::CODE_CRYPTO_ERROR, L"Key is already loaded");

		CryptCtx* pCtx = CryptCtx::CreateCtx(k, cipher, key_len);
		if (pCtx) {
			s_handleMap.insert(HandleMap::value_type(handle, ctxId));
			s_ctxMap.insert(CryptCtx::CtxMap::value_type(ctxId, pCtx));
		}

		return pCtx;
	}

	void
	CryptCtx::Load(const ucs& handle,
				   const ucs& ctxId,
				   Buf<char>& k,
				   const Buf<uint8_t>& cryptInfo)
	{
		// NOTE: We're ensuring that a null-string will never be a valid handle. This makes
		// it possible to supply a null-string handle as a dummy handle in the file-system routines
		// resting assured that no encrypt/decrypt operations will take place.
		Error::Assert( (!handle.empty()) &&  (!ctxId.empty()),
					   Error::CODE_BAD_PARAM,
					   L"Invalid Key or DB Path" );

		// Destroy ctx if already loaded (erring on side of security)
		if (Exists(handle)) { Destroy(handle); }

		CryptCtx* pCtx = CryptCtx::LoadCtx(k, cryptInfo);
		//if (pCtx) {
			s_handleMap.insert(HandleMap::value_type(handle, ctxId));
			s_ctxMap.insert(CryptCtx::CtxMap::value_type(ctxId, pCtx));
		//}
	}

	bool
	CryptCtx::DupeIfNotLoaded(const ucs& ctxId, const ucs& dupeHandle)
	{
		if (!Exists(dupeHandle)) {
			if (!CtxExists(ctxId)) { return false; }
			s_handleMap.insert(HandleMap::value_type(dupeHandle, ctxId));
		}
		else if (GetCtxId(dupeHandle) != ctxId) {
			return false;
		}

		return true;
	}

	void
	CryptCtx::Destroy(const ucs& handle)
	{
		const ucs ctxId = GetCtxId(handle);
		s_handleMap.erase(handle);
		if (!CtxIdExists(ctxId)) {
			delete GetCtx(ctxId); // may return null
			s_ctxMap.erase(ctxId);
		}
	}

	bool
	CryptCtx::CtxIdExists(const ucs& ctxId)
	{
		for (HandleMap::const_iterator it = s_handleMap.begin(); it != s_handleMap.end(); it++) {
			if (it->second == ctxId) { return true; }
		}
		return false;
	}
	
	const CryptCtx*
	CryptCtx::Get(const ucs& handle)
	{
        ucs ctxId = GetCtxId(handle);
        Error::Assert(!ctxId.empty(), 
                      Error::CODE_CTX_NOT_FOUND, 
                      L"Key is not loaded");
		return GetCtx(ctxId);
	}

	bool
	CryptCtx::Exists(const ucs& handle)
	{
		try
		{
			const ucs ctxId = s_handleMap.at(handle);
			// We got here indicates that the key exists, otherwise an
			// exception would've been thrown.
			return true;
		} 
		catch (const std::out_of_range&)
		{
			// The key wasn't found
			return false;
		}
		catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}

	const CryptCtx::ucs
	CryptCtx::GetCtxId(const ucs& handle)
	{
		try {
			return s_handleMap.at(handle);
		}
		catch (const std::out_of_range&)
		{
			return L""; // empty contex-id implies no context.
			// throw Error(Error::CODE_BAD_PARAM, L"crypt Key not loaded");
		}
		catch (std::exception& e)
		{
			throw Error(Error::CODE_BAD_PARAM, LocaleToUnicode(e.what()));
		}
	}
}