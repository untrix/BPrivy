#include <stdafx.h>
#include <CryptCtxWin.h>

namespace crypt
{
	unsigned int	
	CryptCtx::Make()
	{
		// 1. Check if RSA_ASE provider is available.
		// 2. Find the largest key size available for ASE.
		// 3. Create a key using scrypt.
		// 4. Create a new CryptCtx object and populate it with
		//    details of the alrogithm and key generated above.
		// 5. Obtain a new handle of the context, insert it into
		//	  s_ctxMap and return the handle.
		// *. Throw and exception if anything went wrong.

		HCRYPTPROV cspHandle;
		unsigned int handle = 0;

		if (CryptAcquireContext(&cspHandle, NULL, MS_ENH_RSA_AES_PROV, PROV_RSA_AES, CRYPT_VERIFYCONTEXT))
		{
			HCRYPTKEY k;
			CryptCtxWin* pCtx = new CryptCtxWin(cspHandle);
			if (!pCtx) {throw Error(Error::CODE_NO_MEM);}
			handle = CryptCtx::MakeHandle();
			s_ctxMap.insert(CryptCtx::map::value_type(handle, pCtx));
		}
		else {
			//DWORD errc = GetLastError();
			throw Error(Error::CODE_NO_CSP);
		}
		
		return handle;
	}

	CryptCtxWin::~CryptCtxWin()
	{
		CryptReleaseContext(m_CSPHandle, 0);
	}

} // end namespace crypt