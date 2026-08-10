import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon-180.png', 'icons/favicon.svg'],
      manifest: {
        id: '/',
        name: 'Wallet | Identity',
        // Etiqueta del icono en la pantalla de inicio: tiene que ser corta o se trunca.
        short_name: 'Wallet',
        description:
          'Wallet de credenciales verificables: consulta tus credenciales y compártelas con un verificador escaneando un QR.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#0b0f19',
        theme_color: '#0b0f19',
        categories: ['utilities', 'finance', 'productivity'],
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Escanear QR', short_name: 'Escanear', url: '/scan' },
          { name: 'Mis credenciales', short_name: 'Credenciales', url: '/' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        // La app es un SPA: cualquier navegación se resuelve con el shell cacheado.
        // Las llamadas a la API nunca se cachean (datos sensibles + tokens), por eso
        // se excluyen explícitamente del fallback de navegación.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // El shell y los assets ya van en precache; aquí solo se cubren fuentes
            // u otros recursos estáticos de mismo origen añadidos en runtime.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && (request.destination === 'font' || request.destination === 'image'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
  },
})
