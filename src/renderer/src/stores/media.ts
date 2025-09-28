import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface MediaFile {
  name: string
  path: string
  type: 'video' | 'audio' | 'image'
}

export const useMediaStore = defineStore('media', () => {
  const currentFile = ref<MediaFile | null>(null)
  const playlist = ref<MediaFile[]>([])
  const recentFiles = ref<MediaFile[]>([])

  const setCurrentFile = (file: MediaFile) => {
    currentFile.value = file

    // 添加到播放列表
    const existingIndex = playlist.value.findIndex(f => f.path === file.path)
    if (existingIndex === -1) {
      playlist.value.push(file)
    }

    // 添加到最近文件
    const recentIndex = recentFiles.value.findIndex(f => f.path === file.path)
    if (recentIndex === -1) {
      recentFiles.value.unshift(file)
      if (recentFiles.value.length > 10) {
        recentFiles.value = recentFiles.value.slice(0, 10)
      }
    } else {
      // 移到最前面
      recentFiles.value.splice(recentIndex, 1)
      recentFiles.value.unshift(file)
    }
  }

  const clearCurrentFile = () => {
    currentFile.value = null
  }

  const getRecentFiles = () => {
    return recentFiles.value
  }

  return {
    currentFile,
    playlist,
    recentFiles,
    setCurrentFile,
    clearCurrentFile,
    getRecentFiles
  }
})