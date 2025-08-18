import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'models/**'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,json,bin}'],
      },
      manifest: {
        name: 'Reloj Checador',
        short_name: 'Reloj Checador',
        description: 'INAEBA',
        theme_color: '#4310A1',
        background_color: '#4310A1',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icons/logotipo_inaeba.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/logotipo_inaeba.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-app.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
}) 