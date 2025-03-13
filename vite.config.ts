import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    root: path.join(__dirname, 'src/renderer'), // 关键修复：指定正确的根目录
    server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        hmr: {
            overlay: true,
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@main': path.resolve(__dirname, './src/main'),
            '@renderer': path.resolve(__dirname, './src/renderer'),
        },
    },
    build: {
        outDir: path.join(__dirname, 'dist/renderer'), // 更新输出目录为绝对路径
        emptyOutDir: true,
        sourcemap: true,
    },
});