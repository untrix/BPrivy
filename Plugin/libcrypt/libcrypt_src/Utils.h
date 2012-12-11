#ifndef _UTILS_H_
#define _UTILS_H_

#include <cstdint>
#include <string>
#include "Error.h"

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

	//WARNING: Buf and its descendants use memory operations like memset and memcpy.
	//Hence, T should be a basic type or a POD. It is designed for uint8_t and
	//wchar_t only.
	template <typename T>
	class Buf
	{
	public:
		void		zero			() {if (m_buf) {memset(m_buf, 0, size());}}
		/** Size of the buffer in # of bytes */
		size_t		size			() const {return (m_buf ? (m_len*sizeof(T)) : 0);}
		/** Number of T elements in the m_buf array */
		size_t		length			() const {return m_len;}		
					operator T*		() {return m_buf;}
					operator const T* () const {return m_buf;}
		void		PutBuf			(size_t pos, const Buf<uint8_t>&, 
									 size_t len) {}
	protected:
					Buf				() : m_len(0), m_buf(NULL) {}
		virtual		~Buf			() {zero();}
		/** Buffer memory management is done by derived concrete classes */
		T*			m_buf;
		// Array length. # of T elements in m_buf
		size_t		m_len;
	private:
					Buf				(const Buf&); // disabled
		Buf&		operator=		(const Buf&); // disabled
		virtual	void dummy			() = 0;
	};

	//WARNING: Buf and its descendants use memory operations like memset and memcpy.
	//Hence, T should be a basic type or a POD. It is designed for uint8_t and
	//wchar_t only.	
	template <typename T>
	class BufHeap : public Buf<T>
	{
	public:
		explicit		BufHeap			(size_t len) {Malloc(len);}
		// WARNING: This constructor will only work on PODs and shallow
		// structs.
		explicit		BufHeap			(const T* c_str);
						BufHeap			(BufHeap<T>&& that);
		/** Move operator capable of accepting expiring values (xvalue) */
		BufHeap&		operator=		(BufHeap<T>&& that);
		virtual			~BufHeap		() {Delete();}
	private:
		void			Malloc			(size_t len);
		void			Malloc			(const T* c_str);
		void			Delete			() 
			{
				size_t _temp = size();
				zero();
				_temp = size();
				delete[] m_buf; 
				m_buf = NULL; m_len = 0;}
		virtual void	dummy			() {}

	private: // Disabled interfaces
						BufHeap			(const BufHeap&);// disabled
		BufHeap&		operator=		(const BufHeap&);// disabled
	};

	template <typename T> void
	BufHeap<T>::Malloc(size_t len)
	{
		if (len == 0) {
			throw Error(Error::CODE_BAD_PARAM, L"BufHeap: Zero Buf size specified");
		}
		std::nothrow_t x;
		m_buf = new(x) T[len];
		if (!m_buf) {
			throw Error(Error::CODE_NO_MEM);
		}
		m_len = len;
		zero();
	}

	template <typename T>
	BufHeap<T>::BufHeap(const T* c_str)
	{
		Error::Assert((c_str!=NULL), Error::CODE_BAD_PARAM, L"BufHeap: c_str is null");

		size_t i;
		for (i=0; c_str[i] != 0; i++){}

		if (!i) {
			m_buf = NULL;
			m_len = 0;
		}
		else {
			Malloc(i);
			/*for (i=0; i<=m_len; i++)  // No null termination.
			{
				m_buf[i] = c_str[i];  // Invokes assignment operator.
			}*/
			// WARNING: Below does a shallow copy only. Will only
			// work on PODs and shallow structs.
			memcpy(m_buf, c_str, m_len*sizeof(T));
		}
	}

	template <typename T>
	BufHeap<T>::BufHeap(BufHeap&& that) {*this = that;}

	template <typename T> BufHeap<T>&
	BufHeap<T>::operator=(BufHeap<T>&& that)
	{
		Delete();
		m_buf = that.m_buf; that.m_buf = NULL;
		m_len = that.m_len; that.m_len = 0;
		return *this;
	}

	//WARNING: Buf and its descendants use memory operations like memset and memcpy.
	//Hence, T should be a basic type or a POD. It is designed for uint8_t and
	//wchar_t only.
	/** 
	* Buf allocated on the stack.
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

	private: // Disabled interfaces
						Array			(const Array&); // undefined
		Array&			operator=		(const Array&); // undefined
	};
}

#endif // !_UTILS_H_