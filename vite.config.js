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
          // MSAL har medvetet INGEN manualChunk. Att namnge den lyfte ut den i en
          // egen chunk som blev ett beroende av entryn, så Vite la en
          // modulepreload på den — 86 kB gzip hämtades på varje sidladdning trots
          // att den bara importeras dynamiskt. Utan manualChunk hamnar den i den
          // lazy-laddade chunk som faktiskt använder den (MicrosoftButton /
          // OAuthProviders) och hämtas först när någon når inloggningen.
        },
        // Keep page chunks reasonably sized
        experimentalMinChunkSize: 10_000,
      },
    },
  },
})
