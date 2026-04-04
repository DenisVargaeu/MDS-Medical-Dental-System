const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'MDS - Medical Dental System',
    icon: path.join(__dirname, 'renderer', 'assets', 'icons', 'icon.png'),
    backgroundColor: '#0f1117',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Remove default menu bar in production
  if (process.env.NODE_ENV !== 'development') {
    Menu.setApplicationMenu(null);
  }
}

// ── IPC Handlers ─────────────────────────────────────────────

// Open file dialog for uploads
ipcMain.handle('dialog:openFile', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select File(s)',
    filters: [
      { name: 'All Supported', extensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx'] },
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx'] },
    ],
    properties: ['openFile', ...(options.multiSelections ? ['multiSelections'] : [])]
  });
  return result;
});

// Open external links in default browser
ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url);
});

// App version
ipcMain.handle('app:version', () => app.getVersion());

// ── App Lifecycle ────────────────────────────────────────────

// Disable hardware acceleration to resolve VSync and GLib errors on some Linux distributions
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
