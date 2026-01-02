import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumentamos o limite para 2000kb para evitar o aviso, 
    // mas deixamos o Vite decidir como dividir os arquivos (é mais seguro).
    chunkSizeWarningLimit: 2000, 
  },
})