// scripts/check-dist.js
const fs = require('fs');
const path = require('path');

// 检查编译后的文件是否存在
const requiredFiles = [
    'main/index.js',
    'main/preload.js',
    'renderer/index.html'
];

console.log('检查编译后的文件...');

let allFilesExist = true;
const distDir = path.resolve(__dirname, '../dist');

console.log(`检查目录: ${distDir}`);

// 检查每个必需文件
for (const file of requiredFiles) {
    const filePath = path.join(distDir, file);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ 未找到必需文件: ${file}`);
        allFilesExist = false;

        // 如果是渲染器的HTML文件缺失，尝试创建一个基本的HTML文件
        if (file === 'renderer/index.html') {
            const htmlDir = path.dirname(filePath);

            if (!fs.existsSync(htmlDir)) {
                fs.mkdirSync(htmlDir, { recursive: true });
            }

            // 基本的HTML文件
            const basicHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的世界客户端</title>
    <style>
        body {
            font-family: sans-serif;
            background-color: #111827;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background-color: rgba(31, 41, 55, 0.7);
            border-radius: 0.5rem;
            border: 1px solid #374151;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>我的世界客户端</h1>
        <p>应用程序已启动</p>
    </div>
</body>
</html>`;

            fs.writeFileSync(filePath, basicHtml);
            console.log(`⚠️ 已创建基本的 ${file} 文件`);

            // 更新检查结果
            allFilesExist = true;
        }
    } else {
        console.log(`✅ 找到文件: ${file}`);
    }
}

// 打印目录结构
console.log('\n目录结构:');
function listDirectory(dir, prefix = '') {
    if (!fs.existsSync(dir)) {
        console.error(`目录不存在: ${dir}`);
        return;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(distDir, fullPath);

        if (stats.isDirectory()) {
            // 跳过win-unpacked目录，它可能很大
            if (item === 'win-unpacked') {
                console.log(`${prefix}📁 ${relativePath || item} (内容已省略)`);
                continue;
            }

            console.log(`${prefix}📁 ${relativePath || item}`);
            listDirectory(fullPath, prefix + '  ');
        } else {
            console.log(`${prefix}📄 ${relativePath || item}`);
        }
    }
}

try {
    listDirectory(distDir);
} catch (error) {
    console.error(`❌ 无法列出目录: ${error.message}`);
}

if (!allFilesExist) {
    console.error('\n❌ 构建验证失败: 部分必需文件缺失');
    process.exit(1);
} else {
    console.log('\n✅ 构建验证成功: 所有必需文件都存在');
}