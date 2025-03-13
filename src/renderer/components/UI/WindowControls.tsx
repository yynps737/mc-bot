import React from 'react';

const WindowControls: React.FC = () => {
    const isElectron = !!window.api?.isElectron;

    if (!isElectron) {
        return null;
    }

    return (
        <div className="flex">
            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-primary-100 transition-colors"
                onClick={() => window.electron?.minimize?.()}
                aria-label="最小化"
            >
                <svg className="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            </button>

            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-primary-100 transition-colors"
                onClick={() => window.electron?.maximizeRestore?.()}
                aria-label="最大化/还原"
            >
                <svg className="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
                </svg>
            </button>

            <button
                className="w-10 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                onClick={() => window.electron?.close?.()}
                aria-label="关闭"
            >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

export default WindowControls;