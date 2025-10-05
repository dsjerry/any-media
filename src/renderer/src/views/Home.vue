<template>
  <div class="home-container">
  
    <div class="features-grid">
      <div class="feature-card glass-card">
        <div class="feature-icon">🎬</div>
        <h3 class="feature-title">视频播放</h3>
        <p class="feature-description">支持 MP4、AVI、MOV 等多种视频格式</p>
      </div>

      <div class="feature-card glass-card">
        <div class="feature-icon">🎵</div>
        <h3 class="feature-title">音频播放</h3>
        <p class="feature-description">支持 MP3、WAV、FLAC 等音频格式</p>
      </div>

      <div class="feature-card glass-card">
        <div class="feature-icon">🖼️</div>
        <h3 class="feature-title">图片查看</h3>
        <p class="feature-description">支持 JPG、PNG、GIF 等图片格式</p>
      </div>
    </div>

    <div class="action-section">
      <button
        @click="openFile"
        class="glass-btn primary large"
      >
        打开媒体文件
      </button>
    </div>

    <div v-if="recentFiles.length > 0" class="recent-files">
      <h2 class="section-title">最近打开的文件</h2>
      <div class="recent-files-list">
        <div
          v-for="file in recentFiles"
          :key="file.path"
          class="recent-file-item glass-card"
          @click="openRecentFile(file)"
        >
          <div class="file-info">
            <h3 class="file-name">{{ file.name }}</h3>
            <p class="file-path">{{ file.path }}</p>
          </div>
          <div class="file-type">
            {{ file.type.toUpperCase() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaStore } from '@/stores/media'
import type { MediaFile } from '@/stores/media'

const router = useRouter()
const mediaStore = useMediaStore()

const recentFiles = computed(() => mediaStore.getRecentFiles())

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

/* 英雄区域 */
.hero-section {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.hero-content {
  background: rgba(25, 25, 25, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 60px 40px;
  box-shadow: var(--glass-shadow);
  animation: float 6s ease-in-out infinite;
}

.app-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.app-subtitle {
  font-size: 20px;
  color: var(--text-secondary);
  font-weight: 400;
}

/* 功能网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.feature-card {
  text-align: center;
  padding: 40px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-primary);
  box-shadow: 0 12px 40px rgba(0, 212, 255, 0.3);
}

.feature-icon {
  font-size: 64px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: float 4s ease-in-out infinite;
}

.feature-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.feature-description {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 操作区域 */
.action-section {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 1;
}

.glass-btn.large {
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 600;
}

/* 最近文件 */
.recent-files {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  padding-bottom: 80px;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
  text-align: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.recent-files-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recent-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.recent-file-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.recent-file-item:hover::before {
  left: 100%;
}

.recent-file-item:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.2);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-path {
  font-size: 14px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
  background: rgba(0, 212, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--accent-primary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 20px 16px;
  }

  .hero-section {
    margin-bottom: 60px;
  }

  .hero-content {
    padding: 40px 24px;
  }

  .app-title {
    font-size: 36px;
  }

  .app-subtitle {
    font-size: 18px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 60px;
  }

  .feature-card {
    padding: 32px 20px;
  }

  .feature-icon {
    font-size: 48px;
  }

  .feature-title {
    font-size: 20px;
  }

  .feature-description {
    font-size: 14px;
  }

  .glass-btn.large {
    padding: 14px 36px;
    font-size: 16px;
  }

  .section-title {
    font-size: 24px;
  }

  .recent-file-item {
    padding: 16px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .file-type {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 28px;
  }

  .app-subtitle {
    font-size: 16px;
  }

  .hero-content {
    padding: 32px 20px;
  }

  .feature-icon {
    font-size: 40px;
  }

  .feature-title {
    font-size: 18px;
  }
}
</style>