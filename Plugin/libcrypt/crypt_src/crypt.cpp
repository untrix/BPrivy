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
	printf("Usage:\t%S \"enc|enc2\" <password> <headerFile> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %S \"dec\" <password> <headerFile> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %S \"make\" <password> <headerFile>", argv[0], argv[0], argv[0]);
}

size_t
fSize( FILE* fPtr)
{
	fseek(fPtr, 0L, SEEK_END);
	size_t siz = ftell(fPtr);
	fseek(fPtr, 0L, SEEK_SET);
	return siz;
}

int _tmain(int argc, wchar_t* argv[])
{
	if (argc < 2) {
		printUsage(argv);
		return 1;
	}

	try {
	if ((std::wstring(L"enc") == argv[1]) ||  (std::wstring(L"enc2") == argv[1]))
	{
		if (argc != 6) {printUsage(argv); return 1;}

		crypt::BufHeap<wchar_t> passwd(argv[2]);
		std::wstring headerFile(argv[3]);
		std::wstring fileIn(argv[4]);
		std::wstring fileOut(argv[5]);
		
		FILE* hFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s\n", crypt::UnicodeToLocale(headerFile).c_str()); 
			perror(NULL);
			return 1;
		}

		crypt::BufHeap<uint8_t> hBuf(fSize(hFile));
		size_t count = fread(hBuf, sizeof(char), hBuf.capacityBytes(), hFile);
		if (!count) {
			fprintf(stderr, "fread on file %S returned zero", headerFile.c_str());
			return 1;
		}
		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd, hBuf);

		FILE* inFile = fopen(crypt::UnicodeToLocale(fileIn).c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s\n", crypt::UnicodeToLocale(fileIn).c_str()); 
			perror(NULL);
			return 1;
		}

		crypt::BufHeap<uint8_t> inBuf(fSize(inFile));
		count = fread(inBuf, sizeof(char), inBuf.capacityBytes(), inFile);
		if (!count) {
			fprintf(stderr, "fread returned zero\n");
			perror(NULL);
			return 1;
		}
		inBuf.setDataLen(count);

		crypt::ByteBuf outBuf; // Null buffer
		crypt::CryptCtx::Get(ctxHandle).Encrypt(inBuf, outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(fileOut).c_str(), (std::wstring(L"enc") == argv[1]) ? "wb" : "ab");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", crypt::UnicodeToLocale(fileIn).c_str()); 
			perror(NULL);
			return 1;
		}
		count = fwrite(outBuf, sizeof(uint8_t), outBuf.dataLen(), outFile);
		return 0;
	}
	else if (std::wstring(L"make") == argv[1])
	{
		if (argc != 4) {printUsage(argv); return 1;}

		crypt::BufHeap<wchar_t> passwd(argv[2]);
		std::wstring headerFile = argv[3];

		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd);
		crypt::BufHeap<uint8_t> outBuf(1);
		
		const crypt::CryptCtx& ctx = crypt::CryptCtx::Get(ctxHandle);
		ctx.serializeInfo(outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", crypt::UnicodeToLocale(headerFile).c_str()); 
			perror(NULL);
			return 1;
		}
		size_t count = fwrite(outBuf, sizeof(uint8_t), outBuf.capacityBytes(), outFile);
		if (count == outBuf.capacityBytes()) {
			return 0;
		}
		else {
			return 1;
		}
	}
	else if (std::wstring(L"dec") == argv[1])
	{
		if (argc != 6) {printUsage(argv); return 1;}

		crypt::BufHeap<wchar_t> passwd(argv[2]);
		std::wstring headerFile(argv[3]);
		std::wstring fileOut(argv[4]);
		std::wstring fileIn(argv[5]);
		
		FILE* hFile = fopen(crypt::UnicodeToLocale(headerFile).c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s\n", crypt::UnicodeToLocale(headerFile).c_str()); 
			perror(NULL);
			return 1;
		}
		crypt::BufHeap<uint8_t> inBuf(fSize(hFile));
		size_t count = fread(inBuf, sizeof(char), inBuf.capacityBytes(), hFile);
		if (!count) {
			fprintf(stderr, "fread on file %S returned zero\n", headerFile.c_str());
			perror(NULL);
			return 1;
		}
		unsigned int ctxHandle = crypt::CryptCtx::Make(passwd, inBuf);

		FILE* inFile = fopen(crypt::UnicodeToLocale(fileIn).c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s\n", crypt::UnicodeToLocale(fileIn).c_str()); 
			perror(NULL);
			return 1;
		}

		crypt::BufHeap<uint8_t> ciBuf(fSize(inFile));
		count = fread(ciBuf, sizeof(uint8_t), ciBuf.capacityBytes(), inFile);
		if (!count) {
			fprintf(stderr, "fread returned zero\n");
			perror(NULL);
			return 1;
		}
		ciBuf.setDataLen(count);

		crypt::ByteBuf outBuf;
		crypt::CryptCtx::Get(ctxHandle).Decrypt(std::move(ciBuf), outBuf);

		FILE* outFile = fopen(crypt::UnicodeToLocale(fileOut).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", crypt::UnicodeToLocale(fileOut).c_str());
			perror(NULL);
			return 1;
		}
		count = fwrite(outBuf, sizeof(uint8_t), outBuf.dataLen(), outFile);
		return 0;
	}
	else {printUsage(argv); return 2;}
	}
	catch (crypt::Error& e)
	{
		std::wcerr << e.PrintMsg();
	}
}
