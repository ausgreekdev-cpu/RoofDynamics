import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg"],
      manifest: {
        name: "RoofDynamics — ERP for Roofing & Trade",
        short_name: "RoofDynamics",
        description: "Multi-Tenant SaaS & Enterprise ERP for Roofing & Trade Businesses in Perth, WA",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Activate new precache manifests immediately so a deploy cannot leave
        // existing tabs stuck on an old bundle (which breaks protected pages).
        skipWaiting: true,
        clientsClaim: true,
        // Three.js 3D viewer chunk exceeds the 2 MiB default precache limit.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: [
      "@capacitor/core", "@capacitor/camera", "@capacitor/geolocation",
      "@capacitor/filesystem", "@capacitor/network", "@capacitor/preferences",
      "@capacitor/haptics", "@capacitor/splash-screen", "@capacitor/status-bar",
    ],
  },
  // Capacitor is an optional, Android-only dependency. Keep its imports out of
  // the web bundle so the browser build succeeds without installing it.
  build: {
    rolldownOptions: {
      external: [
        "@capacitor/core", "@capacitor/camera", "@capacitor/geolocation",
        "@capacitor/filesystem", "@capacitor/network", "@capacitor/preferences",
        "@capacitor/haptics", "@capacitor/splash-screen", "@capacitor/status-bar",
      ],
    },
    rollupOptions: {
      external: [
        "@capacitor/core", "@capacitor/camera", "@capacitor/geolocation",
        "@capacitor/filesystem", "@capacitor/network", "@capacitor/preferences",
        "@capacitor/haptics", "@capacitor/splash-screen", "@capacitor/status-bar",
      ],
    },
  },
});
