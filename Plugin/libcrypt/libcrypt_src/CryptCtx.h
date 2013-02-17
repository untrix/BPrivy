#ifndef _H_CRYPT_CTX_
#define _H_CRYPT_CTX_

#include <string>
#include <cstdint>
#include <unordered_map>
#include <openssl/evp.h>
#include "CryptUtils.h"
#include "CryptInfo.h"

namespace crypt
{
	using std::wstring;

	/*****************************************************************/
	/*************************** CryptCtx ****************************/
	/*****************************************************************/
	class CryptCtx
	{
	public:
		typedef std::wstring ucs;
		static CipherEnum			CipherStrToEnum		(const wstring& cipher);

		const CryptInfo&			GetInfo				() const {return m_info;}
		void						serializeInfo		(BufHeap<uint8_t>& outBuf) const;
		void						Encrypt				(const Buf<uint8_t>& in,
														 ByteBuf& out) const;
        // if Decrypt returns false, but doesn't throw an exception, then it
        // means that only part of the data was successfully decrypted. However,
        // that part of usable.
		bool						Decrypt				(ByteBuf&& in, 
                                                         ByteBuf& out,
                                                         bool bestEffort = true) const;
		bool						operator==			(const CryptCtx& other) const 
			{ return m_randKey == other.m_randKey; }

	protected:
									CryptCtx			(CipherEnum cipher,
														 unsigned int keyLen);
									CryptCtx			(const Buf<uint8_t>& cryptInfo);
		virtual						~CryptCtx			() {zero();}
		virtual void				zero				();

	private:
		explicit					CryptCtx			(const CryptCtx&);
		CryptCtx&					operator=			(const CryptCtx&);// not to be defined

		void						EncryptImpl			(const Buf<uint8_t>& in,
														 ByteBuf& out,
														 const uint8_t* pKey = NULL) const;
		bool						DecryptImpl			(ByteBuf&& in,
														 ByteBuf& out,
														 const uint8_t* pKey = NULL,
                                                         bool bestEffort = false) const;
		size_t						DecryptOne			(CipherBlob& in, ByteBuf& out,
														 const uint8_t* pKey = NULL) const;
		
		/** Object variables */
		Array<uint8_t, SCRYPT_DK_SIZE> m_dk;
		ByteBuf						m_randKey;
		CryptInfo					m_info;

	/*****************************************************************/
	/***************** Static Methods and Members ********************/
	/*****************************************************************/
	public:
		static const CryptCtx*		Create				(const ucs& handle,
														 const ucs& ctxId,
														 Buf<char>& k,
														 CipherEnum cipher = CIPHER_BF_CBC,
														 unsigned int key_len = DEFAULT_KEY_LEN);
		static void					Load				(const ucs& handle,
														 const ucs& ctxId,
														 Buf<char>& k,
														 const Buf<uint8_t>& cryptInfo);
		/**
		 * Returns false if ctxId doesn't exist.
		 * Otherwise, if newHandle already exists, then returns true.
		 * Otherwise creates a newHandle->ctxId mapping and returns true.
		 */
		static bool					DupeIfNotLoaded		(const ucs& ctxId,
													     const ucs& newHandle);
		/**
		 *  Destroys the Handle entry and if this was the last handle for the corresponding
		 *  context, then destroys the context as well by calling CryptCtx::Destroy.
		 */
		static void					Destroy				(const ucs& handle);
		static const CryptCtx*		Get					(const ucs& handle);
		static bool					Exists				(const ucs& handle);
		static bool					CtxIdExists			(const ucs& ctxId);
		static bool					CtxExists			(const ucs& ctxId);

	private:
		static const ucs			GetCtxId			(const ucs& handle);
		/** If handle is an empty string, a NULL value is returned. See documentation for Create. */
		static CryptCtx*			GetCtx				(const ucs& ctxId);

		/**
		*	Creates and stores a crypt-ctx against the supplied handle. The k parameter is
		*   zeroed out if the call is successful. Throws exceptions in case of errors.
		* @param handle. A Unicode string (UCS16 for Windows and UCS32 for Mac/Unix/Linux).
		*		 A empty string is not allowed while creating a handle hence no context
		*        can exist against a empty string handle. However, a empty-string can be
		*	     passed into the GetCtx/CtxExists routines with the result that no crypt-context
		*        will be found. This technique is used to pass a empty-handle to routines that
		*        optionally require a valid crypt-handle. This will affect a bypass of the
		*        encryption/decryption layer in various BPrivyAPI routines that have been written
		*        to bypass the encryption layer of CryptCtx::GetCtx returned NULL. For e.g.
		*        BPrivyAPI::zeroFile uses this technique
		*        to indicate to BPrivyAPI::overwriteFile that the data in the zero-buffer
		*        should not be encrypted before writing to file.
		* @param k. passwd. Gets zeroe'd out if the call is successful.
		* @param cipher. The cipher to use for en/decryption.
		* @param key_len. The length of the key to be generated for en/decryption.
		*/
		static CryptCtx*			CreateCtx			(Buf<char>& k,
														 CipherEnum cipher = CIPHER_BF_CBC,
														 unsigned int key_len = DEFAULT_KEY_LEN);
		/**
		*	Creates and stores a crypt-ctx which can be retrieved using the specified handle.
		*	The k parameter is zeroed out if the call is successful. Throws exceptions
		*   in case of errors.
		* @param k. passwd. Gets zeroe'd out if the call is successful.
		* @param cryptInfo. cryptInfo bytes read from an encrypted AB. Should've been
		*	generated by serializeInfo().
		*/
		static CryptCtx*			LoadCtx				(Buf<char>& k,
														 const Buf<uint8_t>& cryptInfo,
														 /* for testing only*/ bool bKeepKey = false);

		typedef std::unordered_map<ucs, CryptCtx*>		CtxMap;
		static CtxMap				s_ctxMap;

		typedef std::unordered_map<ucs, ucs>			HandleMap;
		static HandleMap			s_handleMap;
	};

	inline
	CryptCtx::CryptCtx(const CryptCtx& other)
	: m_randKey(other.m_randKey, true), m_info(other.m_info)
	// m_dk is not used after Ctx creation hence it is left out.
	{}

	inline bool
	CryptCtx::Decrypt(ByteBuf&& in, ByteBuf& out, bool bestEffort) const
	{
		return DecryptImpl(std::forward<ByteBuf>(in), out, m_randKey, bestEffort);
	}

	inline void
	CryptCtx::Encrypt(const Buf<uint8_t>& in, ByteBuf& out) const
	{
		EncryptImpl(in, out, m_randKey);
	}

	inline CipherEnum
	CryptCtx::CipherStrToEnum(const wstring& cipher)
	{
		if (cipher == L"CIPHER_AES_CBC") {
			return CIPHER_AES_CBC;
		}
		else // || if (cipher == L"CIPHER_BF_CBC")
		{
			return CIPHER_BF_CBC;
		}
	};
}
#endif // !_H_CRYPT_CTX_