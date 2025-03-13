import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    root: path.join(__dirname, 'src/renderer'),
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
        outDir: path.join(__dirname, 'dist/renderer'),
        emptyOutDir: true,
        sourcemap: true,
    },
});