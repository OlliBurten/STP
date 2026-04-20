import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — stable, cacheable separately
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Sentry — large, rarely changes
          'vendor-sentry': ['@sentry/react'],
          // OAuth — large, rarely changes
          'vendor-oauth': ['@react-oauth/google', '@azure/msal-browser', '@azure/msal-react'],
        },
      },
    },
  },
})
