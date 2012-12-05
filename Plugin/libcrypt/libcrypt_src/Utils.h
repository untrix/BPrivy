#ifndef _UTILS_H_
#define _UTILS_H_

#include <stdint.h>
#include <string>

namespace crypt
{
	bool	byteToHexStr(const uint8_t* binBuf, size_t binBufLen, std::string& hexStr);
	bool	hexToByteBuf(const std::string& hexStr, uint8_t* binBuf, size_t binBufLen);

	inline uint16_t
	be16dec(const void *buf)
	{
		const uint8_t *pI8 = (uint8_t const *)buf;

		return	((uint16_t)(pI8[1]) + 
				((uint16_t)(pI8[0]) << 8) );
	}

	inline uint32_t
	be32dec(const void *buf)
	{
		const uint8_t *pI8 = (uint8_t const *)buf;

		return	((uint32_t)(pI8[3]) + 
				((uint32_t)(pI8[2]) << 8) +
				((uint32_t)(pI8[1]) << 16) + 
				((uint32_t)(pI8[0]) << 24));
	}

	inline void
	be16enc(void *buf, uint16_t i16)
	{
		uint8_t * pI8 = (uint8_t *)buf;

		pI8[1] = i16 & 0xff;
		pI8[0] = (i16 >> 8) & 0xff;
	}

	inline void
	be32enc(void *buf, uint32_t i32)
	{
		uint8_t * pI8 = (uint8_t *)buf;

		pI8[3] = i32 & 0xff;
		pI8[2] = (i32 >> 8) & 0xff;
		pI8[1] = (i32 >> 16) & 0xff;
		pI8[0] = (i32 >> 24) & 0xff;
	}

	template <class T> void
	zero(std::basic_string<T>& str)
	{
		str.assign(str.length(), 0);
	}

	template <typename T>
	class Buf
	{
	public:
						Buf				(size_t len) : LENGTH(len) 
						{
							Malloc(LENGTH);
						}
		virtual			~Buf			() {zero(); delete[] m_buf;}
		virtual void	zero			() {memset(m_buf, 0, sizeof m_buf);}
		size_t			size			() const {return sizeof m_buf;}
		const size_t	LENGTH;
		virtual T*		operator T*		() {return m_buf;}
		virtual const T* operator T*		() const {return m_buf;}
	private:
						Buf				(const Buf&);// not to be defined
		Buf&			operator=		(const Buf&);// not to be defined
		void			Malloc			(size_t len)
						{
							if (len == 0) {
								throw Error(Error::CODE_BAD_PARAM, L"Zero Buf size specified");
							}
							std::nothrow_t x;
							m_buf = new(x) T[len];
							if (!m_buf) {
								throw Error(Error::CODE_NO_MEM);
							}
						}
		T*				m_buf;
	};

	/** 
	* Wrapper around Buf to allow specifying size along with declaration.
	* Makes code shorter and less error prone provided the buffer size is fixed.
	*/
	template <typename T, size_t default_len>
	class Array : public Buf<T>
	{
	public:
						Array			() : Buf(default_len){}
	};
}

#endif // !_UTILS_H_