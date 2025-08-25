import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ic-api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
        headers: {
          'Host': 'uxrrr-q7777-77774-qaaaq-cai.localhost:4943'
        },
        rewrite: (path) => path.replace(/^\/ic-api/, ''),
      },
    },
  },
})
