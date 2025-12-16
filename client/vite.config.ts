import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // No proxy needed as frontend will use VITE_API_BASE_URL for absolute backend calls
  }
})
