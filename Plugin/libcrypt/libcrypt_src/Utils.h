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
		void		zero			() {if (m_buf) {memset(m_buf, 0, sizeof m_buf);}}
		size_t		size			() const {return (m_buf ? sizeof m_buf : 0);}
		size_t		length			() const {return m_len;}		
					operator T*		() {return m_buf;}
					operator const T* () const {return m_buf;}
	protected:
					Buf				() : m_len(0), m_buf(NULL) {}
		virtual		~Buf			() {zero();}
		/** Buffer memory management is done by derived concrete classes */
		T*			m_buf;
		size_t		m_len;
	private:
					Buf				(const Buf&); // disabled
		Buf&		operator=		(const Buf&); // disabled
		virtual	void dummy			() = 0;
	};

	template <typename T>
	class BufHeap : public Buf<T>
	{
	public:
						BufHeap			(size_t len) {Malloc(len);}
		virtual			~BufHeap		() {zero(); delete[] m_buf; m_buf = NULL;}
	private:
						BufHeap			(const Buf&);// not to be defined
		BufHeap&		operator=		(const Buf&);// not to be defined
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
			m_len = len;
			zero();
		}
		virtual void	dummy			() {}
	};

	/** 
	* Wrapper around Buf to allow specifying size along with declaration.
	* Makes code shorter and less error prone provided the buffer size is fixed.
	*/
	template <typename T, size_t LEN>
	class Array : public Buf<T>
	{
	public:
						Array			() {m_buf = m_array; m_len = LEN;}
	protected:
		T				m_array[LEN];
	private:
		virtual void	dummy			() {}
	};
}

#endif // !_UTILS_H_