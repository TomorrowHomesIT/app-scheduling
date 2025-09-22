import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   workbox: {
    //     globPatterns: ["**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,ttf,eot}"],
    //     // Cache all routes for true offline support
    //     navigateFallback: "/index.html",
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: "CacheFirst",
    //         options: {
    //           cacheName: "google-fonts-cache",
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    //           },
    //         },
    //       },
    //     ],
    //   },
    //   includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
    //   manifest: {
    //     name: "App Scheduling",
    //     short_name: "Scheduling",
    //     description: "Construction job scheduling application",
    //     theme_color: "#10b981",
    //     background_color: "#ffffff",
    //     display: "standalone",
    //     icons: [
    //       {
    //         src: "icon-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //   },
    // }),
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
  base: "./", // Relative paths for static hosting
});
