import type { UploadedPhoto } from "@/lib/media-submission";

export const maxOriginalImageBytes = 5 * 1024 * 1024;
export type PhotoOptimizationTarget = "hero" | "glimpse";

const optimizationTargets: Record<PhotoOptimizationTarget, { maxSide: number; targetBytes: number }> = {
  hero: { maxSide: 1600, targetBytes: 850 * 1024 },
  glimpse: { maxSide: 1200, targetBytes: 450 * 1024 },
};

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

function webpFile(file: File, blob: Blob) {
  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: file.lastModified });
}

async function encodeWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

function drawScaled(image: HTMLImageElement, maxSide: number) {
  const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Photo optimization is unavailable in this browser.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Produce a metadata-free WebP with a target appropriate to how the photo is rendered.
 * The adaptive path intentionally caps normal work at three WebP encodes.
 */
export async function preparePhoto(file: File, target: PhotoOptimizationTarget = "glimpse", previewSource?: Blob): Promise<File> {
  if (file.size > maxOriginalImageBytes) throw new Error(`${file.name} is over 5 MB. Please choose a smaller photo.`);
  if (typeof document === "undefined") throw new Error("Photo optimization is unavailable here. Please use a smaller photo.");

  const settings = optimizationTargets[target];
  const imageSource = previewSource ?? (isHeicPhoto(file) ? await convertHeicPhoto(file) : file);
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

    // An already-small WebP does not benefit from another lossy encode. Server-side
    // structural validation/metadata cleaning still runs before Storage accepts it.
    if (!isHeicPhoto(file) && file.type === "image/webp"
      && file.size <= settings.targetBytes
      && Math.max(image.naturalWidth, image.naturalHeight) <= settings.maxSide) {
      return file;
    }

    let canvas = drawScaled(image, settings.maxSide);
    let blob = await encodeWebp(canvas, .82);
    if (blob?.type === "image/webp" && blob.size <= settings.targetBytes) return webpFile(file, blob);

    blob = await encodeWebp(canvas, .74);
    if (blob?.type === "image/webp" && blob.size <= settings.targetBytes) return webpFile(file, blob);

    if (!blob?.size) throw new Error(`${file.name} could not be optimized. Please choose a different photo.`);
    const adaptiveScale = Math.max(.68, Math.min(.9, Math.sqrt(settings.targetBytes / blob.size) * .95));
    const reducedMaxSide = Math.max(720, Math.round(settings.maxSide * adaptiveScale));
    canvas = drawScaled(image, reducedMaxSide);
    blob = await encodeWebp(canvas, .76);
    if (blob?.type === "image/webp" && blob.size <= settings.targetBytes) return webpFile(file, blob);

    const targetKb = Math.round(settings.targetBytes / 1024);
    throw new Error(`${file.name} is too large after optimization. Please use a smaller photo (target under ${targetKb} KB).`);
  } finally {
    image.src = "";
    URL.revokeObjectURL(objectUrl);
  }
}

function createPreparationQueue(concurrency: number) {
  const waiting: Array<() => void> = [];
  let active = 0;

  function pump() {
    while (active < concurrency && waiting.length) {
      const start = waiting.shift()!;
      active += 1;
      start();
    }
  }

  return function enqueue<T>(run: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      waiting.push(() => {
        void run()
          .then(resolve, reject)
          .finally(() => {
            active -= 1;
            pump();
          });
      });
      pump();
    });
  };
}

type PreparationJob = { id: string; promise: Promise<File> };

export function createPhotoPreparationManager(
  prepared: Map<File, File>,
  concurrency = 2,
  onPendingDelta?: (delta: number) => void,
) {
  const enqueue = createPreparationQueue(Math.max(1, concurrency));
  const jobs = new Map<File, PreparationJob>();
  const failures = new Map<File, Error>();

  function prepare(file: File, target: PhotoOptimizationTarget, previewSource?: Blob): Promise<File> {
    const cached = prepared.get(file);
    if (cached) return Promise.resolve(cached);
    const failed = failures.get(file);
    if (failed) return Promise.reject(failed);
    const current = jobs.get(file);
    if (current) return current.promise;

    const id = crypto.randomUUID();
    const promise = enqueue(async () => {
      // The queue may start synchronously; yield once so the stable job identity
      // is registered before cancellation checks run.
      await Promise.resolve();
      if (jobs.get(file)?.id !== id) throw new Error("Photo preparation was cancelled.");
      const result = await preparePhoto(file, target, previewSource);
      if (jobs.get(file)?.id !== id) throw new Error("Photo preparation was cancelled.");
      prepared.set(file, result);
      return result;
    }).catch((cause) => {
      if (jobs.get(file)?.id === id) {
        const error = cause instanceof Error ? cause : new Error(`${file.name} could not be optimized.`);
        failures.set(file, error);
      }
      throw cause;
    }).finally(() => {
      if (jobs.get(file)?.id === id) {
        jobs.delete(file);
        onPendingDelta?.(-1);
      }
    });

    jobs.set(file, { id, promise });
    failures.delete(file);
    onPendingDelta?.(1);
    // Background jobs are intentionally fire-and-forget until Save awaits them.
    void promise.catch(() => undefined);
    return promise;
  }

  function cancel(file: File) {
    if (jobs.delete(file)) onPendingDelta?.(-1);
    prepared.delete(file);
    failures.delete(file);
  }

  function clear(notify = true) {
    const count = jobs.size;
    jobs.clear();
    prepared.clear();
    failures.clear();
    if (notify && count) onPendingDelta?.(-count);
  }

  return {
    prepare,
    cancel,
    clear,
    getError: (file: File) => failures.get(file),
    hasPending: (file: File) => jobs.has(file),
  };
}

export async function preparePendingPhotos(
  pendingFiles: Record<string, File[]>,
  prepared: Map<File, File>,
) {
  for (const [slot, files] of Object.entries(pendingFiles)) {
    const target: PhotoOptimizationTarget = slot === "hero" ? "hero" : "glimpse";
    for (const file of files) {
      if (!prepared.has(file)) prepared.set(file, await preparePhoto(file, target));
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
          const optimized = prepared.get(file);
          if (!optimized) throw new Error(`${file.name} has not finished optimizing. Please try saving again.`);
          const form = new FormData();
          form.set("file", optimized);
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
      } catch (error) {
        failure = error;
      }
    }
  }

  // Four workers shorten large batches while still bounding mobile/network pressure.
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (failure) throw failure;
  return uploadedBySlot;
}

export function selectedUploadedPhotos(pendingFiles: Record<string, File[]>, uploaded: Map<string, UploadedPhoto>) {
  return Object.entries(pendingFiles).flatMap(([slot, files]) => files.map((_, index) => uploaded.get(`${slot}:${index}`)).filter((photo): photo is UploadedPhoto => Boolean(photo)));
}
