import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const buildStamp = Date.now().toString(36)

export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react(), tailwindcss()],
  base: '/chinese/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${buildStamp}.js`,
        chunkFileNames: `assets/[name]-[hash]-${buildStamp}.js`,
        assetFileNames: `assets/[name]-[hash]-${buildStamp}[extname]`,
      },
    },
  },
})
