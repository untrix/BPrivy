#ifndef _UTILS_H_
#define _UTILS_H_

#include <cstdint>
#include <string>
#include "CryptError.h"

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
             |<----------------------------m_num-------------------------------->|
             |<------m_seek------->|<-----m_dataNum------>|<----unfilled space-->|
             |                     |<------capacityNum / capacityBytes---------->|
             v                     v                                             v
            m_buf            (m_buf+m_seek)                                (m_buf+m_num)
		 */
					operator T*			() {return m_buf+m_seek;}
					operator const T*	() const {return m_buf+m_seek;}
		/**	Zero's out all allocated memory (regardless of seek-position). Resets dataNum
		 *  and seek-position to zero.
		 */
		virtual void zero				();
		/** Size of the usable buffer (i.e. after the seek-position) in # of bytes. Somewhat like
		 *	vector::capacity() except that size before the seek-position is disregarded.
		 */
		size_t		capacityBytes		() const {return (m_buf ? ((m_num-m_seek)*sizeof(T)) : 0);}
		/** Number of T elements in the m_buf array after the seek-position. Somewhat like
		 *	vector::capacity() except that size before the seek-position is disregarded.
		 */
		size_t		capacityNum			() const { return m_num-m_seek;	}
		/** Length of populated useful data starting from the seek-position and ending before 
		 *	or at the end of the allocated memory buffer. Similar to basic_string::length().
		 *	This value maybe less than capacityNum() (which itself maybe less than m_num).
		 */
		size_t		dataNum		() const { return m_dataNum; }
		size_t		dataBytes	() const { return m_dataNum * sizeof(T); }
		void		setDataNum	(size_t l) {m_dataNum = l;}
		//void		incrDataNum	(size_t l) {m_dataNum += l;}
		void		setFull		()	{m_dataNum = capacityNum();}
		/** Seek forward num items */
		void		seek			(size_t num);
		/** Rewind the seek pointer to zero. Increments dataNum by original value of seek() */
		void		rewind			() { m_dataNum += m_seek; m_seek = 0; }
		/** Returns the seek position */
		size_t		seek			() {return m_seek;}
		/** Copies data from the supplied array to m_buf at position m_seek+m_dataNum.
		 *	len should be number of elements to copy, not number of bytes.
		 */
		void		append			(const T* data, size_t len);
		void		append			(const T data);
		/** Returns true if the data content matches */
		bool		operator==		(const Buf<T>&) const;

	protected:
					Buf				(T* buf = NULL, size_t len = 0, size_t uLen = 0, size_t seek = 0) 
			: m_num(len), m_buf(buf), m_dataNum(uLen), m_seek(seek) {}
		// Move constructor
		explicit	Buf				(Buf<T>&& other)
						: m_dataNum(other.m_dataNum), m_seek(other.m_seek)
		{
			if (this != &other ) {
				other.m_dataNum = other.m_seek = 0;
			}
		}
		Buf&		operator=		(Buf<T>&& other);
		virtual		~Buf			() {zero();}
		/** Buffer memory management is done by derived concrete classes */
		T*			m_buf;
		// Array length. Total # of T elements allocated from memory/stack.
		// NOTE: This may be greater than the value returned by capacityNum()
		size_t		m_num;

		// In cases where a larger buffer may be allocated, this is a place
		// to record the useful data length of a buffer. This class does not
		// manage this value except for initializing it at construction, copying it at 
		// assignment and zeroing it out at zero(). It is the responsibility
		// of the user to set its correct value.
		size_t		m_dataNum;
		size_t		m_seek; // number of items to seek forward starting from m_buf

	private:
		/* Disabled methods */
					Buf				(const Buf&); // disabled
		Buf&		operator=		(const Buf&); // disabled
		virtual	void dummy			() = 0;
	};

	template <typename T> inline bool
	Buf<T>::operator==(const Buf<T>& other) const
	{
		return (m_num==other.m_num) && ((m_num==0) || (memcmp(m_buf, other.m_buf, m_num) == 0));
	}

	template <typename T> void
	Buf<T>::zero()
	{
		if (m_buf) {
			memset(m_buf, 0, m_num*sizeof(T));
			m_dataNum = 0;
			m_seek = 0;
		}
	}

	template <typename T>
	void Buf<T>::seek(size_t num)
	{
		size_t pos = m_seek + num;
		Error::Assert((pos <= m_num), Error::CODE_BAD_PARAM, L"Buf::seek, invalid parameter");
		m_seek = pos;
		m_dataNum = ( (m_dataNum>num) ? (m_dataNum-num) : 0);
	}

	template <typename T> Buf<T>&
	Buf<T>::operator=(Buf<T>&& other)
	{
		if (this != &other)
		{
			m_dataNum = other.m_dataNum;
			m_seek = other.m_seek;
			other.m_dataNum = other.m_seek = 0;
		}
		return *this;
	}

	template <typename T> void
	Buf<T>::append(const T* data, size_t len)
	{
		if (len > 0)
		{
			if (len <= (capacityNum()-m_dataNum))
			{
				// WARNING: Below does a shallow copy only. Will only
				// work on PODs and shallow structs.
				//memcpy(m_buf+m_seek+m_dataNum, data, len*sizeof(T));
				memcpy(static_cast<T*>(*this)+m_dataNum, data, len*sizeof(T));
				m_dataNum += len;
			}
			else {
				throw Error(Error::CODE_BAD_PARAM, L"Not enough space left in buffer for append.");
			}
		}
	}

	template <typename T> void
	Buf<T>::append(T item)
	{
		Error::Assert((m_dataNum<m_num), Error::CODE_BAD_PARAM, L"Buf::append. No more space in buffer");
		static_cast<T*>(*this)[m_dataNum] = item;
		m_dataNum++;
	}

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
			setDataNum(uLen);
		}
		/** NULL BUFFER !! */
		explicit		BufHeap			() {}
		// WARNING: This constructor implements move semantics. The buffer
		// p is owned by the constructed object and must not be deleted
		// externally. Also, p must've been allocated as an array - i.e.
		// using the new T[] operator. This object will delete it using the
		// delete [] operator.
		explicit		BufHeap			(PtrType&& p, size_t len)
		{
			m_buf=p;m_num=len;p=NULL;
			setDataNum(len);
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
		 * Ensures that the buffer has at least an additional delta_num
		 * slots for appending. That is m_num >= (m_seek+m_dataNum+delta_num).
		 * If the buffer is short, then it allocates new memory and copies
		 * over old contents (m_seek+m_dataNum) into it.
		 */
		void			ensureCap			(size_t delta_num);

	private:
		// pointer to beginning of allocated memory. May be different from m_buf.
		void			Malloc			(size_t len);
		void			Delete			();
		virtual void	dummy			() {}

	private: // Disabled interfaces
						BufHeap			(const BufHeap&);// disabled
		BufHeap&		operator=		(const BufHeap&);// disabled
	};
	typedef BufHeap<uint8_t> ByteBuf;

	template <typename T> void
	BufHeap<T>::Delete()
	{
		zero();
		delete[] m_buf;
		m_buf = NULL; 
		m_num = 0;
	}

	template <typename T> void
	BufHeap<T>::ensureCap(size_t delta_num)
	{
		if (delta_num)
		{
			if (delta_num > (m_num - m_seek - m_dataNum))
			{
				T* oldBuf = m_buf;
				size_t oldDataNum = m_dataNum;
				size_t oldSeek = m_seek;
				size_t oldNum = m_num;

				Malloc(oldSeek + oldDataNum + delta_num);
				if ((oldSeek>0) || (oldDataNum>0)) {
					memcpy(m_buf, oldBuf, (oldSeek+oldDataNum)*sizeof(T));
				}
				m_dataNum = oldDataNum;
				m_seek = oldSeek;

				// zero-out and then delete the oldBuf
				memset(oldBuf, 0, oldNum*sizeof(T));
				delete [] oldBuf;
			}
		}
	}

	template <typename T> void
	BufHeap<T>::Malloc(size_t len)
	{
		if (len) {
			std::nothrow_t x;
			m_buf = new(x) T[len];
			if (!m_buf) {
				throw Error(Error::CODE_NO_MEM);
			}
			m_num = len;
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
			m_num = 0;
		}
		else {
			Malloc(i);
			/*for (i=0; i<=m_num; i++)  // No null termination.
			{
				m_buf[i] = c_str[i];  // Invokes assignment operator.
			}*/
			// WARNING: Below does a shallow copy only. Will only
			// work on PODs and shallow structs.
			memcpy(m_buf, c_str, m_num*sizeof(T));
			setDataNum(m_num);
		}
	}

	template <typename T>
	BufHeap<T>::BufHeap(BufHeap&& other) {*this = std::forward<BufHeap<T> >(other);}

	template <typename T> BufHeap<T>&
	BufHeap<T>::operator=(BufHeap<T>&& other)
	{
		if (this != &other)
		{
			Delete();
			m_buf = other.m_buf; other.m_buf = NULL;
			m_num = other.m_num; other.m_num = 0;
			Buf<T>::operator=(std::forward<Buf<T> >(other));

			other.zero(); // paranoia
		}
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
							m_num = LEN;
							setDataNum(uLen);
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