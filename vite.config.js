import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1000kb (padrão é 500kb) para silenciar avisos irrelevantes
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Cria chunks manuais para separar bibliotecas pesadas (Vendor) do seu código
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})