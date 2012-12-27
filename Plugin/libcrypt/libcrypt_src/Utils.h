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
		/*
             |<----------------------------m_len-------------------------------->|
             |<------m_seek------->|<-----m_dataLen------>|<----unfilled space-->|
             |                     |<------capacityNum / capacitySize----------->|
            m-buf               seek-pos              
		 */
					operator T*		() {return m_buf+m_seek;}
					operator const T* () const {return m_buf+m_seek;}
		/**	Zero's out all allocated memory (regardless of seek-position). Resets dataLen
		 *  and seek-position to zero.
		 */
		virtual void zero			()
		{
			if (m_buf) {
				memset(m_buf, 0, m_len*sizeof(T));
				m_dataLen = 0;
				m_seek = 0;
			}
		}
		/** Size of the usable buffer (i.e. after the seek-position) in # of bytes. Somewhat like
		 *	vector::capacity() except that size before the seek-position is disregarded.
		 */
		size_t		capacityBytes			() const {return (m_buf ? ((m_len-m_seek)*sizeof(T)) : 0);}
		/** Number of T elements in the m_buf array after the seek-position. Somewhat like
		 *	vector::capacity() except that size before the seek-position is disregarded.
		 */
		size_t		capacityNum			() const {
			return m_len-m_seek;
		}
		/** Length of populated useful data starting from the seek-position and ending before 
		 *	or at the end of the allocated memory buffer. Similar to basic_string::length().
		 *	This value maybe less than capacityNum() (which itself maybe less than m_len).
		 */
		size_t		dataLen	() const {
			return m_dataLen;
		}
		void		setDataLen	(size_t l) {m_dataLen = l;}
		/** Seek forward delta items */
		void		seek			(size_t delta) {m_seek += delta; m_dataLen = ( (m_dataLen>delta) ? (m_dataLen-delta) : 0);}
		size_t		seek			() {return m_seek;}
		/** Copies data from the supplied array to m_buf at position m_seek+m_dataLen.
		 *	len should be number of elements to copy, not number of bytes.
		 */
		void		append			(const T* data, size_t len)
		{
			if (len && (len <= (capacityNum()-m_dataLen))) {
				// WARNING: Below does a shallow copy only. Will only
				// work on PODs and shallow structs.
				memcpy(m_buf+m_seek+m_dataLen, data, len*sizeof(T));
				m_dataLen += len;
			}
			else {
				throw Error(Error::CODE_NO_MEM, L"Not enough space left in buffer for append.");
			}
		}

	protected:
					Buf				(T* buf = NULL, size_t len = 0, size_t uLen = 0, size_t seek = 0) 
			: m_len(len), m_buf(buf), m_dataLen(uLen), m_seek(seek) {}
		// Move constructor
					Buf				(Buf<T>&& other)
						: m_dataLen(other.m_dataLen), m_seek(other.m_seek)
		{
			//m_dataLen = other.m_dataLen;
			other.m_dataLen = other.m_seek = 0;
		}
		Buf&		operator=		(Buf<T>&& other)
		{
			if (this != &other)
			{
				m_dataLen = other.m_dataLen;
				m_seek = other.m_seek;
				other.m_dataLen = other.m_seek = 0;
			}
			return *this;
		}
		virtual		~Buf			() {zero();}
		/** Buffer memory management is done by derived concrete classes */
		T*			m_buf;
		// Array length. Total # of T elements allocated from memory/stack.
		// NOTE: This may be greater than the value returned by capacityNum()
		size_t		m_len;

	private:
		// In cases where a larger buffer may be allocated, this is a place
		// to record the useful data length of a buffer. This class does not
		// set this value except for initializing it at construction, copying it at 
		// assignment and zeroing it out at zero()
		size_t		m_dataLen;
		size_t		m_seek; // number of items to seek forward starting from m_buf
		/* Disabled methods */
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
		typedef			T*				PtrType;
		explicit		BufHeap			(size_t len, size_t uLen=0) 
		{
			Malloc(len);
			setDataLen(uLen);
		}
		// NULL POINTER !!
		explicit		BufHeap			() {}
		// WARNING: This constructor implements move semantics. The buffer
		// p is owned by the constructed object and must not be deleted
		// externally. Also, p must've been allocated as an array - i.e.
		// using the new T[] operator. This object will delete it using the
		// delete [] operator.
		explicit		BufHeap			(PtrType&& p, size_t len)
		{
			m_buf=p;m_len=len;p=NULL;
			setDataLen(len);
			p = NULL;
		}
		// WARNING: This constructor will only work on PODs and shallow
		// structs because it uses memcpy to copy from c_str.
		explicit		BufHeap			(const T* c_str);
		explicit		BufHeap			(BufHeap<T>&& other);
		/** Move operator capable of accepting expiring values (xvalue) */
		BufHeap&		operator=		(BufHeap<T>&& other);
		virtual			~BufHeap		() {Delete();}
		/**	
		 * Ensures that the capacity of the buffer is at least <capacity>,
		 *	allocating memory if necesary. Then it zeroes and reinitializes
		 *  the object as if by invoking BufHeap(<cap>) in place.
		 */
		void			reInit			(size_t cap)
		{
			if (cap)
			{
				if (cap < m_len) { zero(); }
				else {
					Delete();
					Malloc(cap);
				}
			}
			else if (m_buf) { Delete(); }
		}

	private:
		// pointer to beginning of allocated memory. May be different from m_buf.
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
		if (len) {
			std::nothrow_t x;
			m_buf = new(x) T[len];
			if (!m_buf) {
				throw Error(Error::CODE_NO_MEM);
			}
			m_len = len;
			zero();
		}
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
			setDataLen(m_len);
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
		Buf<T>::operator=(std::forward<Buf<T> >(other));

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
							setDataLen(uLen);
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