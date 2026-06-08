import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // 开发环境代理目标：从 .env.development 读取，默认 localhost:8080
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080';

  return {
    base: '/satmonitor-visual/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      // 开发环境代理：把前端的 /api 请求转发到真实后端
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''), // 如后端不需要 /api 前缀则取消注释
        },
      },
    },
  };
});
