// src/renderer/App.tsx
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import LoginForm from './components/Login/LoginForm';
import ServerConnect from './components/Server/ServerConnect';
import Settings from './components/Settings/Settings';
import GameInterface from './components/Game/GameInterface'; // 游戏界面组件
import WindowControls from './components/UI/WindowControls'; // 窗口控制组件

// 错误边界组件
interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("应用错误:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
                    <div className="max-w-lg mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">应用出现错误</h2>
                        <p className="mb-4 text-gray-300">{this.state.error?.message}</p>
                        <button
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                            onClick={() => window.location.reload()}
                        >
                            重新加载应用
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// 定义应用状态
type AppState = 'login' | 'connect' | 'settings' | 'game';

interface UserData {
    username: string;
    uuid: string;
    token?: string;
    isOnline: boolean;
}

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('login');
    const [userData, setUserData] = useState<UserData | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateReady, setUpdateReady] = useState(false);
    const [isElectron, setIsElectron] = useState(false);
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
    const [gameStatus, setGameStatus] = useState<{
        health: number;
        food: number;
        position: { x: number; y: number; z: number } | null;
    }>({
        health: 20,
        food: 20,
        position: null
    });

    // 检查环境
    useEffect(() => {
        const api = window.api;
        if (api) {
            if (api.isElectron) {
                console.log('在Electron环境中运行');
                setIsElectron(true);
            } else {
                console.log('在浏览器模式下运行，使用模拟API');
            }
        } else {
            console.error('API对象不可用');
        }
    }, []);

    // 安全地初始化API监听器
    useEffect(() => {
        if (!window.api) return () => {};

        let cleanupFunctions: Array<() => void> = [];

        try {
            if (window.api.onUpdateAvailable) {
                const cleanup = window.api.onUpdateAvailable(() => {
                    setUpdateAvailable(true);
                });
                cleanupFunctions.push(cleanup);
            }

            if (window.api.onUpdateDownloaded) {
                const cleanup = window.api.onUpdateDownloaded(() => {
                    setUpdateReady(true);
                });
                cleanupFunctions.push(cleanup);
            }

            if (window.api.onGameEvent) {
                const cleanup = window.api.onGameEvent((event, data) => {
                    switch (event) {
                        case 'health':
                            setGameStatus(prev => ({ ...prev, health: data.health, food: data.food }));
                            break;
                        case 'position':
                            setGameStatus(prev => ({ ...prev, position: { x: data.x, y: data.y, z: data.z } }));
                            break;
                        case 'kicked':
                            alert(`您已被踢出服务器: ${data.reason}`);
                            setAppState('connect');
                            break;
                        case 'error':
                            alert(`发生错误: ${data.message}`);
                            break;
                    }
                });
                cleanupFunctions.push(cleanup);
            }
        } catch (error) {
            console.error('设置监听器时出错:', error);
        }

        return () => {
            cleanupFunctions.forEach(cleanup => {
                try {
                    cleanup();
                } catch (e) {
                    console.error('清理监听器时出错:', e);
                }
            });
        };
    }, []);

    // 切换主题
    const toggleTheme = () => {
        setCurrentTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    // 处理登录成功
    const handleLoginSuccess = (loginData: UserData) => {
        setUserData(loginData);
        setAppState('connect');
    };

    // 处理服务器连接
    const handleConnect = async (serverData: {
        serverIp: string;
        serverPort: number;
        version: string;
    }) => {
        if (!userData || !window.api) return;

        try {
            const result = await window.api.connectToServer({
                ...serverData,
                username: userData.username,
                token: userData.token
            });

            if (result.success) {
                setAppState('game');
            } else {
                alert(`连接失败: ${result.error}`);
            }
        } catch (error) {
            alert(`连接错误: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // 处理断开连接
    const handleDisconnect = () => {
        if (window.api?.disconnectFromServer) {
            window.api.disconnectFromServer();
        }
        setAppState('connect');
    };

    // 安装更新
    const handleInstallUpdate = () => {
        if (updateReady && window.api && window.api.installUpdate) {
            window.api.installUpdate();
        }
    };

    // 根据应用状态渲染不同组件
    const renderContent = () => {
        switch (appState) {
            case 'login':
                return <LoginForm onLoginSuccess={handleLoginSuccess} />;
            case 'connect':
                return (
                    <ServerConnect
                        onConnect={handleConnect}
                        onSettings={() => setAppState('settings')}
                    />
                );
            case 'settings':
                return (
                    <Settings
                        onBack={() => setAppState('connect')}
                        currentTheme={currentTheme}
                        onThemeChange={toggleTheme}
                    />
                );
            case 'game':
                return (
                    <GameInterface
                        onDisconnect={handleDisconnect}
                        username={userData?.username || ''}
                        gameStatus={gameStatus}
                    />
                );
            default:
                return <div>未知状态</div>;
        }
    };

    // 动态设置主题类
    const themeClass = currentTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white'
        : 'bg-gradient-to-br from-gray-100 to-white text-gray-800';

    return (
        <ErrorBoundary>
            <div className={`min-h-screen transition-colors duration-300 ${themeClass}`}>
                {/* 顶部导航栏 */}
                <header className={`${currentTheme === 'dark' ? 'bg-gray-800/70' : 'bg-white/70'} backdrop-blur-md p-4 shadow-lg sticky top-0 z-50 app-drag`}>
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center app-no-drag">
                            <div className="w-10 h-10 bg-green-500 rounded-lg mr-3 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">M</span>
                            </div>
                            <h1 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                我的世界客户端
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4 app-no-drag">
                            {/* 切换主题按钮 */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-full ${currentTheme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}
                            >
                                {currentTheme === 'dark' ? '☀️' : '🌙'}
                            </button>

                            {/* 运行环境标识 */}
                            <div className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {isElectron ? 'Electron版' : '浏览器版'}
                            </div>

                            {/* 用户信息（如果已登录） */}
                            {userData && (
                                <div className={`text-sm ${currentTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                    已登录为 <span className="font-bold">{userData.username}</span>
                                    {userData.isOnline && (
                                        <span className={`ml-1 ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                            (微软账户)
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* 窗口控制按钮 */}
                            <WindowControls />
                        </div>
                    </div>
                </header>

                {/* 主内容 */}
                <main className="container mx-auto p-4 relative max-w-7xl">
                    {renderContent()}
                </main>

                {/* 更新通知 */}
                {updateAvailable && (
                    <div className="fixed bottom-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <p>有可用更新！</p>
                        {updateReady && (
                            <button
                                className="mt-2 px-3 py-1 bg-white text-indigo-600 rounded hover:bg-gray-100 transition-colors"
                                onClick={handleInstallUpdate}
                            >
                                安装更新
                            </button>
                        )}
                    </div>
                )}

                {/* 环境提示 */}
                {!isElectron && (
                    <div className="fixed bottom-4 left-4 bg-amber-600 text-white p-4 rounded-lg shadow-lg backdrop-blur-sm">
                        <p className="font-bold">浏览器模式</p>
                        <p className="text-sm">某些功能在浏览器环境中不可用。</p>
                        <p className="text-sm">请通过Electron启动应用获得完整体验。</p>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default App;