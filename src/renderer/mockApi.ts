// src/renderer/mockApi.ts
export const mockApi = {
    isElectron: false,

    // 认证模拟
    loginOffline: async (username: string) => ({
        success: true,
        username,
        uuid: 'mock-uuid-' + username
    }),

    loginMicrosoft: async () => ({
        success: false,
        error: '浏览器模式不支持微软账户登录'
    }),

    // 版本模拟
    getMinecraftVersions: async () => [
        { id: '1.20.4', type: 'release', releaseTime: '2023-12-07', supported: true },
        { id: '1.20.3', type: 'release', releaseTime: '2023-10-31', supported: true },
        { id: '1.20.2', type: 'release', releaseTime: '2023-09-20', supported: true },
        { id: '1.20.1', type: 'release', releaseTime: '2023-06-14', supported: true },
        { id: '1.20.0', type: 'release', releaseTime: '2023-06-07', supported: true },
        { id: '1.19.4', type: 'release', releaseTime: '2023-03-14', supported: true },
        { id: '1.19.3', type: 'release', releaseTime: '2022-12-07', supported: true },
        { id: '1.19.2', type: 'release', releaseTime: '2022-08-05', supported: true },
        { id: '1.18.2', type: 'release', releaseTime: '2022-02-28', supported: true },
        { id: '1.18.1', type: 'release', releaseTime: '2021-12-10', supported: true },
        { id: '1.17.1', type: 'release', releaseTime: '2021-07-06', supported: true },
        { id: '1.16.5', type: 'release', releaseTime: '2021-01-14', supported: true },
        { id: '1.15.2', type: 'release', releaseTime: '2020-01-21', supported: true },
        { id: '1.14.4', type: 'release', releaseTime: '2019-07-19', supported: true },
        { id: '1.13.2', type: 'release', releaseTime: '2018-10-22', supported: true },
        { id: '1.12.2', type: 'release', releaseTime: '2017-09-18', supported: true },
        { id: '1.11.2', type: 'release', releaseTime: '2016-12-21', supported: true },
        { id: '1.10.2', type: 'release', releaseTime: '2016-06-23', supported: true },
        { id: '1.9.4', type: 'release', releaseTime: '2016-05-10', supported: true },
        { id: '1.8.9', type: 'release', releaseTime: '2015-12-09', supported: true }
    ],

    // 服务器连接模拟
    connectToServer: async () => ({
        success: false,
        error: '浏览器模式不支持服务器连接'
    }),

    // 游戏事件模拟
    sendChatMessage: (message: string) => {
        console.log(`[模拟] 发送消息: ${message}`);
        return true;
    },

    // 更新相关
    onUpdateAvailable: (callback: () => void) => {
        // 返回清理函数
        return () => {};
    },

    onUpdateDownloaded: (callback: () => void) => {
        // 返回清理函数
        return () => {};
    },

    installUpdate: async () => {
        alert('浏览器模式不支持更新安装');
    },

    // 游戏事件
    onGameEvent: (callback: (event: string, data: any) => void) => {
        // 模拟一些游戏事件
        setTimeout(() => {
            callback('chat', { username: 'Steve', message: '大家好！' });
        }, 1000);

        setTimeout(() => {
            callback('chat', { username: 'Alex', message: '你好！欢迎来到服务器！' });
        }, 3000);

        setTimeout(() => {
            callback('playerJoined', { username: 'Notch' });
        }, 5000);

        setTimeout(() => {
            callback('chat', { username: 'Notch', message: '有人需要帮助吗？' });
        }, 7000);

        setTimeout(() => {
            callback('playerLeft', { username: 'Notch' });
        }, 15000);

        // 模拟随机生命值变化
        const healthInterval = setInterval(() => {
            const health = Math.max(1, Math.floor(Math.random() * 20));
            const food = Math.max(1, Math.floor(Math.random() * 20));
            callback('health', { health, food, saturation: food });
        }, 10000);

        // 模拟位置变化
        const positionInterval = setInterval(() => {
            callback('position', {
                x: Math.floor(Math.random() * 1000) - 500,
                y: Math.floor(Math.random() * 100) + 60,
                z: Math.floor(Math.random() * 1000) - 500
            });
        }, 5000);

        // 返回清理函数
        return () => {
            clearInterval(healthInterval);
            clearInterval(positionInterval);
        };
    },

    // 插件相关
    getPlugins: async () => [
        {
            id: 'example-plugin',
            name: '示例插件',
            version: '1.0.0',
            description: '一个简单的示例插件，展示插件系统的功能',
            author: '开发者',
            isActive: true
        },
        {
            id: 'auto-fish',
            name: '自动钓鱼',
            version: '2.1.3',
            description: '自动钓鱼并收集鱼获，支持循环操作和背包检查',
            author: 'FishMaster',
            isActive: false
        },
        {
            id: 'map-radar',
            name: '小地图雷达',
            version: '3.0.1',
            description: '显示周围实体和玩家的小地图，支持自定义显示范围和图标',
            author: 'MapDev',
            isActive: false
        }
    ],

    enablePlugin: async (pluginId: string) => {
        console.log(`[模拟] 启用插件: ${pluginId}`);
        return true;
    },

    disablePlugin: async (pluginId: string) => {
        console.log(`[模拟] 禁用插件: ${pluginId}`);
        return true;
    }
};