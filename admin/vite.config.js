import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react','react-dom','react-router-dom'],
          'vendor-query':  ['@tanstack/react-query'],
          'vendor-ui':     ['react-helmet-async'],
        },
      },
    },
  },
  // Preload all chunks to avoid blank-on-navigate
  server: { warmup: { clientFiles: ['./src/App.jsx'] } },
});