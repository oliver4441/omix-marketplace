"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  listingId?: string;
  existingImages?: { id: string; image_url: string }[];
  onImagesChange?: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUploader({
  existingImages = [],
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [existing, setExisting] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = existing.length + previews.length;
  const remaining = maxImages - totalImages;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) return `${file.name} is not an image`;
      if (file.size > maxSizeMB * 1024 * 1024)
        return `${file.name} exceeds ${maxSizeMB}MB`;
      return null;
    },
    [maxSizeMB]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setError(null);

      const newFiles: File[] = [];
      for (let i = 0; i < files.length && totalImages + newFiles.length < maxImages; i++) {
        const validation = validateFile(files[i]);
        if (validation) {
          setError(validation);
          continue;
        }
        newFiles.push(files[i]);
      }

      if (newFiles.length === 0) return;

      const newPreviews = newFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      const updated = [...previews, ...newPreviews];
      setPreviews(updated);
      onImagesChange?.(updated.map((p) => p.file));
    },
    [previews, totalImages, maxImages, validateFile, onImagesChange]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePreview = (index: number) => {
    const updated = [...previews];
    URL.revokeObjectURL(updated[index].url);
    updated.splice(index, 1);
    setPreviews(updated);
    onImagesChange?.(updated.map((p) => p.file));
  };

  const removeExisting = (index: number) => {
    const updated = [...existing];
    updated.splice(index, 1);
    setExisting(updated);
  };

  const movePreview = (from: number, to: number) => {
    if (to < 0 || to >= previews.length) return;
    const updated = [...previews];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setPreviews(updated);
    onImagesChange?.(updated.map((p) => p.file));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Photos
        <span className="text-slate-400 font-normal ml-1">
          ({totalImages}/{maxImages})
        </span>
      </label>

      {/* Drop Zone */}
      {remaining > 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-emerald-500 bg-emerald-50"
              : "border-white/15 hover:border-emerald-400 hover:bg-emerald-500/50"
          }`}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm text-slate-300">
            <span className="text-emerald-600 font-medium">Click to upload</span> or drag & drop
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPG, WEBP up to {maxSizeMB}MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-400 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Previews Grid */}
      {(existing.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-5 gap-2">
          {/* Existing images */}
          {existing.map((img, i) => (
            <div
              key={img.id}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                i === 0 ? "border-emerald-500" : "border-white/10"
              }`}
            >
              <Image
                src={img.image_url}
                alt={`Photo ${i + 1}`}
                fill
                className="object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeExisting(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}

          {/* New previews */}
          {previews.map((preview, i) => (
            <div
              key={preview.url}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                existing.length === 0 && i === 0
                  ? "border-emerald-500"
                  : "border-white/10"
              }`}
            >
              <Image
                src={preview.url}
                alt={`Upload ${i + 1}`}
                fill
                className="object-cover"
              />
              {existing.length === 0 && i === 0 && (
                <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
              {/* Move buttons */}
              {previews.length > 1 && (
                <div className="absolute bottom-1 left-1 flex gap-1">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => movePreview(i, i - 1)}
                      className="w-5 h-5 bg-black/60 text-white rounded text-[10px] hover:bg-black/80"
                    >
                      ←
                    </button>
                  )}
                  {i < previews.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePreview(i, i + 1)}
                      className="w-5 h-5 bg-black/60 text-white rounded text-[10px] hover:bg-black/80"
                    >
                      →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-slate-400">
        First image is your cover photo. Drag to reorder. Max {maxImages} photos.
      </p>
    </div>
  );
}
