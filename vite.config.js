import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon.png'],
      manifest: {
        name: 'Agenda UESSJR 2026',
        short_name: 'Agenda UESSJR',
        description: 'Plataforma oficial de la 12va Jornada Académica y Cultural',
        theme_color: '#0d261a',
        background_color: '#0d261a',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Aumentar el límite de tamaño de archivo para cachear si hay assets grandes
        maximumFileSizeToCacheInBytes: 4000000,
        runtimeCaching: [
          {
            // Cachear peticiones GET de Supabase (tablas como sesiones, inscripciones, escenarios)
            urlPattern: /^https:\/\/ydcybysimlvatvadpbaz\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cachear imágenes públicas de Supabase Storage
            urlPattern: /^https:\/\/ydcybysimlvatvadpbaz\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
