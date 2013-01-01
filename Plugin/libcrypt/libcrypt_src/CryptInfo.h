#ifndef _H_CRYPT_INFO_
#define _H_CRYPT_INFO_

#include <cstdint>
#include <openssl/evp.h>
#include <libscrypt.h>
#include "CryptUtils.h"

namespace crypt
{
	typedef enum {
		CPHR_NULL = 0,
		CIPHER_BF_CBC = 1, // Blowfish in CBC mode
		CIPHER_AES_CBC     // AES (Rijndael) in CBC mode
	} CipherEnum;

	typedef enum {
		DEFAULT_KEY_LEN = 32 // Key Length in #bytes
	} CRYPT_CONSTANT;

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
		CipherBlob& operator=	(ByteBuf&& data);
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
		const ByteBuf& getBuf	() const {return m_buf;}
		const ByteBuf& getIV	() const {return m_iv;}

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
	/************************** CryptInfo ****************************/
	/*****************************************************************/
	struct CryptInfo
	{
		typedef enum {
			LOGN = 14,
			R = 8,
			P = 1,
			SALT_SIZE = SCRYPT_SALT_SIZE,
			SIG_SIZE = 32
		} Constant;

		/** Following are persisted to disk */
		size_t		m_logN;
		size_t		m_r;
		size_t		m_p;
		CipherEnum	m_cipher; // Cipher Enum
		// Key Length in #bytes of both the password derived key as
		// well as the random-generated key.
		size_t		m_keyLen;
		Array<uint8_t, SALT_SIZE> m_salt;
		// Random generated key used for encrypting data. This key is
		// itself encrypted using password-derived key and stored here.
		ByteBuf		m_randKey;
		Array<uint8_t, SIG_SIZE>  m_signature;
		/** Following are ephemeral */
		const EVP_CIPHER*	m_EVP_CIPHER;
		/*size_t		m_ivLen;  // IV size in #bytes*/
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
} // end namespace crypt
#endif //  _H_CRYPT_INFO_
