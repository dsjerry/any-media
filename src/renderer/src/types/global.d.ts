// 为window对象添加electronAPI属性声明
interface Window {
  electronAPI: {
    openFile: () => Promise<string | null>
    getFileData: (filePath: string) => Promise<string | null>
    selectFolder: () => Promise<string | null>
    scanFolder: (folderPath: string) => Promise<Array<{
      name: string
      path: string
      size: number
      lastModified: number
      type: 'video' | 'audio' | 'image'
    }>>
    onWindowMaximize: (callback: () => void) => void
    onWindowUnmaximize: (callback: () => void) => void
    removeAllListeners: (channel: string) => void
    toggleMaximize: () => Promise<void>
  }
}