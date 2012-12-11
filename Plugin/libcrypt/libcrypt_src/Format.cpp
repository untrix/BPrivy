#include "Format.h"

namespace crypt
{
	/*****************************************************************/
	/*********************** CipherBlobFormat1 ***********************/
	/*****************************************************************/
	size_t
	Format<CipherBlob, 1>::GetHeaderSize(size_t encryptedSize)
	{
		if (encryptedSize <= 0xFF) {
			return 1 + FMT_HEADER_HEADER_SIZE;
		}
		else if (encryptedSize <= 0xFFFF) {
			return 2 + FMT_HEADER_HEADER_SIZE;
		}
		else if (encryptedSize <= 0xFFFFFFFF) {
			return 4 + FMT_HEADER_HEADER_SIZE;
		}
		else {
			// Max of 4GB data is supported.
			throw Error(Error::CODE_BAD_PARAM, L"Data size is too large");
		}
	}
	void
	Format<CipherBlob, 1>::serializeHeader(CipherBlob& ciText)
	{
		// LS Nibble represents serialization format version.
		uint8_t HEADER_VER = (VAL_FMT_VER) & 0x0F;
		// MS Nibble represents size of the tail part of the header.
		uint8_t SIZE_FIELD_SIZE = (((ciText.getHeaderSize() - 1) << 4) & 0xF0);

		Serializer serializer(ciText.m_buf);
		serializer.PutU8(SIZE_FIELD_SIZE | HEADER_VER);
		switch ((ciText.getHeaderSize() - 1))
		{
		case 1:
			serializer.PutU8((uint8_t)ciText.getEncryptedSize());
			break;
		case 2:
			serializer.PutU16((uint16_t)ciText.getEncryptedSize());
			break;
		case 4:
			serializer.PutU32((uint32_t)ciText.getEncryptedSize());
			break;
		}		
	}

	/*****************************************************************/
	/**************************** Parser *****************************/
	/*****************************************************************/
	uint8_t
	Parser::GetU8()
	{
		Error::Assert(((m_pos+1)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU8. End of Buffer");
		return m_buf[m_pos++];
	}

	uint16_t
	Parser::GetU16()
	{
		Error::Assert(((m_pos+2)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU16. End of Buffer");
		return be16dec(getP());
	}

	uint32_t
	Parser::GetU32()
	{
		Error::Assert(((m_pos+4)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU32. End of Buffer");
		return be32dec(getP());
	}

	void
	Parser::GetBuf(Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. End of Buffer");
		Error::Assert(((len)<=buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. End of Buffer");
		memcpy(buf, getP(), len);
	}
		
	/*****************************************************************/
	/************************** Serializer ***************************/
	/*****************************************************************/
	void
	Serializer::PutU32(uint32_t n)
	{
		Error::Assert((m_pos+4) <= m_buf.size(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU32. Attempt to write beyond end of buffer");
		be32enc(getP(), n);
		m_pos += 4;
	}
	void
	Serializer::PutU16(uint16_t n)
	{
		Error::Assert((m_pos+2) <= m_buf.size(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU16. Attempt to write beyond end of buffer");
		be16enc(getP(), n);
		m_pos += 2;
	}
	void
	Serializer::PutU8(uint8_t v)
	{
		Error::Assert(((m_pos+1) <= m_buf.size()), Error::CODE_BAD_PARAM,
				L"Serializer::PutU8. Attempt to write beyond end of buffer");
		/** NOTE: pos is #bytes, not #elements */
		uint8_t* p = getP();
		*p = v;
		m_pos++;
	}
	void
	Serializer::PutBuf(const Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len) <= m_buf.size()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to write beyond end of buffer");
		Error::Assert(((len) <= buf.size()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to read beyond end of buffer");
		memcpy(getP(), buf, len);
	}
}
