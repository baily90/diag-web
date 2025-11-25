import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'https://dev-diagnosis-doctor.weicha88.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/\/api/, '/api'),
      },
      '/gdiag-pc': {
        target: 'https://dev-api.weicha88.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/\/gdiag-pc/, '/gdiag-pc'),
      },
      '/app-api': {
        target: 'https://dev-biz-gateway.yijiantongkj.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/\/app-api/, '/app-api'),
      },
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      eslintrc: {
        enabled: false,
        filepath: './.eslintrc-auto-import.json',
      },
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'build',
  },
})
