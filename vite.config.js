import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Gør serveren tilgængelig på netværket
    port: 5175,
    strictPort: false, // Prøv næste port hvis 5175 er optaget
  },
})
