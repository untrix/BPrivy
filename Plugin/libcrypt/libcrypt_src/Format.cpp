#include "Format.h"

namespace crypt
{
	/*****************************************************************/
	/*********************** CipherBlobFormat1 ***********************/
	/*****************************************************************/
	size_t
	CipherBlobFormat1::EstimateHeaderSize(size_t ivSize, size_t encryptedSize)
	{
		size_t n = 2 + ivSize;

		if (encryptedSize <= 0xFF) {
			return 1 + n;
		}
		else if (encryptedSize <= 0xFFFF) {
			return 2 + n;
		}
		else if (encryptedSize <= 0xFFFFFFFF) {
			return 4 + n;
		}
		else {
			// Max of 4GB data is supported.
			throw Error(Error::CODE_BAD_PARAM, L"Data size is too large");
		}
	}
	size_t
	CipherBlobFormat1::EstimateTotalSize(size_t ivSize, size_t encryptedSize)
	{
		return EstimateHeaderSize(ivSize, encryptedSize) + encryptedSize;
	}
	void
	CipherBlobFormat1::serializeHeader(CipherBlob& ciText, size_t headerSize)
	{
		// LS Nibble represents serialization format version.
		uint8_t ver = (VAL_FMT_VER) & 0x0F;
		// MS Nibble represents size of the tail part of the header.
		uint8_t size_field_size = (((ciText.getHeaderSize() - FMT_HEADER_FIXED_SIZE) << 4) & 0xF0);
		uint8_t header_first = (size_field_size | ver);

		Serializer serializer(ciText.m_buf);
		serializer.PutUInt(FMT_HEADER_HEADER_SIZE, header_head);
		serializer.PutUInt((ciText.getHeaderSize() - 1), ciText.getDataSize());
	}
	void
	CipherBlobFormat1::parseHeader(CipherBlob& ciBlob)
	{
		Parser parse(ciBlob.m_buf);
		uint8_t header_head = parse.GetUInt(FMT_HEADER_HEADER_SIZE);
		// LS Nibble represents serialization format version.
		Error::Assert((header_head&0x0F)==VAL_FMT_VER, Error::CODE_BAD_FMT, L"Error while parsing CipherBlob header");
		// MS Nibble represents size of the tail part of the header.
		size_t header_tail_size = ( (header_head&0xF0) >> 4 );
		Error::Assert(header_tail_size<=4, Error::CODE_BAD_FMT, L"Error while parsing CipherBlob header");

		ciBlob.putEncryptedSize((size_t)parse.GetUInt(header_tail_size));
		ciBlob.putHeaderSize(FMT_HEADER_HEADER_SIZE + header_tail_size);
	}

	/*****************************************************************/
	/**************************** Parser *****************************/
	/*****************************************************************/
	unsigned long long
	Parser::GetUInt(unsigned datumSize)
	{
		switch (datumSize)
		{
		case 1:
			return GetU8();
		case 2:
			return GetU16();
		case 4:
			return GetU32();
		default:
			throw Error(Error::CODE_BAD_FMT, L"Error while parsing CipherBlob header");
		}
	}
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

		uint16_t _t;
		_t = be16dec(getP());
		m_pos += 2;
		return _t;
	}

	uint32_t
	Parser::GetU32()
	{
		Error::Assert(((m_pos+4)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU32. End of Buffer");
		uint32_t _t;
		_t = be32dec(getP());
		m_pos += 4;
		return _t;
	}

	void
	Parser::GetBuf(Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len)<=m_buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. End of Buffer");
		Error::Assert(((len)<=buf.size()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. End of Buffer");
		memcpy(buf, getP(), len);
		m_pos += len;
	}
		
	/*****************************************************************/
	/************************** Serializer ***************************/
	/*****************************************************************/
	void
	Serializer::PutUInt(unsigned datumSize, unsigned long long i)
	{
		switch (datumSize)
		{
		case 1:
			PutU8((uint8_t)i); break;
		case 2:
			PutU16((uint16_t)i); break;
		case 4:
			PutU32((uint32_t)i); break;
		default:
			throw Error(Error::CODE_FEATURE_NOT_SUPPORTED, L"Data lengths greater than 4GB are not supported");
		}
	}
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
		m_pos += len;
	}
}
