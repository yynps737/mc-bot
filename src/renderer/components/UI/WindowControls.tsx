// src/renderer/components/UI/WindowControls.tsx
import React from 'react';

/**
 * 自定义窗口控制按钮组件
 * 用于无边框窗口的最小化、最大化/还原和关闭按钮
 */
const WindowControls: React.FC = () => {
    const isElectron = !!window.api?.isElectron;

    // 如果不在Electron环境中，不渲染控制按钮
    if (!isElectron) {
        return null;
    }

    // 最小化窗口
    const handleMinimize = () => {
        // 使用Electron的remote API (在preload中需要暴露此功能)
        if (window.electron?.minimize) {
            window.electron.minimize();
        }
    };

    // 最大化/还原窗口
    const handleMaximizeRestore = () => {
        if (window.electron?.maximizeRestore) {
            window.electron.maximizeRestore();
        }
    };

    // 关闭窗口
    const handleClose = () => {
        if (window.electron?.close) {
            window.electron.close();
        }
    };

    return (
        <div className="flex items-center ml-auto">
            {/* 最小化按钮 */}
            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors"
                onClick={handleMinimize}
                aria-label="最小化"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                </svg>
            </button>

            {/* 最大化/还原按钮 */}
            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors"
                onClick={handleMaximizeRestore}
                aria-label="最大化/还原"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path>
                </svg>
            </button>

            {/* 关闭按钮 */}
            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                onClick={handleClose}
                aria-label="关闭"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    );
};

export default WindowControls;