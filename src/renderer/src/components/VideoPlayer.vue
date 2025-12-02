<template>
  <div class="video-player-container">
    <!-- Video.js 播放器 -->
    <video
      ref="videoPlayer"
      class="video-js vjs-default-skin vjs-big-play-centered"
      preload="auto"
      :poster="poster"
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
  (e: "timeupdate", currentTime: number): void
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
  if (!src) return src

  console.log("VideoPlayer.processSource input:", src)

  // 如果已经是 URL，直接返回
  if (src.startsWith("http://") || src.startsWith("https://") || 
      src.startsWith("file://") || src.startsWith("data:")) {
    return src
  }
  
  // 如果是 safe-file 协议，去除可能的重复前缀
  if (src.startsWith("safe-file://")) {
    if (src.includes('safe-file://safe-file://')) {
      return src.replace('safe-file://safe-file://', 'safe-file://')
    }
    return src
  }

  // 如果是本地路径，转换为 safe-file:// 协议
  // 规范化路径，使用正斜杠
  const normalizedPath = src.replace(/\\/g, "/")
  
  // 对 Windows 路径进行处理，确保驱动器字母后有正确的斜杠
  const formattedPath = /^[a-zA-Z]:/.test(normalizedPath)
    ? normalizedPath.replace(/^([a-zA-Z]:)(?!\/)/g, '$1/')
    : normalizedPath
  
  return `safe-file://${formattedPath}`
}


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
    fill: true,
    responsive: true,
    controls: props.showControls,
    autoplay: props.autoplay,
    preload: "auto",
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    techOrder: ["html5"], // 只使用HTML5技术
    html5: {
      nativeTextTracks: false,
      hls: {
        overrideNative: true, // 覆盖原生 HLS 支持，强制使用 videojs-http-streaming
        enableLowInitialPlaylist: true, // 开始时使用低质量流，提高加载速度
      },
      vhs: {
        overrideNative: true,
      },
    },
    liveui: true, // 改进直播 UI
    liveTracker: {
      trackingThreshold: 0.5,
      liveTolerance: 15
    },
    sources: [
      {
        src: processSource(props.src),
        type: props.mimeType || "video/mp4",
      },
    ],
    // 添加错误处理配置
    errorDisplay: {
      messages: {
        1: '加载视频失败，请检查网络连接',
        2: '网络错误，无法加载视频',
        3: '无法解码视频，可能不支持此格式',
        4: '视频格式不支持，请尝试不同的格式',
        5: '加密视频无法播放',
      }
    },
  }

  // 创建播放器实例
  player.value = videojs(videoPlayer.value, options, () => {
    console.log("Video.js 播放器已就绪")
    emit("ready", player.value)
  })

  // 绑定事件监听器
  setupEventListeners()
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
      mimeType: props.mimeType,
    }

    console.error("Video error:", errorInfo)

    // 如果是源不支持错误，尝试不同的处理方式
    if (videoError?.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
      console.log("Source not supported, trying file:// protocol...")
      // 尝试使用 file:// 协议
      setTimeout(() => {
        if (player.value && props.src.startsWith('safe-file://')) {
          const fileProtocolSrc = props.src.replace(/^safe-file:\/\//, 'file:///')
          console.log("Trying with file:// protocol:", fileProtocolSrc)
          player.value.src({
            src: fileProtocolSrc,
            type: props.mimeType || "video/mp4"
          })
          player.value.load()
          player.value.play().catch(() => {})
        }
      }, 100)
    } else if (videoError?.code === 2) { // MEDIA_ERR_NETWORK
      console.log("Network error, trying to reload...")
      // 网络错误，尝试重新加载
      setTimeout(() => {
        if (player.value) {
          player.value.load()
          player.value.play().catch(() => {})
        }
      }, 1000)
    } else if (videoError?.code === 3) { // MEDIA_ERR_DECODE
      console.log("Decode error, trying with different source format...")
      // 解码错误，尝试使用不同的源格式
      setTimeout(() => {
        if (player.value && props.src.startsWith('safe-file://')) {
          const fileProtocolSrc = props.src.replace(/^safe-file:\/\//, 'file:///')
          console.log("Trying with file:// protocol after decode error:", fileProtocolSrc)
          player.value.src({
            src: fileProtocolSrc,
            type: props.mimeType || "video/mp4"
          })
          player.value.load()
          player.value.play().catch(() => {})
        }
      }, 100)
    }

    emit("error", errorInfo)
  })

  // 元数据加载完成
  videoElement.on("loadedmetadata", () => {
    const metadata = {
      duration: videoElement.duration(),
      videoWidth: videoElement.videoWidth(),
      videoHeight: videoElement.videoHeight(),
    }

    if (metadata.videoWidth && metadata.videoHeight && player.value) {
      const ratio = `${metadata.videoWidth}:${metadata.videoHeight}`
      player.value.aspectRatio(ratio)
    }

    emit("loadedmetadata", metadata)
  })

  // 时间更新事件
  videoElement.on("timeupdate", () => {
    emit("timeupdate", player.value?.currentTime() || 0)
  })
}

// 切换视频源的函数
const changeVideoSource = (newSrc: string) => {
  if (!player.value) return

  try {
    // 检查新源是否有效
    if (!newSrc || newSrc.trim() === "") {
      console.warn("视频源为空，取消切换")
      return
    }

    // 处理文件路径
    const processedSrc = processSource(newSrc)

    // 使用 Video.js 推荐的方式切换源
    player.value.src({
      src: processedSrc,
      type: props.mimeType,
    })

    // 加载新源
    player.value.load()

    // 如果需要自动播放
    if (props.autoplay) {
      player.value.play().catch((err: any) => {
        console.warn("自动播放失败:", err)
      })
    }
  } catch (error) {
    console.error("切换视频源失败:", error)
    // 如果切换失败，尝试重新初始化播放器
    setTimeout(() => {
      initVideoPlayer()
    }, 100)
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

const togglePlay = () => {
  if (!player.value) {
    console.warn("togglePlay: player is not initialized")
    return
  }
  
  console.log("togglePlay called, player paused state:", player.value.paused())
  
  if (player.value.paused()) {
    try {
      console.log("Attempting to play video")
      player.value.play()
        .then(() => console.log("Video playback started successfully"))
        .catch((err: Error) => {
          console.error("Error starting video playback:", err)
          if (err.name === 'AbortError') {
            console.log("Play was aborted, possibly due to a concurrent pause operation")
          } else if (err.name === 'NotAllowedError') {
            console.log("Playback was prevented, possibly due to autoplay restrictions")
          }
        })
    } catch (err: unknown) {
      console.error("Exception during play attempt:", err)
    }
  } else {
    console.log("Pausing video")
    player.value.pause()
  }
}

// 暴露方法给父组件
defineExpose({
  play,
  pause,
  togglePlay,
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
onMounted(() => {
  initVideoPlayer()
})

onUnmounted(() => {
  if (player.value) {
    player.value.dispose()
    player.value = null
  }
})
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 320px;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
}

/* 全屏模式下的视频播放器容器 */
.video-player-container:fullscreen {
  min-height: 0;
}

.video-js {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px !important;
}

:deep(.vjs-tech) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  background: #000;
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
