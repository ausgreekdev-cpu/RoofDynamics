import { isNative, dynamicImport } from "./nativeBridge";

/**
 * Sync the native Android status bar with the active app theme.
 * No-op on web (the browser chrome handles it).
 */
export async function setStatusBarTheme(theme: "dark" | "light"): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore - Capacitor is an optional dependency
    const { StatusBar, Style } = await dynamicImport("@capacitor/status-bar");
    if (theme === "dark") {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#0F172A" });
    } else {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#F8FAFC" });
    }
  } catch {
    // ignore — status bar theming is best-effort
  }
}
