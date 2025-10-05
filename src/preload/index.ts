import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  openFile: () => ipcRenderer.invoke('open-file'),
  getFileData: (filePath: string) => ipcRenderer.invoke('get-file-data', filePath),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('scan-folder', folderPath),
  onWindowMaximize: (callback: () => void) => ipcRenderer.on('window-maximize', callback),
  onWindowUnmaximize: (callback: () => void) => ipcRenderer.on('window-unmaximize', callback),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  toggleMaximize: () => ipcRenderer.invoke('toggle-maximize')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}