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
    <div :class="['library-content', { 'sidebar-collapsed': isFoldersCollapsed }]">
      <!-- 文件夹列表 -->
      <div :class="['folders-section', { collapsed: isFoldersCollapsed }]">
        <div class="folders-header">
          <h2 class="section-title">文件夹</h2>
          <button
            class="sidebar-toggle"
            type="button"
            @click="toggleFoldersPanel"
            :aria-expanded="!isFoldersCollapsed"
            :title="isFoldersCollapsed ? '展开文件夹面板' : '收起文件夹面板'"
          >
            <span class="toggle-icon">{{ isFoldersCollapsed ? '▶️' : '◀️' }}</span>
            <span class="toggle-text">{{ isFoldersCollapsed ? '展开' : '收起' }}</span>
          </button>
        </div>
        <div class="folders-list" v-show="!isFoldersCollapsed">
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
          <div class="section-heading">
            <h2 class="section-title">
              {{ selectedFolder ? selectedFolder.name : '所有文件' }}
            </h2>
            <p class="section-subtitle">
              {{ filteredItems.length }} 个文件
              <span v-if="selectionCount">· {{ selectionCount }} 个已选</span>
            </p>
          </div>
          <div class="files-controls">
            <div class="search-box">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索文件、路径或扩展名..."
                class="glass-input"
              />
            </div>
            <select v-model="typeFilter" class="glass-input">
              <option value="">所有类型</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
              <option value="image">图片</option>
            </select>
            <select v-model="sortOption" class="glass-input">
              <option value="name">名称</option>
              <option value="date">最近修改</option>
              <option value="size">文件大小</option>
            </select>
            <div class="view-toggle" role="group" aria-label="视图模式">
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: viewMode === 'grid' }"
                @click="viewMode = 'grid'"
                title="网格视图"
              >
                ⬚
              </button>
              <button
                type="button"
                class="toggle-btn"
                :class="{ active: viewMode === 'list' }"
                @click="viewMode = 'list'"
                title="列表视图"
              >
                ≣
              </button>
            </div>
            <button @click="refreshLibrary" class="icon-btn" :disabled="mediaLibraryStore.isLoading" title="刷新">
              🔄
            </button>
          </div>
        </div>

        <div class="selection-toolbar glass-card" v-if="selectionCount > 0">
          <div class="selection-info">
            <span class="selection-count">{{ selectionCount }}</span>
            <span>个文件已选</span>
          </div>
          <div class="selection-actions">
            <button class="glass-btn secondary" @click="selectAllVisible">全选可见</button>
            <button class="glass-btn secondary" @click="clearSelection">清除选择</button>
            <button class="glass-btn primary" @click="playSelection">播放</button>
            <button class="glass-btn danger" @click="removeSelection">移除</button>
          </div>
        </div>

        <div class="files-body">
          <div :class="['files-grid', viewMode]">
            <div
              v-for="(item, index) in filteredItems"
              :key="item.id"
              class="file-item glass-card"
              :class="{ selected: mediaLibraryStore.selectedItemIds.has(item.id), list: viewMode === 'list' }"
              @click="handleFileClick($event, item, index)"
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
                <div class="file-extra" v-if="viewMode === 'list'">
                  <span>{{ getFolderName(item.folderId) }}</span>
                  <span class="separator">•</span>
                  <span>{{ item.path }}</span>
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

          <aside class="preview-pane glass-card" v-if="primarySelection">
            <div class="preview-header">
              <div class="preview-icon" :class="primarySelection.type">
                {{ getFileIcon(primarySelection.type) }}
              </div>
              <div class="preview-titles">
                <h3 class="preview-title">{{ primarySelection.name }}</h3>
                <p class="preview-path" :title="primarySelection.path">{{ primarySelection.path }}</p>
              </div>
            </div>
            <div v-if="isImageSelected" class="preview-media">
              <div class="image-preview">
                <div class="image-stage" :class="{ loading: isImageLoading }">
                  <div v-if="isImageLoading" class="image-state loading">
                    <div class="loading-spinner small"></div>
                    <span>图片加载中...</span>
                  </div>
                  <div v-else-if="imagePreviewError" class="image-state error">
                    {{ imagePreviewError }}
                  </div>
                  <img
                    v-else-if="previewImageUrl"
                    :src="previewImageUrl"
                    :alt="primarySelection?.name"
                    :style="{ transform: `scale(${imageZoom / 100})` }"
                  />
                  <div v-else class="image-state empty">暂无预览</div>
                </div>
              </div>
              <div class="image-controls">
                <label class="control-label" for="imageZoomRange">缩放</label>
                <div class="zoom-control">
                  <input
                    id="imageZoomRange"
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    v-model.number="imageZoom"
                  />
                  <span class="zoom-value">{{ imageZoom }}%</span>
                </div>
                <div class="image-actions">
                  <button class="glass-btn secondary" type="button" @click="resetImageZoom">重置缩放</button>
                  <button class="glass-btn secondary" type="button" @click="openImageInNewTab" :disabled="!previewImageUrl">
                    新窗口查看
                  </button>
                  <button class="glass-btn primary" type="button" @click="downloadImage" :disabled="!previewImageUrl">
                    下载图片
                  </button>
                </div>
              </div>
            </div>
            <div class="preview-meta">
              <div class="meta-row">
                <span class="meta-label">类型</span>
                <span class="meta-value">{{ primarySelection.type }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">文件夹</span>
                <span class="meta-value">{{ getFolderName(primarySelection.folderId) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">大小</span>
                <span class="meta-value">{{ formatFileSize(primarySelection.size) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">更新时间</span>
                <span class="meta-value">{{ formatAbsoluteTime(primarySelection.lastModified) }}</span>
              </div>
            </div>
            <div class="preview-actions">
              <button class="glass-btn primary" @click="playItem(primarySelection)">
                ▶️ 播放
              </button>
              <button class="glass-btn secondary" @click="clearSelection">
                ✕ 清除选择
              </button>
              <button class="glass-btn danger" @click="removeSelection">
                🗑️ 移除文件
              </button>
            </div>
          </aside>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaLibraryStore } from '@/stores/mediaLibrary'
import { useMediaStore } from '@/stores/media'
import type { MediaLibraryItem, MediaFolder } from '@/stores/mediaLibrary'
import { openImagePreviewWindow } from '@/utils/imagePreview'

const router = useRouter()
const mediaLibraryStore = useMediaLibraryStore()
const mediaStore = useMediaStore()

const searchQuery = ref('')
const typeFilter = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const sortOption = ref<'name' | 'date' | 'size'>('name')
const isFoldersCollapsed = ref(false)
const previewImageUrl = ref<string | null>(null)
const isImageLoading = ref(false)
const imagePreviewError = ref<string | null>(null)
const imageZoom = ref(100)
const lastSelectedIndex = ref<number | null>(null)

// 计算属性
const stats = computed(() => mediaLibraryStore.getTypeStats)
const selectedFolder = computed(() => mediaLibraryStore.getSelectedFolder)
const selectedItems = computed(() => mediaLibraryStore.getSelectedItems)
const primarySelection = computed(() => selectedItems.value[0] || null)
const selectionCount = computed(() => selectedItems.value.length)
const isImageSelected = computed(() => primarySelection.value?.type === 'image')

const baseItems = computed(() => (
  mediaLibraryStore.selectedFolderId
    ? mediaLibraryStore.getSelectedFolderItems
    : mediaLibraryStore.items
))

const sortItems = (items: MediaLibraryItem[]) => {
  const sorted = [...items]
  switch (sortOption.value) {
    case 'date':
      return sorted.sort((a, b) => b.lastModified - a.lastModified)
    case 'size':
      return sorted.sort((a, b) => b.size - a.size)
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
  }
}

const filteredItems = computed(() => {
  let items = [...baseItems.value]

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

  return sortItems(items)
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
    const message = error instanceof Error ? error.message : String(error)
    alert('扫描文件夹失败: ' + message)
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

const selectAllVisible = () => {
  if (!filteredItems.value.length) return
  mediaLibraryStore.setSelectedItems(filteredItems.value.map(item => item.id))
}

const clearSelection = () => {
  mediaLibraryStore.clearSelection()
  lastSelectedIndex.value = null
}

const playSelection = () => {
  const target = primarySelection.value || filteredItems.value[0]
  if (target) {
    playItem(target)
  }
}

const toggleFoldersPanel = () => {
  isFoldersCollapsed.value = !isFoldersCollapsed.value
}

const handleFileClick = (event: MouseEvent, item: MediaLibraryItem, index: number) => {
  const isRangeSelection = event.shiftKey
  const isToggleSelection = event.ctrlKey || event.metaKey

  if (isRangeSelection && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    const rangeIds = filteredItems.value.slice(start, end + 1).map(entry => entry.id)
    mediaLibraryStore.setSelectedItems(rangeIds)
    return
  }

  if (isToggleSelection) {
    mediaLibraryStore.toggleItemSelected(item.id)
    if (mediaLibraryStore.selectedItemIds.has(item.id)) {
      lastSelectedIndex.value = index
    }
    return
  }

  mediaLibraryStore.setSelectedItems([item.id])
  lastSelectedIndex.value = index
}

let imagePreviewRequestId = 0
watch(() => primarySelection.value?.path, async () => {
  imagePreviewError.value = null
  previewImageUrl.value = null
  imageZoom.value = 100

  if (!isImageSelected.value || !primarySelection.value?.path) {
    isImageLoading.value = false
    return
  }

  const currentRequest = ++imagePreviewRequestId
  isImageLoading.value = true

  try {
    const dataUrl = await window.electronAPI.getFileData(primarySelection.value.path)
    if (currentRequest !== imagePreviewRequestId) return
    if (dataUrl) {
      previewImageUrl.value = dataUrl
    } else {
      imagePreviewError.value = '无法加载图片数据'
    }
  } catch (error) {
    if (currentRequest === imagePreviewRequestId) {
      console.error('Failed to load image preview:', error)
      imagePreviewError.value = '加载图片失败'
    }
  } finally {
    if (currentRequest === imagePreviewRequestId) {
      isImageLoading.value = false
    }
  }
})

const resetImageZoom = () => {
  imageZoom.value = 100
}

const downloadImage = () => {
  if (!previewImageUrl.value || !primarySelection.value) return
  const anchor = document.createElement('a')
  anchor.href = previewImageUrl.value
  anchor.download = primarySelection.value.name
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

const openImageInNewTab = () => {
  if (!previewImageUrl.value) return
  const title = primarySelection.value?.name || '图片预览'
  const success = openImagePreviewWindow(previewImageUrl.value, title)
  if (!success) {
    alert('无法打开预览窗口，请检查浏览器弹窗设置')
  }
}

const removeSelection = () => {
  if (!selectedItems.value.length) return
  if (confirm(`确定要移除选中的 ${selectedItems.value.length} 个文件吗？`)) {
    mediaLibraryStore.removeMediaItems(selectedItems.value.map(item => item.id))
  }
}

const formatAbsoluteTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const getFolderName = (folderId: string) => {
  const folder = mediaLibraryStore.folders.find(folder => folder.id === folderId)
  return folder ? folder.name : '未分类'
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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  overflow-y: auto;
  padding: 40px 20px;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  height: 100%;
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
  grid-template-columns: 320px 1fr;
  gap: 30px;
  position: relative;
  z-index: 1;
  min-height: 600px;
  width: 100%;
  box-sizing: border-box;
  align-items: flex-start;
}

.library-content.sidebar-collapsed {
  grid-template-columns: 96px 1fr;
}

/* 文件夹列表 */
.folders-section {
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  min-height: 0;
}

.folders-section.collapsed {
  width: 80px;
}

.folders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.sidebar-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border-radius: 12px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
}

.sidebar-toggle:hover {
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.folders-section.collapsed .section-title,
.folders-section.collapsed .toggle-text {
  display: none;
}

.folders-section.collapsed .folders-header {
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.folders-section.collapsed .sidebar-toggle {
  padding: 10px;
  border-radius: 50%;
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
  min-height: 0;
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

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

.files-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.view-toggle {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(12px);
}

.toggle-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: rgba(0, 212, 255, 0.15);
  color: var(--accent-primary);
}

.toggle-btn:not(.active):hover {
  background: rgba(255, 255, 255, 0.1);
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

.files-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  flex: 1;
  padding-right: 8px;
}

.files-grid.list {
  display: flex;
  flex-direction: column;
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

.file-item.list {
  align-items: flex-start;
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

.file-extra {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  gap: 6px;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selection-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 20px;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px 20px;
  border-radius: 16px;
}

.selection-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  color: var(--text-secondary);
}

.selection-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent-primary);
}

.selection-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.selection-actions .glass-btn.danger {
  background: rgba(255, 82, 82, 0.15);
  border-color: rgba(255, 82, 82, 0.3);
  color: #ff6b6b;
}

.selection-actions .glass-btn.danger:hover {
  background: rgba(255, 82, 82, 0.2);
}

.preview-pane {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
}

.preview-media {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.image-preview {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.25);
  padding: 12px;
}

.image-stage {
  height: 220px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.image-stage img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease;
}

.image-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.image-state.error {
  color: #ff6b6b;
}

.image-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-control input[type='range'] {
  flex: 1;
}

.zoom-value {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 48px;
  text-align: right;
}

.image-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-spinner.small {
  width: 28px;
  height: 28px;
  border-width: 2px;
}

.preview-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.preview-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: rgba(255, 255, 255, 0.1);
}

.preview-titles {
  flex: 1;
  min-width: 0;
}

.preview-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-path {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-label {
  color: var(--text-tertiary);
}

.meta-value {
  color: var(--text-primary);
  text-align: right;
  margin-left: 12px;
}

.preview-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 1200px) {
  .library-content {
    grid-template-columns: minmax(240px, 35%) 1fr;
    gap: 20px;
  }

  .files-body {
    flex-direction: column;
  }

  .preview-pane {
    width: 100%;
    position: static;
  }

  .image-stage {
    height: 200px;
  }

  .preview-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
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

  .library-content {
    grid-template-columns: minmax(72px, 32%) 1fr;
    gap: 16px;
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