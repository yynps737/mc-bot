// 创建这个新文件
export const mockApi = {
    isElectron: false,

    // 认证模拟
    loginOffline: async (username: string) => ({
        success: true,
        username,
        uuid: 'mock-uuid'
    }),
    loginMicrosoft: async () => ({
        success: false,
        error: '浏览器模式不支持 Microsoft 登录'
    }),

    // 版本模拟
    getMinecraftVersions: async () => [
        { id: '1.19.4', type: 'release', releaseTime: '2023-03-14', supported: true },
        { id: '1.20.0', type: 'release', releaseTime: '2023-06-07', supported: true }
    ],

    // 服务器连接模拟
    connectToServer: async () => ({
        success: false,
        error: '浏览器模式不支持服务器连接'
    }),

    // 更新相关
    onUpdateAvailable: (callback: () => void) => () => {},
    onUpdateDownloaded: (callback: () => void) => () => {},
    installUpdate: async () => {},

    // 游戏事件
    onGameEvent: (callback: (event: string, data: any) => void) => () => {},

    // 插件相关
    getPlugins: async () => [],
    enablePlugin: async () => false,
    disablePlugin: async () => false
};