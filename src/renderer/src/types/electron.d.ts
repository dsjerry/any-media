export interface ElectronAPI {
  openFile: () => Promise<string>
  getFileData: (filePath: string) => Promise<Buffer>
  selectFolder: () => Promise<string>
  scanFolder: (folderPath: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean }>>
  onWindowMaximize: (callback: () => void) => void
  onWindowUnmaximize: (callback: () => void) => void
  removeAllListeners: (channel: string) => void
  toggleMaximize: () => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}