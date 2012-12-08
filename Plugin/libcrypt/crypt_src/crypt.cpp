// test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <fstream>
#include <libscrypt.h>
#include <CryptCtx.h>
#include <Error.h>

const uint32_t i = 1;
#define is_bigendian() ( (*(char*)&i) == 0 )

void printUsage(wchar_t* argv[])
{
	printf("Usage:\t%S \"enc\" <headerFile> <password> <fileName> |\n\t%S \"dec\" <headerFile> password> <fileName>", argv[0], argv[0]);
}

int _tmain(int argc, wchar_t* argv[])
{
	if (argc != 5) {
		printUsage(argv);
		return 1;
	}

	if (std::wstring(L"enc") == argv[1])
	{
		if (argc != 5) {printUsage(argv); return 1;}

		const wchar_t *headerFile = argv[2];
		crypt::BufHeap<wchar_t> passwd(argv[3]);
		crypt::Array<uint8_t, 64> dk;
		crypt::Array<uint8_t, 32> salt;
		std::wstring fileIn(argv[4]);  fileIn += L".txt";
		std::wstring fileOut(argv[4]); fileOut += L".bin";
		
		FILE* inFile = fopen(crypt::UnicodeToLocale(fileIn).c_str(), "r");
		FILE* outFile;// = outStream(fileOut += L".bin");

		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd);

		crypt::Array<char, 256> inBuf;
		size_t count = fread(inBuf, inBuf.size(), inBuf.size(), inFile);
		if (!count) {
			fprintf(stderr, "fread returned zero");
			return 1;
		}

		crypt::CryptCtx::Get(ctxHandle).Encrypt(stringIn, stringOut);
	}
}
