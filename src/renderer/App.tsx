import React, { useState, useEffect } from 'react';
import LoginForm from './components/Login/LoginForm';
import ServerConnect from './components/Server/ServerConnect';
import GameInterface from './components/Game/GameInterface';
import WindowControls from './components/UI/WindowControls';

type AppState = 'login' | 'connect' | 'game';

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
    const [gameStatus, setGameStatus] = useState({
        health: 20, food: 20,
        position: null as { x: number; y: number; z: number } | null
    });

    useEffect(() => {
        if (window.api?.isElectron) setIsElectron(true);
    }, []);

    useEffect(() => {
        if (!window.api) return () => {};

        const cleanupFunctions: Array<() => void> = [];

        if (window.api.onUpdateAvailable) {
            cleanupFunctions.push(window.api.onUpdateAvailable(() => setUpdateAvailable(true)));
        }

        if (window.api.onUpdateDownloaded) {
            cleanupFunctions.push(window.api.onUpdateDownloaded(() => setUpdateReady(true)));
        }

        if (window.api.onGameEvent) {
            cleanupFunctions.push(window.api.onGameEvent((event, data) => {
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
            }));
        }

        return () => cleanupFunctions.forEach(cleanup => cleanup());
    }, []);

    const handleLoginSuccess = (loginData: UserData) => {
        setUserData(loginData);
        setAppState('connect');
    };

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

    const handleDisconnect = () => {
        if (window.api?.disconnectFromServer) {
            window.api.disconnectFromServer();
        }
        setAppState('connect');
    };

    const handleInstallUpdate = () => {
        if (updateReady && window.api?.installUpdate) {
            window.api.installUpdate();
        }
    };

    const renderContent = () => {
        switch (appState) {
            case 'login':
                return <LoginForm onLoginSuccess={handleLoginSuccess} />;
            case 'connect':
                return <ServerConnect onConnect={handleConnect} />;
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 text-gray-800">
            <header className="bg-white/70 backdrop-blur-md p-3 shadow-cute sticky top-0 z-50 app-drag">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center app-no-drag">
                        <div className="w-8 h-8 bg-primary-400 rounded-lg mr-2 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">M</span>
                        </div>
                        <h1 className="text-xl font-bold text-primary-700">
                            Minecraft 客户端
                        </h1>
                    </div>

                    <div className="flex items-center space-x-2 app-no-drag">
                        {userData && (
                            <div className="text-sm text-primary-600">
                                <span className="font-bold">{userData.username}</span>
                                {userData.isOnline && (
                                    <span className="ml-1 text-accent-500">(微软账户)</span>
                                )}
                            </div>
                        )}
                        <WindowControls />
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 relative">
                {renderContent()}
            </main>

            {updateAvailable && (
                <div className="fixed bottom-4 right-4 bg-accent-500 text-white p-3 rounded-lg shadow-cute">
                    <p>有可用更新！</p>
                    {updateReady && (
                        <button
                            className="mt-2 px-3 py-1 bg-white text-accent-600 rounded hover:bg-gray-100 transition-colors"
                            onClick={handleInstallUpdate}
                        >
                            安装更新
                        </button>
                    )}
                </div>
            )}

            {!isElectron && (
                <div className="fixed bottom-4 left-4 bg-primary-400 text-white p-3 rounded-lg shadow-cute">
                    <p className="font-bold">浏览器模式</p>
                    <p className="text-sm">某些功能在浏览器环境中不可用。</p>
                </div>
            )}
        </div>
    );
};

export default App;