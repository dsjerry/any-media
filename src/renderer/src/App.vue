<template>
  <div class="app-container">
    <header class="app-header">
      <nav class="nav-container">
        <div class="nav-content">
          <div class="brand-section">
            <h1 class="app-title">Any Player</h1>
          </div>
          <div class="nav-links">
            <router-link
              to="/"
              class="nav-link"
              :class="{ 'active': $route.path === '/' }"
            >
              <span class="nav-icon">🏠</span>
              <span class="nav-text">首页</span>
            </router-link>
            <router-link
              to="/player"
              class="nav-link"
              :class="{ 'active': $route.path === '/player' }"
            >
              <span class="nav-icon">🎬</span>
              <span class="nav-text">播放器</span>
            </router-link>
            <router-link
              to="/media-library"
              class="nav-link"
              :class="{ 'active': $route.path === '/media-library' }"
            >
              <span class="nav-icon">📁</span>
              <span class="nav-text">媒体库</span>
            </router-link>
            <router-link
              to="/settings"
              class="nav-link"
              :class="{ 'active': $route.path === '/settings' }"
            >
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">设置</span>
            </router-link>
          </div>
        </div>
      </nav>
    </header>

    <main class="main-content">
      <ErrorBoundary component-name="RouterView">
        <router-view />
      </ErrorBoundary>
    </main>

    <!-- <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-info">
          <p>&copy; dsjerry</p>
        </div>
      </div>
    </footer> -->
  </div>
</template>

<script setup lang="ts">
import ErrorBoundary from './components/ErrorBoundary.vue';
</script>

<style scoped>
/* App 根组件毛玻璃风格 */
.app-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100vh;
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
    radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 153, 204, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 应用头部 */
.app-header {
  position: relative;
  z-index: 100;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* 品牌区域 */
.brand-section {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 12px rgba(0, 212, 255, 0.3);
  margin: 0;
}

/* 导航链接 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.nav-link.active {
  background: rgba(0, 212, 255, 0.1);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.nav-link.active::before {
  display: none;
}

.nav-icon {
  font-size: 16px;
}

.nav-text {
  font-weight: 500;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 64px - 60px);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 应用底部 */
.app-footer {
  position: relative;
  z-index: 100;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--glass-border);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.footer-info {
  text-align: center;
}

.footer-info p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 400;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 16px;
  }

  .nav-content {
    height: 56px;
  }

  .app-title {
    font-size: 20px;
  }

  .nav-links {
    gap: 4px;
  }

  .nav-link {
    padding: 8px 12px;
    gap: 6px;
  }

  .nav-icon {
    font-size: 14px;
  }

  .nav-text {
    font-size: 13px;
  }

  .main-content {
    min-height: calc(100vh - 56px - 60px);
  }

  .footer-content {
    padding: 16px;
  }

  .footer-info p {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .nav-content {
    flex-direction: column;
    height: auto;
    padding: 12px 0;
    gap: 12px;
  }

  .nav-links {
    width: 100%;
    justify-content: space-around;
  }

  .nav-link {
    flex-direction: column;
    padding: 8px;
    text-align: center;
    min-width: 60px;
  }

  .nav-text {
    font-size: 12px;
  }

  .main-content {
    min-height: calc(100vh - 100px - 60px);
  }
}

/* 动画效果 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-header {
  animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link {
  animation: slideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
}

.nav-link:nth-child(1) { animation-delay: 0.1s; }
.nav-link:nth-child(2) { animation-delay: 0.2s; }
.nav-link:nth-child(3) { animation-delay: 0.3s; }
.nav-link:nth-child(4) { animation-delay: 0.4s; }

/* 悬浮效果 */
.app-header:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.nav-link:hover {
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.2);
}

.nav-link.active:hover {
  box-shadow: 0 6px 24px rgba(0, 212, 255, 0.4);
}
</style>