# Any Player

> **GLM-4.5 + Claude Code** 生成

一个基于 Electron + Vue 3 + TypeScript 的现代化媒体播放器，支持视频、音频和图片播放。

## 功能特性

- 🎬 **视频播放** - 支持 MP4、AVI、MOV 等多种视频格式
- 🎵 **音频播放** - 支持 MP3、WAV、FLAC 等音频格式
- 🖼️ **图片查看** - 支持 JPG、PNG、GIF 等图片格式
- 🎨 **现代 UI** - 基于 Tailwind CSS 的现代化界面
- 🚀 **快速启动** - 使用 Vite 7 构建工具
- 💻 **跨平台** - 基于 Electron，支持 Windows、macOS、Linux

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 7
- **桌面应用**: Electron
- **样式**: Tailwind CSS
- **路由**: Vue Router 4
- **状态管理**: Pinia

## 开发环境要求

- Node.js 18+
- npm 或 yarn

## 安装依赖

```bash
npm install
```

## 开发模式

```bash
# 启动开发服务器
npm run dev

# 启动 Electron 开发模式
npm run electron
```

## 构建项目

```bash
# 构建 Vue 应用
npm run build

# 构建 Electron 应用
npm run electron:build

# 完整构建
npm run dist
```

## 项目结构

```
any-player/
├── src/
│   ├── main/                 # Electron 主进程
│   ├── preload/             # 预加载脚本
│   └── renderer/            # 渲染进程 (Vue 应用)
│       ├── src/
│       │   ├── components/  # 组件
│       │   ├── views/       # 页面
│       │   ├── router/      # 路由
│       │   ├── stores/      # 状态管理
│       │   ├── assets/      # 静态资源
│       │   ├── App.vue      # 根组件
│       │   └── main.ts      # 入口文件
│       └── index.html       # HTML 模板
├── dist/                    # 构建输出
├── dist-electron/           # Electron 构建输出
└── package.json             # 项目配置
```

## 开发说明

1. 主进程代码位于 `src/main/` 目录
2. 预加载脚本位于 `src/preload/` 目录
3. Vue 应用代码位于 `src/renderer/` 目录
4. 使用 TypeScript 确保类型安全
5. 使用 Tailwind CSS 进行样式开发
6. 使用 Vue Router 进行页面路由管理
7. 使用 Pinia 进行状态管理

## 许可证

MIT License
