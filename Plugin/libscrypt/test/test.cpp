// test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <libscrypt.h>

const uint32_t i = 1;
#define is_bigendian() ( (*(char*)&i) == 0 )

void initSalt(uint8_t* salt, size_t len)
{
	memset(salt, 0, len * sizeof(uint8_t));
}

int _tmain(int argc, _TCHAR* argv[])
{
	printf("Hello World!\n");

	if (argc != 2) {
		printf("Usage: %S <password> \n", argv[0]);
		return 1;
	}

	const wchar_t *passwd = argv[1];
	uint8_t header[96];
	uint8_t dk[64];
	char headerBuf[512];
	
	if (deriveKey(passwd, 16, 8, 1, dk, headerBuf)) {
		printf("Header Buf: %s\n", headerBuf);
	}
	else {
		printf("deriveKey failed\n");
	}
}

