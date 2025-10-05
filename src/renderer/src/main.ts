import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import "./style.css"

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 添加全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error handler caught an error:', err)
  console.error('Error occurred in component:', instance)
  console.error('Error info:', info)
}

// 添加全局警告处理
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Global warning:', msg)
  console.warn('Warning occurred in component:', instance)
  console.warn('Warning trace:', trace)
}

// 添加全局性能跟踪
app.config.performance = true

// 注册插件
app.use(pinia)
app.use(router)

// 添加全局属性
app.config.globalProperties.$appName = 'Any Player'
app.config.globalProperties.$appVersion = '1.0.0'

// 挂载应用
app.mount("#app")

// 添加全局未捕获错误处理
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
