#include "Utils.h"

namespace crypt
{
	char nibbleToHex[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
	uint8_t hexToNibbles[71] ={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 16
							   0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 32
							   0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 48
							   0,1,2,3,4,5,6,7,8,9,0,0,0,0,0,0, // 64
							   0,10,11,12,13,14,15};

	static bool
	hexToNibble(char hex, uint8_t* nibble)
	{
		if (hex>47) {
			if (hex<58) {
				*nibble = (hex - 48);
				return true; // success
			}
			else if ((hex > 64) && (hex < 71)) {
				*nibble = (hex - 65);
				return true; // success
			}
		}

		return false; // failed
	}

	bool
	byteToHexStr(const uint8_t* binBuf, size_t binBufLen, std::string& hexStr)
	{
		size_t i;

		if (!binBuf) {
			return false; // hex buffer is too small
		}

		hexStr.clear();
		for (i=0; i<binBufLen; i++)
		{
			hexStr.push_back(nibbleToHex[(binBuf[i] & 0xF0) >> 4]);
			hexStr.push_back(nibbleToHex[(binBuf[i] & 0x0F)]);
			//sprintf(&hexStr[2*i], "%02x", binBuf[i]);
		}

		return true;
	}

	bool
	hexToByteBuf(const std::string& hexStr, uint8_t* binBuf, size_t binBufLen)
	{
		size_t i, j;
		uint8_t left, right;
		size_t hexStrLen = hexStr.length();

		if (((hexStrLen) > (binBufLen*2)) || (!binBuf)) {
			return false; // bin buffer is too small
		}

		if (hexStrLen % 2) {
			return false; // hex buffer is not a multiple of two
		}

		for (j=0,i=0; i<hexStrLen; j++)
		{
			left = hexStr[i++];
			right = hexStr[i++];
			if ((left==0) && (right==0)) {
				binBuf[j] = ( (left<<4) | right );
			}
			else {
				return false;
			}
		}

		return true;
	}
}