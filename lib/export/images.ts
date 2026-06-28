import { isExternalImageUrl } from "@/lib/images";
import { getSignedImageUrl } from "@/lib/supabase/storage";

export async function resolveSlideImageUrl(
  imageUrl?: string
): Promise<string | null> {
  if (!imageUrl) return null;
  if (isExternalImageUrl(imageUrl)) return imageUrl;
  return getSignedImageUrl(imageUrl);
}

export async function fetchImageAsDataUrl(
  url: string
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function loadSlideImageData(
  imageUrl?: string
): Promise<string | null> {
  const resolved = await resolveSlideImageUrl(imageUrl);
  if (!resolved) return null;
  return fetchImageAsDataUrl(resolved);
}

export function safeExportFilename(title: string, ext: string): string {
  const base =
    title
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "presentation";
  return `${base}.${ext}`;
}
