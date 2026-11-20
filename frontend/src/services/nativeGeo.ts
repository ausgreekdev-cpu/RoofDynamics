import { isNative, dynamicImport } from "./nativeBridge";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export async function getCurrentPosition(): Promise<GeoPosition | null> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency (installed for Android builds)
      const { Geolocation } = await dynamicImport("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
          timestamp: p.timestamp,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
