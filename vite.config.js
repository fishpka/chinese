import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: fileURLToPath(new URL('./src', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  base: '/chinese/',
  build: {
    outDir: projectRoot,
    emptyOutDir: false,
  },
})
