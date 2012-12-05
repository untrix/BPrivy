#ifndef _H_CRYPT_CTX_WIN_
#define _H_CRYPT_CTX_WIN_

#include <CryptCtx.h>

namespace crypt
{
	class CryptCtxWin : public crypt::CryptCtx
	{
	public:
							CryptCtxWin			(HCRYPTPROV cspHandle):m_CSPHandle(cspHandle) {}
		virtual				~CryptCtxWin		();
	private:
		HCRYPTPROV			m_CSPHandle;
	};
}

#endif // !_H_CRYPT_CTX_WIN_