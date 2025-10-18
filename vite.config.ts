import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages (proyecto): https://CatGolden98.github.io/Kunapet_app/
  base: "/Kunapet_app_web/",
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
