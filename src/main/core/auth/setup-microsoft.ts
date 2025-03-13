import { BrowserWindow, dialog } from 'electron';
import { getLogger } from '../utils/logger';
import { saveConfig } from '../utils/config';

const logger = getLogger('auth:setup-microsoft');

/**
 * 打开一个对话框，让用户输入Microsoft客户端ID
 */
export async function setupMicrosoftClientId(): Promise<boolean> {
    try {
        // 创建一个简单的窗口用于输入Microsoft Client ID
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

        // 创建简单的HTML内容，包含输入框和按钮
        const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>设置Microsoft客户端ID</title>
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
        input {
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background-color: #0078d7;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        button:hover {
          background-color: #005a9e;
        }
        button.cancel {
          background-color: #d9d9d9;
          color: #333;
        }
        button.cancel:hover {
          background-color: #c1c1c1;
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
        <h2>设置Microsoft客户端ID</h2>
        <p>请输入您从Azure门户获取的Microsoft客户端ID：</p>
        <input type="text" id="clientId" placeholder="Microsoft客户端ID">
        <div>
          <button id="saveBtn">保存</button>
          <button class="cancel" id="cancelBtn">取消</button>
        </div>
        <div class="info">
          <p>这个ID将会被安全地保存在您的用户数据目录中。</p>
        </div>
      </div>
      <script>
        const saveBtn = document.getElementById('saveBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const clientIdInput = document.getElementById('clientId');
        
        saveBtn.addEventListener('click', () => {
          const clientId = clientIdInput.value.trim();
          if (clientId) {
            window.location.href = 'mc-auth-callback://save?clientId=' + encodeURIComponent(clientId);
          } else {
            alert('请输入有效的Microsoft客户端ID');
          }
        });
        
        cancelBtn.addEventListener('click', () => {
          window.location.href = 'mc-auth-callback://cancel';
        });
      </script>
    </body>
    </html>
    `;

        setupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

        return new Promise<boolean>((resolve) => {
            setupWindow.webContents.on('will-navigate', async (event, url) => {
                event.preventDefault();

                if (url.startsWith('mc-auth-callback://save')) {
                    const urlObj = new URL(url);
                    const clientId = urlObj.searchParams.get('clientId');

                    if (clientId) {
                        // 保存Client ID到配置
                        const saved = saveConfig({
                            microsoftAuth: {
                                clientId
                            }
                        });

                        if (saved) {
                            await dialog.showMessageBox(setupWindow, {
                                type: 'info',
                                title: '配置已保存',
                                message: 'Microsoft客户端ID已成功保存。',
                                buttons: ['确定']
                            });
                            setupWindow.close();
                            resolve(true);
                        } else {
                            await dialog.showMessageBox(setupWindow, {
                                type: 'error',
                                title: '保存失败',
                                message: '无法保存配置。请检查应用权限。',
                                buttons: ['确定']
                            });
                            resolve(false);
                        }
                    }
                } else if (url.startsWith('mc-auth-callback://cancel')) {
                    setupWindow.close();
                    resolve(false);
                }
            });

            setupWindow.on('closed', () => {
                resolve(false);
            });
        });
    } catch (error) {
        logger.error('设置Microsoft客户端ID失败:', error);
        return false;
    }
}