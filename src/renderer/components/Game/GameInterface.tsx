import React, { useState, useEffect, useRef } from 'react';

interface GameInterfaceProps {
    onDisconnect: () => void;
    username: string;
    gameStatus: {
        health: number;
        food: number;
        position: { x: number; y: number; z: number } | null;
    };
}

const GameInterface: React.FC<GameInterfaceProps> = ({ onDisconnect, username, gameStatus }) => {
    const [chatMessages, setChatMessages] = useState<Array<{ sender: string; message: string; timestamp: Date }>>([]);
    const [chatInput, setChatInput] = useState('');
    const [players, setPlayers] = useState<string[]>([]);
    const [showPlayerList, setShowPlayerList] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        if (!window.api?.onGameEvent) return () => {};

        const cleanup = window.api.onGameEvent((event, data) => {
            switch (event) {
                case 'chat':
                    setChatMessages(prev => [
                        ...prev,
                        {
                            sender: data.username,
                            message: data.message,
                            timestamp: new Date()
                        }
                    ]);
                    break;
                case 'playerJoined':
                    setPlayers(prev => [...prev, data.username]);
                    setChatMessages(prev => [
                        ...prev,
                        {
                            sender: 'Server',
                            message: `${data.username} 加入了游戏`,
                            timestamp: new Date()
                        }
                    ]);
                    break;
                case 'playerLeft':
                    setPlayers(prev => prev.filter(player => player !== data.username));
                    setChatMessages(prev => [
                        ...prev,
                        {
                            sender: 'Server',
                            message: `${data.username} 离开了游戏`,
                            timestamp: new Date()
                        }
                    ]);
                    break;
            }
        });

        return cleanup;
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!chatInput.trim()) return;

        if (chatInput.startsWith('/')) {
            handleCommand(chatInput);
        } else {
            window.api?.sendChatMessage?.(chatInput);
        }

        setChatInput('');
    };

    const handleCommand = (command: string) => {
        const [cmd, ...args] = command.slice(1).split(' ');

        switch (cmd.toLowerCase()) {
            case 'help':
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: 'System',
                        message: '可用命令: /help, /list, /pos, /debug',
                        timestamp: new Date()
                    }
                ]);
                break;
            case 'list':
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: 'System',
                        message: `在线玩家: ${players.join(', ') || '无其他玩家'}`,
                        timestamp: new Date()
                    }
                ]);
                break;
            case 'pos':
                if (gameStatus.position) {
                    const { x, y, z } = gameStatus.position;
                    setChatMessages(prev => [
                        ...prev,
                        {
                            sender: 'System',
                            message: `当前位置: X: ${Math.floor(x)}, Y: ${Math.floor(y)}, Z: ${Math.floor(z)}`,
                            timestamp: new Date()
                        }
                    ]);
                }
                break;
            case 'debug':
                setShowDebug(!showDebug);
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: 'System',
                        message: `调试信息已${showDebug ? '关闭' : '开启'}`,
                        timestamp: new Date()
                    }
                ]);
                break;
            default:
                setChatMessages(prev => [
                    ...prev,
                    {
                        sender: 'System',
                        message: `未知命令: ${cmd}`,
                        timestamp: new Date()
                    }
                ]);
        }
    };

    return (
        <div className="relative h-[calc(100vh-8rem)]">
            <div className="h-full flex flex-col">
                <div className="bg-white rounded-xl shadow-cute border border-primary-100 p-3 mb-3">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-md mr-2">
                                <span className="text-red-500">❤</span>
                            </div>
                            <div className="text-sm">
                                <div className="flex h-2 w-20 bg-gray-200 rounded overflow-hidden">
                                    <div
                                        className="bg-red-500 transition-all"
                                        style={{ width: `${(gameStatus.health / 20) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs mt-1 text-gray-600">{gameStatus.health} / 20</div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <div className="w-6 h-6 flex items-center justify-center bg-yellow-100 rounded-md mr-2">
                                <span className="text-yellow-500">🍗</span>
                            </div>
                            <div className="text-sm">
                                <div className="flex h-2 w-20 bg-gray-200 rounded overflow-hidden">
                                    <div
                                        className="bg-yellow-500 transition-all"
                                        style={{ width: `${(gameStatus.food / 20) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs mt-1 text-gray-600">{gameStatus.food} / 20</div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <button
                                className="flex items-center space-x-1 px-2 py-1 bg-accent-100 hover:bg-accent-200 rounded transition-colors text-accent-700"
                                onClick={() => setShowPlayerList(!showPlayerList)}
                            >
                                <span className="text-xs">{players.length} 玩家</span>
                            </button>

                            {showPlayerList && (
                                <div className="absolute right-0 mt-32 bg-white border border-primary-100 rounded-lg shadow-cute p-2 w-48 z-10">
                                    <div className="text-sm font-medium text-primary-600 pb-1 mb-1">在线玩家</div>
                                    {players.length === 0 ? (
                                        <div className="text-xs text-gray-500 py-2 text-center">没有其他玩家在线</div>
                                    ) : (
                                        <div className="max-h-40 overflow-y-auto">
                                            {players.map((player, index) => (
                                                <div key={index} className="text-sm py-1 hover:bg-primary-50 px-2 rounded flex items-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                    {player}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm text-white transition-colors flex items-center"
                            onClick={onDisconnect}
                        >
                            断开连接
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col bg-white rounded-xl shadow-cute border border-primary-100 p-3 overflow-hidden">
                    <div
                        ref={chatContainerRef}
                        className="h-full overflow-y-auto pr-2"
                    >
                        {chatMessages.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">
                                <p>还没有聊天消息</p>
                                <p className="text-sm mt-1">发送消息或使用 /help 查看可用命令</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, index) => (
                                <div key={index} className="mb-1 last:mb-0">
                  <span className="text-gray-400 text-xs mr-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                                    <span
                                        className={`font-medium mr-2 ${
                                            msg.sender === 'System' ? 'text-primary-500' :
                                                msg.sender === 'Server' ? 'text-accent-500' :
                                                    msg.sender === username ? 'text-green-500' : 'text-blue-500'
                                        }`}
                                    >
                    {msg.sender}:
                  </span>
                                    <span className="text-gray-800">{msg.message}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="mt-2">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="输入消息或命令..."
                                className="flex-grow px-3 py-2 bg-white border border-primary-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-r-lg transition-colors"
                            >
                                发送
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="absolute top-16 right-4">
                <div className="bg-white rounded-lg border border-primary-100 overflow-hidden shadow-cute w-32">
                    <div className="p-2 bg-primary-50 text-xs font-medium text-primary-700">小地图</div>
                    <div className="p-2 flex items-center justify-center h-32">
                        {gameStatus.position ? (
                            <div className="text-center">
                                <div className="text-primary-500 text-xs mb-1">{username}</div>
                                <div className="text-xs text-gray-600">
                                    X: {Math.floor(gameStatus.position.x)}
                                    <br />
                                    Y: {Math.floor(gameStatus.position.y)}
                                    <br />
                                    Z: {Math.floor(gameStatus.position.z)}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-xs">位置未知</div>
                        )}
                    </div>
                </div>
            </div>

            {showDebug && (
                <div className="absolute bottom-16 right-4 bg-white p-3 rounded-lg border border-primary-100 text-xs shadow-cute">
                    <div className="font-medium mb-1 text-primary-600">调试信息</div>
                    <div className="text-gray-700">用户名: {username}</div>
                    <div className="text-gray-700">生命值: {gameStatus.health}/20</div>
                    <div className="text-gray-700">饥饿度: {gameStatus.food}/20</div>
                    {gameStatus.position && (
                        <>
                            <div className="text-gray-700">X: {gameStatus.position.x.toFixed(2)}</div>
                            <div className="text-gray-700">Y: {gameStatus.position.y.toFixed(2)}</div>
                            <div className="text-gray-700">Z: {gameStatus.position.z.toFixed(2)}</div>
                        </>
                    )}
                    <div className="text-gray-700">在线玩家: {players.length}</div>
                </div>
            )}
        </div>
    );
};

export default GameInterface;