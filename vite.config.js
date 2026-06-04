import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name for Pages project sites
export default defineConfig({
  plugins: [react()],
  base: '/stock-tracker/',
})
