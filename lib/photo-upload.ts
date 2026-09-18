import type { UploadedPhoto } from "@/lib/media-submission";

export const maxOriginalImageBytes = 5 * 1024 * 1024;
const targetUploadBytes = 900 * 1024;

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
    if (image.naturalWidth > 12_000 || image.naturalHeight > 12_000 || image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error(`${file.name} has too many pixels. Please resize it before uploading.`);
    }
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
          const name = file.name.replace(/\.[^.]+$/, "") || "photo";
          return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
        }
      }
    }

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
  uploaded: Map<string, UploadedPhoto>,
  uploadToken?: string,
) {
  const uploadedBySlot: Record<string, string[]> = {};
  const jobs = Object.entries(pendingFiles).flatMap(([slot, files]) => {
    uploadedBySlot[slot] = new Array(files.length);
    return files.map((file, index) => ({ slot, file, index }));
  });
  let cursor = 0;
  let failure: unknown;
  async function worker() {
    while (!failure && cursor < jobs.length) {
      const { slot, file, index } = jobs[cursor++];
      const currentSlot = `${slot}:${index}`;
      try {
        let photo = uploaded.get(currentSlot);
        if (!photo) {
          const form = new FormData();
          form.set("file", prepared.get(file) ?? file);
          form.set("invitationId", invitationId);
          if (uploadToken) form.set("uploadToken", uploadToken);
          form.set("slot", currentSlot);
          const response = await fetch(endpoint, { method: "POST", body: form });
          const result = await response.json().catch(() => ({})) as Partial<UploadedPhoto> & { error?: string };
          if (!response.ok || !result.url || !result.receipt || !result.path) {
            if (response.status === 413) throw new Error(`${file.name} exceeded the upload limit. Please try a smaller photo.`);
            throw new Error(result.error || `${file.name} could not be uploaded. No order was saved; please try again.`);
          }
          photo = result as UploadedPhoto;
          uploaded.set(currentSlot, photo);
        }
        uploadedBySlot[slot][index] = photo.url;
      } catch (error) { failure = error; }
    }
  }
  // Wait for BOTH workers before compensation; no late upload escapes cleanup.
  await Promise.all([worker(), worker()]);
  if (failure) throw failure;
  return uploadedBySlot;
}

export function selectedUploadedPhotos(pendingFiles: Record<string, File[]>, uploaded: Map<string, UploadedPhoto>) {
  return Object.entries(pendingFiles).flatMap(([slot, files]) => files.map((_, index) => uploaded.get(`${slot}:${index}`)).filter((photo): photo is UploadedPhoto => Boolean(photo)));
}
