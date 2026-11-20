/**
 * Native capability bridge.
 *
 * Detects whether the app is running inside the Capacitor Android shell and
 * exposes a single `isNative` flag so the rest of the codebase can branch
 * without importing Capacitor directly (which is only available in the shell).
 */
export const isNative = (): boolean => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.();
};

export const platform = (): "web" | "android" | "ios" => {
  if (!isNative()) return "web";
  return (window as any).Capacitor?.getPlatform?.() ?? "web";
};

/** Lazy-load a Capacitor plugin so web bundles stay small. */
export async function loadPlugin<T = any>(name: string): Promise<T | null> {
  if (!isNative()) return null;
  try {
    const mod = await dynamicImport(`@capacitor/${name}`);
    return (mod as any)[capitalize(name)] ?? null;
  } catch {
    return null;
  }
}

/**
 * Runtime-only dynamic import. Using `new Function` prevents Vite/Rolldown
 * from statically resolving the module at build time, which would fail when
 * Capacitor is not installed (web builds).
 */
export async function dynamicImport(spec: string): Promise<any> {
  // eslint-disable-next-line no-new-func
  return new Function("m", "return import(m)")(spec);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
