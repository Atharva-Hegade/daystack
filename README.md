# ⚡ DayStack — Desktop App Setup Guide

A smart daily task manager that runs as a native Windows desktop app.

---

## 🚀 Quick Start (3 steps)

### Step 1 — Prerequisites
Make sure you have Node.js installed:
```
winget install OpenJS.NodeJS.LTS
```
Then restart your terminal.

### Step 2 — Install & Build
Open a terminal in this folder, then run:
```
setup.bat
```
This will:
- Install all dependencies
- Build the React frontend
- Package it as a Windows .exe

Your app lands in: `dist-electron\DayStack.exe`

### Step 3 — Run It
Double-click `dist-electron\DayStack.exe`

---

## 🖥️ Run Without Building (Dev Mode)
If you just want to test it quickly without building an .exe:
```
run-dev.bat
```
This runs Vite + Electron together in development mode.

---

## 🔁 Auto-Start on Windows Boot

### Option A — Use the in-app toggle (Easiest)
The sidebar has a **"Launch on startup"** toggle.
Flip it ON — done. DayStack will silently start with Windows.

### Option B — Manual shortcut
1. Press `Win + R` → type `shell:startup` → press Enter
2. Copy a shortcut to `DayStack.exe` into that folder
3. Reboot to test

### Option C — PowerShell (one-liner)
```powershell
$exe = "C:\Path\To\dist-electron\DayStack.exe"
$startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$s = (New-Object -COM WScript.Shell).CreateShortcut("$startup\DayStack.lnk")
$s.TargetPath = $exe; $s.Save()
```

---

## 📁 Where Your Data Lives
Tasks are saved locally at:
```
%APPDATA%\DayStack\tasks.json
```
You can back this file up or sync it with OneDrive.

---

## 🏗️ Project Structure
```
daystack/
├── electron/
│   ├── main.js        ← Electron main process (window, tray, storage, startup)
│   └── preload.js     ← Secure bridge between Electron and React
├── src/
│   ├── main.jsx       ← React entry point
│   └── App.jsx        ← Full DayStack UI
├── public/            ← Static assets (put icon.png here)
├── index.html
├── vite.config.js
├── package.json
├── setup.bat          ← Build script
└── run-dev.bat        ← Dev mode launcher
```

---

## 🎨 Customizing the Icon
1. Create a 256×256 PNG named `icon.png`
2. Place it in the `public/` folder
3. For the taskbar .ico format, use: https://icoconvert.com
4. Save the .ico as `public/icon.ico`
5. Rebuild with `setup.bat`

---

## ⌨️ Keyboard Shortcuts (in-app)
| Key | Action |
|-----|--------|
| `Enter` (in form) | Save task |
| `Esc` (modal open) | Close modal |
| Click tray icon | Hide/show window |
| Double-click tray | Show window |

---

## 🧪 Troubleshooting

**"electron is not recognized"**
→ Run `npm install` first

**White screen on launch**
→ Wait 2-3 seconds for Vite dev server to start in dev mode

**App doesn't start on boot**
→ Check Task Manager > Startup tab > Enable DayStack

**Tasks disappeared**
→ Check `%APPDATA%\DayStack\tasks.json` — your data is always there
