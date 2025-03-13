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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (loginMethod === 'offline') {
                // Offline login (username only)
                if (!username || username.length < 3 || username.length > 16) {
                    throw new Error('Username must be between 3 and 16 characters');
                }

                const result = await window.api.loginOffline(username);

                if (result.success) {
                    onLoginSuccess({
                        username: result.username,
                        uuid: result.uuid,
                        isOnline: false
                    });
                } else {
                    throw new Error(result.error || 'Login failed');
                }
            } else {
                // Microsoft login
                const result = await window.api.loginMicrosoft();

                if (result.success) {
                    onLoginSuccess({
                        username: result.username!,
                        uuid: result.uuid!,
                        token: result.token,
                        isOnline: true
                    });
                } else {
                    throw new Error(result.error || 'Microsoft authentication failed');
                }
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Login to Minecraft</h2>

            {/* Login method selector */}
            <div className="mb-6">
                <div className="flex border border-gray-600 rounded overflow-hidden">
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 ${
                            loginMethod === 'offline'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => setLoginMethod('offline')}
                    >
                        Offline Mode
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 ${
                            loginMethod === 'microsoft'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => setLoginMethod('microsoft')}
                    >
                        Microsoft Account
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Username input for offline mode */}
                {loginMethod === 'offline' && (
                    <div className="mb-4">
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium mb-2"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your username"
                            required
                            minLength={3}
                            maxLength={16}
                        />
                    </div>
                )}

                {/* Microsoft login info */}
                {loginMethod === 'microsoft' && (
                    <div className="mb-4 text-gray-300 text-sm">
                        <p>You will be redirected to sign in with your Microsoft account.</p>
                        <p className="mt-2">
                            This allows you to play on online-mode servers and access your purchased content.
                        </p>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500 bg-opacity-25 border border-red-700 rounded text-red-100">
                        {error}
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    className={`w-full py-2 px-4 rounded font-medium ${
                        isLoading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={isLoading}
                >
                    {isLoading
                        ? 'Logging in...'
                        : loginMethod === 'offline'
                            ? 'Login with Username'
                            : 'Login with Microsoft'
                    }
                </button>
            </form>
        </div>
    );
};

export default LoginForm;