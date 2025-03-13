// src/renderer/components/Game/GameInterface.tsx
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
    const [isMinimapExpanded, setIsMinimapExpanded] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // 在组件挂载或状态更新时滚动到最新消息
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    // 监听游戏事件（聊天消息、玩家加入/离开等）
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

    // 发送聊天消息
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!chatInput.trim()) return;

        // 这里可以添加命令处理逻辑
        if (chatInput.startsWith('/')) {
            handleCommand(chatInput);
        } else {
            // 普通聊天消息
            window.api?.sendChatMessage?.(chatInput);
        }

        setChatInput('');
    };

    // 处理命令
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
                        message: `在线玩家: ${players.join(', ') || '无'}`,
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

    // 渲染小地图
    const renderMinimap = () => {
        return (
            <div
                className={`bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden transition-all ${
                    isMinimapExpanded ? 'w-64 h-64' : 'w-32 h-32'
                }`}
            >
                <div className="p-2 bg-gray-700/50 flex justify-between items-center">
                    <div className="text-xs font-medium">小地图</div>
                    <button
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                        onClick={() => setIsMinimapExpanded(!isMinimapExpanded)}
                    >
                        {isMinimapExpanded ? '收起' : '展开'}
                    </button>
                </div>
                <div className="p-2 flex items-center justify-center h-full">
                    {gameStatus.position ? (
                        <div className="text-center">
                            <div className="text-green-400 text-xs mb-1">{username}</div>
                            <div className="text-xs">
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
        );
    };

    // 渲染状态栏
    const renderStatusBar = () => {
        return (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 p-3">
                <div className="flex items-center space-x-4">
                    {/* 生命值 */}
                    <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-red-500/20 rounded-md mr-2">
                            <span className="text-red-400">❤</span>
                        </div>
                        <div className="text-sm">
                            <div className="flex h-2 w-20 bg-gray-700 rounded overflow-hidden">
                                <div
                                    className="bg-red-500 transition-all"
                                    style={{ width: `${(gameStatus.health / 20) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs mt-1">{gameStatus.health} / 20</div>
                        </div>
                    </div>

                    {/* 饥饿度 */}
                    <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-yellow-500/20 rounded-md mr-2">
                            <span className="text-yellow-400">🍗</span>
                        </div>
                        <div className="text-sm">
                            <div className="flex h-2 w-20 bg-gray-700 rounded overflow-hidden">
                                <div
                                    className="bg-yellow-500 transition-all"
                                    style={{ width: `${(gameStatus.food / 20) * 100}%` }}
                                ></div>
                            </div>
                            <div className="text-xs mt-1">{gameStatus.food} / 20</div>
                        </div>
                    </div>

                    {/* 在线玩家 */}
                    <div className="flex items-center">
                        <button
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                            onClick={() => setShowPlayerList(!showPlayerList)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <span className="text-xs">{players.length} 玩家</span>
                        </button>

                        {/* 玩家列表弹出框 */}
                        {showPlayerList && (
                            <div className="absolute right-0 mt-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 w-48 z-10">
                                <div className="text-sm font-medium border-b border-gray-700 pb-1 mb-1">在线玩家</div>
                                {players.length === 0 ? (
                                    <div className="text-xs text-gray-400 py-2 text-center">没有其他玩家在线</div>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto">
                                        {players.map((player, index) => (
                                            <div
                                                key={index}
                                                className="text-sm py-1 hover:bg-gray-700 px-2 rounded flex items-center"
                                            >
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                {player}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 断开连接按钮 */}
                    <button
                        className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm transition-colors flex items-center"
                        onClick={onDisconnect}
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        断开
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="relative h-[calc(100vh-8rem)]">
            {/* 游戏界面主区域 */}
            <div className="h-full flex flex-col">
                {/* 顶部状态栏 */}
                {renderStatusBar()}

                {/* 聊天区域 */}
                <div className="mt-4 flex-grow flex flex-col">
                    <div className="flex-grow bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 overflow-hidden">
                        <div
                            ref={chatContainerRef}
                            className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                        >
                            {chatMessages.length === 0 ? (
                                <div className="text-gray-400 text-center py-8">
                                    <p>还没有聊天消息</p>
                                    <p className="text-sm mt-1">发送消息或使用 /help 查看可用命令</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, index) => (
                                    <div key={index} className="mb-2 last:mb-0">
                                        <span className="text-gray-400 text-xs mr-2">
                                            {msg.timestamp.toLocaleTimeString()}
                                        </span>
                                        <span
                                            className={`font-medium mr-2 ${
                                                msg.sender === 'System' ? 'text-yellow-400' :
                                                    msg.sender === 'Server' ? 'text-purple-400' :
                                                        msg.sender === username ? 'text-green-400' : 'text-blue-400'
                                            }`}
                                        >
                                            {msg.sender}:
                                        </span>
                                        <span>{msg.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 聊天输入区 */}
                    <form onSubmit={handleSendMessage} className="mt-2">
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="输入消息或命令..."
                                className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 border border-green-600 rounded-r-lg transition-colors"
                            >
                                发送
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* 右上角小地图 */}
            <div className="absolute top-16 right-4">
                {renderMinimap()}
            </div>

            {/* 调试信息 */}
            {showDebug && (
                <div className="absolute bottom-20 right-4 bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700 text-xs font-mono">
                    <div className="font-medium mb-1 text-green-400">调试信息</div>
                    <div>用户名: {username}</div>
                    <div>生命值: {gameStatus.health}/20</div>
                    <div>饥饿度: {gameStatus.food}/20</div>
                    {gameStatus.position && (
                        <>
                            <div>X: {gameStatus.position.x.toFixed(2)}</div>
                            <div>Y: {gameStatus.position.y.toFixed(2)}</div>
                            <div>Z: {gameStatus.position.z.toFixed(2)}</div>
                        </>
                    )}
                    <div>在线玩家: {players.length}</div>
                </div>
            )}
        </div>
    );
};

export default GameInterface;