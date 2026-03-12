const { contextBridge, ipcRenderer } = require('electron');

// Expose storage API (replaces window.storage from web version)
contextBridge.exposeInMainWorld('storage', {
  get:    (key)         => ipcRenderer.invoke('storage-get', key),
  set:    (key, value)  => ipcRenderer.invoke('storage-set', key, value),
  delete: (key)         => ipcRenderer.invoke('storage-delete', key),
  list:   (prefix)      => ipcRenderer.invoke('storage-list', prefix),
});

// Expose window controls
contextBridge.exposeInMainWorld('electronAPI', {
  minimize:       ()       => ipcRenderer.send('window-minimize'),
  maximize:       ()       => ipcRenderer.send('window-maximize'),
  hide:           ()       => ipcRenderer.send('window-hide'),
  close:          ()       => ipcRenderer.send('window-close'),
  getAutoLaunch:  ()       => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch:  (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  isElectron:     true,
});
