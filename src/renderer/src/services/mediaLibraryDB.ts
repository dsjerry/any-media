import { get, set, del, keys, clear } from 'idb-keyval'
// 尝试导入 LogService
let logService: any;
try {
  // 使用动态导入避免循环依赖
  const LogServiceModule = require('./LogService');
  logService = LogServiceModule.logService;
} catch (error) {
  // 如果无法导入，创建一个简单的替代品
  logService = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  console.warn('Could not import LogService, using fallback logger');
}

export interface MediaFolder {
  id: string
  name: string
  path: string
  dateAdded: number
  lastScanned?: number
}

export interface MediaItem {
  id: string
  name: string
  path: string
  type: 'video' | 'audio' | 'image'
  size: number
  lastModified: number
  folderId: string
  duration?: number
  dimensions?: { width: number; height: number }
  thumbnail?: string
}

export interface MediaLibraryStorage {
  folders: MediaFolder[]
  items: MediaItem[]
  selectedFolderId: string | null
}

const STORAGE_KEY = 'media_library'

class MediaLibraryDB {
  private dbName = 'AnyPlayerDB'
  private storeName = 'mediaLibrary'

  async getLibrary(): Promise<MediaLibraryStorage> {
    try {
      const data = await get(STORAGE_KEY) as MediaLibraryStorage | undefined
      
      if (data) {
        logService.info('Media library loaded from IndexedDB', { itemCount: data.items.length, folderCount: data.folders.length })
        return data
      }
      
      // 如果没有数据，返回默认空库
      const emptyLibrary: MediaLibraryStorage = {
        folders: [],
        items: [],
        selectedFolderId: null
      }
      
      logService.info('No existing media library found, creating empty library')
      return emptyLibrary
    } catch (error) {
      logService.error('Error loading media library from IndexedDB', error)
      // 出错时也返回默认空库，而不是 null，这样可以避免调用方处理 null 的情况
      return {
        folders: [],
        items: [],
        selectedFolderId: null
      }
    }
  }

  async saveLibrary(data: MediaLibraryStorage): Promise<boolean> {
    try {
      await set(STORAGE_KEY, data)
      logService.info('Media library saved to IndexedDB', { 
        itemCount: data.items.length, 
        folderCount: data.folders.length 
      })
      return true
    } catch (error) {
      logService.error('Error saving media library to IndexedDB', error)
      return false
    }
  }

  async clearLibrary(): Promise<boolean> {
    try {
      await del(STORAGE_KEY)
      logService.info('Media library cleared from IndexedDB')
      return true
    } catch (error) {
      logService.error('Error clearing media library from IndexedDB', error)
      return false
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number; quota: number; percentUsed: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage || 0
        const quota = estimate.quota || 0
        const available = quota - usage
        const percentUsed = quota > 0 ? Math.round((usage / quota) * 100) : 0
        
        logService.info('Storage info retrieved', { usage, quota, available, percentUsed })
        
        return {
          used: usage,
          available: available,
          quota: quota,
          percentUsed: percentUsed
        }
      }
      
      logService.warn('Storage API not supported by browser')
      return { used: 0, available: 0, quota: 0, percentUsed: 0 }
    } catch (error) {
      logService.error('Error getting storage info', error)
      return { used: 0, available: 0, quota: 0, percentUsed: 0 }
    }
  }

  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('mediaLibrary')
      if (localData) {
        try {
          const parsed = JSON.parse(localData) as MediaLibraryStorage
          
          // 验证数据格式
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid media library data format')
          }
          
          // 确保数据结构完整
          const validData: MediaLibraryStorage = {
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
            items: Array.isArray(parsed.items) ? parsed.items : [],
            selectedFolderId: parsed.selectedFolderId || null
          }
          
          const saved = await this.saveLibrary(validData)
          if (saved) {
            logService.info('Successfully migrated media library from localStorage to IndexedDB', {
              itemCount: validData.items.length,
              folderCount: validData.folders.length
            })
            
            // 迁移完成后清除localStorage
            localStorage.removeItem('mediaLibrary')
            return true
          }
        } catch (parseError) {
          logService.error('Error parsing localStorage data:', parseError)
          return false
        }
      } else {
        logService.info('No localStorage media library data found to migrate')
      }
      return false
    } catch (error) {
      logService.error('Error migrating from localStorage:', error)
      return false
    }
  }
  
  // 添加新方法：获取媒体库统计信息
  async getLibraryStats(): Promise<{ totalItems: number, totalFolders: number, videoCount: number, audioCount: number, imageCount: number }> {
    const library = await this.getLibrary()
    
    const videoCount = library.items.filter(item => item.type === 'video').length
    const audioCount = library.items.filter(item => item.type === 'audio').length
    const imageCount = library.items.filter(item => item.type === 'image').length
    
    return {
      totalItems: library.items.length,
      totalFolders: library.folders.length,
      videoCount,
      audioCount,
      imageCount
    }
  }
}

// 使用延迟初始化的单例
let instance: MediaLibraryDB | null = null;

export const getMediaLibraryDB = (): MediaLibraryDB => {
  if (!instance) {
    instance = new MediaLibraryDB();
  }
  return instance;
};

// 向后兼容，但不推荐直接使用
export const mediaLibraryDB = getMediaLibraryDB();