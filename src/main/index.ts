import { app, BrowserWindow, ipcMain, protocol, net } from "electron";
import path from "path";
let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === "development"

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 720,
    webPreferences: {
      scrollBounce: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload/index.js"),
      // 允许访问本地文件
      webSecurity: false,
      // 允许混合内容
      allowRunningInsecureContent: true,
      // 禁用内容安全策略
      additionalArguments: [
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--allow-file-access',
        '--allow-cross-origin-auth-prompt'
      ]
    },
    icon: path.join(__dirname, "../../src/renderer/assets/icon.png"),
    show: false,
    autoHideMenuBar: true, // 隐藏菜单栏（按Alt键可以临时显示）
    // 如果想完全移除菜单栏（包括整个窗口框架），可以使用：
    // frame: false, // 注意：这也会移除最小化、最大化、关闭按钮
  })

  const startUrl = isDev
    ? "http://localhost:4000"
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

  // 监听窗口最大化事件
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-maximize")
  })

  // 监听窗口取消最大化事件
  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-unmaximize")
  })

  // 处理切换最大化状态的请求
  ipcMain.handle('toggle-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
}

app.whenReady().then(() => {
  protocol.handle("safe-file", (request) => {
    try {
      console.log("Safe-file protocol request:", request.url)
      
      // 处理重复协议前缀
      let processedUrl = request.url.replace('safe-file://safe-file://', 'safe-file://')
      
      // 从 URL 中提取路径
      const url = new URL(processedUrl)
      let urlPath = decodeURIComponent(url.pathname)
      
      // 处理路径格式
      let localPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath
      
      // 处理 Windows 路径
      if (!localPath.match(/^[a-zA-Z]:/)) {
        // 如果缺失驱动器字母，尝试添加 C:
        localPath = `C:\\${localPath}`
      }
      
      // 将正斜杠转换为反斜杠（Windows路径）
      localPath = localPath.replace(/\//g, '\\')
      
      console.log("Safe-file protocol path:", localPath)

      // 检查文件是否存在
      const fs = require('fs')
      if (fs.existsSync(localPath)) {
        // 使用 file:// 协议返回文件
        return net.fetch(`file:///${localPath.replace(/\\/g, '/')}`)
      }
      
      console.log("File not found:", localPath)
      throw new Error("File not found")
    } catch (error) {
      console.error("Error handling safe-file protocol:", error)
      throw error
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
    title: "选择要添加到媒体库的文件夹",
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
      image: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"],
    }

    const scanDirectory = async (dirPath: string) => {
      const files = await fs.readdir(dirPath, { withFileTypes: true })
      const mediaFiles: Array<{
        name: string
        path: string
        size: number
        lastModified: number
        type: "video" | "audio" | "image"
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
          let fileType: "video" | "audio" | "image" | null = null
          for (const [type, extensions] of Object.entries(
            supportedExtensions
          )) {
            if (extensions.includes(ext)) {
              fileType = type as "video" | "audio" | "image"
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
                type: fileType,
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
  const fsSync = require("fs")
  const path = require("path")

  try {
    console.log("get-file-data called with:", filePath)
    // 确保 filePath 是字符串
    if (typeof filePath !== 'string') {
      console.error("filePath must be a string, received:", typeof filePath, filePath)
      return null
    }
    
    // 检查文件是否存在
    if (!fsSync.existsSync(filePath)) {
      console.error("File does not exist:", filePath)
      return null
    }
    
    // 获取文件统计信息
    const stats = await fs.stat(filePath)
    if (stats.size === 0) {
      console.error("File is empty:", filePath)
      return null
    }
    
    console.log(`File size: ${stats.size} bytes, last modified: ${stats.mtime}`)
    
    const extension = path.extname(filePath).toLowerCase()
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]
    const videoExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".ts", ".mts", ".m2ts", ".3gp", ".3g2"]
    const audioExtensions = [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".opus", ".wma"]

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
      // 使用 Node.js path 模块正确处理路径
      const normalizedPath = path.normalize(filePath).replace(/\\/g, '/')
      
      // 特别处理 Windows 路径
      let safeUrl = '';
      
      // 检查是否是 Windows 路径
      if (/^[a-zA-Z]:/.test(normalizedPath)) {
        // Windows 路径，确保驱动器字母后面有正确的斜杠
        const formattedPath = normalizedPath.replace(/^([a-zA-Z]:)(?!\/)/g, '$1/')
        safeUrl = `safe-file://${formattedPath}`
        console.log("Windows path formatted for safe-file URL:", safeUrl)
      } else {
        // 非 Windows 路径或已经格式化的路径
        safeUrl = `safe-file://${normalizedPath.replace(/^\//, '')}`
      }
      
      // 额外检查，确保 URL 格式正确
      if (/^safe-file:\/\/[a-zA-Z]:/.test(safeUrl) && !safeUrl.includes(':/')) {
        safeUrl = safeUrl.replace(':', ':/')
        console.log("Fixed URL format:", safeUrl)
      }
      
      // 检查 URL 中是否有多余的斜杠
      if (safeUrl.includes('///')) {
        safeUrl = safeUrl.replace(/\/{3,}/g, '//')
        console.log("Removed extra slashes:", safeUrl)
      }
      
      // 确保协议后有两个斜杠
      safeUrl = safeUrl.replace(/^safe-file:(\/?)(\/?)/, 'safe-file://')
      
      console.log("Created safe-file URL:", safeUrl, "from original path:", filePath)
      return safeUrl
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
  return (mimeTypes as any)[extension] || "application/octet-stream"
}
