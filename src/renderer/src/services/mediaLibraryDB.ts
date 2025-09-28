import { get, set, del, keys, clear } from 'idb-keyval'

export interface MediaLibraryStorage {
  folders: any[]
  items: any[]
  selectedFolderId: string | null
}

const STORAGE_KEY = 'media_library'

class MediaLibraryDB {
  private dbName = 'AnyPlayerDB'
  private storeName = 'mediaLibrary'

  async getLibrary(): Promise<MediaLibraryStorage | null> {
    try {
      const data = await get(STORAGE_KEY)
      return data || {
        folders: [],
        items: [],
        selectedFolderId: null
      }
    } catch (error) {
      console.error('Error loading media library from IndexedDB:', error)
      return null
    }
  }

  async saveLibrary(data: MediaLibraryStorage): Promise<void> {
    try {
      await set(STORAGE_KEY, data)
    } catch (error) {
      console.error('Error saving media library to IndexedDB:', error)
      throw error
    }
  }

  async clearLibrary(): Promise<void> {
    try {
      await del(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing media library from IndexedDB:', error)
      throw error
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        }
      }
      return { used: 0, available: 0 }
    } catch (error) {
      console.error('Error getting storage info:', error)
      return { used: 0, available: 0 }
    }
  }

  async migrateFromLocalStorage(): Promise<void> {
    try {
      const localData = localStorage.getItem('mediaLibrary')
      if (localData) {
        const parsed = JSON.parse(localData)
        await this.saveLibrary(parsed)
        console.log('Successfully migrated media library from localStorage to IndexedDB')

        // 可选：迁移完成后清除localStorage
        // localStorage.removeItem('mediaLibrary')
      }
    } catch (error) {
      console.error('Error migrating from localStorage:', error)
    }
  }
}

export const mediaLibraryDB = new MediaLibraryDB()