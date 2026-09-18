import { NextResponse } from "next/server";

export class RequestError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

/** Bound the stream, not just Content-Length (which can be absent or false). */
export async function boundedRequest(request: Request, maxBytes: number) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    throw new RequestError("This request is too large.", 413);
  }
  if (!request.body) throw new RequestError("The request body is missing.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RequestError("This request is too large.", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new Request(request.url, { method: request.method, headers: request.headers, body: bytes });
}

export async function readJson<T>(request: Request, maxBytes = 800_000): Promise<T> {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    throw new RequestError("Send a JSON request.", 415);
  }
  const bounded = await boundedRequest(request, maxBytes);
  let value: unknown;
  try { value = await bounded.json(); } catch { throw new RequestError("The request is not valid JSON."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError("The request must be an object.");
  return value as T;
}

export async function readPhotoForm(request: Request) {
  if (!/^multipart\/form-data\s*;/i.test(request.headers.get("content-type") || "")) throw new RequestError("Send a photo upload.", 415);
  const bounded = await boundedRequest(request, 5 * 1024 * 1024 + 32_768);
  try { return await bounded.formData(); } catch { throw new RequestError("The photo upload is incomplete."); }
}

export function requestErrorResponse(error: unknown) {
  return error instanceof RequestError ? NextResponse.json({ error: error.message }, {
    status: error.status,
    headers: { "Cache-Control": "no-store", ...(error.status === 429 ? { "Retry-After": "60" } : {}) },
  }) : null;
}
