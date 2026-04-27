import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

function getMockTarget() {
  const portFile = path.resolve(__dirname, 'mock/.port');
  let port = 8989;
  try {
    port = parseInt(fs.readFileSync(portFile, 'utf-8').trim(), 10);
  } catch {
    // mock server 未启动或未生成 .port 文件，使用默认端口
  }
  return `http://127.0.0.1:${port}`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
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
      // 开发环境代理：自动读取 mock server 实际端口
      proxy: {
        '/api': {
          target: getMockTarget(),
          changeOrigin: true,
        },
      },
    },
  };
});
