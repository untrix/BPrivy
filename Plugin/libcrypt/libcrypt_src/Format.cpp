#include "CryptFormat.h"

namespace crypt
{
	/*****************************************************************/
	/*********************** CipherBlobFormat1 ***********************/
	/*****************************************************************/
	size_t
	CipherBlobFormat1::EstimateHeaderSize(size_t ivSize, size_t ciTextSize)
	{
		size_t n = FMT_HEADER_FIXED_SIZE + ivSize;

		if (ciTextSize <= 0xFF) {
			return 1 + n;
		}
		else if (ciTextSize <= 0xFFFF) {
			return 2 + n;
		}
		else if (ciTextSize <= 0xFFFFFFFF) {
			return 4 + n;
		}
		else {
			// Max of 4GB data is supported.
			throw Error(Error::CODE_BAD_PARAM, L"Data size is too large");
		}
	}
	size_t
	CipherBlobFormat1::EstimateTotalSize(size_t ivSize, size_t ciTextSize)
	{
		return EstimateHeaderSize(ivSize, ciTextSize) + ciTextSize;
	}
	void
	CipherBlobFormat1::serializeHeader(CipherBlob& ciBlob)
	{
		size_t ivSize = ciBlob.m_iv.dataLen();
		size_t headerSize = ciBlob.m_headerSize;
		size_t ciTextSize = ciBlob.m_ciTextSize;
		size_t size_field_size = (headerSize - FMT_HEADER_FIXED_SIZE - ivSize);

		Error::Assert(headerSize>=EstimateHeaderSize(ivSize, ciTextSize), 
			Error::CODE_INTERNAL_ERROR, L"CipherBlobFormat1::serializeHeader. allocated header size is too small");
		// LS Nibble represents serialization format version.
		uint8_t ver = (VAL_FMT_VER) & 0x0F;
		// MS Nibble represents size of the tail part of the header.
		uint8_t header_first = ( ( ( ((uint8_t)size_field_size) << 4) & 0xF0) | ver);

		Serializer serializer(ciBlob.m_buf);
		serializer.PutU8(header_first);
		serializer.PutU8((uint8_t)ivSize);
		serializer.PutBuf(ciBlob.m_iv, ivSize);
		serializer.PutUInt(size_field_size, ciTextSize);
	}
	void
	CipherBlobFormat1::parseHeader(CipherBlob& ciBlob)
	{
		Parser parse(ciBlob.m_buf);
		uint8_t header_first = parse.GetU8();
		// LS Nibble represents serialization format version.
		Error::Assert((header_first&0x0F)==VAL_FMT_VER, Error::CODE_BAD_FMT, L"Error while parsing CipherBlob header");
		// MS Nibble has size of the data_size field of the header.
		unsigned int size_field_size = ( (header_first&0xF0) >> 4 );
		Error::Assert(size_field_size<=4, Error::CODE_BAD_FMT, L"Error while parsing CipherBlob header");

		size_t ivSize = parse.GetU8();
		ByteBuf iv(ivSize);
		parse.GetBuf(iv, ivSize);
		ciBlob.m_iv = std::move(iv);

		size_t ciTextSize = parse.GetUInt(size_field_size);
		ciBlob.m_ciTextSize = ciTextSize;
		ciBlob.m_headerSize = (2 + ivSize + size_field_size);
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
		Error::Assert(((m_pos+1)<=m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU8. End of Buffer");
		return m_buf[m_pos++];
	}

	uint16_t
	Parser::GetU16()
	{
		Error::Assert(((m_pos+2)<=m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU16. End of Buffer");

		uint16_t _t;
		_t = be16dec(getP());
		m_pos += 2;
		return _t;
	}

	uint32_t
	Parser::GetU32()
	{
		Error::Assert(((m_pos+4)<=m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
					  L"Parser::GetU32. End of Buffer");
		uint32_t _t;
		_t = be32dec(getP());
		m_pos += 4;
		return _t;
	}

	void
	Parser::GetBuf(Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len)<=m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. End of Buffer");
		Error::Assert(((len)<=buf.capacityBytes()), Error::CODE_BAD_PARAM,
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
		Error::Assert((m_pos+4) <= m_buf.capacityBytes(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU32. Attempt to write beyond end of buffer");
		be32enc(getP(), n);
		m_pos += 4;
	}
	void
	Serializer::PutU16(uint16_t n)
	{
		Error::Assert((m_pos+2) <= m_buf.capacityBytes(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU16. Attempt to write beyond end of buffer");
		be16enc(getP(), n);
		m_pos += 2;
	}
	void
	Serializer::PutU8(uint8_t v)
	{
		Error::Assert(((m_pos+1) <= m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
				L"Serializer::PutU8. Attempt to write beyond end of buffer");
		/** NOTE: pos is #bytes, not #elements */
		uint8_t* p = getP();
		*p = v;
		m_pos++;
	}
	void
	Serializer::PutBuf(const Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len) <= m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to write beyond end of buffer");
		Error::Assert(((len) <= buf.capacityBytes()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to read beyond end of buffer");
		memcpy(getP(), buf, len);
		m_pos += len;
	}
}
