import { app, BrowserWindow, shell, ipcMain, Menu, protocol } from "electron"
import path from "path"

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === "development"

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload/index.js"),
    },
    icon: path.join(__dirname, "../../src/renderer/assets/icon.png"),
    show: false,
    autoHideMenuBar: true, // 隐藏菜单栏（按Alt键可以临时显示）
    // 如果想完全移除菜单栏（包括整个窗口框架），可以使用：
    // frame: false, // 注意：这也会移除最小化、最大化、关闭按钮
  })

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../renderer/index.html")}`

  mainWindow.loadURL(startUrl)

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // 注册自定义协议处理器
  protocol.registerFileProtocol("safe-file", (request, callback) => {
    try {
      const filePath = request.url.replace("safe-file://", "")
      // 将 URL 路径转换为本地文件路径
      const localPath = decodeURIComponent(filePath)
      callback(localPath)
    } catch (error) {
      console.error("Error handling safe-file protocol:", error)
      callback()
    }
  })

  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

ipcMain.handle("open-file", async () => {
  const { dialog } = require("electron")
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Media Files",
        extensions: [
          "mp4",
          "avi",
          "mov",
          "mp3",
          "wav",
          "flac",
          "jpg",
          "png",
          "gif",
        ],
      },
      { name: "Video Files", extensions: ["mp4", "avi", "mov", "mkv"] },
      { name: "Audio Files", extensions: ["mp3", "wav", "flac", "aac"] },
      { name: "Image Files", extensions: ["jpg", "png", "gif", "bmp"] },
    ],
  })

  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

// 处理文件夹选择
ipcMain.handle("select-folder", async () => {
  const { dialog } = require("electron")
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "选择要添加到媒体库的文件夹"
  })

  if (!result.canceled) {
    return result.filePaths[0]
  }
  return null
})

// 扫描文件夹中的媒体文件
ipcMain.handle("scan-folder", async (event, folderPath) => {
  const fs = require("fs").promises
  const path = require("path")

  try {
    const supportedExtensions = {
      video: [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"],
      audio: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"],
      image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"]
    }

    const scanDirectory = async (dirPath: string): Promise<Array<{
      name: string
      path: string
      size: number
      lastModified: number
      type: 'video' | 'audio' | 'image'
    }>> => {
      const files = await fs.readdir(dirPath, { withFileTypes: true })
      const mediaFiles: Array<{
        name: string
        path: string
        size: number
        lastModified: number
        type: 'video' | 'audio' | 'image'
      }> = []

      for (const file of files) {
        if (file.isDirectory()) {
          // 递归扫描子目录
          const subDirPath = path.join(dirPath, file.name)
          const subFiles = await scanDirectory(subDirPath)
          mediaFiles.push(...subFiles)
        } else {
          const filePath = path.join(dirPath, file.name)
          const ext = path.extname(file.name).toLowerCase()

          // 检查文件类型
          let fileType: 'video' | 'audio' | 'image' | null = null
          for (const [type, extensions] of Object.entries(supportedExtensions)) {
            if (extensions.includes(ext)) {
              fileType = type as 'video' | 'audio' | 'image'
              break
            }
          }

          if (fileType) {
            try {
              const stats = await fs.stat(filePath)
              mediaFiles.push({
                name: file.name,
                path: filePath,
                size: stats.size,
                lastModified: stats.mtimeMs,
                type: fileType
              })
            } catch (error) {
              console.warn(`无法读取文件信息: ${filePath}`, error)
            }
          }
        }
      }

      return mediaFiles
    }

    const mediaFiles = await scanDirectory(folderPath)
    return mediaFiles

  } catch (error) {
    console.error("扫描文件夹失败:", error)
    throw error
  }
})

// 处理本地文件加载请求
ipcMain.handle("get-file-data", async (event, filePath) => {
  const fs = require("fs").promises
  const path = require("path")

  try {
    const extension = path.extname(filePath).toLowerCase()
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
    const videoExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    const audioExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a"]

    if (imageExtensions.includes(extension)) {
      // 对于图片文件，读取并转换为 base64
      const data = await fs.readFile(filePath)
      const base64 = data.toString("base64")
      const mimeType = getMimeType(extension)
      return `data:${mimeType};base64,${base64}`
    } else if (
      videoExtensions.includes(extension) ||
      audioExtensions.includes(extension)
    ) {
      // 对于视频和音频文件，创建一个安全的文件协议 URL
      // 使用 Electron 的 protocol API
      return `safe-file://${filePath.replace(/\\/g, "/")}`
    } else {
      // 其他文件类型，返回原始路径
      return filePath
    }
  } catch (error) {
    console.error("Error reading file:", error)
    return null
  }
})

// 获取 MIME 类型
function getMimeType(extension: string) {
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
  }
  return mimeTypes[extension] || "application/octet-stream"
}
