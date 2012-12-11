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
							Parser		(const Buf<uint8_t>& buf)
								: m_buf(buf), m_pos(0) {}
		virtual				~Parser		() {}
		void				Rewind		() {m_pos = 0;}
		uint8_t				GetU8		();
		uint16_t			GetU16		();
		uint32_t			GetU32		();
		void				GetBuf		(Buf<uint8_t>& buf, size_t len);

	private:
		const uint8_t*		getP		();
		const Buf<uint8_t>&	m_buf;
		size_t				m_pos;
	};
	inline const uint8_t*
	Parser::getP()
	{
		/** NOTE: m_pos is #bytes, not #elements */
		return ((const uint8_t*)m_buf) + m_pos;
	}

	class Serializer
	{
	public:
		Serializer			(Buf<uint8_t>& outbuf) 
								: m_buf(outbuf), m_pos(0) {}
		void				PutU8		(uint8_t);
		void				PutU16		(uint16_t);
		void				PutU32		(uint32_t);
		void				PutBuf		(const Buf<uint8_t>&, size_t len);
		size_t				getPos		() const {return m_pos;}
		Buf<uint8_t>&		m_buf;
	private:
		uint8_t*			getP		();
		size_t				m_pos; // Byte position of next insertion point.
	};
	inline uint8_t*
	Serializer::getP()
	{
		/** NOTE: m_pos is #bytes, not #elements */
		return ((uint8_t*)m_buf) + m_pos;
	}
	/** 
	* This template is setup such that only its specializations may be constructed.
	* This generalized code is never meant to be used. Look at specializations for
	* meaningful code.
	*/
	template <typename T, size_t VER>
	class Format
	{
	private:
		Format() {}
		Format(const Format&);
		virtual ~Format() = 0; // prevents instantiation of this generalized code.
	};

	/**
	* Serialization format version 1 for Crypt Header. Since the version# is
	* serialized into a nibble, we have room for 14 versions - 0x1 through 0xE.
	* Value 0x0 is reserved as a NULL value and value 0xF is reserved as a hook
	* into a larger format (e.g. one using an entire byte for the version).
	*/

	template <>
	class Format<CipherBlob, 1>
	{
	public:
		// Format Constants
		typedef enum {
			VAL_FMT_VER = 1,
			FMT_HEADER_HEADER_SIZE = 1
		} Constant;

		static size_t	GetHeaderSize	(size_t encryptedSize);
		static void serializeHeader(CipherBlob& ciText);
	};
	typedef Format<CipherBlob, 1> CipherBlobFormat1;

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

		static void Verify(const Buf<uint8_t>& inbuf, const CryptCtx& ctx)
		{
			return; // TBD:
		}

		static void Sign (Serializer& serialize, const CryptCtx& ctx)
		{
			Array<uint8_t, FMT_SIG_SIZE> tBuf;
			tBuf.zero(); // right now just writing zeroes.
			serialize.PutBuf(tBuf, FMT_SIG_SIZE);
		}

		static void serialize (const CryptInfo& obj, Buf<uint8_t>& outbuf, const CryptCtx& ctx)
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
			Error::Assert(serialize.getPos() == FMT_TOTAL_SIZE);
		}

		static size_t GetVersion(const Buf<uint8_t>& inbuf)
		{
			Parser parse(inbuf);
			return parse.GetU8();
		}

		static void parse (const Buf<uint8_t>& inbuf, CryptInfo& obj)
		{
			Parser parse(inbuf);
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