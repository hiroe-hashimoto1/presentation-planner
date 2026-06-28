import { getImageExtension } from "@/lib/images";
import { getSupabaseClient } from "./client";

export const PROJECT_IMAGES_BUCKET = "project-images";

/** 署名付き URL の有効期限（7日） */
const SIGNED_URL_EXPIRES_SECONDS = 60 * 60 * 24 * 7;

export function buildSlideImagePath(
  userId: string,
  projectId: string,
  slideId: string,
  file: File
): string {
  const ext = getImageExtension(file);
  return `${userId}/${projectId}/${slideId}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadSlideImage(
  path: string,
  file: File
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;
}

export async function deleteStorageImage(path: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .remove([path]);

  if (error) throw error;
}

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_SECONDS);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function listFilesRecursive(prefix: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .list(prefix, { limit: 1000 });

  if (error || !data) return [];

  const files: string[] = [];
  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id) {
      files.push(itemPath);
    } else {
      const nested = await listFilesRecursive(itemPath);
      files.push(...nested);
    }
  }
  return files;
}

export async function deleteProjectImages(
  userId: string,
  projectId: string
): Promise<void> {
  const prefix = `${userId}/${projectId}`;
  const files = await listFilesRecursive(prefix);
  if (files.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .remove(files);

  if (error) throw error;
}
