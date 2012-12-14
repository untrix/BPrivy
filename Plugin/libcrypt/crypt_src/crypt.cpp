// test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <iostream>
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
	printf("Usage:\t%S \"enc\" <headerFile> <password> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %S \"dec\" <headerFile> <password> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %S \"make\" <headerFile> <password>", argv[0], argv[0], argv[0]);
}

int _tmain(int argc, wchar_t* argv[])
{
	if (argc < 2) {
		printUsage(argv);
		return 1;
	}

	try {
	if (std::wstring(L"enc") == argv[1])
	{
		if (argc != 6) {printUsage(argv); return 1;}

		std::wstring headerFile(argv[2]);
		crypt::BufHeap<wchar_t> passwd(argv[3]);
		std::wstring fileIn(argv[4]);
		std::wstring fileOut(argv[5]);
		
		FILE* hFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s", crypt::UnicodeToLocale(headerFile).c_str()); 
			return 1;
		}
		crypt::Array<uint8_t, 256> inBuf;
		size_t count = fread(inBuf, sizeof(char), inBuf.size(), hFile);
		if (!count) {
			fprintf(stderr, "fread on file %S returned zero", headerFile.c_str());
			return 1;
		}
		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd, inBuf);

		FILE* inFile = fopen(crypt::UnicodeToLocale(fileIn).c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s", crypt::UnicodeToLocale(fileIn).c_str()); 
			return 1;
		}

		count = fread(inBuf, sizeof(char), inBuf.size(), inFile);
		if (!count) {
			fprintf(stderr, "fread returned zero");
			return 1;
		}
		//else {
		//	inBuf[count] = 0; // null terminate the string.
		//}

		crypt::CipherBlob outBuf;
		crypt::CryptCtx::Get(ctxHandle).Encrypt(std::string((char*)(uint8_t*)inBuf,count), outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(fileOut).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open input file: %s", crypt::UnicodeToLocale(fileIn).c_str()); 
			return 1;
		}
		count = fwrite(outBuf.getBuf(), sizeof(uint8_t), outBuf.getBuf().usefulLength(), outFile);
		return 0;
	}
	else if (std::wstring(L"make") == argv[1])
	{
		if (argc != 4) {printUsage(argv); return 1;}

		std::wstring headerFile = argv[2];
		crypt::BufHeap<wchar_t> passwd(argv[3]);

		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd);
		crypt::BufHeap<uint8_t> outBuf(1);
		
		const crypt::CryptCtx& ctx = crypt::CryptCtx::Get(ctxHandle);
		ctx.serializeInfo(outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s", crypt::UnicodeToLocale(headerFile).c_str()); 
			return 1;
		}
		size_t count = fwrite(outBuf, sizeof(uint8_t), outBuf.size(), outFile);
		if (count == outBuf.size()) {
			return 0;
		}
		else {
			return 1;
		}
	}
	else if (std::wstring(L"dec") == argv[1])
	{
		if (argc != 6) {printUsage(argv); return 1;}

		std::wstring headerFile(argv[2]);
		crypt::BufHeap<wchar_t> passwd(argv[3]);
		std::wstring fileIn(argv[5]);
		std::wstring fileOut(argv[4]);
		
		FILE* hFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s", crypt::UnicodeToLocale(headerFile).c_str()); 
			return 1;
		}
		crypt::Array<uint8_t, 256> inBuf;
		size_t count = fread(inBuf, sizeof(char), inBuf.size(), hFile);
		if (!count) {
			fprintf(stderr, "fread on file %S returned zero", headerFile.c_str());
			return 1;
		}
		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd, inBuf);

		FILE* inFile = fopen(crypt::UnicodeToLocale(fileIn).c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s", crypt::UnicodeToLocale(fileIn).c_str()); 
			return 1;
		}

		crypt::BufHeap<uint8_t> ciBuf(256);
		count = fread(ciBuf, sizeof(uint8_t), ciBuf.size(), inFile);
		if (!count) {
			fprintf(stderr, "fread returned zero");
			return 1;
		}

		std::string outBuf;
		crypt::CryptCtx::Get(ctxHandle).Decrypt(std::move(ciBuf), outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(fileOut).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s", crypt::UnicodeToLocale(fileIn).c_str()); 
			return 1;
		}
		count = fwrite(outBuf.c_str(), sizeof(uint8_t), outBuf.size(), outFile);
		return 0;
	}
	else {printUsage(argv); return 2;}
	}
	catch (crypt::Error& e)
	{
		std::wcerr << e.PrintMsg();
	}
}
