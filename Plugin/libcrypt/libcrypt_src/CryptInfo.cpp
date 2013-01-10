#include "CryptError.h"
#include "CryptInfo.h"
#include "CryptFormat.h"
#include <openssl/rand.h>
#include <openssl/err.h>

namespace crypt
{
	/*****************************************************************/
	/************************** CryptInfo ****************************/
	/*****************************************************************/

	CryptInfo::CryptInfo(CipherEnum cipher, size_t keyLen, uint8_t version) :
		m_logN(LOGN), m_r(R), m_p(P),
		m_cipher(cipher), m_keyLen(keyLen), m_version(version)
	{
		if (version) {
			RAND_bytes(static_cast<unsigned char*>((uint8_t*)m_salt), m_salt.capacityBytes());
			m_salt.setFull();
			ConstructCommon(m_cipher);
		}
		// else construct a null-cryptinfo object. All we care about here is
		// that m_version=0. This object should not be used for anything other
		// than serialization.
	}
	CryptInfo::CryptInfo(const Buf<uint8_t>& cryptInfo)
	{
		CryptInfoFormat::parse(cryptInfo, *this);
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
		//m_ivLen = EVP_CIPHER_iv_length(m_EVP_CIPHER);
		m_blkSize = EVP_CIPHER_block_size(m_EVP_CIPHER);
	}

	void
	CryptInfo::zero()
	{
		m_logN = m_r = m_p = m_keyLen = 0;
		m_cipher = CPHR_NULL;
		m_salt.zero();
		//m_signature.zero();
	}

	void 
	CryptInfo::serialize(ByteBuf& outbuf)
	{
		CryptInfoFormatBase::serialize(*this, outbuf);
	}

	/*****************************************************************/
	/************************** CipherBlob ***************************/
	/*****************************************************************/
	void
	CipherBlob::zero()
	{
		m_buf.zero();
		m_iv.zero();
		m_headerSize = m_ciTextSize = 0;
	}
	CipherBlob::CipherBlob(CipherBlob&& other)
	  : m_buf(std::forward<ByteBuf>(other.m_buf)),
	    m_iv(std::forward<ByteBuf>(other.m_iv)),
		m_headerSize(other.m_headerSize),
		m_ciTextSize(other.m_ciTextSize)
	{
		other.zero(); // paranoia
	}
	CipherBlob&
	CipherBlob::operator=(CipherBlob&& other)
	{
		if (this == &other) return *this;
		
		m_buf = std::forward<ByteBuf>(other.m_buf);
		m_iv = std::forward<ByteBuf>(other.m_iv);
		m_headerSize = m_headerSize;
		m_ciTextSize = other.m_ciTextSize;

		other.zero();
		return *this;
	}
	CipherBlob::CipherBlob()
		: m_ciTextSize(0), m_headerSize(0)
	{}
	CipherBlob::CipherBlob(ByteBuf&& iv, size_t tentativeDataSize)
		: m_buf(CipherBlobFormat1::EstimateTotalSize(iv.dataNum(), tentativeDataSize)),
		m_headerSize(CipherBlobFormat1::EstimateHeaderSize(iv.dataNum(), tentativeDataSize)),
		m_ciTextSize(0),
		m_iv(std::forward<ByteBuf>(iv))
	{}
	void CipherBlob::finalize(size_t ciTextSize)
	{
		// marshall the header.
		Error::Assert((ciTextSize>0), Error::CODE_BAD_PARAM,
			L"CipherBlob::serialize. Cipher Text size is zero");
		m_ciTextSize = ciTextSize;
		m_buf.setDataNum(ciTextSize + m_headerSize);
		CipherBlobFormat1::serializeHeader(*this);
	}

	CipherBlob::CipherBlob(ByteBuf&& data)
		: m_buf(std::forward<ByteBuf>(data)),
		m_iv()
	{
		CipherBlobFormat1::parseHeader(*this);
		m_buf.setDataNum(m_headerSize + m_ciTextSize);
	}

	CipherBlob&
	CipherBlob::operator=(ByteBuf&& data)
	{
		m_buf = std::forward<ByteBuf>(data);
		CipherBlobFormat1::parseHeader(*this);
		m_buf.setDataNum(m_headerSize + m_ciTextSize);
		return *this;
	}
	
	void
	CipherBlob::seek(size_t count, size_t dataNum)
	{
		if (count)
		{
			m_buf.seek(count);
			m_buf.setDataNum(dataNum);
			CipherBlobFormat1::parseHeader(*this);
			m_buf.setDataNum(m_headerSize + m_ciTextSize);
		}
	}

	uint8_t*
	CipherBlob::getCiText()
	{
		return static_cast<uint8_t*>(m_buf) + m_headerSize;
	}

} // end namespace crypt