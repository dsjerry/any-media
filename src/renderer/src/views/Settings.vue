<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1 class="page-title">设置</h1>
      <p class="page-subtitle">自定义您的媒体播放器体验</p>
    </div>

    <div class="settings-content">
      <div class="settings-section glass-card">
        <h2 class="section-title">常规设置</h2>

        <div class="settings-group">
          <div class="setting-item">
            <label class="setting-label">主题</label>
            <select class="glass-input">
              <option>深色主题</option>
              <option>浅色主题</option>
              <option>跟随系统</option>
            </select>
          </div>

          <div class="setting-item">
            <label class="setting-label">语言</label>
            <select class="glass-input">
              <option>简体中文</option>
              <option>English</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-section glass-card">
        <h2 class="section-title">播放器设置</h2>

        <div class="settings-group">
          <div class="setting-item">
            <div class="toggle-container">
              <label class="setting-label">自动播放</label>
              <label class="toggle-switch">
                <input type="checkbox">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="toggle-container">
              <label class="setting-label">循环播放</label>
              <label class="toggle-switch">
                <input type="checkbox">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <label class="setting-label">默认音量</label>
            <div class="volume-control">
              <input type="range" min="0" max="100" value="50" class="glass-slider">
              <span class="volume-value">50%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section glass-card">
        <h2 class="section-title">文件设置</h2>

        <div class="settings-group">
          <div class="setting-item">
            <label class="setting-label">默认下载目录</label>
            <div class="file-path-container">
              <input type="text" class="glass-input" readonly value="/Downloads">
              <button class="glass-btn secondary">浏览</button>
            </div>
          </div>

          <div class="setting-item">
            <div class="toggle-container">
              <label class="setting-label">记住最近文件</label>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="glass-btn secondary">取消</button>
        <button class="glass-btn primary">保存设置</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* 设置页面毛玻璃风格 */
.settings-container {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  height: 100%;
}

.settings-container::before {
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

/* 设置页面头部 */
.settings-header {
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
}

.page-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  font-weight: 400;
}

/* 设置内容区域 */
.settings-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  height: 100%;
  box-sizing: border-box;
  width: 100%;
}

/* 设置区域 */
.settings-section {
  margin-bottom: 32px;
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-section:hover {
  transform: translateY(-4px);
  border-color: var(--accent-primary);
  box-shadow: 0 12px 40px rgba(0, 212, 255, 0.2);
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 2px;
}

/* 设置组 */
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 设置项 */
.setting-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 选择框样式 */
select.glass-input {
  appearance: none;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

select.glass-input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-primary);
}

select.glass-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

/* 自定义选择框箭头 */
select.glass-input {
  background-image:
    linear-gradient(45deg, transparent 50%, var(--accent-primary) 50%),
    linear-gradient(135deg, var(--accent-primary) 50%, transparent 50%);
  background-position:
    calc(100% - 16px) 50%,
    calc(100% - 12px) 50%;
  background-size: 4px 4px, 4px 4px;
  background-repeat: no-repeat;
  padding-right: 32px;
}

/* 开关容器 */
.toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 自定义开关 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

input:checked + .toggle-slider {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-color: var(--accent-primary);
}

input:checked + .toggle-slider:before {
  transform: translateX(28px);
  background: white;
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.volume-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent-primary);
  background: rgba(0, 212, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--accent-primary);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-width: 50px;
  text-align: center;
}

/* 自定义滑块 */
input[type="range"].glass-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid var(--glass-border);
  border-radius: 3px;
  outline: none;
  transition: all 0.3s;
}

input[type="range"].glass-slider:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--accent-primary);
}

input[type="range"].glass-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
}

input[type="range"].glass-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.5);
}

input[type="range"].glass-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 212, 255, 0.3);
}

/* 文件路径容器 */
.file-path-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-path-container .glass-input {
  flex: 1;
}

/* 设置操作按钮 */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 20px 16px;
  }

  .settings-header {
    margin-bottom: 40px;
  }

  .page-title {
    font-size: 32px;
  }

  .page-subtitle {
    font-size: 16px;
  }

  .settings-section {
    padding: 24px;
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .settings-group {
    gap: 20px;
  }

  .file-path-container {
    flex-direction: column;
    align-items: stretch;
  }

  .volume-control {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .settings-actions {
    flex-direction: column;
    gap: 12px;
  }

  .settings-actions .glass-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 28px;
  }

  .settings-section {
    padding: 20px;
  }

  .section-title {
    font-size: 18px;
  }

  .toggle-switch {
    width: 52px;
    height: 28px;
  }

  .toggle-slider:before {
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }
}
</style>