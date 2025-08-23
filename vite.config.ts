import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Production build optimizations
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react']
        }
      }
    },
    // Ensure compatibility with older browsers
    target: 'es2015',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  server: {
    // Development server configuration
    port: 5173,
    host: true,
    strictPort: false
  },
  preview: {
    // Preview server configuration
    port: 4173,
    host: true,
    strictPort: false
  }
})
