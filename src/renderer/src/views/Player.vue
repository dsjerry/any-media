<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <div class="title-bar" @dblclick="toggleMaximize">
      <div class="title-bar-content">
        <span v-if="currentFile" class="file-title">{{ currentFile.name }}</span>
      </div>
      <div class="title-bar-controls">
        <button class="title-bar-btn" @click="openFile" title="打开文件">
          📁
        </button>
        <button class="title-bar-btn" @click="toggleFullscreen" title="全屏">
          🔍
        </button>
      </div>
    </div>

    <!-- 主播放区域 -->
    <div class="player-area" ref="playerAreaRef">
      <div v-if="!currentFile" class="empty-state">
        <div class="empty-icon">🎬</div>
        <div class="empty-text">选择一个媒体文件开始播放</div>
        <button class="app-btn primary" @click="openFile">
          打开文件
        </button>
      </div>

      <!-- 视频播放器 -->
      <div v-else-if="currentFile.type === 'video'" class="video-container">
        <VideoPlayer
          ref="videoPlayerRef"
          :src="mediaUrl"
          :title="currentFile.name"
          :mimeType="getVideoMimeType(currentFile.name)"
          :autoplay="false"
          @ready="onVideoPlayerReady"
          @ended="onVideoEnded"
          @error="onVideoError"
          @loadedmetadata="onVideoMetadataLoaded"
        />
      </div>

      <!-- 音频播放器 -->
      <div v-else-if="currentFile.type === 'audio'" class="audio-container">
        <div class="audio-visualizer">
          <div class="audio-icon">🎵</div>
          <div class="audio-info">
            <div class="audio-title">{{ currentFile.name }}</div>
            <div class="audio-subtitle" v-if="mediaInfo.duration">
              时长: {{ formatTime(mediaInfo.duration) }}
            </div>
          </div>
        </div>
        <div class="audio-player-wrapper">
          <audio
            ref="audioRef"
            :src="mediaUrl"
            :title="currentFile.name"
            controls
          />
        </div>
      </div>

      <!-- 图片查看器 -->
      <div v-else-if="currentFile.type === 'image'" class="image-container">
        <img
          ref="imageRef"
          :src="mediaUrl"
          :alt="currentFile.name"
          class="image-viewer"
          :style="{
            transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }"
          @load="onMediaLoaded"
          @error="onMediaError"
        />
      </div>
    </div>
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useMediaStore } from "@/stores/media"
import VideoPlayer from "@/components/VideoPlayer.vue"
import type { MediaFile } from "@/stores/media"

interface MediaInfo {
  duration?: number
  dimensions?: { width: number; height: number }
}

const mediaStore = useMediaStore()
const currentFile = ref<MediaFile | null>(null)
const mediaUrl = ref<string>("")
const isLoading = ref(false)
const mediaInfo = ref<MediaInfo>({})
const currentIndex = ref(-1)

// 图片缩放相关状态
const imageScale = ref(1)
const imagePosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const playerAreaRef = ref<HTMLDivElement | null>(null)
const imageRef = ref<HTMLImageElement>()
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer>>()
const audioRef = ref<HTMLAudioElement | null>(null)

// 计算属性
const playlist = computed(() => mediaStore.playlist)
const hasNext = computed(() => currentIndex.value < playlist.value.length - 1)

// 获取文件 MIME 类型
const getVideoMimeType = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase() || ""

  // 基本 MIME 类型映射
  const basicMimeTypes: Record<string, string> = {
    mp4: "video/mp4",
    mp4v: "video/mp4",
    mpg4: "video/mp4",
    m4v: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
    mkv: "video/x-matroska",
    webm: "video/webm",
    ogv: "video/ogg",
    flv: "video/x-flv",
    ts: "video/mp2t",
    mts: "video/mp2t",
    m2ts: "video/mp2t",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
  }

  // 高级 MIME 类型映射，包含编解码器信息
  const advancedMimeTypes: Record<string, string[]> = {
    mp4: [
      "video/mp4",
      "video/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"", // H.264 + AAC
      "video/mp4; codecs=\"hev1\"", // HEVC/H.265
      "video/mp4; codecs=\"av01\"" // AV1
    ],
    webm: [
      "video/webm",
      "video/webm; codecs=\"vp8, vorbis\"", // VP8 + Vorbis
      "video/webm; codecs=\"vp9, opus\"" // VP9 + Opus
    ],
    mkv: [
      "video/x-matroska",
      "video/webm", // 有时 MKV 可以作为 WebM 播放
      ""
    ]
  }

  // 如果有高级 MIME 类型定义，返回第一个
  // 实际播放时会尝试所有可能的 MIME 类型
  if (ext in advancedMimeTypes) {
    return advancedMimeTypes[ext][0];
  }

  // 否则返回基本 MIME 类型
  return basicMimeTypes[ext] || "video/mp4"
}

// 格式化时间（用于显示音频时长）
const formatTime = (seconds?: number): string => {
  if (!Number.isFinite(seconds) || seconds === undefined || seconds < 0) {
    return "00:00"
  }
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// 加载媒体文件 - 修复版本，使用 base64 转换 API
const loadMediaFile = async (file: MediaFile) => {
  currentFile.value = file
  isLoading.value = true
  mediaInfo.value = {}

  try {
    // 使用统一的 getFileData API 来处理所有文件类型
    console.log("调用 getFileData API:", file.path)
    const dataUrl = await window.electronAPI.getFileData(file.path)

    if (dataUrl) {
      mediaUrl.value = dataUrl
      console.log("文件加载成功:", file.name, "URL:", mediaUrl.value?.substring(0, 50) + "...")
    } else {
      console.error("文件加载失败:", file.name)
      mediaUrl.value = ""
    }
  } catch (error) {
    console.error("加载媒体文件错误:", error)
    mediaUrl.value = ""
  }

  // 更新状态管理
  mediaStore.setCurrentFile(file)

  // 更新当前索引
  const existingIndex = playlist.value.findIndex((f: MediaFile) => f.path === file.path)
  currentIndex.value =
    existingIndex !== -1 ? existingIndex : playlist.value.length - 1
}

// 媒体加载完成
const onMediaLoaded = () => {
  isLoading.value = false
}

// 媒体加载错误
const onMediaError = (error: Event) => {
  isLoading.value = false
  console.error("Media loading error:", error)
}

// 打开文件
const openFile = async () => {
  try {
    const filePath = await window.electronAPI.openFile()
    if (filePath) {
      const fileName =
        filePath.split("\\").pop() || filePath.split("/").pop() || "Unknown"
      const extension = fileName.split(".").pop()?.toLowerCase() || ""

      let type: "video" | "audio" | "image" = "video"
      if (["mp3", "wav", "flac", "aac", "ogg", "m4a"].includes(extension)) {
        type = "audio"
      } else if (
        ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)
      ) {
        type = "image"
      }

      const file: MediaFile = { name: fileName, path: filePath, type }
      await loadMediaFile(file)
    }
  } catch (error) {
    console.error("Error opening file:", error)
  }
}

const nextFile = () => {
  if (hasNext.value) {
    loadMediaFile(playlist.value[currentIndex.value + 1])
  }
}

// 全屏切换
const toggleFullscreen = () => {
  const element = playerAreaRef.value || imageRef.value
  if (element) {
    if (!document.fullscreenElement) {
      element.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }
}

// VideoPlayer 事件处理函数
const onVideoPlayerReady = (_player: any) => {
  console.log("VideoPlayer 就绪")
  isLoading.value = false
}

const onVideoEnded = () => {
  // 自动播放下一个
  if (hasNext.value) {
    nextFile()
  }
}

const onVideoError = (error: any) => {
  console.error("VideoPlayer 错误:", error)
  isLoading.value = false
}

const onVideoMetadataLoaded = (metadata: any) => {
  console.log("VideoPlayer 元数据:", metadata)
  isLoading.value = false
  mediaInfo.value = {
    duration: metadata.duration,
    dimensions: {
      width: metadata.videoWidth,
      height: metadata.videoHeight,
    },
  }
}

const onAudioEnded = () => {
  // 自动播放下一个
  if (hasNext.value) {
    nextFile()
  }
}

const onAudioError = (error: any) => {
  console.error("AudioPlayer 错误:", error)
}

const onAudioMetadataLoaded = (event: Event) => {
  const element = event.target as HTMLAudioElement
  mediaInfo.value = {
    duration: element.duration,
  }
}

// 处理窗口最大化事件
const handleWindowMaximize = () => {
  console.log("窗口已最大化")
  // 在这里可以添加特定的逻辑，例如调整播放器大小
  adjustPlayerForMaximize()
}

// 处理窗口取消最大化事件
const handleWindowUnmaximize = () => {
  console.log("窗口已取消最大化")
  // 在这里可以添加特定的逻辑，例如恢复播放器大小
  adjustPlayerForUnmaximize()
}

// 切换窗口最大化状态
const toggleMaximize = async () => {
  try {
    // 调用主进程API来切换窗口最大化状态
    await window.electronAPI.toggleMaximize()
  } catch (error) {
    console.error("切换窗口最大化状态时出错:", error)
  }
}

// 调整播放器以适应最大化窗口
const adjustPlayerForMaximize = () => {
  // 设置播放器的最大宽高，避免出现滚动条
  const playerArea = document.querySelector('.player-area') as HTMLElement
  const videoContainer = document.querySelector('.video-container') as HTMLElement
  if (playerArea) {
    // 获取屏幕尺寸
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    // 设置最大宽高（可以根据需要调整这些值）
    const maxWidth = Math.min(screenWidth * 0.9, 1920) // 最大宽度为屏幕宽度的90%或1920px
    const maxHeight = Math.min(screenHeight * 0.8, 1080) // 最大高度为屏幕高度的80%或1080px

    // 应用样式
    playerArea.style.maxWidth = `${maxWidth}px`
    playerArea.style.maxHeight = `${maxHeight}px`
    playerArea.style.margin = '0 auto' // 居中显示
  }

  // 同样调整视频容器
  if (videoContainer) {
    videoContainer.style.maxWidth = '100%'
    videoContainer.style.maxHeight = 'calc(100vh - 200px)' // 为控制栏留出空间
  }
}

// 调整播放器以适应普通窗口
const adjustPlayerForUnmaximize = () => {
  // 恢复播放器的默认样式
  const playerArea = document.querySelector('.player-area') as HTMLElement
  const videoContainer = document.querySelector('.video-container') as HTMLElement
  if (playerArea) {
    playerArea.style.maxWidth = ''
    playerArea.style.maxHeight = ''
    playerArea.style.margin = ''
  }

  // 恢复视频容器的默认样式
  if (videoContainer) {
    videoContainer.style.maxWidth = ''
    videoContainer.style.maxHeight = ''
  }
}

// 监听状态管理中的文件变化
watch(
  () => mediaStore.currentFile,
  async newFile => {
    if (newFile && !currentFile.value) {
      // 如果状态管理中有文件但当前没有加载，则加载该文件
      await loadMediaFile(newFile)
    }
  },
  { immediate: true }
)

// 图片缩放功能相关函数
const resetImageTransform = () => {
  imageScale.value = 1
  imagePosition.value = { x: 0, y: 0 }
}

const handleWheel = (e: WheelEvent) => {
  if (currentFile.value?.type !== 'image') return

  e.preventDefault()

  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.1, Math.min(5, imageScale.value + delta))

  // 以鼠标位置为中心进行缩放
  if (imageRef.value) {
    const rect = imageRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const scaleRatio = newScale / imageScale.value

    imagePosition.value.x -= (x - imagePosition.value.x) * (scaleRatio - 1)
    imagePosition.value.y -= (y - imagePosition.value.y) * (scaleRatio - 1)
  }

  imageScale.value = newScale
}

const handleMouseDown = (e: MouseEvent) => {
  if (currentFile.value?.type !== 'image') return

  isDragging.value = true
  dragStart.value = { x: e.clientX - imagePosition.value.x, y: e.clientY - imagePosition.value.y }
  if (imageRef.value) {
    imageRef.value.style.cursor = 'grabbing'
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (currentFile.value?.type !== 'image' || !isDragging.value) return

  imagePosition.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y
  }
}

const handleMouseUp = () => {
  if (currentFile.value?.type !== 'image') return

  isDragging.value = false
  if (imageRef.value) {
    imageRef.value.style.cursor = 'grab'
  }
}

onMounted(async () => {
  // 检查是否有从首页传递过来的文件
  if (mediaStore.currentFile && !currentFile.value) {
    await loadMediaFile(mediaStore.currentFile)
  }

  // 监听窗口最大化和取消最大化事件
  window.electronAPI.onWindowMaximize(() => {
    // 窗口最大化时的处理逻辑
    handleWindowMaximize()
  })

  window.electronAPI.onWindowUnmaximize(() => {
    // 窗口取消最大化时的处理逻辑
    handleWindowUnmaximize()
  })

  // 添加图片查看器的事件监听器
  if (imageRef.value) {
    imageRef.value.addEventListener('wheel', handleWheel as EventListener)
    imageRef.value.addEventListener('mousedown', handleMouseDown)
    imageRef.value.addEventListener('mousemove', handleMouseMove)
    imageRef.value.addEventListener('mouseup', handleMouseUp)
    imageRef.value.addEventListener('mouseleave', handleMouseUp)
  }
})
</script>

<style scoped>
/* 毛玻璃风格 */
.app-container {
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

/* 全屏模式样式 */
.app-container:fullscreen {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-container::before {
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

/* 标题栏 */
.title-bar {
  height: 48px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  user-select: none;
  position: relative;
  z-index: 10;
}

.title-bar-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.file-title {
  color: var(--text-secondary);
  font-size: 13px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-bar-controls {
  display: flex;
  gap: 12px;
}

.title-bar-btn {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 16px;
}

.title-bar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
}

/* 主播放区域 */
.player-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow-y: hidden; /* 防止播放区域出现滚动条 */
  z-index: 1;
  min-height: 0; /* 允许flex收缩 */
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 全屏模式下的播放区域 */
.player-area:fullscreen {
  overflow-y: hidden;
}

/* 空状态 */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: rgba(25, 25, 25, 0.4);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  margin: 40px;
  box-shadow: var(--glass-shadow);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  font-size: 18px;
  margin-bottom: 32px;
  color: var(--text-primary);
}

/* 应用按钮 */
.app-btn {
  padding: 12px 24px;
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.app-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.app-btn:hover::before {
  left: 100%;
}

.app-btn.primary {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(0, 153, 204, 0.8));
  border: 1px solid var(--accent-primary);
  color: white;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.app-btn.primary:hover {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(0, 153, 204, 0.9));
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 212, 255, 0.5);
}

.app-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
}

.app-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.2);
}

/* 视频容器 */
.video-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  flex: 1 1 auto;
  min-height: 0;
}

.video-container :deep(.video-player-container) {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
}

/* 全屏模式下的视频容器 */
.video-container:fullscreen {
  padding: 0;
}

/* 移动端视频容器调整 */
@media (max-width: 768px) {
  .video-container {
    min-height: 250px;
  }
}

/* 音频容器 */
.audio-container {
  flex: 1;
  min-height: 0; /* 允许flex收缩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.audio-visualizer {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 48px;
  color: white;
  background: rgba(25, 25, 25, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 32px;
  box-shadow: var(--glass-shadow);
  animation: float 4s ease-in-out infinite;
}

.audio-icon {
  font-size: 64px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.audio-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audio-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  text-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
}

.audio-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.audio-player-wrapper {
  width: 100%;
  max-width: 700px;
}

/* 图片容器 */
.image-container {
  flex: 1;
  min-height: 0; /* 允许flex收缩 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.image-viewer {
  max-width: 95%;
  max-height: 95%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--glass-border);
}

/* 控制栏 */
.control-bar {
  height: auto;
  min-height: 80px;
  max-height: 120px;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-top: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  gap: 16px;
  position: sticky; /* 使控制栏始终可见 */
  bottom: 0; /* 粘性定位在底部 */
  z-index: 10;
  flex-shrink: 0; /* 防止控制栏被压缩 */
}

/* 全屏模式下的控制栏 */
.control-bar:fullscreen {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  border-radius: 0;
}

.media-info {
  flex: 1;
  min-width: 0;
}

.media-title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.media-path {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-details {
  color: var(--text-secondary);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: var(--text-tertiary);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 240px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.seek-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.seek-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
  border: 2px solid #fff;
}

.seek-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 2px solid #fff;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.6);
}

/* 播放控制 */
.playback-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.control-btn {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.control-btn:hover::before {
  left: 100%;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.3);
}

.control-btn.play-btn {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(0, 153, 204, 0.8));
  border: 1px solid var(--accent-primary);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.control-btn.play-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(0, 153, 204, 0.9));
  border-color: var(--accent-primary);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 24px rgba(0, 212, 255, 0.5);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
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
@media (max-width: 768px) {
  .title-bar {
    height: 44px;
    padding: 0 16px;
  }

  .app-title {
    font-size: 14px;
  }

  .file-title {
    max-width: 150px;
    font-size: 12px;
  }

  .title-bar-controls {
    gap: 8px;
  }

  .title-bar-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .control-bar {
    min-height: 100px;
    max-height: 140px;
    padding: 8px 16px;
    flex-direction: column;
    gap: 8px;
  }

  .media-info {
    text-align: center;
  }

  .media-title {
    font-size: 14px;
  }

  .media-path {
    font-size: 11px;
  }

  .media-details {
    font-size: 11px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .playback-controls {
    gap: 8px;
  }

  .control-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .control-btn.play-btn {
    width: 48px;
    height: 48px;
  }

  .audio-container {
    padding: 20px;
  }

  .audio-visualizer {
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
    padding: 24px;
  }

  .audio-icon {
    font-size: 48px;
  }

  .audio-title {
    font-size: 18px;
  }

  .audio-player-wrapper {
    max-width: 100%;
  }

  .empty-state {
    margin: 20px;
    padding: 20px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-text {
    font-size: 16px;
  }

  .app-btn {
    padding: 10px 20px;
    font-size: 13px;
  }
}
</style>