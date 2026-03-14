export const openImagePreviewWindow = (src: string, title = '图片预览') => {
  if (!src) return false

  const previewWindow = window.open('', '_blank')
  if (!previewWindow) {
    alert('请允许浏览器弹出窗口以查看图片')
    return false
  }

  const safeTitle = title.replace(/[<>]/g, '')
  const escapedTitle = safeTitle.replace(/"/g, '&quot;')
  const escapedSrc = src.replace(/"/g, '&quot;')

  const popupHtml = `<!DOCTYPE html>
  <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>${escapedTitle}</title>
      <style>
        :root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          color: #fff;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #050607;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          overflow: hidden;
        }
        body.light-bg {
          background: #f4f5f6;
          color: #1f1f1f;
        }
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          background: rgba(15, 17, 23, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 12px;
          backdrop-filter: blur(12px);
        }
        body.light-bg .toolbar {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(0, 0, 0, 0.08);
        }
        .toolbar-title {
          font-weight: 600;
          margin-right: auto;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-group {
          display: flex;
          gap: 4px;
        }
        .btn {
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: inherit;
          border-radius: 8px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        body.light-bg .btn {
          border-color: rgba(0, 0, 0, 0.15);
          background: rgba(0, 0, 0, 0.05);
        }
        .btn:hover {
          border-color: rgba(0, 212, 255, 0.6);
          background: rgba(0, 212, 255, 0.15);
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .btn.active {
          border-color: rgba(0, 212, 255, 0.8);
          background: rgba(0, 212, 255, 0.25);
        }
        .canvas {
          flex: 1;
          min-height: 0;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          background: repeating-conic-gradient(#333 0% 25%, transparent 0% 50%) 50% / 24px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        body.light-bg .canvas {
          border-color: rgba(0, 0, 0, 0.1);
          background: repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 24px 24px;
        }
        img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          transition: transform 0.15s ease;
          user-select: none;
          transform-origin: center center;
        }
        .status {
          display: flex;
          gap: 16px;
          font-size: 13px;
          opacity: 0.85;
          align-items: center;
        }
        .status-info {
          display: flex;
          gap: 12px;
        }
        .status-hint {
          margin-left: auto;
          opacity: 0.6;
          font-size: 12px;
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 10;
        }
        .canvas:hover .nav-btn {
          opacity: 1;
        }
        .nav-btn:hover {
          background: rgba(0, 212, 255, 0.5);
        }
        .nav-btn:disabled {
          display: none;
        }
        .nav-prev { left: 16px; }
        .nav-next { right: 16px; }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div class="toolbar-title" title="${escapedTitle}">${escapedTitle}</div>
        
        <div class="btn-group">
          <button class="btn" data-action="zoom-out" title="缩小 (-)">−</button>
          <button class="btn" data-action="zoom-fit" title="适应窗口 (F)">适应窗口</button>
          <button class="btn" data-action="zoom-100" title="实际像素 (1)">1:1</button>
          <button class="btn" data-action="zoom-in" title="放大 (+)">+</button>
        </div>
        
        <div class="btn-group">
          <button class="btn" data-action="rotate-left" title="逆时针旋转 (L)">⟲</button>
          <button class="btn" data-action="rotate-right" title="顺时针旋转 (R)">⟳</button>
          <button class="btn" data-action="flip-h" title="水平翻转 (H)">⇆</button>
          <button class="btn" data-action="flip-v" title="垂直翻转 (V)">⇅</button>
        </div>
        
        <div class="btn-group">
          <button class="btn" data-action="bg-toggle" id="bgToggle">背景</button>
          <button class="btn" data-action="fullscreen" title="全屏 (F11)">全屏</button>
          <button class="btn" data-action="download" title="下载">下载</button>
          <button class="btn" data-action="close" title="关闭 (ESC)">关闭</button>
        </div>
      </div>
      
      <div class="canvas" id="canvas">
        <button class="nav-btn nav-prev" data-action="prev" title="上一张 (←)">❮</button>
        <img id="previewImage" src="${escapedSrc}" alt="${escapedTitle}" draggable="false" />
        <button class="nav-btn nav-next" data-action="next" title="下一张 (→)">❯</button>
      </div>
      
      <div class="status">
        <div class="status-info">
          <span>缩放：<strong id="zoomValue">100%</strong></span>
          <span>旋转：<strong id="rotationValue">0°</strong></span>
        </div>
        <div class="status-hint">
          滚轮/拖拽 | 空格适应窗口 | 1实际像素 | F11全屏 | ←→切换 | ESC关闭
        </div>
      </div>
      
      <script>
        (function () {
          const img = document.getElementById('previewImage');
          const zoomValue = document.getElementById('zoomValue');
          const rotationValue = document.getElementById('rotationValue');
          const canvas = document.getElementById('canvas');
          const fileName = ${JSON.stringify(title)};
          
          let scale = 1;
          let rotation = 0;
          let flipH = false;
          let flipV = false;
          let isDragging = false;
          let startPos = { x: 0, y: 0 };
          let translate = { x: 0, y: 0 };
          let lastMousePos = { x: 0, y: 0 };
          
          const minScale = 0.05;
          const maxScale = 10;
          const zoomStep = 0.15;
          
          const getImageNaturalSize = () => {
            return new Promise(resolve => {
              if (img.naturalWidth > 0) {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
              } else {
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
              }
            });
          };
          
          const updateView = async () => {
            let transform = 'translate(' + translate.x + 'px, ' + translate.y + 'px) ';
            transform += 'scale(' + scale * (flipH ? -1 : 1) + ', ' + scale * (flipV ? -1 : 1) + ') ';
            transform += 'rotate(' + rotation + 'deg)';
            img.style.transform = transform;
            
            zoomValue.textContent = Math.round(scale * 100) + '%';
            rotationValue.textContent = rotation + '°';
          };
          
          const fitToWindow = async () => {
            const natural = await getImageNaturalSize();
            const rect = canvas.getBoundingClientRect();
            const padding = 40;
            const scaleX = (rect.width - padding) / natural.width;
            const scaleY = (rect.height - padding) / natural.height;
            scale = Math.min(scaleX, scaleY, 1);
            translate = { x: 0, y: 0 };
            updateView();
          };
          
          const actions = {
            'zoom-in': () => {
              const rect = canvas.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const oldScale = scale;
              scale = Math.min(scale * (1 + zoomStep), maxScale);
              const scaleRatio = scale / oldScale;
              translate.x = centerX - (centerX - translate.x) * scaleRatio;
              translate.y = centerY - (centerY - translate.y) * scaleRatio;
            },
            'zoom-out': () => {
              const rect = canvas.getBoundingClientRect();
              const centerX = rect.width / 2;
              const centerY = rect.height / 2;
              const oldScale = scale;
              scale = Math.max(scale * (1 - zoomStep), minScale);
              const scaleRatio = scale / oldScale;
              translate.x = centerX - (centerX - translate.x) * scaleRatio;
              translate.y = centerY - (centerY - translate.y) * scaleRatio;
            },
            'zoom-fit': fitToWindow,
            'zoom-100': () => { scale = 1; translate = { x: 0, y: 0 }; },
            'rotate-left': () => { rotation = (rotation - 90 + 360) % 360; },
            'rotate-right': () => { rotation = (rotation + 90) % 360; },
            'flip-h': () => { flipH = !flipH; },
            'flip-v': () => { flipV = !flipV; },
            'bg-toggle': () => { document.body.classList.toggle('light-bg'); },
            'fullscreen': () => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            },
            download: () => {
              const link = document.createElement('a');
              link.href = img.src;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            close: () => window.close(),
            prev: () => window.dispatchEvent(new CustomEvent('navigate', { detail: -1 })),
            next: () => window.dispatchEvent(new CustomEvent('navigate', { detail: 1 }))
          };
          
          document.querySelectorAll('.btn[data-action], .nav-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const action = btn.getAttribute('data-action');
              if (action && actions[action]) {
                actions[action]();
                updateView();
              }
            });
          });
          
          canvas.addEventListener('wheel', event => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left - rect.width / 2;
            const mouseY = event.clientY - rect.top - rect.height / 2;
            
            const delta = event.deltaY > 0 ? -1 : 1;
            const oldScale = scale;
            
            if (delta > 0) {
              scale = Math.min(scale * (1 + zoomStep), maxScale);
            } else {
              scale = Math.max(scale * (1 - zoomStep), minScale);
            }
            
            const scaleRatio = scale / oldScale;
            translate.x = mouseX - (mouseX - translate.x) * scaleRatio;
            translate.y = mouseY - (mouseY - translate.y) * scaleRatio;
            
            updateView();
          }, { passive: false });
          
          canvas.addEventListener('mousedown', event => {
            if (event.button === 0) {
              isDragging = true;
              startPos = { x: event.clientX - translate.x, y: event.clientY - translate.y };
              canvas.style.cursor = 'grabbing';
              event.preventDefault();
            }
          });
          
          window.addEventListener('mousemove', event => {
            if (isDragging) {
              translate.x = event.clientX - startPos.x;
              translate.y = event.clientY - startPos.y;
              lastMousePos = { x: event.clientX, y: event.clientY };
              updateView();
            }
          });
          
          window.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
          });
          
          canvas.addEventListener('dblclick', async (event) => {
            if (scale > 1.5) {
              await fitToWindow();
            } else {
              scale = 2;
              const rect = canvas.getBoundingClientRect();
              const clickX = event.clientX - rect.left - rect.width / 2;
              const clickY = event.clientY - rect.top - rect.height / 2;
              translate.x = -clickX;
              translate.y = -clickY;
            }
            updateView();
          });
          
          canvas.style.cursor = 'grab';
          
          window.addEventListener('keydown', event => {
            switch (event.key) {
              case 'Escape':
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  window.close();
                }
                break;
              case '+':
              case '=':
                actions['zoom-in']();
                break;
              case '-':
                actions['zoom-out']();
                break;
              case '1':
                actions['zoom-100']();
                break;
              case '0':
                actions['zoom-fit']();
                break;
              case 'f':
              case 'F':
                if (event.key === 'F' && event.shiftKey) {
                  actions['fullscreen']();
                } else {
                  actions['zoom-fit']();
                }
                break;
              case 'F11':
                event.preventDefault();
                actions['fullscreen']();
                break;
              case ' ':
                event.preventDefault();
                actions['zoom-fit']();
                break;
              case 'l':
              case 'L':
                actions['rotate-left']();
                break;
              case 'r':
              case 'R':
                actions['rotate-right']();
                break;
              case 'h':
              case 'H':
                actions['flip-h']();
                break;
              case 'v':
              case 'V':
                actions['flip-v']();
                break;
              case 'ArrowLeft':
                window.dispatchEvent(new CustomEvent('navigate', { detail: -1 }));
                break;
              case 'ArrowRight':
                window.dispatchEvent(new CustomEvent('navigate', { detail: 1 }));
                break;
            }
            updateView();
          });
          
          img.onload = () => {
            fitToWindow();
          };
          
          if (img.complete) {
            fitToWindow();
          }
        })();
      </script>
    </body>
  </html>`

  previewWindow.document.write(popupHtml)
  previewWindow.document.close()
  return true
}
