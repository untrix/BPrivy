#/**********************************************************\ 
#
# Auto-Generated Plugin Configuration file
# for BPrivy - then edited manually.
#
# This file is to be edited manually.
#
#\**********************************************************/

set(PLUGIN_NAME "K3YRING")
set(PLUGIN_PREFIX "K3Y")
set(COMPANY_NAME "Untrix")

# ActiveX constants:
set(FBTYPELIB_NAME K3YRINGLib)
set(FBTYPELIB_DESC "K3YRING 1.0 Type Library")
set(IFBControl_DESC "K3YRING Control Interface")
set(FBControl_DESC "K3YRING Control Class")
set(IFBComJavascriptObject_DESC "K3YRING IComJavascriptObject Interface")
set(FBComJavascriptObject_DESC "K3YRING ComJavascriptObject Class")
set(IFBComEventSource_DESC "K3YRING IFBComEventSource Interface")
set(AXVERSION_NUM "1")

# NOTE: THESE GUIDS *MUST* BE UNIQUE TO YOUR PLUGIN/ACTIVEX CONTROL!  YES, ALL OF THEM!
set(FBTYPELIB_GUID 14c7ef19-2cae-5166-abd4-8fc6e5c91a91)
set(IFBControl_GUID e0b0d070-ece3-5203-871e-545af53c9875)
set(FBControl_GUID 0b95d359-b708-576c-b705-de2eac81ca1a)
set(IFBComJavascriptObject_GUID 3c2dee3d-d04e-5367-94d9-5946747e1d8f)
set(FBComJavascriptObject_GUID 85b7a40f-4a56-5daf-b63f-4b9c1cf85d4b)
set(IFBComEventSource_GUID 0f8ba12f-b626-5759-870d-70b77f2a2c45)
# FBControl_WixUpgradeCode_GUID was manually added later and BPrivyInstaller.wxs
# modified accordingly by hand. The old GUID value was re-used for 32 bit archs.
# i.e. 7de7ad6c-3b99-513c-81ae-4cfc439e969f is the original value before the
# if/else condition was added. More changes maybe needed in other files, in order
# to make this logic truly correct, but it should work for 32 bit arch since we've
# reused the old GUID value.
if ( FB_PLATFORM_ARCH_32 )
    set(FBControl_WixUpgradeCode_GUID 7de7ad6c-3b99-513c-81ae-4cfc439e969f)
else ( FB_PLATFORM_ARCH_32 )
    set(FBControl_WixUpgradeCode_GUID 54d05202-1981-5cd2-9ce1-07076b16ef63)
endif ( FB_PLATFORM_ARCH_32 )
set(MSVCR_DLL_GUID 04A64AC7-FFC9-433F-A05B-CCEB7AF130B3)
set(MSVCP_DLL_GUID 315308D7-E269-4857-804D-9BA275BB54A2)

# these are the pieces that are relevant to using it from Javascript
set(ACTIVEX_PROGID "Untrix.K3YRING")
set(MOZILLA_PLUGINID "untrix.com/K3YRING")

# strings
set(FBSTRING_CompanyName "Untrix Inc")
set(FBSTRING_PluginDescription "K3YRING Plugin [beta]")
set(FBSTRING_PLUGIN_VERSION "1.1.0.4")
set(FBSTRING_LegalCopyright "Copyright 2013 Untrix Inc")
set(FBSTRING_PluginFileName "np${PLUGIN_NAME}.dll")
set(FBSTRING_ProductName "K3YRING Plugin [beta]")
set(FBSTRING_FileExtents "3ab|3ac|3ad|3ak|3am|3ao|3at")
if ( FB_PLATFORM_ARCH_32 )
    set(FBSTRING_PluginName "K3YRING Plugin [beta]")  # No 32bit postfix to maintain backward compatability.
else ( FB_PLATFORM_ARCH_32 )
    set(FBSTRING_PluginName "K3YRING Plugin [beta]_${FB_PLATFORM_ARCH_NAME}")
endif ( FB_PLATFORM_ARCH_32 )
set(FBSTRING_MIMEType "application/x-k3yring")

# Uncomment this next line if you're not planning on your plugin doing
# any drawing:

set (FB_GUI_DISABLED 1)

# Mac plugin settings. If your plugin does not draw, set these all to 0
set(FBMAC_USE_QUICKDRAW 0)
set(FBMAC_USE_CARBON 0)
set(FBMAC_USE_COCOA 0)
set(FBMAC_USE_COREGRAPHICS 0)
set(FBMAC_USE_COREANIMATION 0)
set(FBMAC_USE_INVALIDATINGCOREANIMATION 0)

# If you want to register per-machine on Windows, uncomment this line
#set (FB_ATLREG_MACHINEWIDE 1)

# Manually added by Sumeet. We only require filesystem from boost, but all the
# others are needed in order to compile successfully.
add_boost_library(filesystem)
#add_boost_library(system)
#add_boost_library(date_time)
#add_boost_library(regex)
add_firebreath_library(log4cplus)