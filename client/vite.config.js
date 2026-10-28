import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The API runs on port 5001 (macOS uses 5000 for AirPlay). /api and /uploads are forwarded to it.
const api = process.env.VITE_API_URL || 'http://localhost:5001'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': api,
      '/uploads': api,
    },
  },
})
