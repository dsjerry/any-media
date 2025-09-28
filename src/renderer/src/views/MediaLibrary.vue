<template>
  <div class="media-library-container">
    <!-- 页面头部 -->
    <div class="library-header">
      <div class="header-content">
        <h1 class="page-title">媒体库</h1>
        <p class="page-subtitle">管理您的媒体文件收藏</p>
      </div>
      <div class="header-actions">
        <button @click="addFolder" class="glass-btn primary">
          <span class="btn-icon">📁</span>
          <span>添加文件夹</span>
        </button>
        <button @click="refreshLibrary" class="glass-btn secondary" :disabled="mediaLibraryStore.isLoading">
          <span class="btn-icon">🔄</span>
          <span>刷新</span>
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card glass-card">
          <div class="stat-icon">📹</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.video }}</div>
            <div class="stat-label">视频</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon">🎵</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.audio }}</div>
            <div class="stat-label">音频</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon">🖼️</div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.image }}</div>
            <div class="stat-label">图片</div>
          </div>
        </div>
        <div class="stat-card glass-card">
          <div class="stat-icon">📂</div>
          <div class="stat-content">
            <div class="stat-number">{{ mediaLibraryStore.folders.length }}</div>
            <div class="stat-label">文件夹</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="library-content">
      <!-- 文件夹列表 -->
      <div class="folders-section">
        <h2 class="section-title">文件夹</h2>
        <div class="folders-list">
          <div
            v-for="folder in mediaLibraryStore.folders"
            :key="folder.id"
            class="folder-item glass-card"
            :class="{ active: mediaLibraryStore.selectedFolderId === folder.id }"
            @click="selectFolder(folder.id)"
          >
            <div class="folder-info">
              <div class="folder-icon">📁</div>
              <div class="folder-details">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-path">{{ folder.path }}</div>
                <div class="folder-meta">
                  <span class="item-count">{{ folder.itemCount }} 个文件</span>
                  <span class="scan-time">• 扫描于 {{ formatTime(folder.lastScanned) }}</span>
                </div>
              </div>
            </div>
            <div class="folder-actions">
              <button @click.stop="rescanFolder(folder)" class="icon-btn" title="重新扫描">
                🔄
              </button>
              <button @click.stop="removeFolder(folder.id)" class="icon-btn danger" title="移除">
                🗑️
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="mediaLibraryStore.folders.length === 0" class="empty-state">
            <div class="empty-icon">📁</div>
            <div class="empty-text">还没有添加任何文件夹</div>
            <button @click="addFolder" class="glass-btn primary">
              添加第一个文件夹
            </button>
          </div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="files-section">
        <div class="files-header">
          <h2 class="section-title">
            {{ selectedFolder ? selectedFolder.name : '所有文件' }}
          </h2>
          <div class="files-controls">
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文件..."
                class="glass-input"
              />
            </div>
            <select v-model="typeFilter" class="glass-input">
              <option value="">所有类型</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="image">图片</option>
            </select>
          </div>
        </div>

        <div class="files-grid">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="file-item glass-card"
            :class="{ selected: mediaLibraryStore.selectedItemIds.has(item.id) }"
            @click="toggleFileSelection(item.id)"
            @dblclick="playItem(item)"
          >
            <div class="file-preview">
              <div class="file-icon" :class="item.type">
                {{ getFileIcon(item.type) }}
              </div>
            </div>
            <div class="file-info">
              <div class="file-name" :title="item.name">{{ item.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(item.size) }}</span>
                <span class="separator">•</span>
                <span class="file-time">{{ formatTime(item.lastModified) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <button @click.stop="playItem(item)" class="icon-btn" title="播放">
                ▶️
              </button>
              <button @click.stop="removeFile(item.id)" class="icon-btn danger" title="移除">
                🗑️
              </button>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredItems.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">
              {{ searchQuery ? '没有找到匹配的文件' : '这个文件夹是空的' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="mediaLibraryStore.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">扫描文件夹中...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaLibraryStore } from '@/stores/mediaLibrary'
import { useMediaStore } from '@/stores/media'
import type { MediaLibraryItem, MediaFolder } from '@/stores/mediaLibrary'

const router = useRouter()
const mediaLibraryStore = useMediaLibraryStore()
const mediaStore = useMediaStore()

const searchQuery = ref('')
const typeFilter = ref('')

// 计算属性
const stats = computed(() => mediaLibraryStore.getTypeStats)
const selectedFolder = computed(() => mediaLibraryStore.getSelectedFolder)

const filteredItems = computed(() => {
  let items = mediaLibraryStore.getSelectedFolderItems

  // 应用类型过滤
  if (typeFilter.value) {
    items = items.filter(item => item.type === typeFilter.value)
  }

  // 应用搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  return items
})

// 方法
const addFolder = async () => {
  try {
    const folderPath = await window.electronAPI.selectFolder()
    if (folderPath) {
      const folderName = folderPath.split('\\').pop() || folderPath.split('/').pop() || '未知文件夹'

      // 添加文件夹到库
      const folder = mediaLibraryStore.addFolder({
        name: folderName,
        path: folderPath,
        itemCount: 0,
        lastScanned: Date.now(),
        isExpanded: true
      })

      // 开始扫描文件夹
      await scanFolder(folder.id, folderPath)
    }
  } catch (error) {
    console.error('添加文件夹失败:', error)
  }
}

const scanFolder = async (folderId: string, folderPath: string) => {
  try {
    mediaLibraryStore.setLoading(true)

    // 扫描文件夹中的文件
    const files = await window.electronAPI.scanFolder(folderPath)

    // 添加文件到媒体库
    await mediaLibraryStore.scanFolder(folderId, files)

    // 自动选择新添加的文件夹
    mediaLibraryStore.setSelectedFolder(folderId)
  } catch (error) {
    console.error('扫描文件夹失败:', error)
    alert('扫描文件夹失败: ' + error.message)
  } finally {
    mediaLibraryStore.setLoading(false)
  }
}

const rescanFolder = async (folder: MediaFolder) => {
  await scanFolder(folder.id, folder.path)
}

const removeFolder = (folderId: string) => {
  if (confirm('确定要移除这个文件夹吗？这不会删除实际的文件。')) {
    mediaLibraryStore.removeFolder(folderId)
  }
}

const selectFolder = (folderId: string) => {
  mediaLibraryStore.setSelectedFolder(folderId)
}

const toggleFileSelection = (itemId: string) => {
  mediaLibraryStore.toggleItemSelected(itemId)
}

const playItem = (item: MediaLibraryItem) => {
  // 设置当前播放文件并跳转到播放器页面
  const mediaFile = {
    name: item.name,
    path: item.path,
    type: item.type
  }

  // 使用媒体 store 来设置当前文件
  mediaStore.setCurrentFile(mediaFile)

  // 跳转到播放器页面
  router.push('/player')
}

const removeFile = (itemId: string) => {
  mediaLibraryStore.removeMediaItem(itemId)
}

const refreshLibrary = () => {
  // 重新加载所有文件夹的数据
  mediaLibraryStore.folders.forEach(folder => {
    rescanFolder(folder)
  })
}

// 工具函数
const getFileIcon = (type: string) => {
  const icons = {
    video: '🎬',
    audio: '🎵',
    image: '🖼️'
  }
  return icons[type as keyof typeof icons] || '📄'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`
  } else {
    return date.toLocaleDateString()
  }
}

// 生命周期
onMounted(async () => {
  // 初始化媒体库存储
  await mediaLibraryStore.initializeStorage()
})
</script>

<style scoped>
/* 媒体库页面毛玻璃风格 */
.media-library-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  overflow: hidden;
  padding: 40px 20px;
}

.media-library-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 153, 204, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 页面头部 */
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.page-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.glass-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.glass-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.glass-btn:hover::before {
  left: 100%;
}

.glass-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
}

.glass-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.glass-btn.primary {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(0, 153, 204, 0.8));
  border: 1px solid rgba(0, 212, 255, 0.4);
}

.glass-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(0, 153, 204, 0.9));
  border-color: rgba(0, 212, 255, 0.6);
}

.btn-icon {
  font-size: 16px;
}

/* 统计信息 */
.stats-section {
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
  box-shadow: 0 12px 40px rgba(0, 212, 255, 0.2);
}

.stat-icon {
  font-size: 32px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 主要内容区域 */
.library-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;
  position: relative;
  z-index: 1;
  min-height: 600px;
}

/* 文件夹列表 */
.folders-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.folders-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.folder-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.folder-item:hover::before {
  left: 100%;
}

.folder-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
}

.folder-item.active {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--accent-primary);
}

.folder-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.folder-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.folder-details {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-path {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.item-count {
  color: var(--accent-primary);
}

.folder-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.folder-item:hover .folder-actions {
  opacity: 1;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-size: 14px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.icon-btn.danger:hover {
  background: rgba(255, 71, 87, 0.3);
  color: var(--danger);
}

/* 文件列表 */
.files-section {
  display: flex;
  flex-direction: column;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.files-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 200px;
  padding-left: 40px;
}

.search-box::before {
  content: '🔍';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-secondary);
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  flex: 1;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.file-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.file-item:hover::before {
  left: 100%;
}

.file-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
}

.file-item.selected {
  background: rgba(0, 212, 255, 0.1);
  border-color: var(--accent-primary);
}

.file-preview {
  flex-shrink: 0;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.file-icon.video {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1));
}

.file-icon.audio {
  background: linear-gradient(135deg, rgba(72, 219, 251, 0.2), rgba(72, 219, 251, 0.1));
}

.file-icon.image {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.2), rgba(74, 222, 128, 0.1));
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.separator {
  color: var(--text-tertiary);
}

.file-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 24px;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--glass-shadow);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .library-content {
    grid-template-columns: 1fr;
  }

  .folders-section {
    order: 2;
  }

  .files-section {
    order: 1;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .media-library-container {
    padding: 20px 16px;
  }

  .library-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 16px;
  }

  .files-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .files-controls {
    flex-wrap: wrap;
  }

  .search-box input {
    width: 100%;
  }

  .files-grid {
    grid-template-columns: 1fr;
  }

  .folder-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .folder-actions {
    align-self: flex-end;
    opacity: 1;
  }

  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .file-actions {
    opacity: 1;
    align-self: flex-end;
  }
}
</style>