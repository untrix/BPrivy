#include "Format.h"

namespace crypt
{
	/*****************************************************************/
	/************************* Format ****************************/
	/*****************************************************************/

	/* ALL VALUES DEFINED UNDER Format MUST NEVER EVER BE CHANGED *
	 *************************** EVER !!! ****************************/
	// NOTE: For values that are burnt to disk, don't use a value '0' since
	// we're reserving zeroes to denote blanks. Hence, the first file-format
	// is numbered 1 instead of zero. Similarly the first cipher (BF) is
	// numbered 1 likewise.
	//const unsigned int FormatConstants::VAL_FMT_VER_CRYPTINFO1 = 1;
	const unsigned int	FormatConstants::FMT_NUM_FLDS_CRYPTINFO1 = 7;
	const uint8_t FormatCryptInfo::VAL_CIPHER_BF_CBC = 1;
	const uint8_t FormatCryptInfo::VAL_CIPHER_AES_CBC = 2;
	const size_t FormatCryptInfo::FMT_SALT_SIZE = 32;
	const size_t FormatCryptInfo::FMT_SIG_SIZE = 32;

	template<unsigned int FORMAT_VER, size_t NUM_FIELDS>
	size_t
	FormatBase::BufSize()
	{
		if (BUF_SIZE == 0)
		{
			size_t i, n;
			for (i=0, n = m_fields.size(), BUF_SIZE=0; i<n; i++)
			{
				m_offsets.push_back(BUF_SIZE);
				BUF_SIZE += m_fields[i].size;
			}
		}
		return BUF_SIZE;
	}
	//Format Format::s_fileFormats[] = {Format<0>(),Format<1>()};

	/*Format::Format(unsigned int id)
	{
		size_t count = 0;
		switch (id)
		{
		case 1:
			CRYPTINFO_LOGN_SIZE = 1;
			CRYPTINFO_R_SIZE = 4;
			CRYPTINFO_P_SIZE = 4;
			CRYPTINFO_CIPHER_SIZE = 1;
			CRYPTINFO_KEYLEN_SIZE = 1;
			CRYPTINFO_SALT_SIZE = 32;
			CRYPTINFO_SIG_SIZE = 32;

			CRYPTINFO_BUF_SIZE = CRYPTINFO_LOGN_SIZE +
									CRYPTINFO_R_SIZE +
									CRYPTINFO_P_SIZE +
									CRYPTINFO_CIPHER_SIZE +
									CRYPTINFO_KEYLEN_SIZE +
									CRYPTINFO_SALT_SIZE +
									CRYPTINFO_SIG_SIZE;
			break;
		case 0:
		default:
			break;
		}
	}*/
}
