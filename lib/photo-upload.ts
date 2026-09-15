import type { UploadedPhoto } from "@/lib/media-submission";

export const maxOriginalImageBytes = 5 * 1024 * 1024;
const targetUploadBytes = 900 * 1024;
export type UploadFolderIdentity = { link: string; customerName: string };

export function isHeicPhoto(file: File) {
  return ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(file.type.toLowerCase())
    || /\.(heic|heif)$/i.test(file.name);
}

async function convertHeicPhoto(file: File) {
  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({ blob: file, type: "image/jpeg", quality: .92 });
  } catch {
    throw new Error(`${file.name} could not be converted from iPhone HEIC. Try exporting it as a JPG.`);
  }
}

/** Standard browser images can preview immediately; HEIC needs a compatibility conversion first. */
export async function preparePhotoPreview(file: File): Promise<Blob> {
  if (file.size > maxOriginalImageBytes) throw new Error(`${file.name} is over 5 MB. Please choose a smaller photo.`);
  return isHeicPhoto(file) ? convertHeicPhoto(file) : file;
}

/** Keep each request below small edge/proxy body limits, including multipart overhead. */
export async function preparePhoto(file: File): Promise<File> {
  if (file.size > maxOriginalImageBytes) throw new Error(`${file.name} is over 5 MB. Please choose a smaller photo.`);
  if (typeof document === "undefined") throw new Error("Photo optimization is unavailable here. Please use a smaller photo.");

  let imageSource: Blob = file;
  if (isHeicPhoto(file)) imageSource = await convertHeicPhoto(file);
  const objectUrl = URL.createObjectURL(imageSource);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Could not read ${file.name}. Please choose a different photo.`));
      image.src = objectUrl;
    });
    for (const maxSide of [1800, 1600, 1280, 1024]) {
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) break;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [.88, .82, .76]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (blob?.type === "image/webp" && blob.size <= targetUploadBytes) {
          // A tiny original JPEG/WebP can be smaller than recompressing it.
          if (!isHeicPhoto(file) && file.size <= targetUploadBytes && blob.size >= file.size) return file;
          const name = file.name.replace(/\.[^.]+$/, "") || "photo";
          return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
        }
      }
    }
    if (!isHeicPhoto(file) && file.size <= targetUploadBytes) return file;
    throw new Error(`${file.name} is too large after optimization. Please use a smaller photo (under 900 KB).`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function preparePendingPhotos(pendingFiles: Record<string, File[]>, prepared: Map<File, File>) {
  for (const files of Object.values(pendingFiles)) {
    for (const file of files) {
      if (!prepared.has(file)) prepared.set(file, await preparePhoto(file));
    }
  }
}

export async function uploadPendingPhotos(
  invitationId: string,
  pendingFiles: Record<string, File[]>,
  endpoint: string,
  prepared: Map<File, File>,
  uploaded: Map<File, UploadedPhoto>,
  uploadToken?: string,
  folderIdentity?: UploadFolderIdentity,
) {
  const uploadedBySlot: Record<string, string[]> = {};
  for (const [slot, files] of Object.entries(pendingFiles)) {
    uploadedBySlot[slot] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const currentSlot = `${slot}:${index}`;
      let photo = uploaded.get(file);
      if (!photo || photo.slot !== currentSlot) {
        const form = new FormData();
        form.set("file", prepared.get(file) ?? file);
        form.set("invitationId", invitationId);
        if (uploadToken) form.set("uploadToken", uploadToken);
        if (folderIdentity) {
          form.set("link", folderIdentity.link);
          form.set("customerName", folderIdentity.customerName);
        }
        form.set("slot", currentSlot);
        const response = await fetch(endpoint, { method: "POST", body: form });
        // An upstream 413 may be plain text ("Payload Too Large"), not JSON.
        const raw = await response.text();
        let result: Partial<UploadedPhoto> & { error?: string } = {};
        try { result = JSON.parse(raw) as typeof result; } catch { /* An edge server may return HTML or plain text. */ }
        if (!response.ok || !result.url || !result.receipt || !result.path) {
          if (response.status === 413) throw new Error(`${file.name} exceeded the upload limit. It was not saved. Please try a smaller photo.`);
          throw new Error(result.error || `${file.name} could not be uploaded. No order was saved; please try again.`);
        }
        photo = result as UploadedPhoto;
        uploaded.set(file, photo);
      }
      uploadedBySlot[slot].push(photo.url);
    }
  }
  return uploadedBySlot;
}

export function selectedUploadedPhotos(pendingFiles: Record<string, File[]>, uploaded: Map<File, UploadedPhoto>) {
  return Object.values(pendingFiles).flatMap((files) => files.map((file) => uploaded.get(file)).filter((photo): photo is UploadedPhoto => Boolean(photo)));
}
