#ifndef _H_CRYPT_CTX_
#define _H_CRYPT_CTX_

#include <string>
#include <cstdint>
#include <unordered_map>
#include <openssl/evp.h>
#include "CryptUtils.h"
#include <libscrypt.h>
#include <openssl/evp.h>

namespace crypt
{
	using std::wstring;

	/** Call this to initialize the library once. Initializes openssl. */
	void	initLibcrypt	();
	void	unloadLibcrypt	();

	typedef enum {
		CPHR_NULL = 0,
		CIPHER_BF_CBC = 1, // Blowfish in CBC mode
		CIPHER_AES_CBC     // AES (Rijndael) in CBC mode
	} CipherEnum;

	typedef enum {
		DEFAULT_KEY_LEN = 32 // Key Length in #bytes
	} CRYPT_CONSTANT;

	/*****************************************************************/
	/************************** CryptInfo ****************************/
	/*****************************************************************/
	struct CryptInfo
	{
		typedef enum {
			LOGN = 14,
			R = 8,
			P = 1,
			SALT_SIZE = SCRYPT_SALT_SIZE,
			SIG_SIZE = 32,
		} CONSTANT;

		/** Following are persisted to disk */
		size_t		m_logN;
		size_t		m_r;
		size_t		m_p;
		CipherEnum	m_cipher; // Cipher Enum
		size_t		m_keyLen; // Key Length in #bytes.
		Array<uint8_t, SALT_SIZE> m_salt;
		Array<uint8_t, SIG_SIZE>  m_signature;

		/** Following are ephemeral */
		const EVP_CIPHER*	m_EVP_CIPHER;
		size_t		m_ivLen;  // IV size in #bytes
		size_t		m_blkSize;// cipher's block size in #bytes

					CryptInfo		(CipherEnum cipher, size_t keyLen);
					CryptInfo		(const Buf<uint8_t>& cryptInfo);
					~CryptInfo		() {zero();}
		void		zero			();

	private:
					CryptInfo		(const CryptInfo&);// not to be defined
		CryptInfo&	operator=		(const CryptInfo&);// not to be defined
		void		ConstructCommon	(CipherEnum);
	};

	/*****************************************************************/
	/************************* CipherBlob ****************************/
	/*****************************************************************/
	class CipherBlobFormat1;
	class CipherBlob
	{
	public:
		/** Constructs an empty cipher blob, that can be later populated using the
			move assignment operator.
		*/
					CipherBlob	();
		/** Constructs a ci-blob with enough size to accomodate ciTextSize of cipher
			text. It adopts the IV passed in. This constructor is used internally by
			CryptCtx::Encrypt
		*/
					CipherBlob	(ByteBuf&& iv, size_t ciTextSize);
		/** Call finalize after populating buffer (obtained via. getCiText()) with cipher-text */
		void		finalize	(size_t ciTextSize);
					//CipherBlob	(char* data, size_t data_len);
		/**
		* Parses cipher-blob bytes obtained from an encrypted file. This is
		* a step before decryption. Implements move semantics.
		*/
		explicit	CipherBlob	(BufHeap<uint8_t>&& data);
		/** Seeks forward count bytes and re-initializes itself */
		void		seek		(size_t delta_count);
		// Move constructor.
		explicit	CipherBlob	(CipherBlob&& other);
		// Move assignment operator
		CipherBlob&	operator=	(CipherBlob&& other);
		// Function members
		virtual void zero		();
		uint8_t*	getCiText	();
		size_t		getCiTextSize() const {return m_ciTextSize;}
		size_t		getTotalSize()	const {return m_ciTextSize + m_headerSize;}
		/**	Implements move semantics. Transfer data out of m_buf. At the end of
		 *  this call, m_buf is a NULL buf.
		 */
		ByteBuf&&	removeBuf	()
		{m_headerSize = m_ciTextSize = 0; m_iv.zero(); return std::move(m_buf);}
		const ByteBuf& getBuf	() {return m_buf;}
		const ByteBuf& getIV	() {return m_iv;}

		friend class CipherBlobFormat1;

	private:
		// Variable members
		ByteBuf		m_buf; // header + cipher-text.
		size_t		m_headerSize;
		size_t		m_ciTextSize;
		ByteBuf		m_iv;

		// Disabled operators
		CipherBlob(const CipherBlob&); // disabled
		CipherBlob& operator= (const CipherBlob&); // disabled
	};
	/*****************************************************************/
	/*************************** CryptCtx ****************************/
	/*****************************************************************/
	class CryptCtx
	{
	public:
		static CipherEnum			CipherStrToEnum		(const wstring& cipher);
		/**
		*	Creates and stores a crypt-ctx and returns its handle. This handle should
		*	be returned to Javascript for use later with the API. The $ parameter is
		*   zeroed out if the call is successful. Throws exceptions in case of errors.
		* @param $. passwd. Gets zeroe'd out if the call is successful.
		* @param cipher. The cipher to use for en/decryption.
		* @param key_len. The length of the key to be generated for en/decryption.
		*/
		static unsigned	int			Make				(Buf<char>& $,
														 CipherEnum cipher = CIPHER_BF_CBC,
														 unsigned int key_len = DEFAULT_KEY_LEN);
		/**
		*	Creates and stores a crypt-ctx and returns its handle. This handle should
		*	be returned to Javascript for use later with the API. The $ parameter is
		*   zeroed out if the call is successful. Throws exceptions in case of errors.
		* @param $. passwd. Gets zeroe'd out if the call is successful.
		* @param cryptInfo. cryptInfo bytes read from an encrypted AB. Should've been
		*	generated by serializeInfo().
		*/
		static unsigned int			Make				(Buf<char>& $,
														 const Buf<uint8_t>& cryptInfo);
		static const CryptCtx&		Get					(unsigned int handle);
		static void					Destroy				(unsigned int handle);
		const CryptInfo&			GetInfo				() const {return m_info;}
		void						serializeInfo		(BufHeap<uint8_t>& outBuf) const;
		void						Encrypt				(const Buf<uint8_t>& in,
														 ByteBuf& out) const;
		void						Decrypt				(ByteBuf&& in,
														 ByteBuf& out) const;
	protected:
									CryptCtx			(CipherEnum cipher,
														 unsigned int keyLen);
									CryptCtx			(const Buf<uint8_t>& cryptInfo);
		virtual						~CryptCtx			() {zero();}
		virtual void				zero				();

	private:
									CryptCtx			(const CryptCtx&);// not to be defined
		CryptCtx&					operator=			(const CryptCtx&);// not to be defined
		static unsigned int			MakeHandle			() {return ++s_lastHandle;}
		size_t						DecryptOne			(CipherBlob& in, ByteBuf& out) const;
		typedef std::unordered_map<unsigned int, CryptCtx*> map;
		static map					s_ctxMap;
		static unsigned int			s_lastHandle;

		/** Object variables */
		Array<uint8_t, SCRYPT_DK_SIZE> m_dk;
		const CryptInfo				m_info;
	};

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