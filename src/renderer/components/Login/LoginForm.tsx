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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (loginMethod === 'offline') {
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 animate-float">
            <div className="bg-white p-6 rounded-xl shadow-cute-lg border border-primary-100">
                <div className="mb-6 text-center">
                    <div className="inline-block w-20 h-20 rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 mb-4 flex items-center justify-center">
                        <span className="text-4xl">✨</span>
                    </div>
                    <h2 className="text-2xl font-bold text-primary-600">欢迎回来</h2>
                    <p className="text-gray-500 mt-1">登录您的账户连接到服务器</p>
                </div>

                <div className="mb-6">
                    <div className="flex border border-primary-200 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 transition-all ${
                                loginMethod === 'offline'
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-primary-50'
                            }`}
                            onClick={() => setLoginMethod('offline')}
                        >
                            离线模式
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 transition-all ${
                                loginMethod === 'microsoft'
                                    ? 'bg-primary-500 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-primary-50'
                            }`}
                            onClick={() => setLoginMethod('microsoft')}
                        >
                            微软账户
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {loginMethod === 'offline' && (
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                用户名
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="输入您的用户名"
                                required
                                minLength={3}
                                maxLength={16}
                            />
                            <p className="mt-1 text-xs text-gray-500">用户名必须在3到16个字符之间</p>
                        </div>
                    )}

                    {loginMethod === 'microsoft' && (
                        <div className="mb-4 p-3 bg-accent-50 rounded-lg border border-accent-200 text-gray-700 text-sm">
                            <p>您将被重定向到微软账户登录页面。</p>
                        </div>
                    )}

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
                            isLoading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg'
                        }`}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center">
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? '登录中...' : loginMethod === 'offline' ? '用户名登录' : '微软账户登录'}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;