"use client";
import { getBrowserClient } from "./supabase/browser";

/** Resizes photos in the browser before upload: faster pages, lower storage use. */
export async function optimizeImage(file: File, max = 2000): Promise<{ blob: Blob; ext: string; type: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };
    const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    if (jpg) return { blob: jpg, ext: "jpg", type: "image/jpeg" };
  } catch { /* fall through to original */ }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Dit bestandstype wordt niet ondersteund. Gebruik JPG, PNG of WEBP.");
  }
  return { blob: file, ext: file.type.split("/")[1].replace("jpeg", "jpg"), type: file.type };
}

/**
 * Uploads one photo to Supabase Storage (bucket "product-images").
 * Only logged-in admins may upload — enforced by the storage policies in schema.sql.
 */
export async function uploadImage(file: File, folder: "products" | "brands", maxSize = 2000) {
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is groter dan 25 MB.`);
  const { blob, ext, type } = await optimizeImage(file, maxSize);
  const supabase = getBrowserClient();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Uploaden van ${file.name} mislukt: ${error.message}`);
  return { url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl as string, path };
}

export async function removeUploadedImage(path: string) {
  await getBrowserClient().storage.from("product-images").remove([path]);
}
