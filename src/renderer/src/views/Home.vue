<template>
  <div class="home-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">欢迎使用 Any Player</h1>
      <p class="page-subtitle">管理并播放您的媒体文件</p>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card glass-card">
        <div class="stat-icon">📹</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.video }}</div>
          <div class="stat-label">视频</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon">🎵</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.audio }}</div>
          <div class="stat-label">音频</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon">🖼️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.image }}</div>
          <div class="stat-label">图片</div>
        </div>
      </div>
      <div class="stat-card glass-card">
        <div class="stat-icon">📁</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.folders }}</div>
          <div class="stat-label">文件夹</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section" v-if="totalCount > 0">
      <div class="chart-card glass-card">
        <h3 class="chart-title">媒体类型分布</h3>
        <div class="pie-chart">
          <svg viewBox="0 0 100 100" class="pie-svg">
            <circle
              v-for="(segment, index) in pieSegments"
              :key="index"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              :stroke="segment.color"
              stroke-width="20"
              :stroke-dasharray="segment.dashArray"
              :stroke-dashoffset="segment.dashOffset"
              class="pie-segment"
            />
          </svg>
          <div class="pie-center">
            <div class="pie-total">{{ totalCount }}</div>
            <div class="pie-label">总计</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item" v-for="item in legendItems" :key="item.type">
            <span class="legend-color" :style="{ background: item.color }"></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-value">{{ item.value }}</span>
            <span class="legend-percent">{{ item.percent }}%</span>
          </div>
        </div>
      </div>

      <div class="chart-card glass-card">
        <h3 class="chart-title">文件大小分布</h3>
        <div class="bar-chart">
          <div class="bar-item" v-for="item in sizeDistribution" :key="item.label">
            <div class="bar-label">{{ item.label }}</div>
            <div class="bar-wrapper">
              <div 
                class="bar-fill" 
                :style="{ width: item.percent + '%', background: item.color }"
              ></div>
            </div>
            <div class="bar-value">{{ item.count }} 个</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="action-section">
      <button @click="openFile" class="glass-btn primary large">
        打开媒体文件
      </button>
      <button @click="goToLibrary" class="glass-btn secondary large">
        打开媒体库
      </button>
    </div>

    <!-- 最近文件 -->
    <div v-if="recentFiles.length > 0" class="recent-section">
      <h2 class="section-title">最近打开的文件</h2>
      <div class="recent-files-list">
        <div
          v-for="file in recentFiles"
          :key="file.path"
          class="recent-file-item glass-card"
          @click="openRecentFile(file)"
        >
          <div class="file-icon" :class="file.type">{{ getTypeIcon(file.type) }}</div>
          <div class="file-info">
            <h3 class="file-name">{{ file.name }}</h3>
            <p class="file-path">{{ file.path }}</p>
          </div>
          <div class="file-type-badge">{{ file.type.toUpperCase() }}</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📂</div>
      <h3 class="empty-title">还没有媒体文件</h3>
      <p class="empty-text">从媒体库添加文件夹或在下方打开文件</p>
      <button @click="goToLibrary" class="glass-btn primary">
        添加到媒体库
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import { useMediaLibraryStore } from '@/stores/mediaLibrary'
import type { MediaFile } from '@/stores/media'

const router = useRouter()
const mediaStore = useMediaStore()
const mediaLibraryStore = useMediaLibraryStore()

const recentFiles = computed(() => mediaStore.getRecentFiles())

const stats = computed(() => mediaLibraryStore.getTypeStats)
const totalCount = computed(() => stats.value.total)

const pieSegments = computed(() => {
  const { video, audio, image } = stats.value
  const total = totalCount.value
  if (total === 0) return []

  const colors = {
    video: '#ff6b6b',
    audio: '#48dbfb',
    image: '#4ade80'
  }

  let offset = 0
  const circumference = 2 * Math.PI * 40

  return [
    { type: 'video', value: video, color: colors.video, percent: Math.round(video / total * 100) },
    { type: 'audio', value: audio, color: colors.audio, percent: Math.round(audio / total * 100) },
    { type: 'image', value: image, color: colors.image, percent: Math.round(image / total * 100) }
  ].filter(s => s.value > 0).map(segment => {
    const dashArray = (segment.percent / 100) * circumference
    const dashOffset = -offset
    offset += dashArray
    return {
      ...segment,
      dashArray: `${dashArray} ${circumference}`,
      dashOffset
    }
  })
})

const legendItems = computed(() => {
  const { video, audio, image } = stats.value
  const total = totalCount.value
  if (total === 0) return []

  const labels = { video: '视频', audio: '音频', image: '图片' }
  const colors = { video: '#ff6b6b', audio: '#48dbfb', image: '#4ade80' }

  return [
    { type: 'video', label: labels.video, value: video, color: colors.video, percent: Math.round(video / total * 100) },
    { type: 'audio', label: labels.audio, value: audio, color: colors.audio, percent: Math.round(audio / total * 100) },
    { type: 'image', label: labels.image, value: image, color: colors.image, percent: Math.round(image / total * 100) }
  ].filter(item => item.value > 0)
})

const sizeDistribution = computed(() => {
  const items = mediaLibraryStore.items
  const total = items.length
  if (total === 0) return []

  const ranges = [
    { label: '< 1MB', min: 0, max: 1024 * 1024, color: '#4ade80' },
    { label: '1-10MB', min: 1024 * 1024, max: 10 * 1024 * 1024, color: '#48dbfb' },
    { label: '10-100MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024, color: '#ffd93d' },
    { label: '> 100MB', min: 100 * 1024 * 1024, max: Infinity, color: '#ff6b6b' }
  ]

  return ranges.map(range => {
    const count = items.filter(item => item.size >= range.min && item.size < range.max).length
    return {
      ...range,
      count,
      percent: total > 0 ? Math.round(count / total * 100) : 0
    }
  }).filter(item => item.count > 0)
})

const getTypeIcon = (type: string) => {
  const icons = { video: '🎬', audio: '🎵', image: '🖼️' }
  return icons[type as keyof typeof icons] || '📄'
}

const openFile = async () => {
  try {
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      const fileName = filePath.split('\\').pop() || filePath.split('/').pop() || 'Unknown'
      const extension = fileName.split('.').pop()?.toLowerCase() || ''

      let type: 'video' | 'audio' | 'image' = 'video'
      if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension)) {
        type = 'audio'
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
        type = 'image'
      }

      const file: MediaFile = { name: fileName, path: filePath, type }

      // 保存到状态管理
      mediaStore.setCurrentFile(file)

      // 跳转到播放器页面
      router.push('/player')
    }
  } catch (error) {
    console.error('Error opening file:', error)
  }
}

const openRecentFile = (file: MediaFile) => {
  mediaStore.setCurrentFile(file)
  router.push('/player')
}

const goToLibrary = () => {
  router.push('/library')
}

onMounted(async () => {
  await mediaLibraryStore.initializeStorage()
})
</script>

<style scoped>
/* 主页毛玻璃风格 */
.home-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  padding: 40px 20px;
  overflow-y: auto;
  height: 100%;
}

.home-container::before {
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

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
}

/* 统计概览 */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
}

.stat-icon {
  font-size: 36px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.chart-card {
  padding: 24px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
}

/* 饼图 */
.pie-chart {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto 20px;
}

.pie-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pie-segment {
  transition: all 0.3s ease;
  cursor: pointer;
}

.pie-segment:hover {
  filter: brightness(1.2);
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-total {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.pie-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-label {
  color: var(--text-secondary);
  flex: 1;
}

.legend-value {
  color: var(--text-primary);
  font-weight: 500;
}

.legend-percent {
  color: var(--text-tertiary);
  min-width: 36px;
  text-align: right;
}

/* 柱状图 */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 70px;
  font-size: 13px;
  color: var(--text-secondary);
}

.bar-wrapper {
  flex: 1;
  height: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.bar-value {
  width: 60px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: right;
}

/* 操作区域 */
.action-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.glass-btn.large {
  padding: 14px 36px;
  font-size: 16px;
  font-weight: 600;
}

/* 最近文件 */
.recent-section {
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.recent-files-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-file-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-file-item:hover {
  transform: translateY(-2px);
  border-color: var(--accent-primary);
}

.file-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.file-icon.video { background: rgba(255, 107, 107, 0.15); }
.file-icon.audio { background: rgba(72, 219, 251, 0.15); }
.file-icon.image { background: rgba(74, 222, 128, 0.15); }

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-path {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-type-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-primary);
  background: rgba(0, 212, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .home-container {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 32px;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .action-section {
    flex-direction: column;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }
}
</style>