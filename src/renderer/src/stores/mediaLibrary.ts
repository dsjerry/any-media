import { defineStore } from 'pinia'
import { getMediaLibraryDB } from '../services/mediaLibraryDB'

// 延迟初始化 mediaLibraryDB
let mediaLibraryDB: any = null;

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
    // 添加文件夹
    addFolder(folder: Omit<MediaFolder, 'id'>) {
      const newFolder: MediaFolder = {
        ...folder,
        id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      this.folders.push(newFolder)
      this.saveToStorage()
      return newFolder
    },

    // 移除文件夹
    removeFolder(folderId: string) {
      this.folders = this.folders.filter(folder => folder.id !== folderId)
      // 同时移除该文件夹下的所有项目
      this.items = this.items.filter(item => item.folderId !== folderId)

      // 如果移除的是当前选中的文件夹，清除选择
      if (this.selectedFolderId === folderId) {
        this.selectedFolderId = null
      }

      this.saveToStorage()
    },

    // 更新文件夹
    updateFolder(folderId: string, updates: Partial<MediaFolder>) {
      const index = this.folders.findIndex(folder => folder.id === folderId)
      if (index !== -1) {
        this.folders[index] = { ...this.folders[index], ...updates }
        this.saveToStorage()
      }
    },

    // 设置选中的文件夹
    setSelectedFolder(folderId: string | null) {
      this.selectedFolderId = folderId
      // 清除项目选择，因为切换了文件夹
      this.selectedItemIds.clear()
      this.saveToStorage()
    },

    // 切换文件夹展开状态
    toggleFolderExpanded(folderId: string) {
      const folder = this.folders.find(f => f.id === folderId)
      if (folder) {
        folder.isExpanded = !folder.isExpanded
        this.saveToStorage()
      }
    },

    // 添加媒体项目
    addMediaItem(item: Omit<MediaLibraryItem, 'id'>) {
      const existingItem = this.items.find(existing =>
        existing.path === item.path && existing.folderId === item.folderId
      )

      if (existingItem) {
        // 如果项目已存在，更新它
        Object.assign(existingItem, item)
      } else {
        // 否则添加新项目
        const newItem: MediaLibraryItem = {
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        this.items.push(newItem)
      }

      this.saveToStorage()
    },

    // 批量添加媒体项目
    addMediaItems(items: Omit<MediaLibraryItem, 'id'>[]) {
      items.forEach(item => {
        this.addMediaItem(item)
      })
    },

    // 移除媒体项目
    removeMediaItem(itemId: string) {
      this.items = this.items.filter(item => item.id !== itemId)
      this.selectedItemIds.delete(itemId)
      this.saveToStorage()
    },

    // 批量移除媒体项目
    removeMediaItems(itemIds: string[]) {
      this.items = this.items.filter(item => !itemIds.includes(item.id))
      itemIds.forEach(id => this.selectedItemIds.delete(id))
      this.saveToStorage()
    },

    // 更新媒体项目
    updateMediaItem(itemId: string, updates: Partial<MediaLibraryItem>) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...updates }
        this.saveToStorage()
      }
    },

    // 设置选中的项目
    setSelectedItems(itemIds: string[]) {
      this.selectedItemIds.clear()
      itemIds.forEach(id => this.selectedItemIds.add(id))
    },

    // 切换项目选中状态
    toggleItemSelected(itemId: string) {
      if (this.selectedItemIds.has(itemId)) {
        this.selectedItemIds.delete(itemId)
      } else {
        this.selectedItemIds.add(itemId)
      }
    },

    // 清除所有选择
    clearSelection() {
      this.selectedItemIds.clear()
    },

    // 全选当前文件夹
    selectAllInFolder() {
      if (!this.selectedFolderId) return

      const folderItems = this.items.filter(item => item.folderId === this.selectedFolderId)
      folderItems.forEach(item => this.selectedItemIds.add(item.id))
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // 清空文件夹的所有项目
    clearFolderItems(folderId: string) {
      this.items = this.items.filter(item => item.folderId !== folderId)
      this.saveToStorage()
    },

    // 清空整个媒体库
    async clearLibrary() {
      this.folders = []
      this.items = []
      this.selectedFolderId = null
      this.selectedItemIds.clear()
      await this.saveToStorage()
    },

    // 保存到存储
    async saveToStorage() {
      try {
        // 延迟初始化 mediaLibraryDB
        if (!mediaLibraryDB) {
          mediaLibraryDB = getMediaLibraryDB();
        }
        
        const data = {
          folders: this.folders,
          items: this.items,
          selectedFolderId: this.selectedFolderId
        }
        
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
          const backupData = {
            folders: this.folders,
            items: this.items,
            selectedFolderId: this.selectedFolderId
          };
          localStorage.setItem('mediaLibrary_backup', JSON.stringify(backupData));
        } catch (backupError) {
          console.error('备份到 localStorage 失败:', backupError);
        }
      }
    },

    // 从存储加载
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
            console.log('从 localStorage 备份恢复数据成功');
          }
        } catch (backupError) {
          console.error('从 localStorage 备份恢复失败:', backupError);
        }
      }
    },

    // 初始化存储（包括迁移）
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

    // 扫描文件夹中的媒体文件
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
        // 清空现有项目
        this.clearFolderItems(folderId)

        // 添加新项目
        const mediaItems = files.map(file => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          folderId: folderId
        }))

        this.addMediaItems(mediaItems)

        // 更新文件夹信息
        this.updateFolder(folderId, {
          itemCount: files.length,
          lastScanned: Date.now()
        })

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