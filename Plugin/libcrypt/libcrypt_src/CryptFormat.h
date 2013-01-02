#ifndef _LIBCRYPT_FORMAT_H_
#define _LIBCRYPT_FORMAT_H_

#include <cstdint>
#include <vector>
#include "CryptError.h"
#include "CryptUtils.h"
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
		unsigned long long	GetUInt		(unsigned datumSize);
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
		void				PutUInt		(unsigned datumSize, unsigned long long);
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
	/*template <typename T, size_t VER>
	class Format
	{
	private:
		Format() {}
		Format(const Format&);
		virtual ~Format() = 0; // prevents instantiation of this generalized code.
	};*/

	/**
	* Serialization format version 1 for Crypt Header. Since the version# is
	* serialized into a nibble, we have room for 14 versions - 0x1 through 0xE.
	* Value 0x0 is reserved as a NULL value and value 0xF is reserved as a hook
	* into a larger format (e.g. one using an entire byte for the version).
	*/
	class CipherBlobFormat1
	{
	public:
		// Format Constants
		typedef enum {
			VAL_FMT_VER = 1,
			FMT_HEADER_FIXED_SIZE = 2
		} Constant;
		/** 
		 *  BYTE#            NIBBLE 1        NIBBLE 2
		 *
		 *	1           [Size Field Size][Format Version #]
		 *	2           [            IV Size              ]
		 *  3--N        [               IV                ]
		 *  N--M        [           ciText Size           ]
		 *  M--P        [          ciText  Bytes          ]
		 * 
		 */

		static size_t	EstimateHeaderSize	(size_t ivSize, size_t ciTextSize);
		static size_t	EstimateTotalSize	(size_t ivSize, size_t ciTextSize);
		static void		serializeHeader		(CipherBlob& ciBlob);
		static void		parseHeader			(CipherBlob& ciBlob);
	};
	//typedef Format<CipherBlob, 1> CipherBlobFormat1;

	/** 
	* Serialization Format Version 1 for CryptInfo. Carries code that is
	* used to marshall and unmarshall data to/from files. Hence the format
	* can never be changed once it is put to use. If you want to change the
	* format, then write a new class and increment the VER template parameter.
	*/
	//template <>
	//class Format<CryptInfo, 1>
	class CryptInfoFormat1
	{
		/**
		 *  BYTE#                    CONTENTS
         *
         *  1          [ serialization format version number ]
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

		/*static void Verify(const Buf<uint8_t>& inbuf, const CryptCtx& ctx)
		{
			return; // TBD:
		}*/

		/*static void Sign (Serializer& serialize, const CryptCtx& ctx)
		{
			Array<uint8_t, FMT_SIG_SIZE> tBuf;
			tBuf.setDataNum(FMT_SIG_SIZE);
			//tBuf.zero(); // right now just writing zeroes.
			serialize.PutBuf(tBuf, FMT_SIG_SIZE);
		}*/

		static void serialize (const CryptInfo& obj, Buf<uint8_t>& outbuf, const CryptCtx& ctx)
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
			//Sign(serialize, ctx);
			Error::Assert(serialize.getPos() == FMT_TOTAL_FIXED_SIZE + key.dataNum());
			outbuf.setDataNum(serialize.getPos());
		}

		static size_t GetVersion(const Buf<uint8_t>& inbuf)
		{
			Parser parse(inbuf);
			return parse.GetU8();
		}

		static void parse (const Buf<uint8_t>& inbuf, CryptInfo& obj)
		{
			try
			{
				Parser parse(inbuf);
				if ((parse.GetU8() != VAL_FMT_VER)) {
					throw Error(Error::CODE_BAD_FMT);
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
					e.gcode = Error::CODE_BAD_FILE;
					e.gmsg = L"Bad CryptInfo File/Data";
				}
				if (e.gcode == Error::CODE_FEATURE_NOT_SUPPORTED) {
					e.gcode = Error::CODE_INTERNAL_ERROR;
				}
				throw;
			}
		}
	};

	//typedef Format<CryptInfo, 1> FormatCryptInfo1;
}

#endif