import React, { useState, useEffect } from 'react';

interface ServerConnectProps {
    onConnect: (serverData: {
        serverIp: string;
        serverPort: number;
        version: string;
    }) => void;
}

interface MinecraftVersion {
    id: string;
    type: string;
    releaseTime: string;
    supported: boolean;
}

const RECOMMENDED_SERVERS = [
    { name: 'Hypixel', ip: 'mc.hypixel.net', port: 25565, logo: '🏆' },
    { name: '网易我的世界', ip: 'mc.163.com', port: 25565, logo: '🇨🇳' },
    { name: '本地测试', ip: 'localhost', port: 25565, logo: '💻' }
];

const ServerConnect: React.FC<ServerConnectProps> = ({ onConnect }) => {
    const [serverIp, setServerIp] = useState('');
    const [serverPort, setServerPort] = useState(25565);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [versions, setVersions] = useState<MinecraftVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function loadVersions() {
            try {
                const availableVersions = await window.api.getMinecraftVersions();
                const supportedVersions = availableVersions
                    .filter((v: MinecraftVersion) => v.supported)
                    .sort((a: MinecraftVersion, b: MinecraftVersion) =>
                        new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime()
                    );

                setVersions(supportedVersions);
                const latestRelease = supportedVersions.find((v: MinecraftVersion) => v.type === 'release');
                if (latestRelease) {
                    setSelectedVersion(latestRelease.id);
                }
            } catch (error) {
                console.error('加载Minecraft版本失败:', error);
                setError('无法加载Minecraft版本列表');
            } finally {
                setIsLoadingVersions(false);
            }
        }

        loadVersions();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!serverIp) {
                throw new Error('服务器地址不能为空');
            }

            if (!selectedVersion) {
                throw new Error('请选择一个Minecraft版本');
            }

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

    const filteredVersions = versions.filter(version => {
        if (searchTerm && !version.id.includes(searchTerm)) {
            return false;
        }
        return true;
    });

    return (
        <div className="max-w-md mx-auto mt-8 animate-float">
            <div className="bg-white p-6 rounded-xl shadow-cute-lg border border-primary-100">
                <div className="mb-5">
                    <h2 className="text-xl font-bold text-primary-600">连接到服务器</h2>
                    <p className="text-gray-500 text-sm mt-1">输入服务器地址和游戏版本</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="serverIp" className="block text-sm font-medium text-gray-700 mb-1">
                            服务器地址
                        </label>
                        <input
                            type="text"
                            id="serverIp"
                            value={serverIp}
                            onChange={(e) => setServerIp(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="example.com 或 192.168.1.1"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="serverPort" className="block text-sm font-medium text-gray-700 mb-1">
                            端口
                        </label>
                        <input
                            type="number"
                            id="serverPort"
                            value={serverPort}
                            onChange={(e) => setServerPort(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            min={1}
                            max={65535}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">
                            Minecraft版本
                        </label>

                        <input
                            type="text"
                            placeholder="搜索版本号..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 mb-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />

                        {isLoadingVersions ? (
                            <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                加载版本中...
                            </div>
                        ) : (
                            <div className="h-40 overflow-y-auto border border-primary-100 rounded-lg">
                                <div className="sticky top-0 bg-primary-50 p-2 z-10 font-medium text-primary-700 text-sm">
                                    可用版本
                                </div>
                                {filteredVersions.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        没有找到匹配的版本
                                    </div>
                                ) : (
                                    <div>
                                        {filteredVersions.map((version) => (
                                            <label
                                                key={version.id}
                                                className={`flex items-center p-2 hover:bg-primary-50 cursor-pointer ${
                                                    selectedVersion === version.id ? 'bg-primary-100' : ''
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="version"
                                                    value={version.id}
                                                    checked={selectedVersion === version.id}
                                                    onChange={() => setSelectedVersion(version.id)}
                                                    className="mr-2 text-primary-500 focus:ring-primary-500"
                                                />
                                                <span className="flex-grow">{version.id}</span>
                                                <span className="text-xs text-gray-500">
                                                    {version.type === 'release' ? '正式版' : version.type}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            <div className="flex items-center">
                                ⚠️ {error}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                            isLoading || isLoadingVersions
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg'
                        }`}
                        disabled={isLoading || isLoadingVersions}
                    >
                        {isLoading ? '连接中...' : '连接到服务器'}
                    </button>
                </form>

                <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">推荐服务器</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {RECOMMENDED_SERVERS.map((server) => (
                            <button
                                key={server.ip}
                                type="button"
                                className="p-3 bg-accent-50 hover:bg-accent-100 rounded-lg flex items-center justify-between transition-all border border-accent-200"
                                onClick={() => {
                                    setServerIp(server.ip);
                                    setServerPort(server.port);
                                }}
                            >
                                <div className="flex items-center">
                                    <span className="w-8 h-8 flex items-center justify-center bg-accent-100 rounded-lg mr-2 text-xl">
                                        {server.logo}
                                    </span>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-800">{server.name}</div>
                                        <div className="text-xs text-gray-500">{server.ip}</div>
                                    </div>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
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