import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('bizAPI', {
  copyText: (text: string) => ipcRenderer.send('app:copy', text || ''),
});
