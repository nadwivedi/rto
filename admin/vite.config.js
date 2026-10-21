import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The API key pages share docs/VEHICLE_INFO_API.md from the repo root
  server: { fs: { allow: ['..'] } },
})
