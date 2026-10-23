// The callback URL comes from the query string, so anyone can craft it. Only
// same-site paths are accepted: "//evil.com" and "/\evil.com" are read by
// browsers as another domain.
export function safeRedirectPath(value, fallback = "/dashboard") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
