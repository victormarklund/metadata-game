export function buildPublicUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = String(path || "").replace(/^\//, "");
  return new URL(normalized, window.location.origin + base).toString();
}
