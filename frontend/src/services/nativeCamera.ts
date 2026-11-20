import { isNative, dynamicImport } from "./nativeBridge";

export interface CapturedPhoto {
  dataUrl: string;
  format: "jpeg" | "png" | "webp";
  width?: number;
  height?: number;
}

/**
 * Capture a photo from the device camera (native) or the browser file picker
 * (web). Always returns a data URL so callers can upload unchanged.
 */
export async function capturePhoto(): Promise<CapturedPhoto | null> {
  if (isNative()) {
    try {
      // @ts-ignore - Capacitor is an optional dependency (installed for Android builds)
      const { Camera, CameraResultType, CameraSource } = await dynamicImport("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 2048,
      });
      return {
        dataUrl: photo.dataUrl ?? "",
        format: (photo.format as CapturedPhoto["format"]) ?? "jpeg",
        width: photo.width,
        height: photo.height,
      };
    } catch {
      return null;
    }
  }

  // Web fallback — hidden file input.
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () =>
        resolve({ dataUrl: String(reader.result), format: file.type.includes("png") ? "png" : "jpeg" });
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
