import { isNative } from "./nativeBridge";

const PREFIX = "rd_";

export async function prefGet(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: PREFIX + key });
      return value ?? null;
    } catch {
      // fall through
    }
  }
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function prefSet(key: string, value: string): Promise<void> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: PREFIX + key, value });
      return;
    } catch {
      // fall through
    }
  }
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // ignore
  }
}

export async function prefRemove(key: string): Promise<void> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: PREFIX + key });
      return;
    } catch {
      // fall through
    }
  }
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}
