import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bizAPI', {
  copyText: (text: string) => ipcRenderer.send('app:copy', text || ''),
});

contextBridge.exposeInMainWorld('zipAPI', {
  openDialog: () => ipcRenderer.invoke('zip:open'),
  close: () => ipcRenderer.invoke('zip:close'),
  openPath: (filePath: string) => ipcRenderer.invoke('zip:openPath', filePath),
});
