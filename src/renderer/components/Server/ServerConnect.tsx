import React, { useState, useEffect } from 'react';

interface ServerConnectProps {
    onConnect: (serverData: {
        serverIp: string;
        serverPort: number;
        version: string;
    }) => void;
    onSettings: () => void;
}

interface MinecraftVersion {
    id: string;
    type: string;
    releaseTime: string;
    supported: boolean;
}

const ServerConnect: React.FC<ServerConnectProps> = ({ onConnect, onSettings }) => {
    const [serverIp, setServerIp] = useState('');
    const [serverPort, setServerPort] = useState(25565);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [versions, setVersions] = useState<MinecraftVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingVersions, setIsLoadingVersions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load Minecraft versions on component mount
    useEffect(() => {
        async function loadVersions() {
            try {
                const availableVersions = await window.api.getMinecraftVersions();

                // Filter to only supported versions and sort by release date (newest first)
                const supportedVersions = availableVersions
                    .filter((v: MinecraftVersion) => v.supported)
                    .sort((a: MinecraftVersion, b: MinecraftVersion) =>
                        new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime()
                    );

                setVersions(supportedVersions);

                // Set default version to latest release
                const latestRelease = supportedVersions.find((v: MinecraftVersion) => v.type === 'release');
                if (latestRelease) {
                    setSelectedVersion(latestRelease.id);
                }
            } catch (error) {
                console.error('Failed to load Minecraft versions:', error);
                setError('Failed to load Minecraft versions. Please try again.');
            } finally {
                setIsLoadingVersions(false);
            }
        }

        loadVersions();
    }, []);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Validate input
            if (!serverIp) {
                throw new Error('Server IP is required');
            }

            if (!selectedVersion) {
                throw new Error('Please select a Minecraft version');
            }

            // Attempt to connect
            onConnect({
                serverIp,
                serverPort,
                version: selectedVersion
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Connect to Server</h2>
                <button
                    onClick={onSettings}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                    Settings
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Server IP */}
                <div className="mb-4">
                    <label
                        htmlFor="serverIp"
                        className="block text-sm font-medium mb-2"
                    >
                        Server Address
                    </label>
                    <input
                        type="text"
                        id="serverIp"
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="mc.example.com or 192.168.1.1"
                        required
                    />
                </div>

                {/* Server Port */}
                <div className="mb-4">
                    <label
                        htmlFor="serverPort"
                        className="block text-sm font-medium mb-2"
                    >
                        Port
                    </label>
                    <input
                        type="number"
                        id="serverPort"
                        value={serverPort}
                        onChange={(e) => setServerPort(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min={1}
                        max={65535}
                        required
                    />
                </div>

                {/* Minecraft Version Selector */}
                <div className="mb-6">
                    <label
                        htmlFor="version"
                        className="block text-sm font-medium mb-2"
                    >
                        Minecraft Version
                    </label>
                    {isLoadingVersions ? (
                        <div className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400">
                            Loading versions...
                        </div>
                    ) : (
                        <select
                            id="version"
                            value={selectedVersion}
                            onChange={(e) => setSelectedVersion(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a version</option>
                            {versions.map((version) => (
                                <option key={version.id} value={version.id}>
                                    {version.id} ({version.type})
                                </option>
                            ))}
                        </select>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                        Select the version that matches the server you're connecting to
                    </p>
                </div>

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
                        isLoading || isLoadingVersions
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={isLoading || isLoadingVersions}
                >
                    {isLoading ? 'Connecting...' : 'Connect to Server'}
                </button>
            </form>

            {/* Quick connect buttons for popular servers */}
            <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Quick Connect</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        onClick={() => {
                            setServerIp('hypixel.net');
                            setServerPort(25565);
                        }}
                    >
                        Hypixel
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        onClick={() => {
                            setServerIp('mc.cubecraft.net');
                            setServerPort(25565);
                        }}
                    >
                        CubeCraft
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        onClick={() => {
                            setServerIp('localhost');
                            setServerPort(25565);
                        }}
                    >
                        Localhost
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServerConnect;