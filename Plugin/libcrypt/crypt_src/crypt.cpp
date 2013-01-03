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
#include <CryptError.h>

const uint32_t i = 1;
#define is_bigendian() ( (*(char*)&i) == 0 )

void printUsage(char* argv[])
{
	printf("Usage:\t%s \"enc|enc2\" <password> <headerFile> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %s \"dec\" <password> <headerFile> <ClearTextFile> <CipherTextFile>\n"
		   "\t| %s \"make\" <password> <headerFile>", argv[0], argv[0], argv[0]);
}

size_t
fSize( FILE* fPtr)
{
	fseek(fPtr, 0L, SEEK_END);
	size_t siz = ftell(fPtr);
	fseek(fPtr, 0L, SEEK_SET);
	return siz;
}

int main(int argc, char* argv[])
{
	if (argc < 2) {
		printUsage(argv);
		return 1;
	}

	try {
	if ((std::string("enc") == argv[1]) || (std::string("enc2") == argv[1]))
	{
		if (argc != 6) {printUsage(argv); return 1;}

		crypt::BufHeap<char> passwd(argv[2]);
		std::string headerFile(argv[3]);
		std::string fileIn(argv[4]);
		std::string fileOut(argv[5]);
		
		FILE* hFile = fopen(headerFile.c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s\n", headerFile.c_str()); 
			perror(NULL);
			return 1;
		}

		crypt::BufHeap<uint8_t> hBuf(fSize(hFile));
		size_t count = fread(hBuf, sizeof(char), hBuf.capacityBytes(), hFile);
		if (!count) {
			fprintf(stderr, "fread on file %S returned zero", headerFile.c_str());
			return 1;
		}
		hBuf.setDataNum(count);
		std::wstring ctxHandle(L"handle");
		crypt::CryptCtx::Load(ctxHandle, passwd, hBuf);

		FILE* inFile = fopen(fileIn.c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s\n", fileIn.c_str()); 
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
		inBuf.setDataNum(count);

		crypt::ByteBuf outBuf; // Null buffer
		crypt::CryptCtx::Get(ctxHandle).Encrypt(inBuf, outBuf);

		FILE* outFile = fopen(fileOut.c_str(), (std::string("enc") == argv[1]) ? "wb" : "ab");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", fileIn.c_str()); 
			perror(NULL);
			return 1;
		}
		count = fwrite(outBuf, sizeof(uint8_t), outBuf.dataNum(), outFile);
		return 0;
	}
	else if (std::string("make") == argv[1])
	{
		if (argc != 4) {printUsage(argv); return 1;}

		crypt::BufHeap<char> passwd(argv[2]);
		std::string headerFile = argv[3];
		std::wstring ctxHandle(L"handle");
		crypt::CryptCtx::Create(ctxHandle, passwd);
		crypt::BufHeap<uint8_t> outBuf;
		
		const crypt::CryptCtx& ctx = crypt::CryptCtx::Get(ctxHandle);
		ctx.serializeInfo(outBuf);

		FILE* outFile = fopen(headerFile.c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", headerFile.c_str()); 
			perror(NULL);
			return 1;
		}
		size_t count = fwrite(outBuf, sizeof(uint8_t), outBuf.dataNum(), outFile);
		if (count == outBuf.dataNum()) {
			return 0;
		}
		else {
			return 1;
		}
	}
	else if (std::string("dec") == argv[1])
	{
		if (argc != 6) {printUsage(argv); return 1;}

		crypt::BufHeap<char> passwd(argv[2]);
		std::string headerFile(argv[3]);
		std::string fileOut(argv[4]);
		std::string fileIn(argv[5]);
		
		FILE* hFile = fopen(headerFile.c_str(), "rb");
		if (!hFile) {
			fprintf(stderr, "Could not open input file: %s\n", headerFile.c_str()); 
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
		inBuf.setDataNum(count);
		std::wstring ctxHandle(L"handle");
		crypt::CryptCtx::Load(ctxHandle, passwd, inBuf);

		FILE* inFile = fopen((fileIn).c_str(), "rb");
		if (!inFile) {
			fprintf(stderr, "Could not open input file: %s\n", (fileIn).c_str()); 
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
		ciBuf.setDataNum(count);

		crypt::ByteBuf outBuf;
		crypt::CryptCtx::Get(ctxHandle).Decrypt(std::move(ciBuf), outBuf);

		FILE* outFile = fopen((fileOut).c_str(), "wb");
		if (!outFile) {
			fprintf(stderr, "Could not open output file: %s\n", fileOut.c_str());
			perror(NULL);
			return 1;
		}
		count = fwrite(outBuf, sizeof(uint8_t), outBuf.dataNum(), outFile);
		return 0;
	}
	else {printUsage(argv); return 2;}
	}
	catch (crypt::Error& e)
	{
		std::wcerr << e.PrintMsg();
	}
}
