import { defineStore } from 'pinia'
import { getMediaLibraryDB } from '../services/mediaLibraryDB'

// 延迟初始化 mediaLibraryDB
let mediaLibraryDB: any = null

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 500

export interface MediaLibraryItem {
  id: string
  name: string
  path: string
  type: 'video' | 'audio' | 'image'
  size: number
  lastModified: number
  folderId: string
  duration?: number
  dimensions?: { width: number; height: number }
}

export interface MediaFolder {
  id: string
  name: string
  path: string
  itemCount: number
  lastScanned: number
  isExpanded: boolean
}

export interface MediaLibraryState {
  folders: MediaFolder[]
  items: MediaLibraryItem[]
  selectedFolderId: string | null
  selectedItemIds: Set<string>
  isLoading: boolean
}

export const useMediaLibraryStore = defineStore('mediaLibrary', {
  state: (): MediaLibraryState => ({
    folders: [],
    items: [],
    selectedFolderId: null,
    selectedItemIds: new Set(),
    isLoading: false
  }),

  getters: {
    // 获取所有文件夹
    getAllFolders: (state) => state.folders,

    // 获取选中的文件夹
    getSelectedFolder: (state) => {
      return state.folders.find(folder => folder.id === state.selectedFolderId) || null
    },

    // 获取选中文件夹中的项目
    getSelectedFolderItems: (state) => {
      if (!state.selectedFolderId) return []
      return state.items.filter(item => item.folderId === state.selectedFolderId)
    },

    // 获取所有项目（可选类型过滤）
    getAllItems: (state) => (type?: 'video' | 'audio' | 'image') => {
      if (!type) return state.items
      return state.items.filter(item => item.type === type)
    },

    // 获取选中的项目
    getSelectedItems: (state) => {
      return state.items.filter(item => state.selectedItemIds.has(item.id))
    },

    // 按类型分组统计
    getTypeStats: (state) => {
      const stats = {
        video: 0,
        audio: 0,
        image: 0,
        total: state.items.length
      }

      state.items.forEach(item => {
        stats[item.type]++
      })

      return stats
    },

    // 搜索项目
    searchItems: (state) => (query: string) => {
      if (!query.trim()) return state.items

      const lowerQuery = query.toLowerCase()
      return state.items.filter(item =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.path.toLowerCase().includes(lowerQuery)
      )
    }
  },

  actions: {
    // 添加文件夹（内部方法，不自动保存）
    addFolderInternal(folder: Omit<MediaFolder, 'id'>): MediaFolder {
      const newFolder: MediaFolder = {
        ...folder,
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      this.folders.push(newFolder)
      return newFolder
    },

    // 添加文件夹
    addFolder(folder: Omit<MediaFolder, 'id'>) {
      const newFolder = this.addFolderInternal(folder)
      this.debouncedSave()
      return newFolder
    },

    // 移除文件夹
    removeFolder(folderId: string) {
      this.folders = this.folders.filter(folder => folder.id !== folderId)
      this.items = this.items.filter(item => item.folderId !== folderId)

      if (this.selectedFolderId === folderId) {
        this.selectedFolderId = null
      }

      this.debouncedSave()
    },

    // 更新文件夹
    updateFolder(folderId: string, updates: Partial<MediaFolder>) {
      const index = this.folders.findIndex(folder => folder.id === folderId)
      if (index !== -1) {
        this.folders[index] = { ...this.folders[index], ...updates }
        this.debouncedSave()
      }
    },

    // 设置选中的文件夹
    setSelectedFolder(folderId: string | null) {
      this.selectedFolderId = folderId
      this.selectedItemIds.clear()
      this.debouncedSave()
    },

    // 切换文件夹展开状态
    toggleFolderExpanded(folderId: string) {
      const folder = this.folders.find(f => f.id === folderId)
      if (folder) {
        folder.isExpanded = !folder.isExpanded
        this.debouncedSave()
      }
    },

    // 添加媒体项目（内部方法，不自动保存）
    addMediaItemInternal(item: Omit<MediaLibraryItem, 'id'>): MediaLibraryItem {
      const existingItem = this.items.find(existing =>
        existing.path === item.path && existing.folderId === item.folderId
      )

      if (existingItem) {
        Object.assign(existingItem, item)
        return existingItem
      }

      const newItem: MediaLibraryItem = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      this.items.push(newItem)
      return newItem
    },

    // 添加媒体项目
    addMediaItem(item: Omit<MediaLibraryItem, 'id'>) {
      this.addMediaItemInternal(item)
      this.debouncedSave()
    },

    // 批量添加媒体项目
    addMediaItems(items: Omit<MediaLibraryItem, 'id'>[]) {
      items.forEach(item => this.addMediaItemInternal(item))
      this.debouncedSave()
    },

    // 移除媒体项目
    removeMediaItem(itemId: string) {
      this.items = this.items.filter(item => item.id !== itemId)
      this.selectedItemIds.delete(itemId)
      this.debouncedSave()
    },

    // 批量移除媒体项目
    removeMediaItems(itemIds: string[]) {
      const idSet = new Set(itemIds)
      this.items = this.items.filter(item => !idSet.has(item.id))
      itemIds.forEach(id => this.selectedItemIds.delete(id))
      this.debouncedSave()
    },

    // 更新媒体项目
    updateMediaItem(itemId: string, updates: Partial<MediaLibraryItem>) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...updates }
        this.debouncedSave()
      }
    },

    // 设置选中的项目
    setSelectedItems(itemIds: string[]) {
      this.selectedItemIds.clear()
      itemIds.forEach(id => this.selectedItemIds.add(id))
      this.debouncedSave()
    },

    // 切换项目选中状态
    toggleItemSelected(itemId: string) {
      if (this.selectedItemIds.has(itemId)) {
        this.selectedItemIds.delete(itemId)
      } else {
        this.selectedItemIds.add(itemId)
      }
      this.debouncedSave()
    },

    // 清除所有选择
    clearSelection() {
      this.selectedItemIds.clear()
      this.debouncedSave()
    },

    // 全选当前文件夹
    selectAllInFolder() {
      if (!this.selectedFolderId) return

      const folderItems = this.items.filter(item => item.folderId === this.selectedFolderId)
      folderItems.forEach(item => this.selectedItemIds.add(item.id))
      this.debouncedSave()
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // 清空文件夹的所有项目
    clearFolderItems(folderId: string) {
      this.items = this.items.filter(item => item.folderId !== folderId)
      this.debouncedSave()
    },

    // 清空整个媒体库
    async clearLibrary() {
      this.folders = []
      this.items = []
      this.selectedFolderId = null
      this.selectedItemIds.clear()
      await this.flushSave()
    },

    // 防抖保存
    debouncedSave() {
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
      }
      saveDebounceTimer = setTimeout(() => {
        this.saveToStorage()
      }, SAVE_DEBOUNCE_MS)
    },

    // 强制立即保存
    async flushSave() {
      if (saveDebounceTimer) {
        clearTimeout(saveDebounceTimer)
        saveDebounceTimer = null
      }
      await this.saveToStorage()
    },

    // 保存到存储 - 修复版本，处理 Set 序列化问题
    async saveToStorage() {
      const serializeState = () => ({
        folders: this.folders.map(folder => ({ ...folder })),
        items: this.items.map(item => ({ ...item })),
        selectedFolderId: this.selectedFolderId,
        selectedItemIds: Array.from(this.selectedItemIds) // Set 转 Array
      });

      try {
        // 延迟初始化 mediaLibraryDB
        if (!mediaLibraryDB) {
          mediaLibraryDB = getMediaLibraryDB();
        }

        // 将 Proxy/Set 转换为可序列化的普通对象
        const data = serializeState();

        // 使用 Promise.race 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Storage operation timed out')), 3000);
        });

        await Promise.race([
          mediaLibraryDB.saveLibrary(data),
          timeoutPromise
        ]);
      } catch (error) {
        console.error('保存媒体库数据失败:', error)
        // 如果失败，尝试使用 localStorage 作为备用
        try {
          const backupData = serializeState();
          localStorage.setItem('mediaLibrary_backup', JSON.stringify(backupData));
        } catch (backupError) {
          console.error('备份到 localStorage 失败:', backupError);
        }
      }
    },

    // 从存储加载 - 修复版本，处理 Set 反序列化
    async loadFromStorage() {
      try {
        // 延迟初始化 mediaLibraryDB
        if (!mediaLibraryDB) {
          mediaLibraryDB = getMediaLibraryDB();
        }

        // 使用 Promise.race 设置超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Storage operation timed out')), 3000);
        });

        // 首先尝试从IndexedDB加载
        const data = await Promise.race([
          mediaLibraryDB.getLibrary(),
          timeoutPromise
        ]);

        if (data) {
          this.folders = data.folders || []
          this.items = data.items || []
          this.selectedFolderId = data.selectedFolderId || null
          // 将数组转换回 Set
          this.selectedItemIds = new Set(data.selectedItemIds || [])
        }
      } catch (error) {
        console.error('加载媒体库数据失败:', error)

        // 如果从 IndexedDB 加载失败，尝试从 localStorage 备份中恢复
        try {
          const backupData = localStorage.getItem('mediaLibrary_backup');
          if (backupData) {
            const parsedData = JSON.parse(backupData);
            this.folders = parsedData.folders || [];
            this.items = parsedData.items || [];
            this.selectedFolderId = parsedData.selectedFolderId || null;
            // 将数组转换回 Set
            this.selectedItemIds = new Set(parsedData.selectedItemIds || []);
            console.log('从 localStorage 备份恢复数据成功');
          }
        } catch (backupError) {
          console.error('从 localStorage 备份恢复失败:', backupError);
        }
      }
    },

    // 初始化存储（包括迁移）- 修复版本
    async initializeStorage() {
      try {
        await this.loadFromStorage()

        // 如果IndexedDB中没有数据，尝试从localStorage迁移
        if (this.folders.length === 0 && this.items.length === 0) {
          try {
            // 延迟初始化 mediaLibraryDB
            if (!mediaLibraryDB) {
              mediaLibraryDB = getMediaLibraryDB();
            }

            // 使用 Promise.race 设置超时
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Migration operation timed out')), 3000);
            });

            await Promise.race([
              mediaLibraryDB.migrateFromLocalStorage(),
              timeoutPromise
            ]);

            await this.loadFromStorage();
          } catch (migrationError) {
            console.error('从 localStorage 迁移失败:', migrationError);
            // 尝试直接从 localStorage 加载
            try {
              const localData = localStorage.getItem('mediaLibrary');
              if (localData) {
                const parsedData = JSON.parse(localData);
                this.folders = parsedData.folders || [];
                this.items = parsedData.items || [];
                this.selectedFolderId = parsedData.selectedFolderId || null;
                // 初始化空 Set
                this.selectedItemIds = new Set();
                console.log('直接从 localStorage 加载数据成功');
              }
            } catch (directLoadError) {
              console.error('直接从 localStorage 加载失败:', directLoadError);
            }
          }
        }
      } catch (error) {
        console.error('初始化媒体库存储失败:', error)
      }
    },

    // 扫描文件夹中的媒体文件（优化版本）
    async scanFolder(folderId: string, files: Array<{
      name: string
      path: string
      size: number
      lastModified: number
      type: 'video' | 'audio' | 'image'
    }>) {
      const folder = this.folders.find(f => f.id === folderId)
      if (!folder) return

      this.setLoading(true)

      try {
        // 移除该文件夹下的现有项目
        this.items = this.items.filter(item => item.folderId !== folderId)

        // 批量添加新项目（使用内部方法，避免重复保存）
        const mediaItems = files.map(file => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          folderId: folderId
        }))

        mediaItems.forEach(item => this.addMediaItemInternal(item))

        // 更新文件夹信息
        const folderIndex = this.folders.findIndex(f => f.id === folderId)
        if (folderIndex !== -1) {
          this.folders[folderIndex].itemCount = files.length
          this.folders[folderIndex].lastScanned = Date.now()
        }

        // 一次性保存
        await this.flushSave()
      } catch (error) {
        console.error('扫描文件夹失败:', error)
      } finally {
        this.setLoading(false)
      }
    },

    // 获取最近添加的项目
    getRecentItems(limit: number = 10) {
      return [...this.items]
        .sort((a, b) => b.lastModified - a.lastModified)
        .slice(0, limit)
    }
  }
})