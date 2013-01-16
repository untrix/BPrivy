#ifndef _H_LIBCRYPT_
#define _H_LIBCRYPT_

namespace crypt
{
	/** Call this to initialize the library once. Initializes openssl. */
	void	initLibcrypt	();
	void	unloadLibcrypt	();
}

#endif // !_H_LIBCRYPT_