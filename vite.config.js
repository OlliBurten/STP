import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Warn on chunks over 500 kB (Vite default is 500, but we want to stay below 300)
    chunkSizeWarningLimit: 500, // vendor-sentry + vendor-msal are lazy-loaded, large is OK
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — tiny, stable, always needed
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Google OAuth — needed on login page only but loads fast
          'vendor-google-oauth': ['@react-oauth/google'],
          // Sentry — loaded lazily in main.jsx via dynamic import, but
          // keeping it named here ensures consistent hashing across builds
          'vendor-sentry': ['@sentry/react'],
          // MSAL — loaded lazily in OAuthProviders.jsx, named for cache stability
          'vendor-msal': ['@azure/msal-browser', '@azure/msal-react'],
        },
        // Keep page chunks reasonably sized
        experimentalMinChunkSize: 10_000,
      },
    },
  },
})
