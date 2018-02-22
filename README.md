# K3YRING
Open Source Password Manager with Decentralized Data Synchronization
Released under GNU AGPL license version 3 - http://www.gnu.org/licenses/agpl.txt

For usage and download information see the [website](http://www.untrix.com/w3/html/web.html). Instructions for setting up the dev environment are in Readme files in respective folders.

    The project is not being actively maintained. If you want to resume development, fork it and off you go!
    Feel free to reach me if needed though. Specifically, since the NPAPI API was desupported by Goole Chrome
    back in 2014, I need someone to port this entire code to [electronjs](https://electronjs.org/). Then it
    will be a self contained browser+keyring that will work on Windows, Mac and Linux (but not iOS or Android).

I started this project back in 2012 with an aim to solve the follwing problems:
1. A ubiquitous and secure password-wallet that I could use to access my credentials wherever I went. I coined the three P's 1) **Personal**, 2) **Private** and 3) **Portable**.
1. A password manager that would flawlessly **auto-fill** and **auto-capture** credentials to/from web pages. I had been using password managers for over a decade and all password managers available at that time did a very poor job of this. I wanted to fix that. I was certainly convinced that they were needed - but also knew that people would adopt it only if they worked flawlessly.
1. The third 'P' - portability implied that my credentials should be available to me on every device (i.e. various browsers, mobile phones, gaming consoles, set-top boxes, 'Roku's, smart-TVs etc.). This implied not only developing the auto-fill and auto-capture functions on each device, but synchronizing the passwords across all of these. For something as sensitive as my passwords I didn't expect my users to trust a thirdparty saving the passwords onto their cloud (all password managers that synchronize data across devices do that - because none of them have **decentralized data synchronization** like the one I created). Therefore the synchronization had to be strictly peer-to-peer even if there were 10 peer devices. The synchronization had to be very very light and offline (meaning not requiring a network connection at all). Having worked in the data-synchronization technology as a Chief Architect previously I knew that synchronization could very quickly get very complex and slow. Therefore I was determined to make the new data-synchronization tech. very light - light enough to completely run on JavaScript inside a browser running on a mobile device. And I did achieve that goal.

In order to achieve the above objective I chose to implement a fully working product as a Google Chrome browser extension. All code was writtein in JavaScript and self-contained within the chrome-extension. However, since Chrome API won't let me read or list files on a desktop, I had to create a NPAPI plugin that would open a Windows Explorer dialog box to let you choose the password files to load etc. This unfortunately caused a dependency on the platform (i.e. Windows, Mac etc.). I built that on top of the [firebreath](http://www.firebreath.org/) toolkit. It worked very well. Unfortunately Google discontinued supporting the NPAPI API in 2014 and therefore the product doesn't work anymore.
