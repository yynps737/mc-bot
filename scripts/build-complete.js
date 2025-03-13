// scripts/build-complete.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色代码用于控制台输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// 辅助函数：打印带颜色的消息
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 辅助函数：执行命令并处理错误
function exec(command, message) {
    try {
        log(`🔄 ${message}...`, 'cyan');
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        log(`❌ ${message}失败: ${error.message}`, 'red');
        return false;
    }
}

// 主构建流程
async function buildProject() {
    // 步骤 1: 创建必要资源
    log('🌟 开始完整构建流程', 'green');
    log('步骤 1/7: 创建必要的资源文件', 'blue');

    try {
        const createResourcesPath = path.join(__dirname, 'create-resources.js');
        if (fs.existsSync(createResourcesPath)) {
            require('./create-resources.js');
        } else {
            log('⚠️ 资源创建脚本不存在，跳过此步骤', 'yellow');
        }
    } catch (error) {
        log(`⚠️ 资源创建出错: ${error.message}`, 'yellow');
    }

    // 步骤 2: 清理之前的构建
    log('\n步骤 2/7: 清理之前的构建', 'blue');
    if (!exec('rimraf dist', '清理目录')) {
        log('⚠️ 尝试继续构建', 'yellow');
    }

    // 步骤 3: 确保必要目录存在
    log('\n步骤 3/7: 确保目录结构', 'blue');
    const dirs = ['dist', 'dist/main', 'dist/renderer'];
    dirs.forEach(dir => {
        const dirPath = path.resolve(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            log(`📁 创建目录: ${dir}`, 'cyan');
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });

    // 步骤 4: 构建主进程代码
    log('\n步骤 4/7: 构建主进程 (TypeScript)', 'blue');
    if (!exec('node scripts/ts-build.js', '构建主进程')) {
        log('❌ 主进程构建失败，无法继续', 'red');
        process.exit(1);
    }

    // 步骤 5: 构建渲染进程代码
    log('\n步骤 5/7: 构建渲染进程 (React)', 'blue');
    if (!exec('node scripts/react-build.js', '构建渲染进程')) {
        log('❌ 渲染进程构建失败，无法继续', 'red');
        process.exit(1);
    }

    // 步骤 6: 验证构建
    log('\n步骤 6/7: 验证构建', 'blue');
    try {
        require('./check-dist.js');
    } catch (error) {
        log(`❌ 构建验证失败: ${error.message}`, 'red');
        process.exit(1);
    }

    // 步骤 7: 使用 electron-builder 打包
    log('\n步骤 7/7: 使用 electron-builder 打包', 'blue');
    if (!exec('electron-builder', '打包应用')) {
        log('❌ 应用打包失败', 'red');
        process.exit(1);
    }

    log('\n✅ 构建流程完成!', 'green');
    log('📦 可分发文件位于 dist 目录', 'green');
}

// 开始构建
buildProject().catch(error => {
    log(`❌ 构建过程中发生错误: ${error.message}`, 'red');
    process.exit(1);
});