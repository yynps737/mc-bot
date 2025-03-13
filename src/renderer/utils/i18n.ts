// src/renderer/utils/i18n.ts

/**
 * 简单的国际化(i18n)支持
 * 目前仅支持中文，但架构允许未来扩展支持更多语言
 */

export type LanguageCode = 'zh-CN' | 'en-US';

// 默认语言设置
export const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN';

// 语言资源
const resources: Record<LanguageCode, Record<string, string>> = {
    'zh-CN': {
        // 通用
        'app.name': '我的世界客户端',
        'app.loading': '加载中...',
        'app.error': '出错了',
        'app.retry': '重试',
        'app.back': '返回',
        'app.cancel': '取消',
        'app.confirm': '确认',
        'app.save': '保存',
        'app.delete': '删除',
        'app.settings': '设置',

        // 登录页面
        'login.title': '登录我的世界',
        'login.subtitle': '使用您的账户登录以连接服务器',
        'login.offline': '离线模式',
        'login.microsoft': '微软账户',
        'login.username': '用户名',
        'login.username.placeholder': '输入您的用户名',
        'login.username.requirements': '用户名必须在3到16个字符之间',
        'login.microsoft.info': '您将被重定向到微软账户登录页面。',
        'login.microsoft.info2': '这允许您在线模式服务器上游玩并访问您购买的内容。',
        'login.button.offline': '用户名登录',
        'login.button.microsoft': '微软账户登录',
        'login.button.loading': '登录中...',
        'login.help': '无法登录？',
        'login.help.link': '查看帮助',

        // 服务器连接页面
        'server.title': '连接到服务器',
        'server.subtitle': '输入服务器地址和选择游戏版本',
        'server.address': '服务器地址',
        'server.address.placeholder': 'example.com 或 192.168.1.1',
        'server.port': '端口',
        'server.version': 'Minecraft版本',
        'server.version.placeholder': '选择版本',
        'server.version.loading': '加载版本中...',
        'server.version.filter.major': '主要版本',
        'server.version.filter.all': '全部版本',
        'server.version.search': '搜索版本号...',
        'server.version.series': '系列',
        'server.version.select': '请选择与您连接服务器匹配的版本',
        'server.connect': '连接到服务器',
        'server.connecting': '连接中...',
        'server.recommended': '推荐服务器',

        // 设置页面
        'settings.title': '设置',
        'settings.tab.general': '常规设置',
        'settings.tab.plugins': '插件管理',
        'settings.tab.logs': '日志',
        'settings.theme': '应用主题',
        'settings.theme.light': '浅色主题',
        'settings.theme.light.desc': '明亮的背景，深色文本',
        'settings.theme.dark': '深色主题',
        'settings.theme.dark.desc': '暗色背景，浅色文本',
        'settings.performance': '性能设置',
        'settings.performance.renderDistance': '渲染距离',
        'settings.performance.low': '低',
        'settings.performance.medium': '中',
        'settings.performance.high': '高',
        'settings.performance.tip': '较低的设置可在性能较弱的电脑上获得更流畅的体验',
        'settings.startup': '启动设置',
        'settings.updates': '自动检查更新',
        'settings.updates.desc': '启动时自动检查更新',
        'settings.rememberServer': '记住上次服务器',
        'settings.rememberServer.desc': '自动填充上次连接的服务器信息',
        'settings.notifications': '游戏通知',
        'settings.notifications.desc': '启用游戏内事件的系统通知',
        'settings.cache': '缓存管理',
        'settings.cache.clear': '清除缓存',
        'settings.reset': '重置设置',
        'settings.about': '关于',
        'settings.version': '我的世界客户端 v0.1.0',
        'settings.based': '基于Mineflayer协议',
        'settings.optimized': '⚡ 为Windows 10/11系统优化',

        // 插件页面
        'plugins.title': '插件管理',
        'plugins.loading': '加载插件中...',
        'plugins.empty': '未安装插件',
        'plugins.empty.desc': '通过将插件放置在插件文件夹中安装。',
        'plugins.folder': '打开插件文件夹',
        'plugins.enable': '启用',
        'plugins.disable': '禁用',
        'plugins.enabled': '已启用',
        'plugins.author': '作者',
        'plugins.directory': '插件目录',
        'plugins.directory.path': '插件文件夹: [应用程序文件夹]/plugins',
        'plugins.directory.tip': '将.js或.ts文件添加到此文件夹以安装插件',

        // 日志页面
        'logs.title': '应用日志',
        'logs.empty': '没有可显示的日志条目',
        'logs.refresh': '刷新日志',
        'logs.export': '导出日志',
        'logs.clear': '清除日志',

        // 游戏界面
        'game.disconnect': '断开',
        'game.players': '玩家',
        'game.chat.placeholder': '输入消息或命令...',
        'game.chat.send': '发送',
        'game.chat.empty': '还没有聊天消息',
        'game.chat.empty.tip': '发送消息或使用 /help 查看可用命令',
        'game.minimap': '小地图',
        'game.minimap.expand': '展开',
        'game.minimap.collapse': '收起',
        'game.minimap.unknown': '位置未知',
        'game.debug': '调试信息',
        'game.health': '生命值',
        'game.food': '饥饿度',
        'game.online': '在线玩家',
        'game.online.empty': '没有其他玩家在线',

        // 错误消息
        'error.connection': '连接失败',
        'error.version': '无法加载Minecraft版本列表',
        'error.authentication': '认证失败',
        'error.username': '用户名必须在3到16个字符之间',
        'error.browser': '浏览器模式不支持此功能'
    },

    'en-US': {
        // 通用
        'app.name': 'Minecraft Client',
        // 其他英文翻译...
    }
};

// 当前语言
let currentLanguage: LanguageCode = DEFAULT_LANGUAGE;

/**
 * 设置当前语言
 */
export function setLanguage(language: LanguageCode): void {
    if (resources[language]) {
        currentLanguage = language;
    } else {
        console.error(`Language ${language} is not supported`);
    }
}

/**
 * 获取当前语言代码
 */
export function getCurrentLanguage(): LanguageCode {
    return currentLanguage;
}

/**
 * 翻译函数
 * @param key 翻译键
 * @param params 替换参数
 */
export function t(key: string, params?: Record<string, string | number>): string {
    const translation = resources[currentLanguage][key] || resources[DEFAULT_LANGUAGE][key] || key;

    if (!params) {
        return translation;
    }

    // 替换参数 {name} 将被 params.name 替换
    return translation.replace(/{(\w+)}/g, (match, paramName) => {
        return params[paramName] !== undefined ? String(params[paramName]) : match;
    });
}

/**
 * 创建格式化日期的函数
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const options: Intl.DateTimeFormatOptions = {};

    if (format.includes('YYYY') || format.includes('YY')) {
        options.year = format.includes('YYYY') ? 'numeric' : '2-digit';
    }

    if (format.includes('MM') || format.includes('M')) {
        options.month = format.includes('MM') ? '2-digit' : 'numeric';
    }

    if (format.includes('DD') || format.includes('D')) {
        options.day = format.includes('DD') ? '2-digit' : 'numeric';
    }

    return date.toLocaleDateString(currentLanguage, options);
}

/**
 * 创建格式化数字的函数
 */
export function formatNumber(num: number): string {
    return num.toLocaleString(currentLanguage);
}

export default {
    t,
    setLanguage,
    getCurrentLanguage,
    formatDate,
    formatNumber
};