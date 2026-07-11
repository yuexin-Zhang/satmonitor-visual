import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // 开发环境代理目标：从 .env.development 读取，默认 localhost:8080
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8080';

  return {
    base: '/',
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
        // SRS 直播流代理：避免浏览器直接请求 SRS 服务器时遇到 CORS 重复头问题
        // （SRS 服务器同时被 SRS 和 nginx 添加了 Access-Control-Allow-Origin: *）
        // 直接代理 /live 路径（不做 rewrite），因为 m3u8 内部的相对 URL（如
        // /live/xxx.m3u8?hls_ctx=... 和 xxx.ts?hls_ctx=...）需要保持 /live 前缀
        // 才能正确走通代理。生产环境大屏与 SRS 同源，不需要此代理。
        '/live': {
          target: 'http://8.145.43.245:9000',
          changeOrigin: true,
        },
      },
    },
  };
});
