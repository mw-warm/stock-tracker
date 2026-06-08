import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name for Pages project sites
export default defineConfig({
  plugins: [react()],
  base: '/stock-tracker/',
  // Per-build id used to cache-bust the iframe pages + gate script so a new
  // deploy is picked up immediately instead of GitHub's 10-min HTML cache.
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString()) },
})
