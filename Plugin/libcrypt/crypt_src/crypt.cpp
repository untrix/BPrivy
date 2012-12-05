// test.cpp : Defines the entry point for the console application.
//

#include <stdafx.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <libscrypt.h>
#include <fstream>

const uint32_t i = 1;
#define is_bigendian() ( (*(char*)&i) == 0 )

void printUsage(wchar_t* argv[])
{
	printf("Usage:\t%S \"enc\" <headerFile> <password> |\n\t%S \"dec\" <headerFile>", argv[0], argv[0]);
}

int _tmain(int argc, wchar_t* argv[])
{
	if (argc < 3) {
		printUsage(argv);
		return 1;
	}

	if (std::wstring(L"enc") == argv[1])
	{
		if (argc != 4) {printUsage(argv); return 1;}

		const wchar_t *headerFile = argv[2];
		const wchar_t *passwd = argv[3];
		std::basic_string<uint8_t> dk;
		std::string headerHex;
	
		if (crypt::deriveKey(passwd, 16, 8, 1, dk, headerHex)) {
			printf("Header Hex: %s\n", headerHex);
			std::ofstream f(headerFile, std::ios_base::out | std::ios_base::trunc | std::ios_base::binary);
			f << headerHex;
		}
		else {
			printf("deriveKey failed\n");
		}
	}
}
