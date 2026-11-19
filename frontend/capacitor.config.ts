import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the RoofDynamics Field Android companion app.
 * Web assets are built by Vite into `dist/` and synced into the Android
 * project with `npm run cap:sync`.
 */
const config: CapacitorConfig = {
  appId: "com.ausgreek.roofdynamics",
  appName: "RoofDynamics Field",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    // Hot-reload against the Vite dev server when running `npx cap run android`.
    // Leave undefined (or remove) for production builds.
    url: process.env.CAPACITOR_DEV_URL || undefined,
    cleartext: !!process.env.CAPACITOR_DEV_URL,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0F172A",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0F172A",
    },
    Camera: {
      presentationStyle: "fullscreen",
    },
    Geolocation: {
      // Prompt the user on first use rather than at launch.
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== "production",
    backgroundColor: "#0F172A",
  },
};

export default config;
