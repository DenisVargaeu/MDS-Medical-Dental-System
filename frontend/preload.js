const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process only
contextBridge.exposeInMainWorld('electron', {
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  getVersion: () => ipcRenderer.invoke('app:version'),
});
