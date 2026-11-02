import { defineConfig } from 'vite'

// base './': GitHub Pages(/gokkal/)와 앱(capacitor://localhost) 어디서 열어도 같은 번들이 돈다
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 900 },
})
