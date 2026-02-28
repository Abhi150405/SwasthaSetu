import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    fs: {
      allow: ["."],
    },
    proxy: {
      '/api/ai': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/recipe': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/diet': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});