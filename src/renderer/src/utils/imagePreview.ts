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
        }
        body.light-bg .btn {
          border-color: rgba(0, 0, 0, 0.15);
          background: rgba(0, 0, 0, 0.05);
        }
        .btn:hover {
          border-color: rgba(0, 212, 255, 0.6);
          background: rgba(0, 212, 255, 0.15);
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
          transition: transform 0.2s ease;
          user-select: none;
        }
        .status {
          display: flex;
          gap: 12px;
          font-size: 13px;
          opacity: 0.85;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div class="toolbar-title">${escapedTitle}</div>
        <button class="btn" data-action="zoom-out">缩小</button>
        <button class="btn" data-action="zoom-in">放大</button>
        <button class="btn" data-action="reset">重置</button>
        <button class="btn" data-action="rotate-left">⟲ 左转90°</button>
        <button class="btn" data-action="rotate-right">⟳ 右转90°</button>
        <button class="btn" id="bgToggle">切换背景</button>
        <button class="btn" data-action="download">下载</button>
        <button class="btn" data-action="close">关闭</button>
      </div>
      <div class="canvas" id="canvas">
        <img id="previewImage" src="${escapedSrc}" alt="${escapedTitle}" draggable="false" />
      </div>
      <div class="status">
        <span>缩放：<strong id="zoomValue">100%</strong></span>
        <span>旋转：<strong id="rotationValue">0°</strong></span>
        <span>提示：滚轮缩放，按住拖拽</span>
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
          let isDragging = false;
          let origin = { x: 0, y: 0 };
          let translate = { x: 0, y: 0 };

          const updateView = () => {
            img.style.transform = 'translate(' + translate.x + 'px,' + translate.y + 'px) scale(' + scale + ') rotate(' + rotation + 'deg)';
            zoomValue.textContent = Math.round(scale * 100) + '%';
            rotationValue.textContent = rotation + '°';
          };

          const actions = {
            'zoom-in': () => scale = Math.min(scale + 0.2, 5),
            'zoom-out': () => scale = Math.max(scale - 0.2, 0.1),
            reset: () => { scale = 1; rotation = 0; translate = { x: 0, y: 0 }; },
            'rotate-left': () => rotation = (rotation - 90 + 360) % 360,
            'rotate-right': () => rotation = (rotation + 90) % 360,
            download: () => {
              const link = document.createElement('a');
              link.href = img.src;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            },
            close: () => window.close()
          };

          document.querySelectorAll('.btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
              const action = btn.getAttribute('data-action');
              if (action && actions[action]) {
                actions[action]();
                updateView();
              }
            });
          });

          const bgToggle = document.getElementById('bgToggle');
          if (bgToggle) {
            bgToggle.addEventListener('click', () => {
              document.body.classList.toggle('light-bg');
            });
          }

          canvas.addEventListener('wheel', event => {
            event.preventDefault();
            scale += event.deltaY > 0 ? -0.1 : 0.1;
            scale = Math.min(Math.max(scale, 0.1), 5);
            updateView();
          }, { passive: false });

          canvas.addEventListener('mousedown', event => {
            isDragging = true;
            origin = { x: event.clientX - translate.x, y: event.clientY - translate.y };
            canvas.style.cursor = 'grabbing';
          });

          window.addEventListener('mousemove', event => {
            if (!isDragging) return;
            translate = { x: event.clientX - origin.x, y: event.clientY - origin.y };
            updateView();
          });

          window.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
          });

          updateView();
        })();
      </script>
    </body>
  </html>`

  previewWindow.document.write(popupHtml)
  previewWindow.document.close()
  return true
}
