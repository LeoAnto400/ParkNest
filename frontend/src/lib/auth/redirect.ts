/** Only app-local destinations are accepted, including after email verification. */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\x00-\x20]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://parknest.invalid");
    if (
      url.origin !== "https://parknest.invalid" ||
      /^\/(auth|login|signup|forgot-password|reset-password)(\/|$)/.test(
        url.pathname,
      )
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
