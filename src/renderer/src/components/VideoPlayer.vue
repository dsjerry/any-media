<template>
  <div class="video-player-container">
    <!-- Video.js 播放器 -->
    <video
      ref="videoPlayer"
      class="video-js vjs-default-skin vjs-big-play-centered"
      preload="auto"
      width="100%"
      height="100%"
      :poster="poster"
      data-setup='{"fluid": true}'
    >
      您的浏览器不支持视频播放。
    </video>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue"
import videojs from "video.js"
import "video.js/dist/video-js.css"

// 定义接口
interface VideoPlayerProps {
  src: string
  title?: string
  poster?: string
  mimeType?: string
  autoplay?: boolean
  showControls?: boolean
}

interface VideoPlayerEmits {
  (e: "ready", player: any): void
  (e: "play"): void
  (e: "pause"): void
  (e: "ended"): void
  (e: "error", error: any): void
  (e: "loadedmetadata", metadata: any): void
}
// Props 和 Emits
const props = withDefaults(defineProps<VideoPlayerProps>(), {
  title: "",
  poster: "",
  mimeType: "video/mp4",
  autoplay: false,
  showControls: true,
})
const emit = defineEmits<VideoPlayerEmits>()
// Refs
const videoPlayer = ref<HTMLVideoElement>()
const player = ref<any>(null)
// 处理文件路径
const processSource = (src: string) => {
  if (!src || src.startsWith('http') || src.startsWith('file://') || src.startsWith('safe-file://')) {
    return src;
  }
  return `file:///${src.replace(/\\/g, '/')}`;
};

// 初始化 Video.js
const initVideoPlayer = () => {
  if (!videoPlayer.value) return

  // 销毁之前的实例
  if (player.value) {
    try {
      player.value.dispose()
    } catch (error) {
      console.warn("销毁播放器实例时出错:", error)
    }
    player.value = null
  }

  // Video.js 配置
  const options = {
    fluid: true, // 使用流体布局适应容器
    responsive: true,
    controls: props.showControls,
    autoplay: props.autoplay,
    preload: "auto",
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    techOrder: ["html5"], // 只使用HTML5技术
    html5: {
      nativeTextTracks: false,
    },
    sources: [
      {
        src: processSource(props.src),
        type: props.mimeType || "video/mp4",
      },
    ],
  }

  // 创建播放器实例
  player.value = videojs(videoPlayer.value, options, () => {
    console.log("Video.js 播放器已就绪")
    emit("ready", player.value)
  })

  // 绑定事件监听器
  setupEventListeners()
}

// 尝试不同的 MIME 类型
const tryDifferentMimeTypes = () => {
  if (!player.value) return

  // 常见的视频 MIME 类型
  const mimeTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-matroska"
  ]

  // 先处理文件路径
  const processedSrc = processSource(props.src);
  
  // 尝试每个 MIME 类型
  for (const mimeType of mimeTypes) {
    try {
      player.value.src({
        src: processedSrc,
        type: mimeType
      })
      player.value.load()
      
      // 如果自动播放启用，尝试播放
      if (props.autoplay) {
        player.value.play().catch(() => {})
      }
      
      // 如果成功，跳出循环
      break
    } catch (err) {
      // 继续尝试下一种格式
    }
  }
}

// 设置事件监听器
const setupEventListeners = () => {
  if (!player.value) return

  const videoElement = player.value

  // 播放事件
  videoElement.on("play", () => {
    emit("play")
  })

  // 暂停事件
  videoElement.on("pause", () => {
    emit("pause")
  })

  // 结束事件
  videoElement.on("ended", () => {
    emit("ended")
  })

  // 错误事件
  videoElement.on("error", (error: any) => {
    const videoError = videoElement.error()
    
    // 提供错误信息
    const errorInfo = {
      code: videoError?.code,
      message: videoError?.message || error?.message || "未知错误",
      src: props.src,
      mimeType: props.mimeType
    }
    
    // 如果是源不支持错误，尝试不同的 MIME 类型
    if (videoError?.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
      setTimeout(() => tryDifferentMimeTypes(), 100)
    }
    
    emit("error", errorInfo)
  })

  // 元数据加载完成
  videoElement.on("loadedmetadata", () => {
    emit("loadedmetadata", {
      duration: videoElement.duration(),
      videoWidth: videoElement.videoWidth(),
      videoHeight: videoElement.videoHeight(),
    })
  })
}

// 切换视频源的函数
const changeVideoSource = (newSrc: string) => {
  if (!player.value || !newSrc) return

  try {
    // 处理文件路径
    const processedSrc = processSource(newSrc);

    // 使用 Video.js 推荐的方式切换源
    player.value.src({
      src: processedSrc,
      type: props.mimeType,
    })

    // 加载新源
    player.value.load()

    // 如果需要自动播放
    if (props.autoplay) {
      player.value.play().catch(() => {})
    }
  } catch (error) {
    // 如果切换失败，尝试重新初始化播放器
    setTimeout(initVideoPlayer, 100)
  }
}

const toggleFullscreen = () => {
  if (!player.value) return
  if (player.value.isFullscreen()) {
    player.value.exitFullscreen()
  } else {
    player.value.requestFullscreen()
  }
}

const togglePictureInPicture = () => {
  if (!player.value) return
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture()
  } else {
    videoPlayer.value?.requestPictureInPicture()
  }
}

const play = () => {
  if (!player.value) return
  player.value?.play()
}

const pause = () => {
  if (!player.value) return
  player.value?.pause()
}

// 暴露方法给父组件
defineExpose({
  play,
  pause,
  toggleFullscreen,
  togglePictureInPicture,
  player: () => player.value,
  // 添加时间控制方法
  getCurrentTime: () => player.value?.currentTime() || 0,
  setCurrentTime: (time: number) => player.value?.currentTime(time),
  getVolume: () => player.value?.volume() || 0,
  setVolume: (volume: number) =>
    player.value?.volume(Math.max(0, Math.min(1, volume))),
  getPlaybackRate: () => player.value?.playbackRate() || 1,
  setPlaybackRate: (rate: number) => player.value?.playbackRate(rate),
})

// 监听 src 变化
watch(
  () => props.src,
  (newSrc, oldSrc) => {
    if (newSrc && newSrc !== oldSrc) {
      changeVideoSource(newSrc)
    }
  }
)

// 生命周期
onMounted(initVideoPlayer)
onUnmounted(() => player.value?.dispose())
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  min-height: 200px;
}

.video-js {
  width: 100% !important;
  height: 100% !important;
  border-radius: 12px !important;
  min-height: 200px;
}

/* 大播放按钮 */
:deep(.vjs-big-play-button) {
  background: linear-gradient(
    135deg,
    var(--accent-primary),
    var(--accent-secondary)
  ) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  width: 80px !important;
  height: 80px !important;
  margin-left: -40px !important;
  margin-top: -40px !important;
  transition: opacity 0.3s ease, visibility 0.3s ease !important;
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4) !important;
}

/* 播放时隐藏大播放按钮 */
:deep(.vjs-has-started .vjs-big-play-button) {
  opacity: 0 !important;
  visibility: hidden !important;
}

/* 暂停时显示大播放按钮 */
:deep(.vjs-paused .vjs-big-play-button) {
  opacity: 0.9 !important;
  visibility: visible !important;
}

/* 进度条 */
:deep(.vjs-play-progress) {
  background: linear-gradient(
    90deg,
    var(--accent-primary),
    var(--accent-secondary)
  ) !important;
}

/* 时间显示控件 */
:deep(.vjs-time-control) {
  min-width: 45px !important;
  padding: 0 8px !important;
}

/* 播放速率控件 */
:deep(.vjs-playback-rate) {
  min-width: 40px !important;
}
</style>
