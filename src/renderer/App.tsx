import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import LoginForm from './components/Login/LoginForm';
import ServerConnect from './components/Server/ServerConnect';
import Settings from './components/Settings/Settings';

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
        console.error("App error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-white p-8">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">应用出现错误</h2>
                    <p className="mb-4">{this.state.error?.message}</p>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => window.location.reload()}
                    >
                        重新加载应用
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Define application states
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
        } catch (error) {
            console.error('设置更新监听器时出错:', error);
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

    // Handle successful login
    const handleLoginSuccess = (loginData: UserData) => {
        setUserData(loginData);
        setAppState('connect');
    };

    // Handle server connection
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

    // Install update
    const handleInstallUpdate = () => {
        if (updateReady && window.api && window.api.installUpdate) {
            window.api.installUpdate();
        }
    };

    // Render different components based on app state
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
                    />
                );
            case 'game':
                return (
                    <div className="p-4">
                        <h2 className="text-xl font-bold">游戏已连接</h2>
                        <p>已作为 {userData?.username} 连接到服务器</p>
                        <button
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => setAppState('connect')}
                        >
                            断开连接
                        </button>
                    </div>
                );
            default:
                return <div>未知状态</div>;
        }
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gray-900 text-white">
                {/* Header */}
                <header className="bg-gray-800 p-4 shadow-md">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Minecraft 客户端</h1>

                        {/* 显示运行环境 */}
                        <div className="text-xs text-gray-400">
                            {isElectron ? 'Electron' : '浏览器'} 模式
                        </div>

                        {/* Display user info if logged in */}
                        {userData && (
                            <div className="text-sm">
                                已登录为 <span className="font-bold">{userData.username}</span>
                                {userData.isOnline && <span className="ml-1 text-green-400">(Microsoft)</span>}
                            </div>
                        )}
                    </div>
                </header>

                {/* Main content */}
                <main className="container mx-auto p-4">
                    {renderContent()}
                </main>

                {/* Update notification */}
                {updateAvailable && (
                    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                        <p>有可用更新！</p>
                        {updateReady && (
                            <button
                                className="mt-2 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
                                onClick={handleInstallUpdate}
                            >
                                安装更新
                            </button>
                        )}
                    </div>
                )}

                {/* 环境提示 */}
                {!isElectron && (
                    <div className="fixed bottom-4 left-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg">
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