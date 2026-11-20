import { isNative, dynamicImport } from "./nativeBridge";

export type HapticStyle = "light" | "medium" | "heavy";

/** Fire-and-forget haptic feedback; no-op on web. */
export async function haptic(style: HapticStyle = "light"): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore - Capacitor is an optional dependency
    const { Haptics, ImpactStyle } = await dynamicImport("@capacitor/haptics");
    const styleMap = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // Haptics unavailable — silently ignore.
  }
}

export async function hapticNotification(type: "success" | "warning" | "error" = "success"): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore - Capacitor is an optional dependency
    const { Haptics, NotificationType } = await dynamicImport("@capacitor/haptics");
    const typeMap = { success: NotificationType.Success, warning: NotificationType.Warning, error: NotificationType.Error };
    await Haptics.notification({ type: typeMap[type] });
  } catch {
    // ignore
  }
}

export async function hapticSelection(): Promise<void> {
  if (!isNative()) return;
  try {
    // @ts-ignore - Capacitor is an optional dependency
    const { Haptics } = await dynamicImport("@capacitor/haptics");
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {
    // ignore
  }
}
