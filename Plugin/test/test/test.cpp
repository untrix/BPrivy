// test.cpp : Defines the entry point for the console application.
//

#include "stdafx.h"
#include <iostream>
#include <boost/filesystem.hpp>

namespace bfs = boost::filesystem;
using std::endl;
using std::cout;

void printUsage(char* argv[])
{
	printf("Usage:\t%s <path-to-normalize>\n",
		   argv[0], argv[0], argv[0], argv[0]);
}

// Test with F:\\\\\New.3ab/New.3ak\\\dsfdsfs///
int main(int argc, char* argv[])
{
	if (argc < 2) {
		printUsage(argv);
		return 1; 
	}

	bfs::path path(argv[1]); path.make_preferred();

	std::cout << "Decomposing path: " << argv[1] << std::endl;
	bfs::path normalized;

	for (bfs::path::iterator it = path.begin(); it != path.end(); it++)
	{
		std::cout << *it << std::endl;
		if (*it != ".") {
			normalized /= *it;
		}
	}

	cout << "Normalized path is: " << normalized << endl;
	cout << "Normalized path 2 is: " << normalized.make_preferred() << endl;
	return 0;
}

