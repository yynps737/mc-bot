// src/renderer/components/Login/LoginForm.tsx
import React, { useState } from 'react';

interface LoginFormProps {
    onLoginSuccess: (userData: {
        username: string;
        uuid: string;
        token?: string;
        isOnline: boolean;
    }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [loginMethod, setLoginMethod] = useState<'offline' | 'microsoft'>('offline');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [animation, setAnimation] = useState(false);

    // 处理表单提交
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setAnimation(true);

        try {
            if (loginMethod === 'offline') {
                // 离线登录（仅用户名）
                if (!username || username.length < 3 || username.length > 16) {
                    throw new Error('用户名必须在3到16个字符之间');
                }

                const result = await window.api.loginOffline(username);

                if (result.success) {
                    onLoginSuccess({
                        username: result.username,
                        uuid: result.uuid,
                        isOnline: false
                    });
                } else {
                    throw new Error(result.error || '登录失败');
                }
            } else {
                // 微软登录
                const result = await window.api.loginMicrosoft();

                if (result.success) {
                    onLoginSuccess({
                        username: result.username!,
                        uuid: result.uuid!,
                        token: result.token,
                        isOnline: true
                    });
                } else {
                    throw new Error(result.error || '微软验证失败');
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            setAnimation(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="mb-6 text-center">
                    <div className="inline-block w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 mb-4 flex items-center justify-center">
                        <span className="text-4xl">🎮</span>
                    </div>
                    <h2 className="text-2xl font-bold">登录我的世界</h2>
                    <p className="text-gray-400 mt-1">使用您的账户登录以连接服务器</p>
                </div>

                {/* 登录方式选择器 */}
                <div className="mb-6">
                    <div className="flex border border-gray-600 rounded-xl overflow-hidden">
                        <button
                            type="button"
                            className={`flex-1 py-3 px-4 transition-all duration-300 ${
                                loginMethod === 'offline'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            onClick={() => setLoginMethod('offline')}
                        >
                            离线模式
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-3 px-4 transition-all duration-300 ${
                                loginMethod === 'microsoft'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            onClick={() => setLoginMethod('microsoft')}
                        >
                            微软账户
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 离线模式的用户名输入 */}
                    {loginMethod === 'offline' && (
                        <div className="mb-6">
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium mb-2"
                            >
                                用户名
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                placeholder="输入您的用户名"
                                required
                                minLength={3}
                                maxLength={16}
                            />
                            <p className="mt-1 text-xs text-gray-400">用户名必须在3到16个字符之间</p>
                        </div>
                    )}

                    {/* 微软登录信息 */}
                    {loginMethod === 'microsoft' && (
                        <div className="mb-6 p-4 bg-gray-700/70 rounded-xl border border-gray-600 text-gray-300 text-sm">
                            <p>您将被重定向到微软账户登录页面。</p>
                            <p className="mt-2">
                                这允许您在线模式服务器上游玩并访问您购买的内容。
                            </p>
                        </div>
                    )}

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
                            isLoading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/30'
                        }`}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center">
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading
                                ? '登录中...'
                                : loginMethod === 'offline'
                                    ? '用户名登录'
                                    : '微软账户登录'
                            }
                        </span>
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    无法登录？ <a href="#" className="text-green-400 hover:text-green-300 transition-colors">查看帮助</a>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;