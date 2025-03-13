// scripts/ts-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 检查源代码目录结构...');
const srcMainDir = path.resolve(__dirname, '../src/main');

if (!fs.existsSync(srcMainDir)) {
    console.error('❌ 源代码目录不存在: src/main');
    process.exit(1);
}

console.log('📂 源代码目录结构:');
function listSourceFiles(dir, prefix = '') {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(path.resolve(__dirname, '..'), fullPath);

        if (stats.isDirectory()) {
            console.log(`${prefix}📁 ${relativePath}`);
            listSourceFiles(fullPath, prefix + '  ');
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            console.log(`${prefix}📄 ${relativePath}`);
        }
    });
}
listSourceFiles(srcMainDir);

console.log('\n🧹 清理dist目录...');
try {
    execSync('rimraf dist', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ 清理失败:', error.message);
    process.exit(1);
}

console.log('\n🔨 编译TypeScript...');
try {
    execSync('tsc -p tsconfig.electron.json', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ 编译失败:', error.message);
    process.exit(1);
}

console.log('\n🔍 检查编译后文件...');
const distMainDir = path.resolve(__dirname, '../dist/main');

if (!fs.existsSync(distMainDir)) {
    console.error('❌ 编译后目录不存在: dist/main');
    // 尝试创建目录结构并移动文件
    console.log('⚠️ 尝试修复目录结构...');

    fs.mkdirSync(distMainDir, { recursive: true });

    const indexSrc = path.resolve(__dirname, '../dist/index.js');
    const preloadSrc = path.resolve(__dirname, '../dist/preload.js');

    if (fs.existsSync(indexSrc) && fs.existsSync(preloadSrc)) {
        console.log('🔄 移动文件到正确位置...');
        fs.copyFileSync(indexSrc, path.join(distMainDir, 'index.js'));
        fs.copyFileSync(preloadSrc, path.join(distMainDir, 'preload.js'));

        // 复制 map 文件
        if (fs.existsSync(indexSrc + '.map')) {
            fs.copyFileSync(indexSrc + '.map', path.join(distMainDir, 'index.js.map'));
        }
        if (fs.existsSync(preloadSrc + '.map')) {
            fs.copyFileSync(preloadSrc + '.map', path.join(distMainDir, 'preload.js.map'));
        }

        console.log('✅ 文件已移动到正确位置');
    } else {
        console.error('❌ 无法找到需要移动的文件');
        process.exit(1);
    }
}

console.log('\n✅ TypeScript编译完成!');