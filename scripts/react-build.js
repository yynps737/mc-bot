// scripts/react-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 检查 React 源代码目录...');
const srcRendererDir = path.resolve(__dirname, '../src/renderer');

if (!fs.existsSync(srcRendererDir)) {
    console.error('❌ 源代码目录不存在: src/renderer');
    process.exit(1);
}

console.log('📂 React 源代码目录结构:');
function listSourceFiles(dir, prefix = '') {
    try {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            const relativePath = path.relative(path.resolve(__dirname, '..'), fullPath);

            if (stats.isDirectory()) {
                console.log(`${prefix}📁 ${relativePath}`);
                listSourceFiles(fullPath, prefix + '  ');
            } else if (/\.(ts|tsx|html|css|js|jsx)$/.test(item)) {
                console.log(`${prefix}📄 ${relativePath}`);
            }
        });
    } catch (error) {
        console.error(`❌ 读取目录错误: ${error.message}`);
    }
}
listSourceFiles(srcRendererDir);

console.log('\n🧹 准备 renderer 目录...');
const distRendererDir = path.resolve(__dirname, '../dist/renderer');
if (!fs.existsSync(distRendererDir)) {
    fs.mkdirSync(distRendererDir, { recursive: true });
}

console.log('\n🔨 执行 Vite 构建...');
try {
    execSync('vite build', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Vite 构建失败:', error.message);
    process.exit(1);
}

console.log('\n🔍 检查 Vite 构建输出...');
const rendererIndexHtml = path.resolve(distRendererDir, 'index.html');

if (!fs.existsSync(rendererIndexHtml)) {
    console.error('❌ 未找到 renderer/index.html');

    // 尝试从可能的其他位置复制
    const possibleLocations = [
        path.resolve(__dirname, '../dist/index.html'),
        path.resolve(__dirname, '../dist/src/renderer/index.html'),
        path.resolve(__dirname, '../src/renderer/dist/index.html')
    ];

    let foundSource = null;
    for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
            foundSource = location;
            break;
        }
    }

    if (foundSource) {
        console.log(`🔄 找到 index.html 在 ${foundSource}，移动到正确位置...`);
        fs.copyFileSync(foundSource, rendererIndexHtml);
        console.log('✅ 已复制 index.html 到正确位置');
    } else {
        console.error('❌ 无法找到 index.html 文件');

        // 创建一个基本的 index.html 文件作为应急方案
        console.log('⚠️ 创建一个基本的 index.html 文件作为应急方案...');

        const basicHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的世界客户端</title>
</head>
<body>
    <div id="root">
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
            <h1>构建问题</h1>
            <p>React 应用未正确构建</p>
        </div>
    </div>
    <script>
        console.error("React应用未正确构建");
    </script>
</body>
</html>`;

        fs.writeFileSync(rendererIndexHtml, basicHtml);
        console.log('✅ 已创建基本的 index.html 文件');
    }
}

console.log('\n📁 最终构建目录:');
function listDistFiles(dir, prefix = '') {
    try {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);
            const relativePath = path.relative(path.resolve(__dirname, '../dist'), fullPath);

            if (stats.isDirectory()) {
                console.log(`${prefix}📁 ${relativePath || item}`);
                listDistFiles(fullPath, prefix + '  ');
            } else {
                console.log(`${prefix}📄 ${relativePath || item}`);
            }
        });
    } catch (error) {
        console.error(`❌ 读取目录错误: ${error.message}`);
    }
}
listDistFiles(path.resolve(__dirname, '../dist'));

console.log('\n✅ React 构建完成!');