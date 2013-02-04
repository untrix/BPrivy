#/**********************************************************\ 
#
# Auto-Generated Plugin Configuration file
# for BPrivy - then edited manually.
#
# This file is to be edited manually.
#
#\**********************************************************/

set(PLUGIN_NAME "UntrixPlugin")
set(PLUGIN_PREFIX "BPL")
set(COMPANY_NAME "UntrixSoft")

# ActiveX constants:
set(FBTYPELIB_NAME UntrixPluginLib)
set(FBTYPELIB_DESC "UntrixPlugin 1.0 Type Library")
set(IFBControl_DESC "UntrixPlugin Control Interface")
set(FBControl_DESC "UntrixPlugin Control Class")
set(IFBComJavascriptObject_DESC "UntrixPlugin IComJavascriptObject Interface")
set(FBComJavascriptObject_DESC "UntrixPlugin ComJavascriptObject Class")
set(IFBComEventSource_DESC "UntrixPlugin IFBComEventSource Interface")
set(AXVERSION_NUM "1")

# NOTE: THESE GUIDS *MUST* BE UNIQUE TO YOUR PLUGIN/ACTIVEX CONTROL!  YES, ALL OF THEM!
set(FBTYPELIB_GUID 14c7ef19-2cae-5166-abd4-8fc6e5c91a91)
set(IFBControl_GUID e0b0d070-ece3-5203-871e-545af53c9875)
set(FBControl_GUID 0b95d359-b708-576c-b705-de2eac81ca1a)
set(IFBComJavascriptObject_GUID 3c2dee3d-d04e-5367-94d9-5946747e1d8f)
set(FBComJavascriptObject_GUID 85b7a40f-4a56-5daf-b63f-4b9c1cf85d4b)
set(IFBComEventSource_GUID 0f8ba12f-b626-5759-870d-70b77f2a2c45)

# these are the pieces that are relevant to using it from Javascript
set(ACTIVEX_PROGID "untrix.com/UntrixPlugin")
set(MOZILLA_PLUGINID "untrix.com/UntrixPlugin")

# strings
set(FBSTRING_CompanyName "Untrix Soft LLC")
set(FBSTRING_PluginDescription "Untrix Portable Passwords")
set(FBSTRING_PLUGIN_VERSION "1.1.0.0")
set(FBSTRING_LegalCopyright "Copyright 2013 Untrix Soft LLC")
set(FBSTRING_PluginFileName "np${PLUGIN_NAME}.dll")
set(FBSTRING_ProductName "Untrix Portable Passwords")
set(FBSTRING_FileExtents "3ab|3ac|3ad|3ak|3am|3ao|3at")
set(FBSTRING_PluginName "Untrix Portable Passwords")
set(FBSTRING_MIMEType "application/x-untrix")

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

# Manually added by Sumeet
add_boost_library(filesystem)
#add_firebreath_library(log4cplus)