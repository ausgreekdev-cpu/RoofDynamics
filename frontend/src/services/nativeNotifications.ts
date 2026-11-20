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
