import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vilken commit är det som faktiskt ligger ute?
//
// Sedan Vercels auto-deploy stängdes av (2026-08-30) deployar en merge till main
// ingenting — prod ligger kvar på gammal kod tills någon kör deploy.sh, och
// ingenting säger ifrån. Bygget stämplar därför in sin commit i index.html så att
// vem som helst (inkl. CI, utan API-nyckel) kan läsa av vad som är live.
//
// Vercel sätter VERCEL_GIT_COMMIT_SHA även för CLI-deployer, eftersom CLI:t
// skickar med git-metadatan från katalogen. GITHUB_SHA täcker CI-byggen, och
// git-anropet lokala byggen.
function commitSha() {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv.trim();
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const stampCommit = () => ({
  name: 'stp-stamp-commit',
  transformIndexHtml() {
    return [{
      tag: 'meta',
      attrs: { name: 'stp-commit', content: commitSha() },
      injectTo: 'head',
    }];
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), stampCommit()],
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
