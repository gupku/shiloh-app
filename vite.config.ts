import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    open: true, // opens the app in your browser
    proxy: {
      '/api': 'http://localhost:3001', // requests to /api go to the Express backend
    },
  },
})
