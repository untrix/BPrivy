#ifndef _LIBCRYPT_FORMAT_H_
#define _LIBCRYPT_FORMAT_H_

#include <cstdint>
#include <vector>
#include "Error.h"
#include "Utils.h"
#include "CryptCtx.h"

namespace crypt
{
	class Parser
	{
	public:
							Parser		(const uint8_t* buf, size_t len)
								: m_buf(buf), m_len(len), m_pos(0) {}
		virtual				~Parser		();
		void				Rewind		() {m_pos = 0;}
		uint8_t				GetU8		();
		uint16_t			GetU16		();
		uint32_t			GetU32		();
		void				GetBuf		(Buf<uint8_t>& buf, size_t len);

	private:
		const uint8_t*		m_buf;
		size_t				m_len;
		size_t				m_pos;
	};

	class Serializer
	{
	public:
		Serializer	(std::string& outbuf) : m_buf(outbuf) {}
		void				PutU8		(const uint8_t&);
		void				PutU16		(const uint16_t&);
		void				PutU32		(const uint32_t&);
		void				PutBuf		(const Buf<uint8_t>&, size_t len);
		void				dump		(std::string&);
		std::string&		m_buf;
	};

	/** 
	* This template is setup such that only its specializations may be constructed.
	* This code is never intended to be used. Look at specializations.
	*/
	template <typename T, size_t VER>
	class Format
	{
	private:
		Format() {}
		Format(const Format&);
		virtual ~Format();
	};

	/**
	* Serialization format version 1 for Crypt Header. Right now we have room
	* for 15 versions.
	*/

	template <>
	class Format<CryptHeader, 1>
	{
	public:
		// Format Constants
		typedef enum {
			VAL_FMT_VER = 1,
			FMT_HEADER_HEADER_SIZE = 1
		} Constant;

		static size_t	GetHeaderSize	(size_t encryptedSize);
		static void marshall(const CryptHeader& header, Buf<uint8_t>& outbuf);
	};
	typedef Format<CryptHeader, 1> CryptHeaderFormat1;

	size_t
	Format<CryptHeader, 1>::GetHeaderSize(size_t encryptedSize)
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
			throw Error(Error::CODE_BAD_PARAM, L"Data size is too large");
		}

		return 5;
	}
	void
	Format<CryptHeader, 1>::marshall(const CryptHeader& header,
									 Buf<uint8_t>& outbuf)
	{
		// MS Nibble represents header version.
		uint8_t HEADER_VER = (VAL_FMT_VER << 4) & 0x10;
		// LS Nibble represents size of the encrypted data to follow.
		uint8_t HEADER_TRAILER_SIZE = header.m_headerSize - 1;
		HEADER_TRAILER_SIZE &= 0x0F;

		outbuf[0] = HEADER_VER || HEADER_TRAILER_SIZE;
		outbuf.PutU32(1, header.m_encryptedSize);
	}
	/** 
	* Serialization Format Version 1 for CryptInfo. Carries code that is
	* used to marshall and unmarshall data to/from files. Hence the format
	* can never be changed once it is put to use. If you want to change the
	* format, then write a new class and increment the VER template parameter.
	*/
	template <>
	class Format<CryptInfo, 1>
	{
	public:
		/**
		* VALues are fixed for posterity. They are never to be changed since 
		* they are persisted to disk 
		*/
		typedef enum {
			VAL_CIPHER_BF_CBC = 1,  // Blowfish in CBC mode
			VAL_CIPHER_AES_CBC = 2, // AES (Rijndael) in CBC mode
			VAL_FMT_VER = 1,
			FMT_SALT_SIZE = 32,
			FMT_SIG_SIZE = 32,
			FMT_TOTAL_SIZE = 76
		} Constant;

		static uint8_t CipherEnumToVal(CipherEnum cipher)
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

		static CipherEnum CipherValToEnum(uint8_t cipher)
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

		static void Verify(const std::string& inbuf, const CryptCtx& ctx)
		{
			return; // TBD:
		}

		static void Sign (Serializer& serialize, const CryptCtx& ctx)
		{
			Array<uint8_t, FMT_SIG_SIZE> tBuf;
			tBuf.zero(); // right now just writing zeroes.
			serialize.PutBuf(tBuf, FMT_SIG_SIZE);
		}

		static void Marshall (const CryptInfo& obj, std::string& outbuf, const CryptCtx& ctx)
		{
			Serializer serialize(outbuf);
			serialize.PutU8(VAL_FMT_VER);
			serialize.PutU8(obj.m_logN);
			serialize.PutU32(obj.m_r);
			serialize.PutU32(obj.m_p);
			serialize.PutU8(CipherEnumToVal(obj.m_cipher));
			serialize.PutU8(obj.m_keyLen);
			serialize.PutBuf(obj.m_salt, FMT_SALT_SIZE);
			Sign(serialize, ctx);
			//serialize.PutBuf(obj.m_signature, FMT_SIG_SIZE);
			Error::Assert(serialize.m_buf.size() == FMT_TOTAL_SIZE);
		}

		static size_t GetVersion(const std::string& inbuf)
		{
			Parser parse(inbuf.data(), inbuf.size());
			return parse.GetU8();
		}

		static void Unmarshall (CryptInfo& obj, const std::string& inbuf)
		{
			Parser parse(inbuf.data(), inbuf.size());
			if ((parse.GetU8() != VAL_FMT_VER) || (inbuf.size() != FMT_TOTAL_SIZE)) {
				throw Error(Error::CODE_BAD_FMT);
			}
			obj.m_logN = parse.GetU8();
			obj.m_r = parse.GetU32();
			obj.m_p = parse.GetU32();
			obj.m_cipher = CipherValToEnum(parse.GetU8());
			obj.m_keyLen = parse.GetU8();
			parse.GetBuf(obj.m_salt, FMT_SALT_SIZE);
			parse.GetBuf(obj.m_signature, FMT_SIG_SIZE);
		}
	};

	typedef Format<CryptInfo, 1> FormatCryptInfo1;
}

#endif