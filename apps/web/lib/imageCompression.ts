/**
 * Utility to compress and resize image files client-side before upload.
 * Automatically downscales large camera photos (3-15MB) and converts them to
 * high-quality JPEGs under the 1MB limit without server-side processing.
 */

export interface CompressionOptions {
  /** Maximum width or height in pixels (default: 1920) */
  maxDimension?: number;
  /** Maximum file size in bytes (default: 1024 * 1024 = 1MB) */
  maxSizeBytes?: number;
  /** Initial JPEG quality from 0.1 to 1.0 (default: 0.85) */
  initialQuality?: number;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxDimension = 1920,
    maxSizeBytes = 1024 * 1024, // 1MB
    initialQuality = 0.85,
  } = options;

  // If not a standard raster image or if it's GIF/SVG, return untouched
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Gagal memproses elemen gambar."));
      img.onload = async () => {
        try {
          let { width, height } = img;

          // If dimensions are within bounds AND file is already < maxSizeBytes, skip compression
          if (
            width <= maxDimension &&
            height <= maxDimension &&
            file.size <= maxSizeBytes
          ) {
            return resolve(file);
          }

          // Calculate downscaled dimensions preserving aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return resolve(file);
          }

          // High quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Solid white background (prevents black background for transparent PNGs converted to JPEG)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Helper to export canvas to Blob
          const toBlob = (quality: number): Promise<Blob | null> => {
            return new Promise((res) => {
              canvas.toBlob((blob) => res(blob), "image/jpeg", quality);
            });
          };

          let quality = initialQuality;
          let blob = await toBlob(quality);

          // If blob still exceeds maxSizeBytes (1MB), iteratively step down quality
          while (blob && blob.size > maxSizeBytes && quality > 0.35) {
            quality -= 0.12;
            blob = await toBlob(quality);
          }

          if (!blob) {
            return resolve(file);
          }

          // Normalize file name with .jpg extension
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const newFileName = `${originalName}.jpg`;

          const compressedFile = new File([blob], newFileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
