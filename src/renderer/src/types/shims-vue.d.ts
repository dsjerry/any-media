declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@/stores/media' {
  export interface MediaFile {
    name: string
    path: string
    type: 'video' | 'audio' | 'image'
  }

  export function useMediaStore(): {
    currentFile: Ref<MediaFile | null>
    playlist: Ref<MediaFile[]>
    recentFiles: Ref<MediaFile[]>
    setCurrentFile: (file: MediaFile) => void
    clearCurrentFile: () => void
    getRecentFiles: () => MediaFile[]
  }
}
