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
		virtual void zero			() 
		{
			if (m_buf) {
				memset(m_buf, 0, size());
				m_usefulLength = 0;
			}
		}
		/** Size of the buffer in # of bytes */
		size_t		size			() const {return (m_buf ? (m_len*sizeof(T)) : 0);}
		/** Number of T elements in the m_buf array */
		size_t		length			() const {return m_len;}
		size_t		usefulLength	() const {return m_usefulLength || m_len;}
		void		setUsefulLength	(size_t l) {m_usefulLength = l;}
					operator T*		() {return m_buf;}
					operator const T* () const {return m_buf;}

	protected:
		Buf				() 
			: m_len(0), m_buf(NULL), m_usefulLength(0) {}
		// Move constructor
		Buf				(Buf<T>&& other) 
		{
			m_usefulLength = other.m_usefulLength;
			other.m_usefulLength = 0;
		}
		Buf&		operator=		(Buf<T>&& other)
		{
			if (this != &other)
			{
				m_usefulLength = other.m_usefulLength;
				other.m_usefulLength = 0;
			}
			return *this;
		}
		virtual		~Buf			() {zero();}
		/** Buffer memory management is done by derived concrete classes */
		T*			m_buf;
		// Array length. # of T elements in m_buf
		size_t		m_len;
	private:
		// In cases where a larger buffer may be allocated, this is a place
		// to record the useful data length of a buffer. This class does not
		// set this value except for initializing it at construction, copying it at 
		// assignment and zeroing it out at zero()
		size_t		m_usefulLength;
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
		explicit		BufHeap			(size_t len, size_t uLen=0) 
		{
			Malloc(len);
			setUsefulLength(uLen);
		}
		// WARNING: This constructor implements move semantics. The buffer
		// p is owned by the constructed object and must not be deleted
		// externally. Also, p must've been allocated as an array - i.e.
		// using the new T[] operator. This object will delete it using the
		// delete [] operator.
		explicit		BufHeap			(T* p, size_t len)
		{
			m_buf=p;m_len=len;p=NULL;
			setUsefulLength(len);
		}

		// WARNING: This constructor will only work on PODs and shallow
		// structs because it uses memcpy to copy from c_str.
		explicit		BufHeap			(const T* c_str);
						BufHeap			(BufHeap<T>&& other);
		/** Move operator capable of accepting expiring values (xvalue) */
		BufHeap&		operator=		(BufHeap<T>&& other);
		virtual			~BufHeap		() {Delete();}

	private:
		void			Malloc			(size_t len);
		void			Delete			() 
		{
			zero();
			delete[] m_buf;
			m_buf = NULL; 
			m_len = 0;
		}
		virtual void	dummy			() {}

	private: // Disabled interfaces
						BufHeap			(const BufHeap&);// disabled
		BufHeap&		operator=		(const BufHeap&);// disabled
	};
	typedef BufHeap<uint8_t> ByteBuf;

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
			setUsefulLength(m_len);
		}
	}

	template <typename T>
	BufHeap<T>::BufHeap(BufHeap&& other) {*this = std::forward<BufHeap<T> >(other);}

	template <typename T> BufHeap<T>&
	BufHeap<T>::operator=(BufHeap<T>&& other)
	{
		Delete();
		m_buf = other.m_buf; other.m_buf = NULL;
		m_len = other.m_len; other.m_len = 0;
		Buf<T>::operator=(*this, std::forward<Buf<T> >(other));

		other.zero(); // paranoia
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
						Array			(size_t uLen=0)
						{
							m_buf = m_array; 
							m_len = LEN;
							setUsefulLength(uLen);
						}
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