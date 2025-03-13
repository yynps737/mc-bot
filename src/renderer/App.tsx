import React, { useState, useEffect } from 'react';
import LoginForm from './components/Login/LoginForm';
import ServerConnect from './components/Server/ServerConnect';
import Settings from './components/Settings/Settings';

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

    // Listen for app updates
    useEffect(() => {
        const removeUpdateAvailableListener = window.api.onUpdateAvailable(() => {
            setUpdateAvailable(true);
        });

        const removeUpdateDownloadedListener = window.api.onUpdateDownloaded(() => {
            setUpdateReady(true);
        });

        return () => {
            removeUpdateAvailableListener();
            removeUpdateDownloadedListener();
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
        if (!userData) return;

        try {
            const result = await window.api.connectToServer({
                ...serverData,
                username: userData.username,
                token: userData.token
            });

            if (result.success) {
                setAppState('game');
            } else {
                alert(`Connection failed: ${result.error}`);
            }
        } catch (error) {
            alert(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // Install update
    const handleInstallUpdate = () => {
        if (updateReady) {
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
                        <h2 className="text-xl font-bold">Game Connected</h2>
                        <p>Connected to the server as {userData?.username}</p>
                        <button
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => setAppState('connect')}
                        >
                            Disconnect
                        </button>
                    </div>
                );
            default:
                return <div>Unknown state</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 p-4 shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Minecraft Client</h1>

                    {/* Display user info if logged in */}
                    {userData && (
                        <div className="text-sm">
                            Logged in as <span className="font-bold">{userData.username}</span>
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
                    <p>A new update is available!</p>
                    {updateReady && (
                        <button
                            className="mt-2 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
                            onClick={handleInstallUpdate}
                        >
                            Install Update
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default App;