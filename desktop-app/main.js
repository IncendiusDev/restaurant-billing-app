const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Chit Restaurant POS - Desktop Application',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    backgroundColor: '#0a0e17',
  });

  // Load local POS interface (index.html)
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Native Thermal Printing & Hardware Support
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  return await mainWindow.webContents.getPrintersAsync();
});

// Direct Silent ESC/POS Receipt & KOT Printing Handler
ipcMain.handle('print-thermal-slip', async (event, { htmlContent, printerName, isKOT }) => {
  return new Promise((resolve, reject) => {
    let printWin = new BrowserWindow({
      show: false,
      width: 300,
      height: 600,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    const slipHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 10px 4px; color: #000; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .subtitle { font-size: 11px; margin-bottom: 8px; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .table-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .item-qty { font-weight: bold; width: 24px; }
          .item-name { flex: 1; font-weight: bold; }
          .item-price { text-align: right; }
          .totals { font-size: 14px; font-weight: bold; margin-top: 8px; text-align: right; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(slipHtml));

    printWin.webContents.on('did-finish-load', () => {
      const options = {
        silent: true,
        printBackground: true,
        deviceName: printerName || ''
      };

      printWin.webContents.print(options, (success, failureReason) => {
        printWin.close();
        printWin = null;
        if (success) resolve({ status: 'ok' });
        else reject(new Error(failureReason || 'Failed to print slip'));
      });
    });
  });
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    const isFS = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFS);
    return !isFS;
  }
  return false;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
