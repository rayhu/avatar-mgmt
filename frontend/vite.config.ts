import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import path from 'path';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig(({ mode }) => {
  console.log('🔧 Vite 构建模式:', mode);

  return {
    preview: {
      allowedHosts: 'all', // 修复类型错误
    },
    plugins: [
      mkcert(), // 自动安装本地根证书并生成 localhost 证书
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      Components({
        dirs: ['src/components'],
        dts: 'src/components.d.ts',
      }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Digital Avatar Management',
          short_name: '3DFrontend',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#42b883',
          icons: [
            {
              src: '/favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon',
            },
          ],
        },
      }),
      viteCompression(),
    ] as any, // 临时类型断言解决兼容性问题
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/variables.scss" as *;`,
        },
      },
    },
    server: {
      port: 5173,
      https: true,
      host: '0.0.0.0',
      open: true,
      proxy: {
        // 代理 API 请求到后端服务器
        '/api': {
          target: 'http://localhost:3000', // 你的后端端口
          changeOrigin: true,
          secure: false,
          rewrite: path => path.replace(/^\/api/, '/api'),
        },
        // 1) 反向代理 Unity 页面与静态资源
        '/unity': {
          target: 'https://cdn.fangmiaokeji.cn/daizi/v2.2', // 对方 Unity 根路径
          changeOrigin: true, // 伪装 Host，便于通过对方的域名校验/防盗链
          secure: true, // 若对方证书自签且想忽略验证 -> 设为 false
          rewrite: p => p.replace(/^\/unity/, ''),
          // 2) 如需转发 WebSocket（一般不需要）
          ws: false,
        },
      },
    },
    envDir: '.',
    // 根据模式设置不同的环境变量
    define: {
      __APP_MODE__: JSON.stringify(mode),
    },
  };
});
