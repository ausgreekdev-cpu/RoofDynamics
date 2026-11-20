import { isNative, dynamicImport } from "./nativeBridge";

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency
      const { Network } = await dynamicImport("@capacitor/network");
      const s = await Network.getStatus();
      return { connected: s.connected, connectionType: s.connectionType };
    } catch {
      // fall through to web
    }
  }
  return { connected: navigator.onLine, connectionType: navigator.onLine ? "wifi" : "none" };
}

export function onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
  if (isNative()) {
    let handle: any;
    (async () => {
      try {
        // @ts-ignore - Capacitor is an optional dependency
        const { Network } = await dynamicImport("@capacitor/network");
        handle = await Network.addListener("networkStatusChange", (s: any) => {
          callback({ connected: s.connected, connectionType: s.connectionType });
        });
      } catch {
        // fall through
      }
    })();
    return () => {
      if (handle && typeof handle.remove === "function") handle.remove();
    };
  }
  const handler = () => callback({ connected: navigator.onLine, connectionType: navigator.onLine ? "wifi" : "none" });
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}
