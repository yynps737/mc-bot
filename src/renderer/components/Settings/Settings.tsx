import React, { useState, useEffect } from 'react';

interface SettingsProps {
    onBack: () => void;
}

interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    isActive: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [logEntries, setLogEntries] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'general' | 'plugins' | 'logs'>('general');

    // Load plugins on component mount
    useEffect(() => {
        async function loadPlugins() {
            try {
                const pluginList = await window.api.getPlugins();
                setPlugins(pluginList);
            } catch (error) {
                console.error('Failed to load plugins:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadPlugins();
    }, []);

    // Toggle plugin activation
    const togglePlugin = async (pluginId: string, isCurrentlyActive: boolean) => {
        try {
            if (isCurrentlyActive) {
                await window.api.disablePlugin(pluginId);
            } else {
                await window.api.enablePlugin(pluginId);
            }

            // Update plugin list
            const updatedPlugins = plugins.map(plugin =>
                plugin.id === pluginId
                    ? { ...plugin, isActive: !isCurrentlyActive }
                    : plugin
            );

            setPlugins(updatedPlugins);
        } catch (error) {
            console.error(`Failed to ${isCurrentlyActive ? 'disable' : 'enable'} plugin:`, error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-6 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Settings</h2>
                <button
                    onClick={onBack}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                >
                    Back
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-gray-700 border-t border-gray-600">
                <div className="flex">
                    <button
                        className={`px-4 py-2 ${activeTab === 'general' ? 'bg-gray-800 border-t-2 border-blue-500' : 'hover:bg-gray-600'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'plugins' ? 'bg-gray-800 border-t-2 border-blue-500' : 'hover:bg-gray-600'}`}
                        onClick={() => setActiveTab('plugins')}
                    >
                        Plugins
                    </button>
                    <button
                        className={`px-4 py-2 ${activeTab === 'logs' ? 'bg-gray-800 border-t-2 border-blue-500' : 'hover:bg-gray-600'}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        Logs
                    </button>
                </div>
            </div>

            {/* Tab content */}
            <div className="p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">General Settings</h3>

                        {/* Application theme */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Application Theme
                            </label>
                            <select className="w-full max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="dark">Dark (Default)</option>
                                <option value="light">Light</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        {/* Startup behavior */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                On Startup
                            </label>
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked
                                    />
                                    Check for updates automatically
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                    />
                                    Remember last server
                                </label>
                            </div>
                        </div>

                        {/* Cache management */}
                        <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Cache Management</h4>
                            <button className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded mr-2">
                                Clear Cache
                            </button>
                            <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded">
                                Reset Settings
                            </button>
                        </div>

                        {/* About */}
                        <div className="mt-8 text-sm text-gray-400 border-t border-gray-700 pt-4">
                            <h4 className="font-medium text-gray-300">About</h4>
                            <p className="mt-1">Minecraft Client v0.1.0</p>
                            <p>Based on Mineflayer protocol</p>
                        </div>
                    </div>
                )}

                {/* Plugins Tab */}
                {activeTab === 'plugins' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Plugins</h3>

                        {isLoading ? (
                            <p>Loading plugins...</p>
                        ) : plugins.length === 0 ? (
                            <div className="bg-gray-700 p-4 rounded border border-gray-600">
                                <p>No plugins installed</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Plugins can be added by placing them in the plugins folder.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {plugins.map(plugin => (
                                    <div
                                        key={plugin.id}
                                        className="bg-gray-700 p-4 rounded border border-gray-600"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{plugin.name} <span className="text-xs text-gray-400">v{plugin.version}</span></h4>
                                                <p className="text-sm text-gray-300 mt-1">{plugin.description}</p>
                                                <p className="text-xs text-gray-400 mt-1">By {plugin.author}</p>
                                            </div>
                                            <div>
                                                <button
                                                    className={`px-3 py-1 rounded ${
                                                        plugin.isActive
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : 'bg-gray-600 hover:bg-gray-500'
                                                    }`}
                                                    onClick={() => togglePlugin(plugin.id, plugin.isActive)}
                                                >
                                                    {plugin.isActive ? 'Enabled' : 'Disabled'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 text-sm text-gray-400">
                            <h4 className="font-medium text-gray-300">Plugin Directory</h4>
                            <p className="mt-1">Plugins folder: [application folder]/plugins</p>
                            <p>Add .js or .ts files to this folder to install plugins</p>
                            <button className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
                                Open Plugins Folder
                            </button>
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Application Logs</h3>

                        <div className="bg-gray-900 p-3 rounded border border-gray-700 h-80 overflow-y-auto font-mono text-xs">
                            {logEntries.length === 0 ? (
                                <p className="text-gray-500">No log entries to display</p>
                            ) : (
                                logEntries.map((entry, index) => (
                                    <div key={index} className="mb-1">
                                        {entry}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
                                Refresh Logs
                            </button>
                            <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded">
                                Export Logs
                            </button>
                            <button className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded">
                                Clear Logs
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;