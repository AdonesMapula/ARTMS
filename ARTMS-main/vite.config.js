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
    chunkSizeWarningLimit: 2000,
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
