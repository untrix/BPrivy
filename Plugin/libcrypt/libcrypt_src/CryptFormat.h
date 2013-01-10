#ifndef _LIBCRYPT_FORMAT_H_
#define _LIBCRYPT_FORMAT_H_

#include <cstdint>
#include <vector>
#include "CryptError.h"
#include "CryptUtils.h"
#include "CryptCtx.h"

namespace crypt
{
	/*****************************************************************/
	/**************************** Parser *****************************/
	/*****************************************************************/
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

	/*****************************************************************/
	/************************** Serializer ***************************/
	/*****************************************************************/
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

	/*********************************************************************/
	/************************ CipherBlobFormat1 **************************/
	/*********************************************************************/
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

	/*********************************************************************/
	/*********************** CryptInfoFormatBase *************************/
	/*********************************************************************/
	class CryptInfoFormatBase
	{
	public:
		/**
		 *  BYTE#                    CONTENTS
         *
         *  1          [ serialization format version number ]
		 */
		static uint8_t			GetVersion		(const Buf<uint8_t>& inbuf);
		static void				serialize		(const CryptInfo& obj,
												 ByteBuf& outbuf);
		static void				parse			(const Buf<uint8_t>& inbuf, CryptInfo& obj);
	};

	typedef CryptInfoFormatBase CryptInfoFormat;

	inline uint8_t
	CryptInfoFormatBase::GetVersion(const Buf<uint8_t>& inbuf)
	{
		Parser parse(inbuf);
		return parse.GetU8();
	}
}


#endif