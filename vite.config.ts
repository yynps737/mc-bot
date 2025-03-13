import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
    plugins: [react()],
    base: './',
    root: path.join(__dirname, 'src/renderer'),
    server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    build: {
        outDir: path.join(__dirname, 'dist/renderer'),
        emptyOutDir: true,
        sourcemap: true
    }
});