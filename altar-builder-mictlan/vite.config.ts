import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Altar Builder Mictlán',
        short_name: 'AltarBuilder',
        description: 'Build virtual Day of the Dead altars with traditional ofrenda elements',
        theme_color: '#8B5CF6',
        background_color: '#1F2937',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // Static assets - Cache First strategy
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - Cache First with fallback
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Application shell - Network First
          {
            urlPattern: /\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          // API/Data - Network First with fallback
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  
  // Build optimizations
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // State management
          'state-vendor': ['zustand'],
          
          // Level 2 features (Catrina)
          'level2-achievements': [
            './src/components/achievements/AchievementsModal.tsx',
            './src/components/achievements/AchievementToast.tsx',
            './src/data/achievements.ts'
          ],
          'level2-export': [
            './src/components/export/ExportModal.tsx',
            './src/utils/export.ts',
            'html2canvas'
          ],
          'level2-gallery': [
            './src/components/gallery/GalleryModal.tsx',
            './src/components/gallery/SaveAltarDialog.tsx',
            './src/components/gallery/StorageManager.tsx',
            './src/utils/indexeddb.ts'
          ],
          'level2-audio': [
            './src/utils/audio-engine.ts',
            './src/data/audio.ts'
          ],
          'level2-animations': [
            './src/utils/animation-engine.ts',
            './src/styles/animations.css'
          ],
          
          // Level 3 features (Mictlán)
          'level3-collaboration': [
            './src/components/collaboration/CollaborationModal.tsx',
            './src/components/collaboration/CollaborationStatus.tsx',
            './src/components/collaboration/CollaborativeCursor.tsx',
            './src/engines/collaboration/collaboration-engine.ts',
            './src/engines/collaboration/webrtc-engine.ts',
            './src/engines/collaboration/operational-transform.ts'
          ],
          'level3-mcp': [
            './src/engines/mcp-engine.ts',
            './src/engines/mcp-config.ts',
            './src/engines/mcp-zustand-bridge.ts',
            './src/engines/mcp-modules/altar-module.ts',
            './src/engines/mcp-modules/collaboration-module.ts',
            './src/engines/mcp-modules/steering-module.ts',
            './src/engines/mcp-modules/user-module.ts'
          ],
          'level3-mariposas': [
            './src/components/mariposas/MariposasCanvas.tsx',
            './src/utils/steering-behaviors.ts'
          ]
        },
        
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          
          if (facadeModuleId) {
            // Level-based naming for better cache management
            if (facadeModuleId.includes('level2')) {
              return 'assets/level2-[name]-[hash].js'
            }
            if (facadeModuleId.includes('level3')) {
              return 'assets/level3-[name]-[hash].js'
            }
          }
          
          return 'assets/[name]-[hash].js'
        },
        
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          
          return 'assets/[name]-[hash][extname]'
        }
      },
      
      // External dependencies that should not be bundled
      external: (id) => {
        // Keep large libraries external in development
        if (process.env.NODE_ENV === 'development') {
          return ['html2canvas'].includes(id)
        }
        return false
      }
    },
    
    // Optimize bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
        // Optimize conditionals
        conditionals: true,
        // Optimize loops
        loops: true,
        // Remove unused variables
        unused: true
      },
      mangle: {
        // Mangle property names for better compression
        properties: {
          regex: /^_/
        }
      },
      format: {
        // Remove comments
        comments: false
      }
    },
    
    // Source map configuration
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // 500KB
    
    // Asset inlining threshold
    assetsInlineLimit: 4096 // 4KB
  },
  
  // Development optimizations
  server: {
    // Enable HTTP/2 for better performance
    https: false,
    // Optimize HMR
    hmr: {
      overlay: true
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'zustand'
    ],
    // Exclude these from pre-bundling
    exclude: [
      // Level 2 and 3 features should be lazy loaded
      'html2canvas'
    ]
  },
  
  // Performance monitoring in development
  define: {
    __PERFORMANCE_MONITORING__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
})
