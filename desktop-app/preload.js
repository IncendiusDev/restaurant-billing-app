const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printThermalSlip: (data) => ipcRenderer.invoke('print-thermal-slip', data),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isDesktop: true,
});
