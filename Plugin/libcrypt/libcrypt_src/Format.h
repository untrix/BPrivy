#ifndef _LIBCRYPT_FORMAT_H_
#define _LIBCRYPT_FORMAT_H_

#include <cstdint>
#include <vector>
#include "Error.h"
#include "Utils.h"
#include "CryptCtx.h"

namespace crypt
{
	class Loader
	{
	public:
							Loader		(const char* buf, size_t len)
								: m_buf((uint8_t*)buf), m_len(len), m_pos(0) {}
		virtual				~Loader		();
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

	class Saver
	{
	public:
							Saver		();
		void				PutU8		(const uint8_t&);
		void				PutU16		(const uint16_t&);
		void				PutU32		(const uint32_t&);
		void				PutBuf		(const Buf<uint8_t>&, size_t len);
		void				dump		(std::string&);
		std::basic_string<uint8_t>	m_buf;
	};

	struct FDesc
	{
		typedef enum {UINT, BUF} FieldType;
		size_t index;
		size_t size;
		FieldType type;
		FDesc(size_t index, size_t size, FieldType t)
			: index(index), size(size), type(t) {}
	};

	struct FormatConstants
	{
		static const unsigned int	FMT_NUM_FLDS_CRYPTINFO1;
	};

	class FormatBase : public FormatConstants
	{
	public:
									FormatBase	(unsigned int ID, size_t NUM_FLDS)
										: FORMAT_VER(ID), NUM_FIELDS(NUM_FLDS), BUF_SIZE(0) {}
		size_t						BufSize		();
		template <T> T				GetField	(unsigned int field_seq, 
												 const Buf<uint8_t>& buf) const
		{
			if (field_seq >= NUM_FIELDS) {
				throw Error(Error::CODE_BAD_PARAM, L"Format::GetField. field_index >= NUM_FIELDS");
			}
			FDesc& desc = m_fields[field_seq];

		}
		const unsigned int			FORMAT_VER;
		const size_t				NUM_FIELDS;

	protected:
		std::vector<FDesc>			m_fields;
		std::vector<size_t>			m_offsets;
		virtual						~FormatBase();

	private:
		size_t						BUF_SIZE;
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

	/** Serialization Format Version 1 for CryptInfo */
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
			FMT_SIG_SIZE = 32
		} Constants;

		uint8_t CipherEnumToVal(CipherEnum cipher)
		{
			switch (cipher)
			{
			case CipherEnum::BF_CBC:
				return VAL_CIPHER_BF_CBC;
				break;
			case CipherEnum::AES_CBC:
				return VAL_CIPHER_AES_CBC;
				break;
			default:
				throw Error(Error::CODE_BAD_PARAM, L"Bad cipher-enum");
			}
		}
		CipherEnum CipherValToEnum(uint8_t cipher)
		{
			switch (cipher)
			{
				case VAL_CIPHER_BF_CBC:
					return CipherEnum::BF_CBC;
				case VAL_CIPHER_AES_CBC:
					return CipherEnum::AES_CBC;
				default:
					throw Error(Error::CODE_BAD_PARAM, L"Bad cipher-val");
			}
		}
		void Marshall (const CryptInfo& obj, std::string& outbuf)
		{
			Saver saver;
			saver.PutU8(VAL_FMT_VER);
			saver.PutU8(obj.m_logN);
			saver.PutU32(obj.m_r);
			saver.PutU32(obj.m_p);
			saver.PutU8(CipherEnumToVal(obj.m_cipher));
			saver.PutU8(obj.m_keyLen);
			saver.PutBuf(obj.m_salt, FMT_SALT_SIZE);
			saver.PutBuf(obj.m_signature, FMT_SIG_SIZE);
			saver.dump(outbuf);
		}
		void Unmarshall (CryptInfo& obj, const std::string& inbuf)
		{
			Loader loader(inbuf.data(), inbuf.size());
			if (loader.GetU8() != VAL_FMT_VER) {
				throw Error(Error::CODE_BAD_FMT);
			}
			obj.m_logN = loader.GetU8();
			obj.m_r = loader.GetU32();
			obj.m_p = loader.GetU32();
			obj.m_cipher = CipherValToEnum(loader.GetU8());
			obj.m_keyLen = loader.GetU8();
			loader.GetBuf(obj.m_salt, FMT_SALT_SIZE);
			loader.GetBuf(obj.m_signature, FMT_SIG_SIZE);
		}
	};

	typedef Format<CryptInfo, 1> FormatCryptInfo;
}

#endif