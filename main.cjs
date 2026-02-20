const { app, BrowserWindow } = require('electron');
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
      // Note: In a future update we should align this with GEP's preload security, 
      // but for GEP-MAILER v1.0.0 we keep nodeIntegration for simplicity.
    }
  });

  // Maximize window on startup
  win.maximize();

  // Load the appropriate URL based on environment
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    // In production, the file is in dist/index.html relative to root
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
