#/**********************************************************\ 
# 
# Auto-generated CMakeLists.txt for the BPrivy project
#
#\**********************************************************/

# Written to work with cmake 2.6
cmake_minimum_required (VERSION 2.6)
set (CMAKE_BACKWARDS_COMPATIBILITY 2.6)

Project(${PLUGIN_NAME})

file (GLOB GENERAL RELATIVE ${CMAKE_CURRENT_SOURCE_DIR}
    [^.]*.cpp
    [^.]*.h
    [^.]*.cmake
    )

include_directories( ${PLUGIN_INCLUDE_DIRS} )
#link directories added by Sumeet to satisfy boost dependencies
link_directories( ${BOOST_LIB_DIR} )

# Generated files are stored in ${GENERATED} by the project configuration
SET_SOURCE_FILES_PROPERTIES(
    ${GENERATED}
    PROPERTIES
        GENERATED 1
    )

SOURCE_GROUP(Generated FILES
    ${GENERATED}
    )

SET( SOURCES
    ${GENERAL}
    ${GENERATED}
    )

# Following was added by Sumeet
set (CERT_DIR ${FireBreath_SOURCE_DIR}/../../../cert)

# This will include Win/projectDef.cmake, X11/projectDef.cmake, Mac/projectDef 
# depending on the platform
include_platform()

# Following was added by Sumeet
set (LIBCRYPT_PATH ${FireBreath_SOURCE_DIR}/../libcrypt)
if (WIN32)
	set (OPENSSL_INC_PATH "C:/openssl/include")
	set (OPENSSL_LIB "C:/openssl/lib/libeay32.lib")
else()
	set (OPENSSL_INC_PATH "/openssl/include")
	set (OPENSSL_LIB "/openssl/lib/libeay32.lib")
endif(WIN32)

# The following was added by Sumeet
include_directories(
	${LIBCRYPT_PATH}/libcrypt_src
	${LIBCRYPT_PATH}/libscrypt_src
	${OPENSSL_INC_PATH}
)


# The following was added by Sumeet
target_link_libraries(${PROJECT_NAME}
	"${OPENSSL_LIB}"
	debug "${LIBCRYPT_PATH}/debug/libcrypt.lib"
	debug "${LIBCRYPT_PATH}/debug/libscrypt.lib"
	optimized "${LIBCRYPT_PATH}/release/libcrypt.lib"
	optimized "${LIBCRYPT_PATH}/release/libscrypt.lib"
)
