import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/", // This ensures absolute paths
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      srcDir: "src/service-worker",
      filename: "sw.ts",
      registerType: "prompt",
      strategies: "injectManifest",
      injectRegister: "auto", // Auto-register service worker
      devOptions: {
        enabled: true,
        type: "module",
      },
      workbox: {
        // We cache pretty much all static assets
        globPatterns: ["**/*.{html,ico,png,svg}", "**/assets/*.{js,css}"],
        cleanupOutdatedCaches: true,
      },
      includeAssets: ["favicon.ico", "icon-192x192.png", "icon-512x512.png"],
      manifest: {
        name: "BASD Onsite",
        short_name: "BASD Onsite",
        description: "Construction application designed for on-site use",
        theme_color: "#122601",
        background_color: "#ffffff",
        display: "standalone",
        categories: ["business", "productivity", "construction"],
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle everything together for true SPA
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Disable code splitting entirely
    chunkSizeWarningLimit: 10000,
    assetsInlineLimit: 0,
  },
});
