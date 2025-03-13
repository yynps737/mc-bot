// scripts/copy-main-files.js
const fs = require('fs');
const path = require('path');

// 确保目录存在
const distDir = path.resolve(__dirname, '../dist');
const mainDir = path.resolve(distDir, 'main');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(mainDir)) {
    fs.mkdirSync(mainDir, { recursive: true });
}

// 检查源文件
const rootIndexJs = path.resolve(distDir, 'index.js');
const rootPreloadJs = path.resolve(distDir, 'preload.js');

const targetIndexJs = path.resolve(mainDir, 'index.js');
const targetPreloadJs = path.resolve(mainDir, 'preload.js');

// 复制文件
function copyIfExists(src, dest) {
    if (fs.existsSync(src)) {
        console.log(`复制文件: ${path.relative(process.cwd(), src)} -> ${path.relative(process.cwd(), dest)}`);
        fs.copyFileSync(src, dest);
        return true;
    }
    return false;
}

// 检查源文件是否存在
let indexExists = fs.existsSync(rootIndexJs);
let preloadExists = fs.existsSync(rootPreloadJs);

// 显示状态
console.log('当前文件状态:');
console.log(`index.js 在根目录: ${indexExists ? '✓' : '✗'}`);
console.log(`preload.js 在根目录: ${preloadExists ? '✓' : '✗'}`);
console.log(`index.js 在 main 目录: ${fs.existsSync(targetIndexJs) ? '✓' : '✗'}`);
console.log(`preload.js 在 main 目录: ${fs.existsSync(targetPreloadJs) ? '✓' : '✗'}`);

// 复制文件
let copied = false;
if (indexExists) {
    copied |= copyIfExists(rootIndexJs, targetIndexJs);
}
if (preloadExists) {
    copied |= copyIfExists(rootPreloadJs, targetPreloadJs);
}

// 如果没有文件可复制，创建一个基本的index.js
if (!fs.existsSync(targetIndexJs)) {
    console.log('创建基本的 index.js 文件');
    const basicIndexJs = `// 基本的Electron主进程文件
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
`;
    fs.writeFileSync(targetIndexJs, basicIndexJs);
}

// 如果没有preload.js，创建一个
if (!fs.existsSync(targetPreloadJs)) {
    console.log('创建基本的 preload.js 文件');
    const basicPreloadJs = `// 预加载脚本
const { contextBridge } = require('electron');

// 暴露接口到渲染进程
contextBridge.exposeInMainWorld('api', {
  isElectron: true
});

console.log('预加载脚本已执行');
`;
    fs.writeFileSync(targetPreloadJs, basicPreloadJs);
}

// 显示最终状态
console.log('\n最终文件状态:');
console.log(`index.js 在 main 目录: ${fs.existsSync(targetIndexJs) ? '✓' : '✗'}`);
console.log(`preload.js 在 main 目录: ${fs.existsSync(targetPreloadJs) ? '✓' : '✗'}`);

if (copied) {
    console.log('\n✓ 文件已成功复制到正确位置!');
} else {
    console.log('\n✓ 已创建必要的文件!');
}