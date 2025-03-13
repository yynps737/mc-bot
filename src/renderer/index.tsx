import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

if (typeof window !== 'undefined' && !window.api) {
    window.api = {
        isElectron: false,
        loginOffline: async (username) => ({
            success: true,
            username,
            uuid: 'mock-uuid-' + username
        }),
        loginMicrosoft: async () => ({
            success: false,
            error: '浏览器模式不支持微软账户登录'
        }),
        getMinecraftVersions: async () => [
            { id: '1.20.4', type: 'release', releaseTime: '2023-12-07', supported: true },
            { id: '1.19.4', type: 'release', releaseTime: '2023-03-14', supported: true },
            { id: '1.18.2', type: 'release', releaseTime: '2022-02-28', supported: true },
            { id: '1.17.1', type: 'release', releaseTime: '2021-07-06', supported: true },
            { id: '1.16.5', type: 'release', releaseTime: '2021-01-14', supported: true },
            { id: '1.15.2', type: 'release', releaseTime: '2020-01-21', supported: true },
            { id: '1.14.4', type: 'release', releaseTime: '2019-07-19', supported: true },
            { id: '1.13.2', type: 'release', releaseTime: '2018-10-22', supported: true },
            { id: '1.12.2', type: 'release', releaseTime: '2017-09-18', supported: true }
        ],
        connectToServer: async () => ({
            success: false,
            error: '浏览器模式不支持服务器连接'
        }),
        sendChatMessage: () => Promise.resolve(true),
        disconnectFromServer: () => Promise.resolve(true),
        onUpdateAvailable: () => () => {},
        onUpdateDownloaded: () => () => {},
        installUpdate: async () => {},
        onGameEvent: (callback) => {
            setTimeout(() => callback('chat', { username: 'Alice', message: '大家好！' }), 1000);
            setTimeout(() => callback('chat', { username: 'Bob', message: '你好！欢迎来到服务器！' }), 3000);
            setTimeout(() => callback('playerJoined', { username: 'Charlie' }), 5000);

            const healthInterval = setInterval(() => {
                const health = Math.max(1, Math.floor(Math.random() * 20));
                const food = Math.max(1, Math.floor(Math.random() * 20));
                callback('health', { health, food });
            }, 10000);

            const positionInterval = setInterval(() => {
                callback('position', {
                    x: Math.floor(Math.random() * 1000) - 500,
                    y: Math.floor(Math.random() * 100) + 60,
                    z: Math.floor(Math.random() * 1000) - 500
                });
            }, 5000);

            return () => {
                clearInterval(healthInterval);
                clearInterval(positionInterval);
            };
        },
        getPlugins: async () => [],
        enablePlugin: async () => true,
        disablePlugin: async () => true,
        getSetting: async () => null,
        setSetting: async () => true,
        getAllSettings: async () => ({}),
        getLogs: async () => [],
        openPluginsFolder: async () => '',
        getAppVersion: async () => '0.1.0'
    };
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);