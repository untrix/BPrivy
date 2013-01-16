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
			throw Error(Error::CODE_FEATURE_NOT_SUPPORTED, L"Data size is too large");
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
		try
		{
		size_t ivSize = ciBlob.m_iv.dataNum();
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
		catch (Error& e)
		{
			e.gmsg = L"CipherBlobFormat1::serializeHeader. " + e.gmsg;
			throw;
		}
	}
	void
	CipherBlobFormat1::parseHeader(CipherBlob& ciBlob)
	{
		try
		{
		Parser parse(ciBlob.m_buf);
		uint8_t header_first = parse.GetU8();
		// LS Nibble represents serialization format version.
		Error::Assert((header_first&0x0F)==VAL_FMT_VER, Error::CODE_BAD_DATA, L"Error while parsing CipherBlob header");
		// MS Nibble has size of the data_size field of the header.
		unsigned int size_field_size = ( (header_first&0xF0) >> 4 );
		Error::Assert(size_field_size<=4, Error::CODE_BAD_DATA, L"Error while parsing CipherBlob header");

		size_t ivSize = parse.GetU8();
		ByteBuf iv(ivSize);
		parse.GetBuf(iv, ivSize);
		ciBlob.m_iv = std::move(iv);

		size_t ciTextSize = parse.GetUInt(size_field_size);
		ciBlob.m_ciTextSize = ciTextSize;
		ciBlob.m_headerSize = (2 + ivSize + size_field_size);
		}
		catch (Error& e)
		{
			e.gmsg = L"CipherBlobFormat1::parseHeader. " + e.gmsg;
			throw;
		}
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
			throw Error(Error::CODE_FEATURE_NOT_SUPPORTED, L"CryptoParser: Data lengths greater than 4GB are not supported");
		}
	}
	uint8_t
	Parser::GetU8()
	{
		Error::Assert(((m_pos+1)<=m_buf.dataNum()), Error::CODE_BAD_DATA,
					  L"Parser::GetU8. End of Buffer");
		return m_buf[m_pos++];
	}

	uint16_t
	Parser::GetU16()
	{
		Error::Assert(((m_pos+2)<=m_buf.dataNum()), Error::CODE_BAD_DATA,
					  L"Parser::GetU16. End of Buffer");

		uint16_t _t;
		_t = be16dec(getP());
		m_pos += 2;
		return _t;
	}

	uint32_t
	Parser::GetU32()
	{
		Error::Assert(((m_pos+4)<=m_buf.dataNum()), Error::CODE_BAD_DATA,
					  L"Parser::GetU32. End of Buffer");
		uint32_t _t;
		_t = be32dec(getP());
		m_pos += 4;
		return _t;
	}

	void
	Parser::GetBuf(Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len)<=m_buf.dataNum()), Error::CODE_BAD_DATA,
					  L"Parser::GetBuf. End of InStream");
		Error::Assert(((len)<=buf.capacityBytes()), Error::CODE_BAD_PARAM,
					  L"Parser::GetBuf. OutBuf too small");
		memcpy(buf, getP(), len);
		buf.setDataNum(len);
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
			throw Error(Error::CODE_FEATURE_NOT_SUPPORTED, L"CryptoSerializer: Data lengths greater than 4GB are not supported");
		}
	}
	void
	Serializer::PutU32(uint32_t n)
	{
		Error::Assert((m_pos+4) <= m_buf.capacityBytes(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU32. Attempt to write beyond end of buffer");
		be32enc(getP(), n);
		m_pos += 4;
		//m_buf.incrDataNum(4);
	}
	void
	Serializer::PutU16(uint16_t n)
	{
		Error::Assert((m_pos+2) <= m_buf.capacityBytes(), Error::CODE_BAD_PARAM,
				L"Serializer::PutU16. Attempt to write beyond end of buffer");
		be16enc(getP(), n);
		m_pos += 2;
		//m_buf.incrDataNum(2);
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
		//m_buf.incrDataNum(1);
	}
	void
	Serializer::PutBuf(const Buf<uint8_t>& buf, size_t len)
	{
		Error::Assert(((m_pos+len) <= m_buf.capacityBytes()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to write beyond end of buffer");
		Error::Assert(((len) <= buf.dataNum()), Error::CODE_BAD_PARAM,
				L"Serializer::PutBuf. Attempt to read beyond end of buffer");
		memcpy(getP(), buf, len);
		m_pos += len;
		//m_buf.incrDataNum(len);
	}

	/*****************************************************************/
	/*********************** CryptInfoFormat0 ************************/
	/************************ Null CryptInfo *************************/
	/**
	* Serialization Format Version 0 for CryptInfo. Used to indicate
	* no encryption, clear-text files. Use this for debugging/development
	* purposes alone. Is not intended for use in production (except perhaps
	* for storing non-sensitive data such as settings, but at the time
	* of this writing the same cryptInfo applies to everything within the
	* DB, hence settings will also be encrypted in prod. One benefit of
	* doing that is that it prevents re-engineering of the DB technology).
	*/
	class CryptInfoFormat0 : public CryptInfoFormatBase
	{
		/**
		 *  BYTE#                    CONTENTS
         *
         *  1          [         [CryptInfoFormatBase]       ]
		*/
	public:
		static size_t			EstimateBufSize	(const CryptInfo& obj);
		static void				serialize		(const CryptInfo& obj,
												 Buf<uint8_t>& outbuf);
		static void				parse			(const Buf<uint8_t>& inbuf, CryptInfo& obj);

	private:
		/**
		* VALues are fixed for posterity. They are never to be changed since 
		* they are persisted to disk 
		*/
		typedef enum {
			VAL_FMT_VER = 0,
			FMT_TOTAL_SIZE = 1
		} Constant;
	};

	inline 	size_t
	CryptInfoFormat0::EstimateBufSize(const CryptInfo& obj)
	{
		return FMT_TOTAL_SIZE;
	}

	void
	CryptInfoFormat0::serialize (const CryptInfo& obj, Buf<uint8_t>& outbuf)
	{
		try
		{
		Serializer serialize(outbuf);
		serialize.PutU8(VAL_FMT_VER);
		Error::Assert(serialize.getPos() == FMT_TOTAL_SIZE);
		outbuf.setDataNum(serialize.getPos());
		}
		catch (Error& e)
		{
			e.gmsg = L"CryptInfoFormat0::serialize. " + e.gmsg;
			throw;
		}
	}

	void 
	CryptInfoFormat0::parse (const Buf<uint8_t>& inbuf, CryptInfo& obj)
	{
		try
		{
			Parser parse(inbuf);
			if ((parse.GetU8() != VAL_FMT_VER)) {
				throw Error(Error::CODE_BAD_DATA, L"Bad CryptInfo File/Data");
			}
		}
		catch (Error& e)
		{
			if (e.gcode == Error::CODE_BAD_DATA) {
				e.gmsg = L"Bad CryptInfo File/Data. " + e.gmsg;
			}
			if (e.gcode == Error::CODE_FEATURE_NOT_SUPPORTED) {
				e.gcode = Error::CODE_INTERNAL_ERROR;
			}
			throw;
		}
	}

	/*****************************************************************/
	/*********************** CryptInfoFormat1 ************************/
	/*****************************************************************/
	/**
	* Serialization Format Version 1 for CryptInfo. Carries code that is
	* used to marshall and unmarshall data to/from files. Hence the format
	* can never be changed once it is put to use. If you want to change the
	* format, then write a new class and increment the VER template parameter.
	*/
	class CryptInfoFormat1 : public CryptInfoFormatBase
	{
		/**
		 *  BYTE#                    CONTENTS
         *
         *  1          [         [CryptInfoFormatBase]       ]
         *  2          [          log N (for scrypt)         ]
         *  3          [           r (for scrypt)            ]
         *  4          [           p (for scrypt)            ]
         *  5          [             cipher - ID             ]
         *  6          [  key length (both rand and derived  ]
         *  7-38       [         salt - 32 bytes             ]
         *  39         [        encrypted key size           ]
         *  40-N       [  encrypted rand key (cipher Blob)   ]
         *  40-N       [ length embedded within cipher Blob  ]
		*/
	public:
		static size_t			EstimateBufSize	(const CryptInfo& obj);
		static uint8_t			CipherEnumToVal	(CipherEnum cipher);
		static CipherEnum		CipherValToEnum	(uint8_t cipher);
		static void				serialize		(const CryptInfo& obj,
												 Buf<uint8_t>& outbuf);
		static void				parse			(const Buf<uint8_t>& inbuf, CryptInfo& obj);

	private:
		/**
		* VALues are fixed for posterity. They are never to be changed since 
		* they are persisted to disk 
		*/
		typedef enum {
			VAL_CIPHER_BF_CBC = 1,  // Blowfish in CBC mode
			VAL_CIPHER_AES_CBC = 2, // AES (Rijndael) in CBC mode
			VAL_FMT_VER = 1,
			FMT_SALT_SIZE = 32,
			//FMT_SIG_SIZE = 32,
			FMT_TOTAL_FIXED_SIZE = 39
		} Constant;
	};

	inline size_t
	CryptInfoFormat1::EstimateBufSize(const CryptInfo& obj)
	{
		return FMT_TOTAL_FIXED_SIZE + obj.m_randKey.dataNum();
	}

	uint8_t
	CryptInfoFormat1::CipherEnumToVal(CipherEnum cipher)
	{
		switch (cipher)
		{
		case CIPHER_BF_CBC:
			return VAL_CIPHER_BF_CBC;
			break;
		case CIPHER_AES_CBC:
			return VAL_CIPHER_AES_CBC;
			break;
		default:
			throw Error(Error::CODE_BAD_PARAM, L"Bad cipher-enum");
		}
	}

	CipherEnum 
	CryptInfoFormat1::CipherValToEnum(uint8_t cipher)
	{
		switch (cipher)
		{
			case VAL_CIPHER_BF_CBC:
				return CIPHER_BF_CBC;
			case VAL_CIPHER_AES_CBC:
				return CIPHER_AES_CBC;
			default:
				throw Error(Error::CODE_BAD_PARAM, L"Bad cipher-val");
		}
	}

	void
	CryptInfoFormat1::serialize (const CryptInfo& obj, Buf<uint8_t>& outbuf)
	{
		try
		{
			Serializer serialize(outbuf);
			serialize.PutU8(VAL_FMT_VER);
			serialize.PutU8(obj.m_logN);
			serialize.PutU8(obj.m_r);
			serialize.PutU8(obj.m_p);
			serialize.PutU8(CipherEnumToVal(obj.m_cipher));
			serialize.PutU8(obj.m_keyLen);
			serialize.PutBuf(obj.m_salt, FMT_SALT_SIZE);
			const ByteBuf& key = obj.m_randKey;
			serialize.PutU8(key.dataNum());
			serialize.PutBuf(key, key.dataNum());
			Error::Assert(serialize.getPos() == FMT_TOTAL_FIXED_SIZE + key.dataNum());
			outbuf.setDataNum(serialize.getPos());
		}
		catch (Error& e)
		{
			e.gmsg = L"CryptInfoFormat1::serialize. " + e.gmsg;
			throw;
		}
	}

	void 
	CryptInfoFormat1::parse (const Buf<uint8_t>& inbuf, CryptInfo& obj)
	{
		try
		{
			Parser parse(inbuf);
			if ((parse.GetU8() != VAL_FMT_VER)) {
				throw Error(Error::CODE_BAD_DATA);
			}
			obj.m_logN = parse.GetU8();
			obj.m_r = parse.GetU8();
			obj.m_p = parse.GetU8();
			obj.m_cipher = CipherValToEnum(parse.GetU8());
			obj.m_keyLen = parse.GetU8();
			parse.GetBuf(obj.m_salt, FMT_SALT_SIZE);
			size_t keySize = parse.GetU8();
			ByteBuf key(keySize);
			parse.GetBuf(key, keySize);
			obj.m_randKey = std::move(key); // parsing of cipher-blob happens here.
			//parse.GetBuf(obj.m_signature, FMT_SIG_SIZE);
		}
		catch (Error& e)
		{
			if (e.gcode == Error::CODE_BAD_DATA) {
				e.gmsg = L"Bad CryptInfo File/Data. " + e.gmsg;
			}
			if (e.gcode == Error::CODE_FEATURE_NOT_SUPPORTED) {
				e.gcode = Error::CODE_INTERNAL_ERROR;
			}
			throw;
		}
	}

	/*****************************************************************/
	/********************** CryptInfoFormatBase **********************/
	/*****************************************************************/
	void
	CryptInfoFormatBase::parse(const Buf<uint8_t>& inbuf, CryptInfo& obj)
	{
		obj.m_version = GetVersion(inbuf);
		switch (obj.m_version)
		{
		case 0:
			CryptInfoFormat0::parse(inbuf, obj);
			break;
		case 1:
			CryptInfoFormat1::parse(inbuf, obj);
			break;
		default:
			Error::Assert(false, Error::CODE_BAD_DATA, L"CryptInfoFormatBase::parse. Bad CryptInfo File");
		}
	}

	void
	CryptInfoFormatBase::serialize(const CryptInfo& obj,
								   ByteBuf& outbuf)
	{
		switch (obj.m_version)
		{
		case 0:
			outbuf.ensureCap(CryptInfoFormat0::EstimateBufSize(obj));
			CryptInfoFormat0::serialize(obj, outbuf);
			break;
		case 1:
			outbuf.ensureCap(CryptInfoFormat1::EstimateBufSize(obj));
			CryptInfoFormat1::serialize(obj, outbuf);
			break;
		default:
			Error::Assert(false, Error::CODE_INTERNAL_ERROR, L"CryptInfoFormatBase::serialize. Bad CryptInfo Object");
		}
	}
}
