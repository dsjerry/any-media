<template>
  <div style="width: 100%; height: 100%;">
    <div v-if="error" class="error-boundary">
      <div class="error-content">
        <h2>出现错误</h2>
        <p>{{ errorMessage }}</p>
        <div class="error-details" v-if="showDetails">
          <pre>{{ errorInfo }}</pre>
        </div>
        <div class="error-actions">
          <button class="error-btn" @click="toggleDetails">
            {{ showDetails ? '隐藏详情' : '显示详情' }}
          </button>
          <button class="error-btn primary" @click="resetError">
            重试
          </button>
        </div>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, provide } from 'vue'
import { logService } from '../services/LogService'

const props = defineProps<{
  componentName?: string
}>()

const error = ref<Error | null>(null)
const errorMessage = ref('')
const errorInfo = ref('')
const showDetails = ref(false)

// 捕获子组件中的错误
onErrorCaptured((err, _instance, info) => {
  // 使用下划线前缀表示参数未使用
  handleError(err, info)
  // 返回 false 以防止错误继续传播
  return false
})

// 处理错误
const handleError = (err: unknown, info?: string) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  errorMessage.value = error.value.message || '未知错误'
  errorInfo.value = `
错误类型: ${error.value.name}
错误信息: ${error.value.message}
组件: ${props.componentName || '未知组件'}
详细信息: ${info || '无'}
堆栈: ${error.value.stack || '无堆栈信息'}
  `.trim()

  // 记录到日志服务
  logService.error(`组件错误: ${errorMessage.value}`, {
    error: error.value,
    info,
    component: props.componentName
  })
}

// 重置错误状态
const resetError = () => {
  error.value = null
  errorMessage.value = ''
  errorInfo.value = ''
  showDetails.value = false
}

// 切换显示详情
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// 提供错误处理方法给子组件
provide('errorHandler', handleError)
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 30, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-primary);
  padding: 20px;
}

.error-content {
  max-width: 600px;
  background: rgba(40, 40, 40, 0.9);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--glass-shadow);
}

h2 {
  color: #ff5252;
  margin-top: 0;
  margin-bottom: 16px;
}

.error-details {
  margin: 16px 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  color: var(--text-secondary);
}

.error-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.error-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.error-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.error-btn.primary {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(0, 153, 204, 0.8));
  border-color: var(--accent-primary);
  color: white;
}

.error-btn.primary:hover {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(0, 153, 204, 0.9));
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}
</style>
