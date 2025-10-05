// 为window对象添加electronAPI属性声明
interface Window {
  electronAPI: {
    openFile: () => Promise<string>
    getFileData: (filePath: string) => Promise<Buffer>
    selectFolder: () => Promise<string>
    scanFolder: (folderPath: string) => Promise<Array<{ name: string; path: string; isDirectory: boolean }>>
    onWindowMaximize: (callback: () => void) => void
    onWindowUnmaximize: (callback: () => void) => void
    removeAllListeners: (channel: string) => void
    toggleMaximize: () => Promise<void>
  }
}