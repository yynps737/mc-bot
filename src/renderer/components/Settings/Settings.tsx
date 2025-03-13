// src/renderer/components/Settings/Settings.tsx
import React, { useState, useEffect } from 'react';

interface SettingsProps {
    onBack: () => void;
    currentTheme: 'light' | 'dark';
    onThemeChange: () => void;
}

interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    isActive: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onBack, currentTheme, onThemeChange }) => {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logEntries, setLogEntries] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'plugins' | 'logs'>('general');
    const [performance, setPerformance] = useState<'low' | 'medium' | 'high'>('medium');
    const [notifications, setNotifications] = useState(true);
    const [autoUpdate, setAutoUpdate] = useState(true);
    const [rememberServer, setRememberServer] = useState(false);

    // 加载插件
    useEffect(() => {
        async function loadPlugins() {
            try {
                if (window.api?.getPlugins) {
                    const pluginList = await window.api.getPlugins();
                    setPlugins(pluginList);
                } else {
                    setPlugins([]);
                }
            } catch (error) {
                console.error('加载插件失败:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadPlugins();
    }, []);

    // 切换插件激活状态
    const togglePlugin = async (pluginId: string, isCurrentlyActive: boolean) => {
        try {
            if (!window.api) return;

            if (isCurrentlyActive) {
                if (window.api.disablePlugin) {
                    await window.api.disablePlugin(pluginId);
                }
            } else {
                if (window.api.enablePlugin) {
                    await window.api.enablePlugin(pluginId);
                }
            }

            // 更新插件列表
            const updatedPlugins = plugins.map(plugin =>
                plugin.id === pluginId
                    ? { ...plugin, isActive: !isCurrentlyActive }
                    : plugin
            );

            setPlugins(updatedPlugins);
        } catch (error) {
            console.error(`${isCurrentlyActive ? '禁用' : '启用'}插件失败:`, error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-6 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            {/* 顶部栏 */}
            <div className="bg-gray-700/50 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">设置</h2>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all flex items-center"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                    </svg>
                    返回
                </button>
            </div>

            {/* 标签页 */}
            <div className="bg-gray-700/30 border-t border-gray-600">
                <div className="flex">
                    <button
                        className={`px-6 py-3 ${activeTab === 'general' ? 'bg-gray-800 border-t-2 border-green-500 font-medium' : 'hover:bg-gray-600/50 transition-colors'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            常规设置
                        </div>
                    </button>
                    <button
                        className={`px-6 py-3 ${activeTab === 'plugins' ? 'bg-gray-800 border-t-2 border-green-500 font-medium' : 'hover:bg-gray-600/50 transition-colors'}`}
                        onClick={() => setActiveTab('plugins')}
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                            </svg>
                            插件管理
                        </div>
                    </button>
                    <button
                        className={`px-6 py-3 ${activeTab === 'logs' ? 'bg-gray-800 border-t-2 border-green-500 font-medium' : 'hover:bg-gray-600/50 transition-colors'}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            日志
                        </div>
                    </button>
                </div>
            </div>

            {/* 标签页内容 */}
            <div className="p-6">
                {/* 常规设置 */}
                {activeTab === 'general' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-6">常规设置</h3>

                        {/* 应用主题 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-3">
                                应用主题
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        if (currentTheme !== 'light') {
                                            onThemeChange();
                                        }
                                    }}
                                    className={`p-4 border rounded-xl transition-all flex items-center ${
                                        currentTheme === 'light'
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg mr-3 text-yellow-500">
                                        ☀️
                                    </div>
                                    <div>
                                        <p className="font-medium">浅色主题</p>
                                        <p className="text-xs text-gray-400">明亮的背景，深色文本</p>
                                    </div>
                                    {currentTheme === 'light' && (
                                        <div className="ml-auto">
                                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        if (currentTheme !== 'dark') {
                                            onThemeChange();
                                        }
                                    }}
                                    className={`p-4 border rounded-xl transition-all flex items-center ${
                                        currentTheme === 'dark'
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg mr-3 text-blue-300">
                                        🌙
                                    </div>
                                    <div>
                                        <p className="font-medium">深色主题</p>
                                        <p className="text-xs text-gray-400">暗色背景，浅色文本</p>
                                    </div>
                                    {currentTheme === 'dark' && (
                                        <div className="ml-auto">
                                            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 性能设置 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-3">
                                性能设置
                            </label>
                            <div className="bg-gray-700 p-4 rounded-xl border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">渲染距离</div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setPerformance('low')}
                                            className={`px-3 py-1 rounded-lg text-sm ${
                                                performance === 'low'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                            }`}
                                        >
                                            低
                                        </button>
                                        <button
                                            onClick={() => setPerformance('medium')}
                                            className={`px-3 py-1 rounded-lg text-sm ${
                                                performance === 'medium'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                            }`}
                                        >
                                            中
                                        </button>
                                        <button
                                            onClick={() => setPerformance('high')}
                                            className={`px-3 py-1 rounded-lg text-sm ${
                                                performance === 'high'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-600 hover:bg-gray-500'
                                            }`}
                                        >
                                            高
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">
                                    较低的设置可在性能较弱的电脑上获得更流畅的体验
                                </p>
                            </div>
                        </div>

                        {/* 启动行为 */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-3">
                                启动设置
                            </label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                                    <div>
                                        <div className="font-medium">自动检查更新</div>
                                        <div className="text-xs text-gray-400">启动时自动检查更新</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={autoUpdate}
                                            onChange={() => setAutoUpdate(!autoUpdate)}
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                                    <div>
                                        <div className="font-medium">记住上次服务器</div>
                                        <div className="text-xs text-gray-400">自动填充上次连接的服务器信息</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={rememberServer}
                                            onChange={() => setRememberServer(!rememberServer)}
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                                    <div>
                                        <div className="font-medium">游戏通知</div>
                                        <div className="text-xs text-gray-400">启用游戏内事件的系统通知</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={notifications}
                                            onChange={() => setNotifications(!notifications)}
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 缓存管理 */}
                        <div className="mb-6">
                            <h4 className="text-sm font-medium mb-3">缓存管理</h4>
                            <div className="flex space-x-3">
                                <button className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                    清除缓存
                                </button>
                                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    重置设置
                                </button>
                            </div>
                        </div>

                        {/* 关于 */}
                        <div className="mt-8 text-sm text-gray-400 border-t border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-300">关于</h4>
                            <p className="mt-1">我的世界客户端 v0.1.0</p>
                            <p>基于Mineflayer协议</p>
                            <p className="mt-2">⚡ 为Windows 10/11系统优化</p>
                        </div>
                    </div>
                )}

                {/* 插件标签页 */}
                {activeTab === 'plugins' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-6">插件管理</h3>

                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <svg className="animate-spin h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="ml-3">加载插件中...</span>
                            </div>
                        ) : plugins.length === 0 ? (
                            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 text-center">
                                <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                                    </svg>
                                </div>
                                <p className="text-lg font-medium">未安装插件</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    通过将插件放置在插件文件夹中安装。
                                </p>
                                <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg inline-flex items-center transition-all">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                    </svg>
                                    打开插件文件夹
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {plugins.map(plugin => (
                                    <div
                                        key={plugin.id}
                                        className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 hover:border-gray-500 transition-all"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <h4 className="font-medium">{plugin.name}</h4>
                                                    <span className="text-xs text-gray-400 ml-2">v{plugin.version}</span>
                                                    {plugin.isActive && (
                                                        <span className="ml-3 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                                            已启用
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-300 mt-1">{plugin.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">作者: {plugin.author}</p>
                                            </div>
                                            <div>
                                                <button
                                                    className={`px-4 py-2 rounded-lg transition-all ${
                                                        plugin.isActive
                                                            ? 'bg-red-500 hover:bg-red-600'
                                                            : 'bg-green-600 hover:bg-green-700'
                                                    }`}
                                                    onClick={() => togglePlugin(plugin.id, plugin.isActive)}
                                                >
                                                    {plugin.isActive ? '禁用' : '启用'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                            <h4 className="font-medium text-gray-300 mb-2">插件目录</h4>
                            <p className="text-sm text-gray-400">插件文件夹: [应用程序文件夹]/plugins</p>
                            <p className="text-sm text-gray-400">将.js或.ts文件添加到此文件夹以安装插件</p>
                            <button className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg inline-flex items-center transition-all">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                                </svg>
                                打开插件文件夹
                            </button>
                        </div>
                    </div>
                )}

                {/* 日志标签页 */}
                {activeTab === 'logs' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-6">应用日志</h3>

                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 h-80 overflow-y-auto font-mono text-xs">
                            {logEntries.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <p>没有可显示的日志条目</p>
                                </div>
                            ) : (
                                logEntries.map((entry, index) => (
                                    <div key={index} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
                                        {entry}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center transition-all">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                刷新日志
                            </button>
                            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg flex items-center transition-all">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                导出日志
                            </button>
                            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg flex items-center transition-all">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                清除日志
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;