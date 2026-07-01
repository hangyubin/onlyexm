import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
let gitCommit = '';
try { gitCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: __dirname }).trim(); } catch { /* no git */ }
let gitBranch = '';
try { gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', cwd: __dirname }).trim(); } catch { /* no git */ }

export default defineConfig({
  plugins: [react()] as any,
  base: '/admin/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/pro-table'],
          'vendor-echarts': ['echarts', 'echarts-for-react'],
          'vendor-utils': ['axios', 'dayjs', 'file-saver'],
        },
      },
    },
  },
});
