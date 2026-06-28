export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function isExternalImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function isStorageImagePath(value: string): boolean {
  return Boolean(value) && !isExternalImageUrl(value);
}

export function getImageExtension(file: File): string {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["png", "jpg", "jpeg", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateImageFile(file: File): ImageValidationResult {
  const name = file.name.toLowerCase();
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif");

  if (isHeic) {
    return {
      ok: false,
      message: "PNG、JPEG、WebP のみ対応しています（HEIC は未対応です）",
    };
  }

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExt = ["png", "jpg", "jpeg", "webp"];
    if (!ext || !allowedExt.includes(ext)) {
      return {
        ok: false,
        message: "PNG、JPEG、WebP のみ対応しています（HEIC は未対応です）",
      };
    }
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      message: "画像は 5MB 以下にしてください",
    };
  }

  return { ok: true };
}
