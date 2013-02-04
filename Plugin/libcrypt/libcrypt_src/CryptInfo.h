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
		/**
		* Seeks forward count bytes and re-initializes itself.
		* @param dataNum The new value of m_buf.dataNum after the seek.
		*/
		void		seek		(size_t delta_count, size_t dataNum);
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
	class CryptInfoFormatBase;
	struct CryptInfo
	{
		typedef enum {
			LOGN = 14,
			R = 8,
			P = 1,
			SALT_SIZE = SCRYPT_SALT_SIZE
			// signature removed on purpose for more security.
			//SIG_SIZE = 32
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
		// NOTE: Signature was removed on purpose, in order to make it
		// impossible for an attacker to know for certain whether they had
		// sucessfully guessed the user's password (using rainbow attack).
		// They would only be able to know if they also had a data file
		// available which they would then try to decrypt using the randKey
		// derived from cryptInfo. If the user keeps cryptInfo and data in
		// separate locations, then the thief/attacker would need to get hold
		// of both of them in order to do this. Just getting hold of the user's
		// cryptinfo file would be a useless to the attacker (unless we put
		// in a signature into cryptinfo thus enabling the attacker to find out
		// when had guessed the right password)
		//Array<uint8_t, SIG_SIZE>  m_signature;
		/** Following are ephemeral */
		const EVP_CIPHER*	m_EVP_CIPHER; // corresponds to m_cipher.
		/*size_t		m_ivLen;  // IV size in #bytes*/
		size_t		m_blkSize;// cipher's block size in #bytes. Corresponds to m_EVP_CIPHER.
		uint8_t		getVersion		() const {return m_version;}

					CryptInfo		(CipherEnum cipher, size_t keyLen, uint8_t version=1);
		explicit	CryptInfo		(const Buf<uint8_t>& cryptInfo);
		explicit	CryptInfo		(const CryptInfo&);
					~CryptInfo		() {zero();}
		void		zero			();
		virtual void serialize		(ByteBuf& outbuf);

		friend class CryptInfoFormatBase;

	private:
		CryptInfo&	operator=		(const CryptInfo&);// disabled
		void		ConstructCommon	(CipherEnum);

		uint8_t		m_version; //serialization format version.
	};

	inline
	CryptInfo::CryptInfo(const CryptInfo& other)
	: m_logN(other.m_logN), m_r(other.m_r), m_p(other.m_p), m_cipher(other.m_cipher),
	m_keyLen(other.m_keyLen), m_salt(other.m_salt, true), m_randKey(other.m_randKey, true),
	m_EVP_CIPHER(other.m_EVP_CIPHER), m_blkSize(other.m_blkSize), m_version(other.m_version)
	
	{}
} // end namespace crypt
#endif //  _H_CRYPT_INFO_
