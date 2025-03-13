import { BrowserWindow, dialog } from 'electron';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth:setup-microsoft');

/**
 * 此功能已弃用 - 现在只支持从config.json文件读取Microsoft客户端ID
 */
export async function setupMicrosoftClientId(): Promise<boolean> {
    try {
        // 创建一个简单的窗口用于显示提示信息
        const setupWindow = new BrowserWindow({
            width: 500,
            height: 300,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            resizable: false,
            minimizable: false,
            maximizable: false,
            parent: BrowserWindow.getFocusedWindow() || undefined,
            modal: true
        });

        // 创建简单的HTML内容，包含提示信息
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Microsoft客户端ID配置</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          padding: 20px;
          background-color: #f7f7f7;
          color: #333;
        }
        h2 {
          margin-top: 0;
          color: #0078d7;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        p {
          line-height: 1.5;
        }
        button {
          background-color: #0078d7;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
        button:hover {
          background-color: #005a9e;
        }
        .info {
          margin-top: 15px;
          font-size: 0.9em;
          color: #555;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Microsoft客户端ID配置</h2>
        <p>此应用程序现在只支持从配置文件读取Microsoft客户端ID。</p>
        <p>请在项目根目录创建或编辑 <strong>config.json</strong> 文件，并设置以下内容：</p>
        <pre style="background-color: #f0f0f0; padding: 10px; border-radius: 4px; overflow: auto;">
{
  "microsoftAuth": {
    "clientId": "您的Microsoft客户端ID"
  }
}</pre>
        <p>配置完成后重启应用程序。</p>
        <div class="info">
          <p>您可以从Azure门户获取Microsoft客户端ID。</p>
        </div>
        <button id="closeBtn">关闭</button>
      </div>
      <script>
        const closeBtn = document.getElementById('closeBtn');
        
        closeBtn.addEventListener('click', () => {
          window.close();
        });
      </script>
    </body>
    </html>
    `;

        setupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

        return new Promise<boolean>((resolve) => {
            setupWindow.on('closed', () => {
                resolve(false);
            });
        });
    } catch (error) {
        logger.error('显示Microsoft客户端ID配置信息失败:', error);
        return false;
    }
}