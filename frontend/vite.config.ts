import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/mapas": "http://localhost:3000",
      "/imagens": "http://localhost:3000"
    }
  }
});
