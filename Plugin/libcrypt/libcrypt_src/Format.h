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
							Parser		(const char* buf, size_t len)
								: m_buf((uint8_t*)buf), m_len(len), m_pos(0) {}
		virtual				~Parser		();
		void				Rewind		() {m_pos = 0;}
		uint8_t				GetU8		();
		uint16_t			GetU16		();
		uint32_t			GetU32		();
		void				GetBuf		(Buf<uint8_t>& buf, size_t len);

	private:
		uint8_t*			m_buf;
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
		} Constants;

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