# webOS Community Edition 3.1

This release represents 15 years of cummulative effort to preserve, restore, improve and maintain Palm and HP's mobile webOS. 

Although other versions exist, the most-commonly found modern release was 3.0.5 for the HP Touchpad, with a build date of 2011-12-21.
It was released shortly before HP sold the platform to LG, who use a descendant OS in their Smart TVs. At that time
HP also open-sourced the majority of the OS, making it possible for the community to continue using it -- although without
any of the web services, App Catalog, or other capabilities provided by a manufacturer.

Since that time, the community has built replacement services, modernized the cryptography, preserved and repaired exsting apps,
and built all new apps. This release has two goals:

- Replace the dead components of the OS with repaired or re-invented equivalents
- Provide a new, more modern platform for new and ongoing development

## Supported Devices

At the time of this writing, *only* **Topaz WiFi** is supported. These are the most common Touchpad devices, without a cellular radio, at 9.7" screen size.

Do not attempt to install on the 4G-equipped Touchpad, or the smaller Touchpad Go prototypes.

---

## Features

webOS CE 3.1.0 includes features not available in the final commercial release...

### Launcher Improvements

#### Icon Groups

- Icons can now be grouped. Press and hold an icon, then drag it over-top another icon to group it
- Remove icons from a group by opening the group and pressing and holding the icon
- Rename the group by opening it and tapping on the name

#### Tab Management

- Launcher tabs can now be renamed: press and hold a tab to enter a new name
- The Downloads tab has been renamed to Games by default
- New Launcher tabs can now be added: press and hold the empty space next to existing tabs to add a new one
- User-added Launcher tabs can be removed: press and hold the tab, then tap the Trash icon to remove the tab

#### LunaCE Improvements

All improvements introduced in 2013's LunaCE release are also in webOS CE, including:

- Task management improvements
- Virtual trackball
- Dynamic Dashboard height
- Optional wave launcher
- Tweaks preferences

More details can be found on the [LunaCE Wiki](https://webos-ports.org/wiki/About_LunaCE#Feature_Description)

#### Power Control

- Advanced Reset options is now built-in, adding Luna Restart and Reboot options to the Power menu (Shut Down is still present)

### Exhibition, Screen and Sounds

- **Clock**'s Exhibition mode includes a new and simplified default clock face
- **Photo**'s Exhibition mode now persists preferences and provides an optional time and date overlay
- New wallpapers and the Treo ringtone have been added

### Platform Improvements

#### UberKernel

- The stock kernel has been replaced with the community-created **UberKernel**, with the default profile enabled
- Govnah is now pre-installed to allow over-clocking (which has proven safe over the past 15 years)

#### TLS 1.3 and Web

- TLS 1.3 Updates to the browser, mail, and app dev libraries are integrated into the OS.
- Previous TLS Updates in **Preware** will not show as available or compatible, and are not needed
- Future TLS Updates in **Preware** will be separately tested and marked for compatibility with 3.1.0
- Google search has been replaced with DuckDuckGo Lite, which still renders in the Stock browser
- Root certs have been updated
- NTP sync has been fixed
- Modern VPN plug-ins can be found in the **App Catalog**, restoring the built-in VPN app
- **Preware** includes alternate browsers with more modern rendering engines

#### Bluetooth Device Support

- Wireless Game Controllers can now be paired as "Other" Bluetooth devices
- Previous Bluetooth updates in **Preware** will not show as available or compatible, and are not needed
- Future Bluetooth in **Preware** will be separately tested and marked for compatibility with 3.1.0 

#### USB Device Support

- USB "On the Go" support is enabled, and a new USB Settings app is pre-installed
- A powered USB OTG Y-cable or Hub can be used to connect keyboards, game controllers, and USB storage devices
- The USB Settings app allows mounting, and safely unmounting USB storage
- While the OS does not include a mouse pointer, USB mice are supported if a game or app provides a software mouse-pointer
- Previous USB updates in **Preware** will not show as available or compatible, and are not needed
- Future USB updates in **Preware** will be separately tested and marked for compatibility with 3.1.0

#### Accounts and Synergy Revival

- The required HP Account has been replaced with an *optional* **webOS Community Account**
- **Activation via deviceTool is no longer required** -- the firstuse out-of-box experience (OOBE) has been repaired, account creation is skippable
- Modernized Synergy components, including libpurple, are pre-installed and enable connectors to modern services
- Find new tested and compatible Synergy plug-ins in **Preware**

### Pre-loaded Apps

- HP App Catalog has been replaced with **App Catalog**, with a community-run back-end that includes archived historical apps and new community-developed apps
- ****Preware**** is now pre-installed (and can still be updated in the future), with the `modernize` feed pre-enabled.
- The stock **Maps** app has been replaced with a repaired version that uses OSM Maps tiles in place of Bing Maps
- The built-in **Backup** app has been re-written to backup and restore from local storage (replacing the HP Cloud storage service)
- **Help** has been largely repaired, loading content from webOS Archive
- **Photos** now shows a filename for an opened photo
- **Mail** adds support for modern EAS servers

---

## Installation

OS images are restored to webOS devices using a "Doctor" -- a Java based tool that writes the system image to storage, and flashed 
the appropriate hardware controllers.

This release would previously have been called a "Meta Doctor", a community term for modified doctor images. 
However, since this version touches almost every part of the OS, it should be considered a complete Doctor unto itself.

User's may Doctor their Touchpad to the final commercial release, 3.0.5, or to this community release, 3.1.0.

Doctoring a device removes all apps, and resets the device. A community-made Backup app is available to back-up and restore apps.

Downgrading is supported, with the same caveat that apps will be removed.

### Optional: Backup and restore

Note: please consider Backup as a "best-effort" and make sure you know where to find your favorite apps before Doctoring.

**A community created [App Scanner](https://appcatalog.webosarchive.org/app/webOSAppScanner) inventory app can help you identify if your device has apps that have not been archived.**
**Please help us rescue lost apps before you wipe your device!**

The 3.1.0 Backup app is avalable in **Preware**. If upgrading a device with apps, you can install and [run a backup, which can be restored](BACKUP-RESTORE.md) after flashing.

### Install Java on your PC

The Doctor requires a Java runtime. Modern Java is supported on common platforms (Mac, Windows, Linux).

Instructions for installing Java are out-of-scope for this document.

### Install Novacom Drivers

Install Drivers appropriate for your Operating System.

- [https://stacks.webosarchive.org/activation/drivers/](https://stacks.webosarchive.org/activation/drivers/)

### Download the Doctor to your PC

The Releases section includes a pre-built Doctor image.

Building the image is out-of-scope for this document and will be covered elsewhere.

### Put the Touchpad in Recovery Mode

#### From Powered On

- Hold down the "Home" and "Power" buttons until the device reboots
- Before the device starts, hold the "Volume Up" button until the USB logo is shown

#### From Powered Off

- Hold down the "Power" button until the device turns on
- Quckly hold the "Volume Up" button (before the logo appears) until the USB logo is down

### Connect the Touchpad to your PC

- Use a data-capable micro-USB capable to connect your Touchpad to your PC

### Run the Doctor

- Open a command line and navigate to the folder where the downloaded Doctor is saved
- Run: `java -jar <doctorfilename>.jar`
- Follow the on-screen prompts
    - on a Mac, you may be prompted to re-install the Drivers. You can skip this step (it will error on modern Macs anyway)

---

## Problems and Support

- Report Issues in this GitHub Repo
- Community chat can provide help, visit [docs.webosarchive.org/community](https://docs.webosarchive.org/community/) to find links to join the conversation