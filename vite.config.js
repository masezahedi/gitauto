import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import usePluginImport from 'vite-plugin-importer'

export default defineConfig({
  plugins: [
    react(),
    usePluginImport({
      libraryName: "antd",
      libraryDirectory: "es",
      style: true,
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
  },
})
