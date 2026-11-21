import { isNative, dynamicImport } from "./nativeBridge";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type GeoResult =
  | { ok: true; position: GeoPosition }
  | { ok: false; error: string };

/**
 * Request location permission where required (Android/iOS). Returns true if
 * granted (or already granted). On web, returns true (the browser prompts on use).
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const { Geolocation } = await dynamicImport("@capacitor/geolocation");
      const status = await Geolocation.requestPermissions();
      return status.location === "granted" || status.coarseLocation === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Capture the current device/browser position. Returns a tagged result so
 * callers can show a meaningful message instead of a silent failure.
 */
export async function getCurrentPosition(): Promise<GeoResult> {
  if (isNative()) {
    try {
      const granted = await requestLocationPermission();
      if (!granted) return { ok: false, error: "Location permission denied" };
      const { Geolocation } = await dynamicImport("@capacitor/geolocation");
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      return {
        ok: true,
        position: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        },
      };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Location unavailable" };
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, error: "Geolocation not supported by this browser" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          ok: true,
          position: {
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracy: p.coords.accuracy,
            timestamp: p.timestamp,
          },
        }),
      (e) => {
        const msg =
          e.code === 1 ? "Location permission denied" :
          e.code === 2 ? "Position unavailable" :
          e.code === 3 ? "Location request timed out" :
          e.message || "Location unavailable";
        resolve({ ok: false, error: msg });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Reverse-geocode a coordinate to a suburb/city name using the free Nominatim
 * service (OpenStreetMap). No API key required. Returns null on failure.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    return (
      addr.suburb ||
      addr.town ||
      addr.city ||
      addr.village ||
      addr.county ||
      null
    );
  } catch {
    return null;
  }
}
