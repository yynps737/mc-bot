import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';
import { mockApi } from './mockApi';

// 如果在浏览器环境中运行，使用模拟API
if (typeof window !== 'undefined' && !window.api) {
    console.log('在浏览器模式下运行，使用模拟API');
    window.api = mockApi;
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);