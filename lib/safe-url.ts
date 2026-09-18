export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2000 || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function safeImageUrl(value: string) {
  // Legacy bundled paths remain supported, but protocol-relative URLs do not.
  return /^\/images\/[a-zA-Z0-9_./?=&%-]+$/.test(value)
    && !value.includes("..")
    && !/%(?:2e|2f|5c)/i.test(value)
    ? value
    : safeHttpsUrl(value);
}
