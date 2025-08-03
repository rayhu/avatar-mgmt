import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';
import path from 'path';

export default defineConfig(({ mode }) => {
  console.log('🔧 Vite 构建模式:', mode);
  
  return {
    preview: {
      allowedHosts: 'all'
    },
    plugins: [
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
      open: true,
    },
    envDir: '.',
    // 根据模式设置不同的环境变量
    define: {
      __APP_MODE__: JSON.stringify(mode),
    },
  };
});
