import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const softflowTarget = 'http://177.43.232.2:25083'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api-soft-flow': {
        target: softflowTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
  },
})
