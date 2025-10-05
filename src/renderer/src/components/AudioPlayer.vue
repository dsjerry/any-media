<template>
  <div class="audio-player-container">
    <audio
      ref="audioPlayer"
      class="video-js vjs-default-skin"
      controls
      preload="auto"
      :data-setup="audioSetup"
    >
      <source :src="audioSource" :type="mimeType" />
      您的浏览器不支持音频播放。
    </audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from "vue"
import videojs from "video.js"

// 定义接口
interface AudioPlayerProps {
  src: string
  title?: string
  mimeType?: string
  autoplay?: boolean
}

interface AudioPlayerEmits {
  (e: "ready", player: any): void
  (e: "play"): void
  (e: "pause"): void
  (e: "ended"): void
  (e: "error", error: any): void
  (e: "timeupdate", currentTime: number): void
  (e: "loadedmetadata", metadata: any): void
}

// Props 和 Emits
const props = withDefaults(defineProps<AudioPlayerProps>(), {
  title: "",
  mimeType: "audio/mpeg",
  autoplay: false,
})

const emit = defineEmits<AudioPlayerEmits>()

// Refs
const audioPlayer = ref<HTMLAudioElement>()
const player = ref<any>(null)
const isPlaying = ref(false)
let isChangingSource = ref(false)

// 计算属性
const audioSource = computed(() => props.src)
const audioSetup = computed(() => ({
  fluid: false,
  responsive: true,
  controls: true,
  autoplay: props.autoplay,
  preload: "auto",
  playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
  liveui: true,
  suppressNotSupportedError: true,
  controlBar: {
    children: [
      "playToggle",
      "volumePanel",
      "currentTimeDisplay",
      "timeDivider",
      "durationDisplay",
      "progressControl",
      "remainingTimeDisplay",
      "customControlSpacer",
      "playbackRateMenuButton",
      "audioTrackButton",
    ],
    volumePanel: {
      inline: false,
      vertical: true,
    },
    progressControl: {
      keepTooltipsInside: true,
    },
  },
  // 音频特定设置
  height: 60,
  width: "100%",
}))

// 初始化 Video.js 音频播放器
const initAudioPlayer = () => {
  if (!audioPlayer.value) return

  // 销毁之前的实例
  if (player.value) {
    player.value.dispose()
  }

  // 创建播放器实例
  player.value = videojs(audioPlayer.value, audioSetup.value, () => {
    console.log("Video.js 音频播放器已就绪")
    emit("ready", player.value)
  })

  // 绑定事件监听器
  setupEventListeners()
}

// 设置事件监听器
const setupEventListeners = () => {
  if (!player.value) return

  const audioElement = player.value

  // 播放事件
  audioElement.on("play", () => {
    isPlaying.value = true
    emit("play")
  })

  // 暂停事件
  audioElement.on("pause", () => {
    isPlaying.value = false
    emit("pause")
  })

  // 结束事件
  audioElement.on("ended", () => {
    isPlaying.value = false
    emit("ended")
  })

  // 错误事件
  audioElement.on("error", (error: any) => {
    const audioError = audioElement.error()
    
    // 提供错误信息
    const errorInfo = {
      code: audioError?.code,
      message: audioError?.message || error?.message || "未知错误",
      src: props.src,
      mimeType: props.mimeType,
    }
    
    console.error("Audio error:", errorInfo)
    
    // 处理不同类型的错误
    if (audioError?.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
      console.log("Audio format not supported, trying different format...")
      // 尝试不同的音频格式
      setTimeout(() => {
        if (player.value) {
          // 尝试不同的 MIME 类型
          const mimeTypes = [
            "audio/mpeg",
            "audio/wav",
            "audio/ogg",
            "audio/aac",
            "audio/flac",
            "audio/mp4",
          ]
          
          for (const mimeType of mimeTypes) {
            try {
              console.log(`Trying audio MIME type: ${mimeType}`)
              player.value.src({
                src: props.src,
                type: mimeType,
              })
              player.value.load()
              if (props.autoplay) {
                player.value.play().catch(() => {})
              }
              break
            } catch (err: unknown) {
              console.warn(`Error with audio MIME type ${mimeType}:`, err)
            }
          }
        }
      }, 100)
    } else if (audioError?.code === 2) { // MEDIA_ERR_NETWORK
      console.log("Network error, trying to reload audio...")
      // 网络错误，尝试重新加载
      setTimeout(() => {
        if (player.value) {
          player.value.load()
          if (props.autoplay) {
            player.value.play().catch(() => {})
          }
        }
      }, 1000)
    }
    
    emit("error", errorInfo)
  })

  // 时间更新事件
  audioElement.on("timeupdate", () => {
    emit("timeupdate", audioElement.currentTime())
  })

  // 元数据加载完成
  audioElement.on("loadedmetadata", () => {
    emit("loadedmetadata", {
      duration: audioElement.duration(),
    })
  })
}

// 控制函数
const togglePlay = () => {
  if (!player.value || isChangingSource.value) return
  if (player.value.paused()) {
    try {
      player.value.play().catch((err: Error) => {
        if (err.name === 'AbortError') {
          console.log("播放被中断，可能是由于同时进行的暂停操作")
        } else {
          console.warn("播放失败:", err)
        }
      })
    } catch (err: unknown) {
      console.warn("播放异常:", err)
    }
  } else {
    player.value.pause()
  }
}

const play = () => {
  if (!player.value || isChangingSource.value) return
  try {
    player.value?.play()
  } catch (err: unknown) {
    console.warn("播放异常:", err)
  }
}

const pause = () => {
  if (!player.value || isChangingSource.value) return
  player.value?.pause()
}

const getCurrentTime = (): number => {
  return player.value?.currentTime() || 0
}

const setCurrentTime = (time: number) => {
  player.value?.currentTime(time)
}

const getVolume = (): number => {
  return player.value?.volume() || 0
}

const setVolume = (volume: number) => {
  player.value?.volume(Math.max(0, Math.min(1, volume)))
}

const getPlaybackRate = (): number => {
  return player.value?.playbackRate() || 1
}

const setPlaybackRate = (rate: number) => {
  player.value?.playbackRate(rate)
}

// 暴露方法给父组件
defineExpose({
  play,
  pause,
  togglePlay,
  getCurrentTime,
  setCurrentTime,
  getVolume,
  setVolume,
  getPlaybackRate,
  setPlaybackRate,
  player: () => player.value,
})

// 监听 src 变化
watch(
  () => props.src,
  newSrc => {
    if (newSrc && player.value) {
      isChangingSource.value = true
      player.value.src({
        src: newSrc,
        type: props.mimeType,
      })
      if (props.autoplay) {
        player.value.play().catch((err: Error) => {
          if (err.name === 'AbortError') {
            console.log("自动播放被中断，可能是由于同时进行的暂停操作")
          } else {
            console.warn("自动播放失败:", err)
          }
        })
      }
      // 重置源切换状态
      isChangingSource.value = false
    }
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  initAudioPlayer()
})

onUnmounted(() => {
  if (player.value) {
    player.value.dispose()
    player.value = null
  }
  isChangingSource.value = false
})
</script>

<style scoped>
.audio-player-container {
  width: 100%;
  background: transparent;
  padding: 8px;
}

.video-js {
  width: 100% !important;
  min-height: 80px;
  background: transparent;
}

/* 全局样式已包含毛玻璃效果，这里只需要组件特定的调整 */
:deep(.vjs-default-skin) {
  --vjs-theme-color: var(--accent-primary);
}

/* 音频播放器特殊调整 */
:deep(.vjs-control-bar) {
  background: rgba(30, 30, 30, 0.9) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border-radius: 12px !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  margin: 0 8px !important;
}

:deep(.vjs-progress-holder) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid var(--glass-border) !important;
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
}

:deep(.vjs-play-progress) {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)) !important;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.4) !important;
}

:deep(.vjs-volume-level) {
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)) !important;
}

:deep(.vjs-playback-rate-menu) {
  background: rgba(30, 30, 30, 0.95) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px !important;
  box-shadow: var(--glass-shadow) !important;
}

:deep(.vjs-menu-item) {
  border-radius: 6px !important;
  margin: 2px 4px !important;
}

:deep(.vjs-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(5px) !important;
}

:deep(.vjs-selected) {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)) !important;
}

:deep(.vjs-big-play-button) {
  display: none;
}

:deep(.vjs-current-time),
:deep(.vjs-duration),
:deep(.vjs-time-divider) {
  font-size: 12px;
  line-height: 48px;
  color: var(--text-primary);
}

:deep(.vjs-control) {
  font-size: 16px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

:deep(.vjs-control:hover) {
  color: var(--text-primary);
}

:deep(.vjs-playback-rate .vjs-playback-rate-value) {
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audio-player-container {
    padding: 4px;
  }

  .video-js {
    min-height: 70px;
  }

  :deep(.vjs-control-bar) {
    height: 40px !important;
  }

  :deep(.vjs-current-time),
  :deep(.vjs-duration),
  :deep(.vjs-time-divider) {
    font-size: 10px;
    line-height: 40px;
  }

  :deep(.vjs-control) {
    font-size: 14px;
  }
}
</style>
