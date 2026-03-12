const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Storage (replaces window.storage from the web version) ──────────────────
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'tasks.json');

function readDB() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {}
  return {};
}
function writeDB(data) {
  try { fs.writeFileSync(dbPath, JSON.stringify(data), 'utf8'); return true; }
  catch (e) { return false; }
}

// IPC handlers for storage
ipcMain.handle('storage-get', (_, key) => {
  const db = readDB();
  const val = db[key];
  return val !== undefined ? { key, value: val } : null;
});
ipcMain.handle('storage-set', (_, key, value) => {
  const db = readDB();
  db[key] = value;
  writeDB(db);
  return { key, value };
});
ipcMain.handle('storage-delete', (_, key) => {
  const db = readDB();
  delete db[key];
  writeDB(db);
  return { key, deleted: true };
});
ipcMain.handle('storage-list', (_, prefix) => {
  const db = readDB();
  const keys = Object.keys(db).filter(k => !prefix || k.startsWith(prefix));
  return { keys, prefix };
});

// ── Startup registry ─────────────────────────────────────────────────────────
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle('set-auto-launch', (_, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: process.execPath,
    args: ['--hidden']
  });
  return enable;
});

// ── Window ───────────────────────────────────────────────────────────────────
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(hidden = false) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 550,
    show: false,
    frame: false,          // custom titlebar
    transparent: false,
    backgroundColor: '#0f0f14',
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (!hidden) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Hide to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray icon ────────────────────────────────────────────────────────────────
function createTray() {
  // Create a simple tray icon programmatically (16x16 PNG as base64)
  const iconPath = path.join(__dirname, '../public/icon.png');
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } else {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('DayStack');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open DayStack',
      click: () => { mainWindow.show(); mainWindow.focus(); }
    },
    { type: 'separator' },
    {
      label: 'Open data folder',
      click: () => shell.openPath(userDataPath)
    },
    { type: 'separator' },
    {
      label: 'Quit DayStack',
      click: () => { app.quitting = true; app.quit(); }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── IPC: window controls (since frame: false) ─────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-hide', () => mainWindow.hide());
ipcMain.on('window-close', () => mainWindow.hide());

// ── App lifecycle ─────────────────────────────────────────────────────────
app.whenReady().then(() => {
  const launchedHidden = process.argv.includes('--hidden');
  createWindow(launchedHidden);
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else { mainWindow.show(); mainWindow.focus(); }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit — keep tray alive
  }
});

app.on('before-quit', () => { app.quitting = true; });
