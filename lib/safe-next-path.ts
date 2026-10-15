const defaultOrigin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost";

const blockedPaths = new Set([
  "/login",
  "/signup",
  "/reset-password",
  "/auth/callback",
]);

export function getSafeNextPath(
  value: string | null | undefined,
  allowedOrigin = defaultOrigin,
) {
  if (!value || value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return null;
  }

  try {
    const url = new URL(value, allowedOrigin);
    const isSameOrigin =
      allowedOrigin === "http://localhost" ||
      url.origin === allowedOrigin;

    if (
      !isSameOrigin ||
      blockedPaths.has(url.pathname) ||
      url.pathname.startsWith("/api/")
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function withNextPath(path: string, nextPath: string | null) {
  if (!nextPath) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(nextPath)}`;
}
