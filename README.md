<div align="center">

<img src="public/icon.png" alt="DayStack Logo" width="80" height="80" />

# ⚡ DayStack

**A smart, minimal daily task manager — built as a native Windows desktop app.**

[![Release](https://img.shields.io/github/v/release/Atharva-Hegade/daystack?color=6366f1&label=Download&style=for-the-badge)](https://github.com/Atharva-Hegade/daystack/releases/latest)
![Platform](https://img.shields.io/badge/Platform-Windows%2011-blue?style=for-the-badge&logo=windows)
![Electron](https://img.shields.io/badge/Electron-32-47848F?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

[**⬇️ Download Latest**](https://github.com/Atharva-Hegade/daystack/releases/latest) · [**🐛 Report a Bug**](https://github.com/Atharva-Hegade/daystack/issues) · [**💡 Request Feature**](https://github.com/Atharva-Hegade/daystack/issues)

</div>

---

## ✨ What is DayStack?

DayStack is a lightweight desktop task manager designed for developers and power users who want a **fast, distraction-free** way to plan their day — right on their Windows desktop, no browser needed.

It launches silently on boot, lives in your system tray, and is always one click away.

---

## 🎯 Features

| Feature | Description |
|---|---|
| 📅 **Week View** | See and plan your entire week at a glance |
| ✅ **Smart Tasks** | Add priority, time, category and notes to every task |
| 🔴 **Priority System** | High / Medium / Low with color coding |
| 🔍 **Search & Filter** | Find any task instantly |
| 🚀 **Launch on Boot** | Toggle auto-start from inside the app |
| 🖥️ **Native Window** | Custom frameless titlebar, no browser chrome |
| 📌 **System Tray** | Hides to tray, always running in background |
| 💾 **Local Storage** | Data saved on your PC — no cloud, no account |

---

## ⬇️ Installation

> **No Node.js required — just download and run.**

1. Go to [**Releases**](https://github.com/Atharva-Hegade/daystack/releases/latest)
2. Download `DayStack.exe`
3. Double-click it — that's it ✅

---

## 🛠️ Build From Source

Want to run or modify the code yourself?

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/Atharva-Hegade/daystack.git
cd daystack

# 2. Run in dev mode (live reload)
npm install
npm run electron:dev

# 3. Build a fresh .exe
.\setup.bat
```

### Project Structure

```
daystack/
├── electron/
│   ├── main.js        ← Electron main process (window, tray, storage, startup)
│   └── preload.js     ← Secure bridge between Electron and React
├── src/
│   ├── main.jsx       ← React entry point
│   └── App.jsx        ← Full DayStack UI
├── public/            ← App icon (icon.png + icon.ico)
├── index.html
├── vite.config.js
├── package.json
├── setup.bat          ← One-click build script
└── run-dev.bat        ← Dev mode launcher
```

---

## 🔁 Auto-Start on Windows Boot

**Option A — Easiest (recommended)**
The sidebar has a built-in **"Launch on startup"** toggle — flip it ON and you're done.

**Option B — Manual shortcut**
1. Press `Win + R` → type `shell:startup` → Enter
2. Drop a shortcut to `DayStack.exe` in that folder

---

## 📁 Your Data

Tasks are saved locally — never uploaded anywhere:
```
%APPDATA%\DayStack\tasks.json
```
Back it up or sync it with OneDrive anytime.

---

## ⌨️ Shortcuts

| Key | Action |
|-----|--------|
| `Enter` in task form | Save task |
| Double-click tray icon | Show window |
| Startup toggle in sidebar | Enable/disable boot launch |

---

## 🧪 Troubleshooting

<details>
<summary><b>White screen on launch</b></summary>
Wait 2–3 seconds for the Vite dev server to start (dev mode only). In production this won't happen.
</details>

<details>
<summary><b>App doesn't start on boot</b></summary>
Check Task Manager → Startup tab → make sure DayStack is Enabled.
</details>

<details>
<summary><b>Tasks disappeared</b></summary>
Your data is always at <code>%APPDATA%\DayStack\tasks.json</code> — check if that file exists.
</details>

<details>
<summary><b>Build fails with symlink error</b></summary>
Run <code>.\setup.bat</code> as Administrator — it clears the electron-builder cache automatically.
</details>

---

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feature/cool-thing`
3. Commit: `git commit -m "add cool thing"`
4. Push: `git push origin feature/cool-thing`
5. Open a Pull Request

---

<div align="center">

Made with ♥ by [@TECHBLENDSTUDIOS](https://github.com/Atharva-Hegade)

</div>
