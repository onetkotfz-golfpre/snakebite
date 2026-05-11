# Snake Bite: Portable & Bootable Deployment Guide

This guide explains how to take the Snake Bite Terminal and turn it into a standalone tool for your red team USB drive.

## 1. Local Packaging (Electron)
To run Snake Bite as a "real" desktop app without a browser:

1. **Install Dependencies:**
   ```bash
   npm install --save-dev electron electron-builder
   ```

2. **Main Electron Script (`electron-main.js`):**
   Create this file to handle the window:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   function createWindow() {
     const win = new BrowserWindow({
       width: 1200,
       height: 800,
       backgroundColor: '#0A0C10',
       webPreferences: { nodeIntegration: true }
     });
     // In production, point to the build folder
     win.loadFile('dist/index.html');
   }
   app.whenReady().then(createWindow);
   ```

3. **Build the Binary:**
   ```bash
   npm run build
   npx electron-builder
   ```
   This will generate a portable `.AppImage` (for Linux) or `.exe` in the `dist` folder.

## 2. Making it Bootable (USB)
To make this part of a bootable OS:

### Method A: The Kali Live "Persistence" Way (Recommended)
1. Flash a standard **Kali Linux ISO** to your USB using **Rufus** or **Etcher**.
2. Create a **Persistence Partition** on the USB.
3. Boot into Kali, and copy your Snake Bite binary into `/usr/local/bin/`.
4. Add Snake Bite to the Kali desktop shortcut or the "Top 10 Tools" menu.

### Method B: Custom ISO Build (Advanced)
1. Use the **Kali Live-Build** script on a Debian machine.
2. Add the Snake Bite source code to the `chroot` hooks.
3. Rebuild the ISO. Every time you boot from that USB, Snake Bite will be the default interface.

## 3. Hardware Recommendations
For a true "Plug and Play" field kit:
- **Drive:** Use a high-speed USB 3.1 (e.g., Samsung Bar Plus).
- **Encryption:** Use **LUKS Partition Encryption** so your data (and Snake Bite logs) are safe if the drive is lost.
