// scripts/build.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保 scripts 和 dist 目录存在
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// 清理 dist 目录
console.log('🧹 清理 dist 目录...');
exec('rimraf dist', (error) => {
    if (error) {
        console.error(`清理错误: ${error}`);
        process.exit(1);
    }

    // 编译主进程代码
    console.log('🔨 编译主进程代码...');
    exec('tsc -p tsconfig.electron.json', (error) => {
        if (error) {
            console.error(`主进程编译错误: ${error}`);
            process.exit(1);
        }

        // 检查主进程文件是否正确生成
        const mainIndexPath = path.join(distDir, 'main', 'index.js');
        if (!fs.existsSync(mainIndexPath)) {
            console.error(`❌ 错误: 主进程入口文件未生成: ${mainIndexPath}`);

            // 检查编译输出目录
            if (fs.existsSync(distDir)) {
                console.log('dist 目录内容:');
                listDirectory(distDir);
            } else {
                console.error('❌ dist 目录不存在!');
            }

            process.exit(1);
        }

        console.log(`✅ 主进程入口文件已生成: ${mainIndexPath}`);

        // 编译渲染进程代码
        console.log('🔨 编译渲染进程代码...');
        exec('vite build', (error) => {
            if (error) {
                console.error(`渲染进程编译错误: ${error}`);
                process.exit(1);
            }

            console.log('✅ 构建完成!');

            // 打印目录结构
            console.log('\n最终目录结构:');
            listDirectory(distDir);
        });
    });
});

// 递归列出目录内容的辅助函数
function listDirectory(dir, prefix = '') {
    try {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                console.log(`${prefix}📁 ${item}`);
                listDirectory(fullPath, prefix + '  ');
            } else {
                console.log(`${prefix}📄 ${item}`);
            }
        });
    } catch (error) {
        console.error(`读取目录错误: ${error}`);
    }
}