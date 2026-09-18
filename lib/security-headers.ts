export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Compatible with React streaming scripts and custom srcDoc frames. The
  // custom document separately denies ALL scripts/connections/forms/frames.
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

export function secureResponse(request: Request, original: Response) {
  const response = new Response(original.body, original);
  for (const { key, value } of securityHeaders) response.headers.set(key, value);
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/") || path.startsWith("/dashboard") || path === "/login") {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}
