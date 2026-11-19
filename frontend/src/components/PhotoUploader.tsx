"use client";

import React, { useState, useEffect } from "react";
import { Camera, Upload, Trash2, ImageIcon, X } from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";
import { capturePhoto } from "../services/nativeCamera";
import { isNative } from "../services/nativeBridge";
import { haptic, hapticNotification } from "../services/nativeHaptics";

interface PhotoUploaderProps {
  jobId: string;
  category: "before" | "after";
  onUploaded?: () => void;
}

export function PhotoUploader({ jobId, category, onUploaded }: PhotoUploaderProps) {
  const toast = useToast();
  const [photos, setPhotos] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [jobId, category]);

  const loadPhotos = async () => {
    try {
      const data = await api.getPhotos(jobId, category);
      setPhotos(data);
    } catch {
      setPhotos([]);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.showToast("error", "Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.showToast("error", "Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview({ url: reader.result as string, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = async () => {
    await haptic("medium");
    const photo = await capturePhoto();
    if (!photo) {
      await hapticNotification("warning");
      toast.showToast("warning", "No photo captured");
      return;
    }
    const mime = photo.dataUrl.split(";")[0].replace("data:", "") || "image/jpeg";
    const ext = mime.includes("png") ? "png" : "jpg";
    setPreview({ url: photo.dataUrl, name: `${category}-${Date.now()}.${ext}` });
    await hapticNotification("success");
  };

  const handleUpload = async () => {
    if (!preview) return;
    try {
      await api.uploadPhoto({
        jobId,
        category,
        fileName: preview.name,
        mimeType: preview.url.split(";")[0].replace("data:", ""),
        dataUrl: preview.url,
        uploadedBy: "Field Crew",
      });
      toast.showToast("success", `${category === "before" ? "Before" : "After"} photo uploaded`);
      setPreview(null);
      loadPhotos();
      onUploaded?.();
    } catch (err: any) {
      toast.showToast("error", err.message || "Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePhoto(id);
      loadPhotos();
      toast.showToast("success", "Photo deleted");
    } catch (err: any) {
      toast.showToast("error", err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-[#0EA5E9]" />
        <h4 className="text-sm font-bold text-[#F8FAFC] capitalize">{category} Photos</h4>
        <span className="text-xs text-[#64748B]">({photos.length})</span>
      </div>

      {/* Upload area */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCapture}
          className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#334155] rounded-lg cursor-pointer hover:border-[#0EA5E9] transition bg-[#0F172A]/50 text-[#94A3B8] hover:text-[#F8FAFC]"
        >
          <Camera className="w-4 h-4" />
          <span className="text-xs">{isNative() ? "Take photo with camera" : "Capture / choose image"}</span>
        </button>
        <label className="flex items-center justify-center gap-2 p-2 border border-[#334155] rounded-lg cursor-pointer hover:border-[#0EA5E9] transition bg-[#0F172A]/50 text-[#94A3B8] hover:text-[#F8FAFC]">
          <Upload className="w-4 h-4" />
          <span className="text-xs">Choose from gallery / files</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      {/* Preview before upload */}
      {preview && (
        <div className="relative rounded-lg overflow-hidden border border-[#334155]">
          <img src={preview.url} alt="preview" className="w-full h-32 object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 p-1 bg-[#0F172A]/80 rounded text-[#94A3B8] hover:text-[#F8FAFC]"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-2 flex items-center justify-between bg-[#1E293B]">
            <span className="text-xs text-[#94A3B8] truncate">{preview.name}</span>
            <button
              onClick={handleUpload}
              className="px-3 py-1 bg-[#0EA5E9] text-[#0F172A] font-bold text-xs rounded hover:bg-[#38BDF8]"
            >
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Uploaded photos */}
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo) => (
          <PhotoThumb key={photo.id} photo={photo} onDelete={() => handleDelete(photo.id)} />
        ))}
      </div>
      {photos.length === 0 && !preview && (
        <p className="text-xs text-[#64748B] text-center py-2">No {category} photos yet</p>
      )}
    </div>
  );
}

function PhotoThumb({ photo, onDelete }: { photo: any; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    api.getPhotoData(photo.id)
      .then((d) => setUrl(d.dataUrl))
      .catch(() => setUrl(null));
  }, [photo.id]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-[#334155] group">
      {url ? (
        <img src={url} alt={photo.fileName} className="w-full h-24 object-cover" />
      ) : (
        <div className="w-full h-24 flex items-center justify-center bg-[#0F172A]">
          <ImageIcon className="w-6 h-6 text-[#475569]" />
        </div>
      )}
      <button
        onClick={onDelete}
        className="absolute top-1 right-1 p-1 bg-[#EF4444]/80 rounded text-white opacity-0 group-hover:opacity-100 transition"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      <p className="text-[10px] text-[#94A3B8] p-1 truncate">{photo.fileName}</p>
    </div>
  );
}
