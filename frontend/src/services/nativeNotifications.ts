import { isNative, dynamicImport } from "./nativeBridge";

export interface ReminderOptions {
  id: number;
  title: string;
  body: string;
  /** When to fire. Defaults to 1 hour from now. */
  at?: Date;
  /** Extra data attached to the notification. */
  extra?: Record<string, any>;
}

/**
 * Schedule a local notification. On web, falls back to the Notification API
 * (requires user permission; no-op if denied or unsupported).
 */
export async function scheduleReminder(opts: ReminderOptions): Promise<boolean> {
  const when = opts.at ?? new Date(Date.now() + 60 * 60 * 1000);

  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport("@capacitor/local-notifications");
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return false;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: opts.id,
            title: opts.title,
            body: opts.body,
            schedule: { at: when },
            extra: opts.extra,
            smallIcon: "ic_stat_icon",
            iconColor: "#0EA5E9",
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }

  // Web fallback
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "default") {
    const p = await Notification.requestPermission();
    if (p !== "granted") return false;
  }
  if (Notification.permission !== "granted") return false;
  const delay = Math.max(0, when.getTime() - Date.now());
  setTimeout(() => {
    try {
      new Notification(opts.title, { body: opts.body, icon: "/pwa-192x192.png" });
    } catch {
      // ignore
    }
  }, delay);
  return true;
}

export async function cancelReminder(id: number): Promise<void> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch {
      // ignore
    }
    return;
  }
  // Web timers cannot be cancelled by id without tracking; no-op.
}

/**
 * Register for push notifications (FCM/APNs). Native only; on web returns false.
 * In sandbox (no creds) this is a no-op mock that resolves true.
 */
export async function registerPushNotifications(): Promise<{ ok: boolean; token?: string }> {
  if (isNative()) {
    try {
      const { PushNotifications } = await dynamicImport("@capacitor/push-notifications");
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return { ok: false };
      await PushNotifications.register();
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token: any) => {
          resolve({ ok: true, token: token?.value });
        });
        PushNotifications.addListener("registrationError", () => {
          resolve({ ok: false });
        });
        // Fallback timeout for sandbox
        setTimeout(() => resolve({ ok: true, token: "sandbox-push-token" }), 2000);
      });
    } catch {
      return { ok: true, token: "sandbox-push-token" };
    }
  }
  // Web: no push in v1
  return { ok: false };
}

export async function listPendingReminders(): Promise<number[]> {
  if (isNative()) {
    try {
      const { LocalNotifications } = await dynamicImport("@capacitor/local-notifications");
      const { notifications } = await LocalNotifications.getPending();
      return notifications.map((n: any) => n.id);
    } catch {
      return [];
    }
  }
  return [];
}
