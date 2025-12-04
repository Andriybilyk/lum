import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "/" : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: process.env.NODE_ENV === "development" ? ["src/main.tsx", "src/tempobook/**/*"] : ["src/main.tsx"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Time Tracker - Облік робочого часу',
        short_name: 'Tracker',
        description: 'Облік робочого часу, процесів та матеріалів для будівельних підрозділів',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
        lang: 'uk'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 години
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/api\.telegram\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'telegram-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 година
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 днів
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
          ],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          utils: [
            'date-fns',
            'clsx',
            'tailwind-merge',
          ],
          icons: ['lucide-react'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  }
});
