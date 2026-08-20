import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // maplibre-gl ships its own web-worker; exclude it from Vite's
  // pre-bundling so the worker URL resolves correctly at runtime.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  build: {
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('livekit') || id.includes('@livekit/')) {
              return 'vendor-livekit';
            }
            if (id.includes('@mediapipe/')) {
              return 'vendor-vision';
            }
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
              return 'vendor-maps';
            }
            if (id.includes('@radix-ui/')) {
              return 'vendor-radix';
            }
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true, // Allows localtunnel and external hosting
    // Proxy /api calls to Laravel during development — avoids CORS entirely
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
