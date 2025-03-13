// src/renderer/components/Server/ServerConnect.tsx
import React, { useState, useEffect } from 'react';

interface ServerConnectProps {
    onConnect: (serverData: {
        serverIp: string;
        serverPort: number;
        version: string;
    }) => void;
    onSettings: () => void;
}

interface MinecraftVersion {
    id: string;
    type: string;
    releaseTime: string;
    supported: boolean;
}

// 推荐服务器列表
const RECOMMENDED_SERVERS = [
    { name: 'Hypixel', ip: 'mc.hypixel.net', port: 25565, logo: '🏆' },
    { name: 'Mineplex', ip: 'us.mineplex.com', port: 25565, logo: '🎮' },
    { name: '网易我的世界', ip: 'mc.163.com', port: 25565, logo: '🇨🇳' },
    { name: 'CubeCraft', ip: 'play.cubecraft.net', port: 25565, logo: '🎲' },
    { name: '本地测试', ip: 'localhost', port: 25565, logo: '💻' }
];

const ServerConnect: React.FC<ServerConnectProps> = ({ onConnect, onSettings }) => {
    const [serverIp, setServerIp] = useState('');
    const [serverPort, setServerPort] = useState(25565);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [versions, setVersions] = useState<MinecraftVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'major'>('major');
    const [searchTerm, setSearchTerm] = useState('');

    // 组件加载时获取Minecraft版本
    useEffect(() => {
        async function loadVersions() {
            try {
                const availableVersions = await window.api.getMinecraftVersions();

                // 过滤出支持的版本并按发布日期排序（最新的先显示）
                const supportedVersions = availableVersions
                    .filter((v: MinecraftVersion) => v.supported)
                    .sort((a: MinecraftVersion, b: MinecraftVersion) =>
                        new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime()
                    );

                setVersions(supportedVersions);

                // 设置默认版本为最新发行版
                const latestRelease = supportedVersions.find((v: MinecraftVersion) => v.type === 'release');
                if (latestRelease) {
                    setSelectedVersion(latestRelease.id);
                }
            } catch (error) {
                console.error('加载Minecraft版本失败:', error);
                setError('无法加载Minecraft版本列表，请重试。');
            } finally {
                setIsLoadingVersions(false);
            }
        }

        loadVersions();
    }, []);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 验证输入
            if (!serverIp) {
                throw new Error('服务器地址不能为空');
            }

            if (!selectedVersion) {
                throw new Error('请选择一个Minecraft版本');
            }

            // 尝试连接
            onConnect({
                serverIp,
                serverPort,
                version: selectedVersion
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            setIsLoading(false);
        }
    };

    // 过滤版本列表显示
    const filteredVersions = versions.filter(version => {
        // 先按搜索词过滤
        if (searchTerm && !version.id.includes(searchTerm)) {
            return false;
        }

        // 如果选择了只显示主要版本
        if (filter === 'major') {
            // 匹配形如 1.x.0 或 1.x 的版本
            const parts = version.id.split('.');
            if (parts.length === 3) {
                return parts[2] === '0' || parts[2] === '';
            } else if (parts.length === 2) {
                return true;
            }
            return false;
        }

        return true;
    });

    // 分类版本列表
    const groupedVersions: Record<string, MinecraftVersion[]> = {};
    filteredVersions.forEach(version => {
        const majorVersion = version.id.split('.').slice(0, 2).join('.');
        if (!groupedVersions[majorVersion]) {
            groupedVersions[majorVersion] = [];
        }
        groupedVersions[majorVersion].push(version);
    });

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">连接到服务器</h2>
                        <p className="text-gray-400 mt-1">输入服务器地址和选择游戏版本</p>
                    </div>
                    <button
                        onClick={onSettings}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center transition-all"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        设置
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 服务器地址 */}
                    <div className="mb-6">
                        <label
                            htmlFor="serverIp"
                            className="block text-sm font-medium mb-2"
                        >
                            服务器地址
                        </label>
                        <input
                            type="text"
                            id="serverIp"
                            value={serverIp}
                            onChange={(e) => setServerIp(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            placeholder="example.com 或 192.168.1.1"
                            required
                        />
                    </div>

                    {/* 服务器端口 */}
                    <div className="mb-6">
                        <label
                            htmlFor="serverPort"
                            className="block text-sm font-medium mb-2"
                        >
                            端口
                        </label>
                        <input
                            type="number"
                            id="serverPort"
                            value={serverPort}
                            onChange={(e) => setServerPort(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            min={1}
                            max={65535}
                            required
                        />
                    </div>

                    {/* Minecraft版本选择器 */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label
                                htmlFor="version"
                                className="block text-sm font-medium"
                            >
                                Minecraft版本
                            </label>

                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setFilter('major')}
                                    className={`px-2 py-1 text-xs rounded ${filter === 'major' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                    主要版本
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilter('all')}
                                    className={`px-2 py-1 text-xs rounded ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                                >
                                    全部版本
                                </button>
                            </div>
                        </div>

                        {/* 版本搜索 */}
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="搜索版本号..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {isLoadingVersions ? (
                            <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-400 flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                加载版本中...
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto border border-gray-600 rounded-xl bg-gray-700">
                                <div className="sticky top-0 bg-gray-600 p-2 z-10 font-medium">
                                    <div className="flex items-center">
                                        <span className="flex-grow">版本</span>
                                        <span className="w-24 text-right">类型</span>
                                    </div>
                                </div>
                                {Object.keys(groupedVersions).length === 0 ? (
                                    <div className="p-4 text-center text-gray-400">
                                        没有找到匹配的版本
                                    </div>
                                ) : (
                                    Object.entries(groupedVersions).map(([majorVersion, versions]) => (
                                        <div key={majorVersion} className="border-t border-gray-600 first:border-0">
                                            <div className="bg-gray-600/50 px-3 py-1 font-medium text-xs">
                                                {majorVersion} 系列
                                            </div>
                                            <div>
                                                {versions.map((version) => (
                                                    <label
                                                        key={version.id}
                                                        className={`flex items-center p-2 hover:bg-gray-600 cursor-pointer ${
                                                            selectedVersion === version.id ? 'bg-green-600/20 border-l-4 border-green-500' : ''
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="version"
                                                            value={version.id}
                                                            checked={selectedVersion === version.id}
                                                            onChange={() => setSelectedVersion(version.id)}
                                                            className="mr-3"
                                                        />
                                                        <span className="flex-grow">{version.id}</span>
                                                        <span className="w-24 text-right text-sm text-gray-400">
                                                            {version.type === 'release' ? '正式版' : version.type}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400">
                            请选择与您连接服务器匹配的版本
                        </p>
                    </div>

                    {/* 错误信息 */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-600 rounded-xl text-red-200">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                            isLoading || isLoadingVersions
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30'
                        }`}
                        disabled={isLoading || isLoadingVersions}
                    >
                        <span className="flex items-center justify-center">
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? '连接中...' : '连接到服务器'}
                        </span>
                    </button>
                </form>

                {/* 推荐服务器快速连接 */}
                <div className="mt-8">
                    <h3 className="text-md font-medium mb-3">推荐服务器</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {RECOMMENDED_SERVERS.map((server) => (
                            <button
                                key={server.ip}
                                type="button"
                                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-between transition-all hover:shadow-lg border border-gray-600 hover:border-gray-500"
                                onClick={() => {
                                    setServerIp(server.ip);
                                    setServerPort(server.port);
                                }}
                            >
                                <div className="flex items-center">
                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-lg mr-3 text-xl">
                                        {server.logo}
                                    </span>
                                    <div className="text-left">
                                        <div className="font-medium">{server.name}</div>
                                        <div className="text-xs text-gray-400">{server.ip}</div>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerConnect;